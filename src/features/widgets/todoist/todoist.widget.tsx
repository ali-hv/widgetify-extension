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
	const tasks =
		snapshot?.items.filter(
			(task) =>
				!task.checked &&
				!task.is_deleted &&
				(!project || task.project_id === project)
		) ?? []
	const showConnection = !disconnecting && (!connected || reconnect || error === 'auth')
	return (
		<>
			<WidgetHeader
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
				) : (
					<>
						{disconnecting ? (
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
								{editor && snapshot ? (
									<TodoistEditor
										key={editor.key}
										task={editor.task}
										snapshot={snapshot}
										initialProject={project}
										busy={busy}
										onCancel={() => setEditor(null)}
										onSave={async (input) => {
											if (
												await perform({
													action: 'save',
													id: editor.task?.id,
													input,
													previousProject:
														editor.task?.project_id,
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
										{tasks.length === 0 &&
											(error ? (
												<WidgetError
													message={errorMessage(error)}
													onRetry={manualSync}
												/>
											) : (
												<WidgetEmpty
													art="tasks"
													description={t('todoist.empty')}
												/>
											))}
										{snapshot && (
											<TodoistTaskList
												tasks={tasks}
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
									</>
								)}
							</>
						)}
						{snapshot?.lastSyncedAt ? (
							<p className="mt-auto pt-1 text-3xs text-fg-faint">
								{formatUpdatedAt(snapshot.lastSyncedAt)}
							</p>
						) : null}
					</>
				)}
			</div>
		</>
	)
}
