import { syncTodoist, TodoistFailure } from './sync-request'
import type { TodoistCommand, TodoistSyncResponse } from './todoist.interface'

export async function syncTodoistBatches(
	token: string,
	cursor: string,
	commands: TodoistCommand[],
	commit: (response: TodoistSyncResponse) => Promise<boolean>,
	send: typeof syncTodoist = syncTodoist
) {
	for (let offset = 0; offset < Math.max(commands.length, 1); offset += 100) {
		const batch = commands.slice(offset, offset + 100)
		const response = await send(token, cursor, batch)
		if (!(await commit(response))) return false
		cursor = response.sync_token
		if (batch.some((command) => response.sync_status?.[command.uuid] !== 'ok'))
			throw new TodoistFailure('request')
	}
	return true
}
