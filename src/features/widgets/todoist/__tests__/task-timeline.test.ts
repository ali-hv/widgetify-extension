import { describe, expect, it } from 'bun:test'
import type { GoogleCalendarEvent } from '@/services/date/get-google-calendar-events.hook'
import type { TodoistTask } from '@/services/todoist/todoist.interface'
import { todoistTimeline } from '../utils/task-timeline'

function task(id: string, date: string | null): TodoistTask {
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
		due: date ? { date, string: date, lang: 'en', is_recurring: false } : null,
	}
}

function event(id: string, start: GoogleCalendarEvent['start']): GoogleCalendarEvent {
	return { id, start } as GoogleCalendarEvent
}

function ids(
	tasks: TodoistTask[],
	events: GoogleCalendarEvent[],
	timezone = 'Asia/Tehran'
) {
	return todoistTimeline(tasks, events, timezone).map((item) =>
		item.kind === 'task' ? item.task.id : item.event.id
	)
}

describe('Todoist combined timeline', () => {
	it('interleaves calendar events and tasks by clock time, before date-only items', () => {
		const tasks = [
			task('date-only', '2026-11-04'),
			task('noon', '2026-11-04T12:00:00'),
			task('morning', '2026-11-04T09:00:00'),
		]
		const events = [
			event('meeting', { dateTime: '2026-11-04T10:00:00+03:30' }),
			event('all-day', { date: '2026-11-04' }),
		]
		expect(ids(tasks, events)).toEqual([
			'morning',
			'meeting',
			'noon',
			'date-only',
			'all-day',
		])
		expect(tasks.map((item) => item.id)).toEqual(['date-only', 'noon', 'morning'])
	})
	it('preserves the existing order of date-only and undated tasks, regardless of date', () => {
		expect(
			ids(
				[
					task('future', '2030-01-01'),
					task('undated', null),
					task('older', '2020-01-01'),
				],
				[]
			)
		).toEqual(['future', 'undated', 'older'])
	})
	it('compares UTC, explicit offsets and floating times in the selected timezone', () => {
		expect(
			ids(
				[
					task('floating', '2026-11-04T10:15:00'),
					task('utc', '2026-11-04T07:00:00Z'),
				],
				[event('offset', { dateTime: '2026-11-04T10:00:00+03:30' })]
			)
		).toEqual(['offset', 'floating', 'utc'])
		expect(
			ids(
				[task('floating', '2026-11-04T10:15:00')],
				[event('utc', { dateTime: '2026-11-04T07:00:00Z' })],
				'UTC'
			)
		).toEqual(['utc', 'floating'])
	})
	it('keeps chronological dates in Upcoming, including overdue clock times', () => {
		expect(
			ids(
				[
					task('today-nine', '2026-11-04T09:00:00'),
					task('yesterday-late', '2026-11-03T23:00:00'),
				],
				[event('tomorrow-early', { dateTime: '2026-11-05T01:00:00+03:30' })]
			)
		).toEqual(['yesterday-late', 'today-nine', 'tomorrow-early'])
	})
	it('keeps equal-time rows stable and respects event timezone for floating starts', () => {
		expect(
			ids(
				[
					task('first', '2026-11-04T10:00:00'),
					task('second', '2026-11-04T10:00:00'),
				],
				[event('same-time', { dateTime: '2026-11-04T06:30:00', timeZone: 'UTC' })]
			)
		).toEqual(['first', 'second', 'same-time'])
	})
})
