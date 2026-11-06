import { describe, expect, it } from 'bun:test'
import { todoistCommands } from '@/services/todoist/task-commands'
import { syncTodoistBatches } from '@/services/todoist/sync-batches'
import type {
	TodoistRequest,
	TodoistTask,
	TodoistSyncResponse,
} from '@/services/todoist/todoist.interface'

function task(
	id: string,
	date: string,
	extra: Partial<NonNullable<TodoistTask['due']>> = {}
): TodoistTask {
	return {
		id,
		content: id,
		description: '',
		project_id: 'inbox',
		section_id: null,
		parent_id: null,
		priority: 1,
		labels: [],
		checked: false,
		due: { date, string: date, lang: 'en', is_recurring: false, ...extra },
	}
}
const request: Extract<TodoistRequest, { action: 'reschedule' }> = {
	action: 'reschedule',
	ids: ['a', 'b'],
	date: '2026-11-06',
	timezone: 'Asia/Tehran',
	operationId: 'a7c64ff5-f4f7-4550-ae8c-d77a8150dc76',
}

function response(
	commands: ReturnType<typeof todoistCommands>,
	cursor: string
): TodoistSyncResponse {
	return {
		full_sync: false,
		sync_token: cursor,
		sync_status: Object.fromEntries(commands.map((command) => [command.uuid, 'ok'])),
	}
}

describe('Todoist rescheduling', () => {
	it('updates only due dates, retains time, recurrence and language, and never completes tasks', () => {
		const tasks = [
			task('a', '2026-11-01', {
				string: 'chaque jour',
				lang: 'fr',
				is_recurring: true,
			}),
			task('b', '2026-11-01T09:30:00'),
		]
		const commands = todoistCommands(request, tasks)
		expect(commands.map((command) => command.type)).toEqual([
			'item_update',
			'item_update',
		])
		expect(commands[0].args).toEqual({
			id: 'a',
			due: { ...tasks[0].due, date: '2026-11-06' },
		})
		expect(commands[1].args).toEqual({
			id: 'b',
			due: { ...tasks[1].due, date: '2026-11-06T09:30:00' },
		})
		expect(commands[0].uuid).not.toBe(commands[1].uuid)
		expect(todoistCommands(request, tasks)).toEqual(commands)
		expect(tasks[0].due?.date).toBe('2026-11-01')
	})
	it('preserves the visible clock time of fixed timestamps across a daylight-saving boundary', () => {
		const commands = todoistCommands(
			{ ...request, ids: ['a'], date: '2026-03-09', timezone: 'America/New_York' },
			[
				task('a', '2026-03-07T14:30:00Z', {
					timezone: 'America/New_York',
					is_recurring: true,
					string: 'every day at 9:30',
				}),
			]
		)
		expect(commands[0].args.due).toEqual({
			date: '2026-03-09T13:30:00.000Z',
			timezone: 'America/New_York',
			is_recurring: true,
			string: 'every day at 9:30',
			lang: 'en',
		})
	})
	it('deduplicates selected IDs and skips missing, undated, completed and deleted tasks', () => {
		const tasks = [
			task('a', '2026-11-01'),
			{ ...task('b', '2026-11-01'), checked: true },
			{ ...task('c', '2026-11-01'), is_deleted: true },
			{ ...task('d', '2026-11-01'), due: null },
		]
		const commands = todoistCommands(
			{ ...request, ids: ['a', 'a', 'b', 'c', 'd', 'missing'] },
			tasks
		)
		expect(commands).toHaveLength(1)
		expect(commands[0].args.id).toBe('a')
	})
	it('sends more than 100 updates in bounded batches with the returned cursors', async () => {
		const tasks = Array.from({ length: 205 }, (_, i) => task(String(i), '2026-11-01'))
		const commands = todoistCommands(
			{ ...request, ids: tasks.map((task) => task.id) },
			tasks
		)
		const calls: Array<{ cursor: string; count: number }> = []
		const committed: string[] = []
		await syncTodoistBatches(
			'token',
			'initial',
			commands,
			async (data) => {
				committed.push(data.sync_token)
				return true
			},
			async (_token, cursor, batch = []) => {
				calls.push({ cursor, count: batch.length })
				return response(batch, `cursor-${calls.length}`)
			}
		)
		expect(calls).toEqual([
			{ cursor: 'initial', count: 100 },
			{ cursor: 'cursor-1', count: 100 },
			{ cursor: 'cursor-2', count: 5 },
		])
		expect(committed).toEqual(['cursor-1', 'cursor-2', 'cursor-3'])
		expect(new Set(commands.map((command) => command.uuid)).size).toBe(205)
	})
	it('commits a partially successful response and stops before sending the remaining batch', async () => {
		const tasks = Array.from({ length: 101 }, (_, i) => task(String(i), '2026-11-01'))
		const commands = todoistCommands(
			{ ...request, ids: tasks.map((task) => task.id) },
			tasks
		)
		let sent = 0
		const committed: TodoistSyncResponse[] = []
		await expect(
			syncTodoistBatches(
				'token',
				'initial',
				commands,
				async (data) => {
					committed.push(data)
					return true
				},
				async (_token, _cursor, batch = []) => {
					sent++
					const data = response(batch, 'partial')
					data.sync_status![batch[1].uuid] = {
						error_code: 1,
						error: 'Rejected',
					}
					return data
				}
			)
		).rejects.toThrow('request')
		expect(sent).toBe(1)
		expect(committed).toHaveLength(1)
		expect(committed[0].sync_status![commands[0].uuid]).toBe('ok')
	})
	it('stops after an account change and retains ordinary sync with no commands', async () => {
		let sent = 0
		await syncTodoistBatches(
			'token',
			'initial',
			[],
			async () => false,
			async (_token, _cursor, batch = []) => {
				sent++
				return response(batch, 'next')
			}
		)
		expect(sent).toBe(1)
	})
})
