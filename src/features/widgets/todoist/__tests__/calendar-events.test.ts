import { describe, expect, it } from 'bun:test'
import type { GoogleCalendarEvent } from '@/services/date/get-google-calendar-events.hook'
import {
	calendarEventTiming,
	calendarEventUrl,
	visibleCalendarEvents,
} from '../utils/calendar-events'
import { todoistDateRange } from '../utils/task-view'

function event(
	id: string,
	start: GoogleCalendarEvent['start'],
	end: GoogleCalendarEvent['end'],
	change: Partial<GoogleCalendarEvent> = {}
): GoogleCalendarEvent {
	return {
		id,
		summary: id,
		status: 'confirmed',
		start,
		end,
		htmlLink: 'https://calendar.google.com/calendar/event?eid=test',
		...change,
	} as GoogleCalendarEvent
}
const range = todoistDateRange('today', new Date('2026-11-04T12:00:00Z'), 'Asia/Tehran')
const today = event('today', { date: '2026-11-04' }, { date: '2026-11-05' })
const overnight = event(
	'overnight',
	{ dateTime: '2026-11-03T23:00:00+03:30' },
	{ dateTime: '2026-11-04T01:00:00+03:30' }
)

describe('Todoist Google Calendar section', () => {
	it('includes all-day and overnight events but excludes exclusive end boundaries and cancellations', () => {
		const ended = event('ended', { date: '2026-11-03' }, { date: '2026-11-04' })
		const tomorrow = event('tomorrow', { date: '2026-11-05' }, { date: '2026-11-06' })
		const cancelled = { ...today, id: 'cancelled', status: 'cancelled' }
		expect(
			visibleCalendarEvents(
				[today, overnight, ended, tomorrow, cancelled],
				range.start,
				range.end,
				'Asia/Tehran'
			).map((item) => item.id)
		).toEqual(['overnight', 'today'])
	})
	it('deduplicates an event without dropping distinct recurring instances', () => {
		const next = event(
			'today',
			{ dateTime: '2026-11-04T12:00:00+03:30' },
			{ dateTime: '2026-11-04T13:00:00+03:30' }
		)
		expect(
			visibleCalendarEvents(
				[today, today, next],
				range.start,
				range.end,
				'Asia/Tehran'
			)
		).toHaveLength(2)
	})
	it('formats a fixed time in the selected timezone and identifies all-day events', () => {
		expect(calendarEventTiming(today, 'Asia/Tehran').allDay).toBe(true)
		const timed = event(
			'timed',
			{ dateTime: '2026-11-04T07:00:00Z' },
			{ dateTime: '2026-11-04T08:00:00Z' }
		)
		expect(calendarEventTiming(timed, 'Asia/Tehran').start).toBe(
			new Date('2026-11-04T07:00:00Z').toLocaleTimeString('fa-IR', {
				timeZone: 'Asia/Tehran',
				hour: '2-digit',
				minute: '2-digit',
				hourCycle: 'h23',
			})
		)
	})
	it('opens only HTTPS Google Calendar links', () => {
		expect(calendarEventUrl(today)).toBe(today.htmlLink)
		for (const htmlLink of [
			'javascript:alert(1)',
			'https://calendar.google.com.attacker.example/event',
			'http://calendar.google.com/event',
			'https://www.google.com/search?q=test',
		])
			expect(calendarEventUrl({ ...today, htmlLink })).toBeNull()
	})
})
