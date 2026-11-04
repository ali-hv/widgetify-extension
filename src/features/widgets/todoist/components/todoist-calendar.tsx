import Analytics from '@/analytics'
import { t } from '@/common/i18n'
import { callEvent } from '@/common/utils/call-event'
import { Alert, Button, Spinner } from '@/components/ui'
import type { TodoistTaskView } from '../utils/task-view'

interface TodoistCalendarProps {
	view: TodoistTaskView
	isAuthenticated: boolean
	connected: boolean
	shownCount: number
	loading: boolean
	error: boolean
	onRetry: () => void
}

export function TodoistCalendar({
	view,
	isAuthenticated,
	connected,
	shownCount,
	loading,
	error,
	onRetry,
}: TodoistCalendarProps) {
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
					{loading && <Spinner size="xs" />}
					{!loading && !error && shownCount === 0 && (
						<p className="text-2xs text-fg-muted">
							{t('todoist.calendarEmpty')}
						</p>
					)}
				</>
			)}
		</section>
	)
}
