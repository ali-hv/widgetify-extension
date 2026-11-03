import Analytics from '@/analytics'
import { t } from '@/common/i18n'
import { callEvent } from '@/common/utils/call-event'
import { Alert, Button, Spinner } from '@/components/ui'
import { Icon } from '@/icons'
import type { GoogleCalendarEvent } from '@/services/date/get-google-calendar-events.hook'
import {
	calendarEventTiming,
	calendarEventUrl,
	visibleCalendarEvents,
} from '../utils/calendar-events'
import type { TodoistTaskView } from '../utils/task-view'

interface TodoistCalendarProps {
	view: TodoistTaskView
	timezone: string
	range: { start: string; end: string }
	isAuthenticated: boolean
	connected: boolean
	events?: GoogleCalendarEvent[]
	loading: boolean
	error: boolean
	onRetry: () => void
}

export function TodoistCalendar({
	view,
	timezone,
	range,
	isAuthenticated,
	connected,
	events,
	loading,
	error,
	onRetry,
}: TodoistCalendarProps) {
	const shown = visibleCalendarEvents(events ?? [], range.start, range.end, timezone)
	const connect = () => {
		Analytics.event('todoist_calendar_connection_opened', {
			signed_in: isAuthenticated,
		})
		if (isAuthenticated) callEvent('openSettings', 'platforms')
		else callEvent('openProfile')
	}
	return (
		<section
			className="flex flex-col gap-2 pt-3 border-t border-line"
			aria-label={t('todoist.calendarTitle')}
		>
			<h4 className="text-2xs font-bold text-fg-strong">
				{view === 'upcoming'
					? t('todoist.calendarUpcoming')
					: t('todoist.calendarTitle')}
			</h4>
			{!connected ? (
				<>
					<p className="text-2xs text-fg-muted">
						{t('todoist.calendarConnectHint')}
					</p>
					<Button
						size="sm"
						variant="ghost"
						color="brand"
						className="self-start"
						onClick={connect}
					>
						{isAuthenticated
							? t('todoist.calendarConnect')
							: t('todoist.calendarSignIn')}
					</Button>
				</>
			) : (
				<>
					{error && (
						<Alert
							tone="warning"
							className="text-2xs"
							action={
								<Button size="xs" variant="ghost" onClick={onRetry}>
									{t('todoist.calendarRetry')}
								</Button>
							}
						>
							{t('todoist.calendarError')}
						</Alert>
					)}
					{loading && !events ? (
						<Spinner size="xs" />
					) : (
						<>
							{!error && shown.length === 0 && (
								<p className="text-2xs text-fg-muted">
									{t('todoist.calendarEmpty')}
								</p>
							)}
							<ul className="flex flex-col gap-1" aria-busy={loading}>
								{shown.map((event) => {
									const timing = calendarEventTiming(event, timezone)
									const link = calendarEventUrl(event)
									const content = (
										<>
											<Icon
												name="calendar"
												size={16}
												className="shrink-0 mt-1 text-fg-muted"
												aria-hidden="true"
											/>
											<span className="flex flex-col min-w-0 gap-1">
												<span
													dir="auto"
													className="text-xs text-fg break-words"
												>
													{event.summary ||
														t('todoist.calendarUntitled')}
												</span>
												<span className="text-3xs text-fg-muted">
													{[
														view === 'upcoming'
															? timing.day
															: '',
														timing.allDay
															? t('todoist.calendarAllDay')
															: t('todoist.calendarTime', {
																	start: timing.start,
																	end: timing.end,
																}),
													]
														.filter(Boolean)
														.join(' · ')}
												</span>
											</span>
										</>
									)
									return (
										<li
											key={`${event.id}:${event.start.dateTime || event.start.date}`}
										>
											{link ? (
												<a
													className="flex items-start gap-2.5 px-2 py-1.5 rounded-xl hover:bg-fill transition-ui focus-visible:focus-ring"
													href={link}
													target="_blank"
													rel="noopener noreferrer"
													onClick={() =>
														Analytics.event(
															'todoist_calendar_event_opened'
														)
													}
												>
													{content}
												</a>
											) : (
												<div className="flex items-start gap-2.5 px-2 py-1.5">
													{content}
												</div>
											)}
										</li>
									)
								})}
							</ul>
						</>
					)}
				</>
			)}
		</section>
	)
}
