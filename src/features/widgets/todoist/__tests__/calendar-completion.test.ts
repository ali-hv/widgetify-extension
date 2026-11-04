import { describe, expect, it } from 'bun:test'
import type { GoogleCalendarEvent } from '@/services/date/get-google-calendar-events.hook'
import {
	calendarCompletionKey,
	normalizeCalendarCompletion,
} from '../utils/calendar-completion'

const event = {
	id: 'instance',
	organizer: { email: 'calendar@example.com' },
	start: { dateTime: '2026-11-04T09:00:00+03:30' },
} as GoogleCalendarEvent

describe('local calendar completion identity', () => {
	it('restores the same occurrence after a new response or timezone representation', () => {
		const saved = calendarCompletionKey('account', event)
		expect(
			calendarCompletionKey('account', {
				...event,
				summary: 'Renamed',
				start: { dateTime: '2026-11-04T05:30:00Z' },
			})
		).toBe(saved)
	})
	it('keeps accounts, calendars and recurring occurrences independent', () => {
		const keys = [
			calendarCompletionKey('account', event),
			calendarCompletionKey('other-account', event),
			calendarCompletionKey('account', {
				...event,
				organizer: { ...event.organizer, email: 'other-calendar@example.com' },
			}),
			calendarCompletionKey('account', {
				...event,
				start: { dateTime: '2026-11-05T09:00:00+03:30' },
			}),
		]
		expect(new Set(keys).size).toBe(4)
	})
	it('preserves completion when a recurring occurrence moves but retains its original start', () => {
		const originalStartTime = event.start
		const key = calendarCompletionKey('account', { ...event, originalStartTime })
		expect(
			calendarCompletionKey('account', {
				...event,
				originalStartTime,
				start: { dateTime: '2026-11-04T11:00:00+03:30' },
			})
		).toBe(key)
	})
	it('keeps all-day instances separate and accepts only a saved boolean true', () => {
		const first = calendarCompletionKey('account', {
			...event,
			start: { date: '2026-11-04' },
		})
		const next = calendarCompletionKey('account', {
			...event,
			start: { date: '2026-11-05' },
		})
		expect(first).not.toBe(next)
		for (const value of [null, undefined, false, 'true', 1, {}, []])
			expect(normalizeCalendarCompletion(value)).toBe(false)
		expect(normalizeCalendarCompletion(true)).toBe(true)
	})
})
