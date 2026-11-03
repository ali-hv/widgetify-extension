import { v4 as uuid, v5 as commandId } from 'uuid'
import type { TodoistCommand, TodoistRequest } from './todoist.interface'
export function todoistCommands(request: TodoistRequest): TodoistCommand[] {
	const command = (type: string, args: Record<string, unknown>): TodoistCommand => ({
		type,
		uuid: request.operationId ? commandId(type, request.operationId) : uuid(),
		args,
	})
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
