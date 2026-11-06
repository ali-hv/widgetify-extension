import { v4 as uuid, v5 as commandId } from 'uuid'
import momentTz from 'moment-timezone'
import type { TodoistCommand, TodoistRequest, TodoistTask } from './todoist.interface'
export function todoistCommands(
	request: TodoistRequest,
	tasks: TodoistTask[] = []
): TodoistCommand[] {
	const command = (
		type: string,
		args: Record<string, unknown>,
		taskId?: string
	): TodoistCommand => ({
		type,
		uuid: request.operationId
			? commandId(taskId ? `${type}:${taskId}` : type, request.operationId)
			: uuid(),
		args,
	})
	if (request.action === 'reschedule') {
		return [...new Set(request.ids)].flatMap((id) => {
			const task = tasks.find((item) => item.id === id)
			if (!task?.due || task.checked || task.is_deleted) return []
			const due = task.due
			let date = request.date
			if (due.date.includes('T')) {
				const fixed = /(?:Z|[+-]\d{2}:\d{2})$/.test(due.date)
				if (fixed) {
					const time = momentTz(due.date)
						.tz(request.timezone)
						.locale('en')
						.format('HH:mm:ss')
					date = momentTz
						.tz(`${request.date}T${time}`, request.timezone)
						.toISOString()
				} else date += due.date.slice(10)
			}
			return [command('item_update', { id, due: { ...due, date } }, id)]
		})
	}
	if (request.action === 'delete' || request.action === 'complete')
		return [
			command(request.action === 'delete' ? 'item_delete' : 'item_close', {
				id: request.id,
			}),
		]
	if (request.action !== 'save') return []
	const { project_id, section_id, ...attributes } = request.input
	if (!request.id)
		return [
			{
				...command('item_add', {
					...attributes,
					project_id,
					...(section_id ? { section_id } : {}),
				}),
				temp_id: request.operationId
					? commandId('temp', request.operationId)
					: uuid(),
			},
		]
	const result = [command('item_update', { ...attributes, id: request.id })]
	if (
		section_id !== request.previousSection ||
		project_id !== request.previousProject
	) {
		result.push(
			command('item_move', {
				id: request.id,
				...(section_id ? { section_id } : { project_id }),
			})
		)
	}
	return result
}
