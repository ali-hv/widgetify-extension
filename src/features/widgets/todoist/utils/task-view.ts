import momentTz from 'moment-timezone'
import type { TodoistTask } from '@/services/todoist/todoist.interface'

export type TodoistTaskView = 'today' | 'tomorrow' | 'upcoming'

export function todoistDateRange(view: TodoistTaskView, now: Date, timezone: string) {
	const start = momentTz.tz(now, timezone).locale('en').startOf('day')
	if (view === 'tomorrow') start.add(1, 'day')
	return {
		day: start.format('YYYY-MM-DD'),
		start: start.toISOString(),
		end: start
			.clone()
			.add(view === 'upcoming' ? 30 : 1, 'days')
			.toISOString(),
	}
}

export function filterTodoistTasks(
	tasks: TodoistTask[],
	view: TodoistTaskView,
	day: string,
	timezone: string,
	project: string
) {
	return tasks.filter((task) => {
		if (task.checked || task.is_deleted || (project && task.project_id !== project))
			return false
		if (view === 'upcoming') return true
		if (!task.due) return false
		const value = task.due.date
		const dueDay = /(?:Z|[+-]\d{2}:\d{2})$/.test(value)
			? momentTz(value).tz(timezone).locale('en').format('YYYY-MM-DD')
			: value.slice(0, 10)
		return dueDay === day
	})
}
