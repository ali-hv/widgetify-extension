import momentTz from 'moment-timezone'
import type { TodoistTask, TodoistTaskInput } from '@/services/todoist/todoist.interface'

interface TaskDraft {
	content: string
	description: string
	project: string
	section: string
	priority: number
	labels: string
	date: string
	time: string
	recurrence: string
	originalDue: TodoistTask['due']
	dueChanged: boolean
}

export function createTaskDraft(
	task: TodoistTask | null,
	project: string,
	initialDate = ''
): TaskDraft {
	let date = task ? (task.due?.date.slice(0, 10) ?? '') : initialDate
	let time = task?.due?.date.includes('T') ? task.due.date.slice(11, 16) : ''
	if (task?.due && /(?:Z|[+-]\d{2}:\d{2})$/.test(task.due.date)) {
		const parts = new Intl.DateTimeFormat('en-CA', {
			timeZone: task.due.timezone ?? undefined,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			hourCycle: 'h23',
		}).formatToParts(new Date(task.due.date))
		const part = (name: string) =>
			parts.find((item) => item.type === name)?.value ?? ''
		date = `${part('year')}-${part('month')}-${part('day')}`
		time = `${part('hour')}:${part('minute')}`
	}
	return {
		content: task?.content ?? '',
		description: task?.description ?? '',
		project: task?.project_id ?? project,
		section: task?.section_id ?? '',
		priority: task?.priority ?? 1,
		labels: task?.labels.join(', ') ?? '',
		date,
		time,
		recurrence: task?.due?.is_recurring ? task.due.string : '',
		originalDue: task?.due ?? null,
		dueChanged: !task && Boolean(initialDate),
	}
}

export function taskDraftInput(draft: TaskDraft): TodoistTaskInput {
	let due: TodoistTaskInput['due']
	if (draft.dueChanged) {
		if (draft.recurrence.trim()) {
			const rule = draft.recurrence.trim()
			due = {
				string: ['every day', 'every week', 'every month'].includes(rule)
					? `${rule}${draft.time ? ` at ${draft.time}` : ''}${draft.date ? ` starting ${draft.date}` : ''}`
					: rule,
				lang: rule === draft.originalDue?.string ? draft.originalDue.lang : 'en',
			}
		} else
			due = draft.date
				? {
						date:
							draft.time && draft.originalDue?.timezone
								? momentTz
										.tz(
											`${draft.date}T${draft.time}:00`,
											draft.originalDue.timezone
										)
										.toISOString()
								: `${draft.date}${draft.time ? `T${draft.time}:00` : ''}`,
						timezone:
							draft.time && draft.originalDue?.timezone
								? draft.originalDue.timezone
								: null,
					}
				: null
	}
	return {
		content: draft.content.trim(),
		description: draft.description.trim(),
		project_id: draft.project,
		section_id: draft.section || null,
		priority: draft.priority,
		labels: [
			...new Set(
				draft.labels
					.split(/[,\u060c]/)
					.map((label) => label.trim())
					.filter(Boolean)
			),
		],
		...(draft.dueChanged ? { due } : {}),
	}
}
