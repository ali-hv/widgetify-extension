import momentTz from 'moment-timezone'
import type { GoogleCalendarEvent } from '@/services/date/get-google-calendar-events.hook'

type CalendarPoint = GoogleCalendarEvent['start']

export function calendarPointTime(point: CalendarPoint, timezone: string): number {
	const value = point.dateTime || point.date
	if (!value) return Number.NaN
	return momentTz.tz(value, point.timeZone || timezone).valueOf()
}

export function visibleCalendarEvents(
	events: GoogleCalendarEvent[],
	start: string,
	end: string,
	timezone: string
) {
	const from = Date.parse(start)
	const until = Date.parse(end)
	const seen = new Set<string>()
	return events
		.filter((event) => {
			if (event.status === 'cancelled') return false
			const begins = calendarPointTime(event.start, timezone)
			const ends = calendarPointTime(event.end, timezone)
			const key = `${event.id}:${event.start.dateTime || event.start.date}`
			if (
				!Number.isFinite(begins) ||
				!Number.isFinite(ends) ||
				begins >= until ||
				ends <= from ||
				seen.has(key)
			)
				return false
			seen.add(key)
			return true
		})
		.sort(
			(a, b) =>
				calendarPointTime(a.start, timezone) -
				calendarPointTime(b.start, timezone)
		)
}

export function calendarEventTiming(event: GoogleCalendarEvent, timezone: string) {
	const begins = calendarPointTime(event.start, timezone)
	const ends = calendarPointTime(event.end, timezone)
	const timeOptions = {
		timeZone: timezone,
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23',
	} as const
	return {
		allDay: !event.start.dateTime,
		day: new Date(begins).toLocaleDateString('fa-IR', { timeZone: timezone }),
		start: new Date(begins).toLocaleTimeString('fa-IR', timeOptions),
		end: new Date(ends).toLocaleTimeString('fa-IR', timeOptions),
	}
}

export function calendarEventUrl(event: GoogleCalendarEvent): string | null {
	try {
		const url = new URL(event.htmlLink)
		return url.protocol === 'https:' &&
			(url.hostname === 'calendar.google.com' ||
				(url.hostname === 'www.google.com' &&
					url.pathname.startsWith('/calendar/')))
			? url.href
			: null
	} catch {
		return null
	}
}
