import type { GoogleCalendarEvent } from '@/services/date/get-google-calendar-events.hook'

export function calendarCompletionKey(account: string, event: GoogleCalendarEvent) {
	const point = event.originalStartTime ?? event.start
	const value = point.dateTime || point.date || ''
	const parsed = point.dateTime ? Date.parse(value) : Number.NaN
	const occurrence = Number.isFinite(parsed) ? new Date(parsed).toISOString() : value
	return `todoistCalendarCompletion:${JSON.stringify([
		account,
		event.organizer?.email ?? '',
		event.id,
		occurrence,
	])}` as const
}

export function normalizeCalendarCompletion(value: unknown): boolean {
	return value === true
}
