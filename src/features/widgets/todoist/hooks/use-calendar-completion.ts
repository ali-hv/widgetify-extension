import { useEffect, useRef, useState } from 'react'
import Analytics from '@/analytics'
import { getFromStorage, setToStorage, watchStorage } from '@/common/storage'
import type { GoogleCalendarEvent } from '@/services/date/get-google-calendar-events.hook'
import {
	calendarCompletionKey,
	normalizeCalendarCompletion,
} from '../utils/calendar-completion'

export function useCalendarCompletion(
	account: string | null,
	events: GoogleCalendarEvent[]
) {
	const [completed, setCompleted] = useState<Record<string, boolean>>({})
	const [loadedKeys, setLoadedKeys] = useState<string | null>(null)
	const [failed, setFailed] = useState(false)
	const [saving, setSaving] = useState(false)
	const pending = useRef(false)
	const keys = JSON.stringify(
		account ? events.map((event) => calendarCompletionKey(account, event)) : []
	)
	useEffect(() => {
		let active = true
		const storageKeys: ReturnType<typeof calendarCompletionKey>[] = JSON.parse(keys)
		setFailed(false)
		const reads: Promise<void>[] = []
		const stops = storageKeys.map((key) => {
			let changed = false
			const stop = watchStorage(key, (value) => {
				changed = true
				if (active)
					setCompleted((previous) => ({
						...previous,
						[key]: normalizeCalendarCompletion(value),
					}))
			})
			reads.push(
				getFromStorage(key)
					.then((value) => {
						if (active && !changed)
							setCompleted((previous) => ({
								...previous,
								[key]: normalizeCalendarCompletion(value),
							}))
					})
					.catch(() => {
						if (!active || changed) return
						setCompleted((previous) => ({ ...previous, [key]: false }))
						setFailed(true)
						Analytics.event('todoist_calendar_completion_load_failed')
					})
			)
			return stop
		})
		void Promise.all(reads).then(() => {
			if (active) setLoadedKeys(keys)
		})
		return () => {
			active = false
			for (const stop of stops) stop()
		}
	}, [keys])
	const shown =
		account && loadedKeys === keys
			? events.filter(
					(event) => completed[calendarCompletionKey(account, event)] === false
				)
			: []
	const loading = !!account && events.length > 0 && loadedKeys !== keys
	const complete = async (event: GoogleCalendarEvent) => {
		if (!account || pending.current) return
		const key = calendarCompletionKey(account, event)
		pending.current = true
		setSaving(true)
		setFailed(false)
		try {
			await setToStorage(key, true)
			setCompleted((previous) => ({ ...previous, [key]: true }))
			Analytics.event('todoist_calendar_event_completed')
		} catch {
			setFailed(true)
			Analytics.event('todoist_calendar_completion_failed')
		} finally {
			pending.current = false
			setSaving(false)
		}
	}
	return { shown, loading, saving, failed, complete }
}
