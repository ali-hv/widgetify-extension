import { v4 as uuid } from 'uuid'
import { TodoistFailure, syncTodoist } from './sync-request'
import { todoistCommands } from './task-commands'
import Analytics from '@/analytics'
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
		const commands = todoistCommands(request)
		const response = await syncTodoist(
			account.token,
			account.snapshot.syncToken,
			commands
		)
		const current = normalizeTodoistAccount(await getFromStorage('todoistAccount'))
		if (
			current?.token !== account.token ||
			current?.connectionId !== account.connectionId
		)
			return { ok: true, view: todoistView(current) }
		account = {
			token: account.token,
			connectionId: account.connectionId,
			snapshot: mergeTodoistSync(account.snapshot, response, nowMs()),
		}
		await setToStorage('todoistAccount', account)
		if (commands.some((command) => response.sync_status?.[command.uuid] !== 'ok'))
			throw new TodoistFailure('request')
		if (request.action === 'sync') Analytics.event('todoist_synced')
		if (request.action === 'save') Analytics.event('todoist_saved')
		if (request.action === 'complete') Analytics.event('todoist_completed')
		if (request.action === 'delete') Analytics.event('todoist_deleted')
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
