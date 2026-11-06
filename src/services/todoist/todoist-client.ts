import { v4 as uuid } from 'uuid'
import { TodoistFailure, syncTodoist } from './sync-request'
import { todoistCommands } from './task-commands'
import { syncTodoistBatches } from './sync-batches'
import Analytics from '@/analytics'
import momentTz from 'moment-timezone'
import { getFromStorage, removeFromStorage, setToStorage } from '@/common/storage'
import { nowMs } from '@/common/utils/trusted-time'
import { mergeTodoistSync, normalizeTodoistAccount, todoistView } from './sync-state'
import type { TodoistAccount, TodoistReply, TodoistRequest } from './todoist.interface'

let queue: Promise<unknown> = Promise.resolve()

export function handleTodoistRequest(request: TodoistRequest): Promise<TodoistReply> {
	const pending = queue.then(() => execute(request))
	queue = pending.catch(() => {})
	return pending
}

async function execute(request: TodoistRequest): Promise<TodoistReply> {
	let account: TodoistAccount | null = null
	try {
		account = normalizeTodoistAccount(await getFromStorage('todoistAccount'))
		if (request.action === 'disconnect') {
			await removeFromStorage('todoistAccount')
			Analytics.event('todoist_disconnected')
			return { ok: true, view: todoistView(null) }
		}
		if (request.action === 'connect') {
			const token = request.token.trim()
			if (!token || /\s/.test(token)) throw new TodoistFailure('auth')
			const response = await syncTodoist(token, '*')
			account = {
				token,
				connectionId: uuid(),
				snapshot: mergeTodoistSync(null, response, nowMs()),
			}
			const latest = await syncTodoist(token, account.snapshot.syncToken)
			account.snapshot = mergeTodoistSync(account.snapshot, latest, nowMs())
			await setToStorage('todoistAccount', account)
			Analytics.event('todoist_connected')
			return { ok: true, view: todoistView(account) }
		}
		if (!account) {
			if (request.action !== 'sync') throw new TodoistFailure('auth')
			return { ok: true, view: todoistView(null) }
		}
		if (account.retryAt && account.retryAt > nowMs())
			throw new TodoistFailure('rate_limit', account.retryAt)
		if (
			request.action === 'reschedule' &&
			(!momentTz(request.date, 'YYYY-MM-DD', true).isValid() ||
				!momentTz.tz.zone(request.timezone))
		)
			throw new TodoistFailure('request')
		const commands = todoistCommands(request, account.snapshot.items)
		const previous = account
		const finished = await syncTodoistBatches(
			previous.token,
			previous.snapshot.syncToken,
			commands,
			async (response) => {
				const current = normalizeTodoistAccount(
					await getFromStorage('todoistAccount')
				)
				if (
					current?.token !== previous.token ||
					current?.connectionId !== previous.connectionId
				) {
					account = current
					return false
				}
				account = {
					token: previous.token,
					connectionId: previous.connectionId,
					snapshot: mergeTodoistSync(current.snapshot, response, nowMs()),
				}
				await setToStorage('todoistAccount', account)
				return true
			}
		)
		if (!finished) return { ok: true, view: todoistView(account) }
		if (request.action === 'sync') Analytics.event('todoist_synced')
		if (request.action === 'save') Analytics.event('todoist_saved')
		if (request.action === 'complete') Analytics.event('todoist_completed')
		if (request.action === 'delete') Analytics.event('todoist_deleted')
		if (request.action === 'reschedule')
			Analytics.event('todoist_rescheduled', { count: request.ids.length })
		return { ok: true, view: todoistView(account) }
	} catch (error) {
		const failure =
			error instanceof TodoistFailure ? error : new TodoistFailure('storage')
		if (account && request.action !== 'connect') {
			try {
				const current = normalizeTodoistAccount(
					await getFromStorage('todoistAccount')
				)
				if (
					current?.token === account.token &&
					current?.connectionId === account.connectionId
				)
					await setToStorage('todoistAccount', {
						...account,
						error: failure.code,
						retryAt: failure.retryAt,
					})
			} catch {}
		}
		Analytics.event('todoist_request_failed', {
			action: request.action,
			reason: failure.code,
		})
		return { ok: false, error: failure.code }
	}
}
