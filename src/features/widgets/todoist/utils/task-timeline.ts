import momentTz from 'moment-timezone'
import type { GoogleCalendarEvent } from '@/services/date/get-google-calendar-events.hook'
import type { TodoistTask } from '@/services/todoist/todoist.interface'
import { calendarPointTime } from './calendar-events'

export type TodoistTimelineItem =
	| { kind: 'task'; task: TodoistTask }
	| { kind: 'calendar'; event: GoogleCalendarEvent }

export function todoistTimeline(
	tasks: TodoistTask[],
	events: GoogleCalendarEvent[],
	timezone: string
): TodoistTimelineItem[] {
	const items: TodoistTimelineItem[] = [
		...tasks.map((task) => ({ kind: 'task' as const, task })),
		...events.map((event) => ({ kind: 'calendar' as const, event })),
	]
	const time = (item: TodoistTimelineItem) => {
		if (item.kind === 'calendar')
			return item.event.start.dateTime
				? calendarPointTime(item.event.start, timezone)
				: Number.POSITIVE_INFINITY
		const value = item.task.due?.date
		return value?.includes('T')
			? momentTz.tz(value, timezone).valueOf()
			: Number.POSITIVE_INFINITY
	}
	return items.sort((a, b) => {
		const first = time(a)
		const second = time(b)
		const validFirst = Number.isFinite(first) ? first : Number.POSITIVE_INFINITY
		const validSecond = Number.isFinite(second) ? second : Number.POSITIVE_INFINITY
		return validFirst === validSecond ? 0 : validFirst < validSecond ? -1 : 1
	})
}
