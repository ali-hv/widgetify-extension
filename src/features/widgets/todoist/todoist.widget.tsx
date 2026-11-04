import { useAuth } from '@/context/auth.context'
import { useGeneralSetting } from '@/context/general-setting.context'
import { nowDate, onClockCorrected } from '@/common/utils/trusted-time'
import {
	useGetGoogleCalendarEvents,
	useRefreshGoogleCalendarEvents,
} from '@/services/date/get-google-calendar-events.hook'
import { TodoistCalendar } from './components/todoist-calendar'
import { useCalendarCompletion } from './hooks/use-calendar-completion'
import { visibleCalendarEvents } from './utils/calendar-events'
import { todoistTimeline } from './utils/task-timeline'
import {
	filterTodoistTasks,
	todoistDateRange,
	type TodoistTaskView,
} from './utils/task-view'
import { WidgetEmpty } from '../components/widget-empty'
import { WidgetError } from '../components/widget-error'
import { TodoistTaskList } from './components/todoist-task-list'
import { useEffect, useState } from 'react'
import Analytics from '@/analytics'
import { t } from '@/common/i18n'
import {
	Alert,
	Button,
	PopoverMenuItem,
	SelectBox,
	TabNavigation,
	Spinner,
	TextInput,
	Tooltip,
} from '@/components/ui'
import { Icon } from '@/icons'
import { useTodoist } from '@/services/todoist/use-todoist.hook'
import type { TodoistTask } from '@/services/todoist/todoist.interface'
import { WidgetHeader } from '../components/widget-header'
import { useWidgetMenuActions } from '../widget-menu.context'
import { formatUpdatedAt } from '../utils/updated-at'
import { TodoistEditor } from './components/todoist-editor'

function errorMessage(code: string) {
	if (code === 'auth') return t('todoist.authError')
	if (code === 'rate_limit') return t('todoist.rateLimit')
	if (code === 'request') return t('todoist.requestError')
	if (code === 'storage') return t('todoist.storageError')
	return t('todoist.networkError')
}

export function TodoistWidget() {
	const { view, busy, ready, error, perform } = useTodoist()
	const { user, isAuthenticated } = useAuth()
	const { selected_timezone } = useGeneralSetting()
	const timezone = selected_timezone.value
	const [taskView, setTaskView] = useState<TodoistTaskView>('today')
	const [now, setNow] = useState(nowDate)
	const range = todoistDateRange(taskView, now, timezone)
	const calendarConnected = isAuthenticated && !!user?.connections?.includes('google')
	const calendarEnabled = calendarConnected && !!view?.connected
	const calendar = useGetGoogleCalendarEvents(calendarEnabled, range.start, range.end)
	const calendarEvents = visibleCalendarEvents(
		calendarEnabled ? (calendar.data ?? []) : [],
		range.start,
		range.end,
		timezone
	)
	const calendarCompletion = useCalendarCompletion(
		calendarEnabled && user
			? user.email || user.phone || user.username || user.joinedAt
			: null,
		calendarEvents
	)
	const refreshCalendar = useRefreshGoogleCalendarEvents(
		calendarEnabled,
		range.start,
		range.end
	)
	useEffect(() => {
		const update = () => setNow(nowDate())
		const timer = setInterval(update, 30000)
		const stop = onClockCorrected(update)
		return () => {
			clearInterval(timer)
			stop()
		}
	}, [])
	useEffect(() => {
		if (calendarEnabled) Analytics.event('todoist_calendar_opened')
	}, [calendarEnabled])
	useEffect(() => {
		if (calendarEnabled && calendar.isError)
			Analytics.event('todoist_calendar_load_failed')
	}, [calendarEnabled, calendar.isError, calendar.errorUpdatedAt])
	const retryCalendar = () => {
		void refreshCalendar().catch(() => {})
	}

	const [token, setToken] = useState('')
	const [project, setProject] = useState('')
	const [editor, setEditor] = useState<{
		task: TodoistTask | null
		key: number
	} | null>(null)
	const [reconnect, setReconnect] = useState(false)
	const [disconnecting, setDisconnecting] = useState(false)
	const snapshot = view?.snapshot
	const connected = view?.connected ?? false
	useEffect(() => {
		setEditor(null)
		setReconnect(false)
		setDisconnecting(false)
		setProject('')
		setToken('')
	}, [view?.connectionId])
	useEffect(() => {
		Analytics.event('todoist_opened')
	}, [])
	useEffect(() => {
		if (project && !snapshot?.projects.some((item) => item.id === project))
			setProject('')
		if (!connected) setEditor(null)
	}, [project, snapshot?.projects, connected])
	const openEditor = (task: TodoistTask | null) => {
		setEditor((previous) => ({ task, key: (previous?.key ?? 0) + 1 }))
		Analytics.event('todoist_editor_opened')
	}
	const manualSync = () => {
		Analytics.event('todoist_sync_clicked')
		void perform({ action: 'sync' })
		retryCalendar()
	}
	useWidgetMenuActions(
		connected ? (
			<>
				<PopoverMenuItem
					icon={<Icon name="refresh" size={14} />}
					label={t('todoist.sync')}
					onClick={manualSync}
				/>
				<PopoverMenuItem
					label={t('todoist.changeToken')}
					onClick={() => {
						setReconnect(true)
						setEditor(null)
						Analytics.event('todoist_connection_opened')
					}}
				/>
				<PopoverMenuItem
					label={t('todoist.disconnect')}
					onClick={() => {
						setDisconnecting(true)
						Analytics.event('todoist_disconnect_opened')
					}}
				/>
			</>
		) : null
	)
	const tasks = filterTodoistTasks(
		snapshot?.items ?? [],
		taskView,
		range.day,
		timezone,
		project
	)
	const timeline = todoistTimeline(tasks, calendarCompletion.shown, timezone)
	const emptyMessage =
		taskView === 'today'
			? t('todoist.todayEmpty')
			: taskView === 'tomorrow'
				? t('todoist.tomorrowEmpty')
				: t('todoist.empty')
	const showConnection = !disconnecting && (!connected || reconnect || error === 'auth')
	return (
		<>
			<WidgetHeader
				info={
					snapshot?.lastSyncedAt
						? formatUpdatedAt(snapshot.lastSyncedAt)
						: undefined
				}
				title={
					<>
						<h3 className="flex-1 min-w-0 text-xs font-bold truncate text-fg-strong">
							{t('todoist.title')}
						</h3>
						{connected && (
							<Tooltip content={t('todoist.sync')}>
								<Button
									size="sm"
									variant="ghost"
									className="h-7 w-7 p-0"
									aria-label={t('todoist.sync')}
									disabled={busy}
									onClick={manualSync}
								>
									{busy ? (
										<Spinner size="xs" aria-hidden="true" />
									) : (
										<Icon
											name="refresh"
											size={14}
											aria-hidden="true"
										/>
									)}
								</Button>
							</Tooltip>
						)}
					</>
				}
			/>
			<div
				className="flex flex-col flex-1 min-h-0 gap-2 overflow-y-auto scrollbar-none"
				aria-busy={busy}
			>
				{error && (
					<Alert tone="warning" className="text-2xs">
						{errorMessage(error)}
					</Alert>
				)}
				{calendarCompletion.failed && (
					<Alert tone="warning" className="text-2xs">
						{t('todoist.storageError')}
					</Alert>
				)}
				{!ready ? (
					<div className="flex items-center justify-center flex-1">
						<Spinner size="sm" />
					</div>
				) : showConnection ? (
					<form
						className="flex flex-col min-w-0 gap-3 py-2"
						onSubmit={async (event) => {
							event.preventDefault()
							if (!busy && (await perform({ action: 'connect', token }))) {
								setToken('')
								setReconnect(false)
								setEditor(null)
							}
						}}
					>
						<h4 className="text-sm font-bold text-fg-strong">
							{t('todoist.connectTitle')}
						</h4>
						<p className="text-xs text-fg-muted">
							{t('todoist.connectHint')}
						</p>
						<TextInput
							aria-label={t('todoist.token')}
							type="password"
							direction="ltr"
							value={token}
							onChange={setToken}
							disabled={busy}
							maxLength={512}
						/>
						<a
							href="https://app.todoist.com/app/settings/integrations/developer"
							onClick={() => Analytics.event('todoist_token_help_opened')}
							target="_blank"
							rel="noreferrer"
							className="text-2xs text-brand focus-visible:focus-ring"
						>
							{t('todoist.tokenHelp')}
						</a>
						<Button
							type="submit"
							size="sm"
							color="brand"
							loading={busy}
							disabled={busy || !token.trim()}
						>
							{t('todoist.connect')}
						</Button>
						{connected && (
							<Button
								size="sm"
								variant="ghost"
								disabled={busy}
								onClick={() => {
									setReconnect(false)
									setToken('')
								}}
							>
								{t('todoist.cancel')}
							</Button>
						)}
						<p className="text-2xs text-fg-muted">
							{t('todoist.tokenPrivacy')}
						</p>
					</form>
				) : disconnecting ? (
					<section
						className="flex flex-col gap-2 p-2 text-xs text-fg"
						aria-label={t('todoist.disconnectQuestion')}
					>
						<p>{t('todoist.disconnectQuestion')}</p>
						<Button
							color="danger"
							variant="soft"
							size="sm"
							disabled={busy}
							onClick={async () => {
								if (await perform({ action: 'disconnect' })) {
									setDisconnecting(false)
									setEditor(null)
									setToken('')
								}
							}}
						>
							{t('todoist.disconnect')}
						</Button>
						<Button
							variant="ghost"
							size="sm"
							disabled={busy}
							onClick={() => setDisconnecting(false)}
						>
							{t('todoist.no')}
						</Button>
					</section>
				) : (
					<>
						<TabNavigation<TodoistTaskView>
							tabMode="simple"
							size="md"
							className="w-full h-10 shrink-0"
							activeBgClass="bg-brand-fill"
							activeTextClass="text-brand"
							activeTab={taskView}
							onTabClick={(next) => {
								setTaskView(next)
								Analytics.event('todoist_view_selected', {
									view: next,
								})
							}}
							tabs={[
								{ id: 'today', label: t('todoist.today') },
								{ id: 'tomorrow', label: t('todoist.tomorrow') },
								{ id: 'upcoming', label: t('todoist.upcoming') },
							]}
						/>
						<SelectBox
							label={t('todoist.projectFilter')}
							value={project}
							className="w-full min-w-0"
							options={[
								{ value: '', label: t('todoist.allProjects') },
								...(snapshot?.projects ?? []).map((item) => ({
									value: item.id,
									label: item.name,
								})),
							]}
							onChange={(value: string) => {
								setProject(value)
								Analytics.event('todoist_project_selected')
							}}
						/>
						{!editor && (
							<Button
								variant="ghost"
								color="brand"
								size="sm"
								className="justify-start"
								disabled={busy}
								icon={<Icon name="plus" size={14} />}
								onClick={() => openEditor(null)}
							>
								{t('todoist.add')}
							</Button>
						)}
						{editor && snapshot ? (
							<TodoistEditor
								key={editor.key}
								task={editor.task}
								snapshot={snapshot}
								initialProject={project}
								initialDate={taskView === 'upcoming' ? '' : range.day}
								busy={busy}
								onCancel={() => setEditor(null)}
								onSave={async (input) => {
									if (
										await perform({
											action: 'save',
											id: editor.task?.id,
											input,
											previousProject: editor.task?.project_id,
											previousSection:
												editor.task?.section_id ?? null,
										})
									)
										setEditor(null)
								}}
								onDelete={async () => {
									if (
										editor.task &&
										(await perform({
											action: 'delete',
											id: editor.task.id,
										}))
									)
										setEditor(null)
								}}
							/>
						) : (
							<>
								{timeline.length === 0 &&
									!calendarCompletion.loading &&
									(!calendarEnabled || !calendar.isFetching) &&
									(error ? (
										<WidgetError
											message={errorMessage(error)}
											onRetry={manualSync}
										/>
									) : (
										<WidgetEmpty
											art="tasks"
											description={emptyMessage}
										/>
									))}
								{snapshot && (
									<TodoistTaskList
										items={timeline}
										timezone={timezone}
										view={taskView}
										calendarSaving={calendarCompletion.saving}
										onCalendarComplete={(event) =>
											void calendarCompletion.complete(event)
										}
										snapshot={snapshot}
										busy={busy}
										onEdit={openEditor}
										onComplete={(id) =>
											void perform({
												action: 'complete',
												id,
											})
										}
									/>
								)}

								<TodoistCalendar
									view={taskView}
									isAuthenticated={isAuthenticated}
									connected={calendarConnected}
									shownCount={calendarCompletion.shown.length}
									loading={
										calendarEnabled &&
										(calendar.isFetching ||
											calendarCompletion.loading)
									}
									error={calendar.isError}
									onRetry={retryCalendar}
								/>
							</>
						)}
					</>
				)}
			</div>
		</>
	)
}
