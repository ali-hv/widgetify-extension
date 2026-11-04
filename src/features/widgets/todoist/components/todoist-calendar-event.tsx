import Analytics from '@/analytics'
import { t } from '@/common/i18n'
import { Icon } from '@/icons'
import type { GoogleCalendarEvent } from '@/services/date/get-google-calendar-events.hook'
import { calendarEventTiming, calendarEventUrl } from '../utils/calendar-events'
import type { TodoistTaskView } from '../utils/task-view'

interface TodoistCalendarEventProps {
	event: GoogleCalendarEvent
	timezone: string
	view: TodoistTaskView
	saving: boolean
	onComplete: (event: GoogleCalendarEvent) => void
}

export function TodoistCalendarEvent({
	event,
	timezone,
	view,
	saving,
	onComplete,
}: TodoistCalendarEventProps) {
	const timing = calendarEventTiming(event, timezone)
	const link = calendarEventUrl(event)
	const title = event.summary || t('todoist.calendarUntitled')
	const content = (
		<>
			<span dir="auto" className="w-full text-xs text-fg break-words">
				{title}
			</span>
			<span className="text-3xs text-fg-muted">
				<Icon
					name="calendar"
					size={10}
					className="inline-block me-1"
					aria-hidden="true"
				/>
				{[
					view === 'upcoming' ? timing.day : '',
					timing.allDay
						? t('todoist.calendarAllDay')
						: t('todoist.calendarTime', {
								start: timing.start,
								end: timing.end,
							}),
					t('todoist.calendarSource'),
				]
					.filter(Boolean)
					.join(' · ')}
			</span>
		</>
	)
	const contentClass =
		'flex flex-col flex-1 min-w-0 gap-1 py-1 text-start rounded-lg focus-visible:focus-ring'
	return (
		<li className="flex items-start gap-2.5 px-2 py-1.5 rounded-xl hover:bg-fill transition-ui">
			<button
				type="button"
				disabled={saving}
				aria-label={t('todoist.completeTask', { title })}
				className="flex items-center justify-center w-8 h-8 shrink-0 rounded-full cursor-pointer focus-visible:focus-ring disabled:opacity-50 text-fg-muted"
				onClick={() => onComplete(event)}
			>
				<span className="w-4 h-4 border rounded-full border-current" />
			</button>
			{link ? (
				<a
					className={contentClass}
					href={link}
					target="_blank"
					rel="noopener noreferrer"
					onClick={() => Analytics.event('todoist_calendar_event_opened')}
				>
					{content}
				</a>
			) : (
				<div className={contentClass}>{content}</div>
			)}
		</li>
	)
}
