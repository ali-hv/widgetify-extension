import momentTz from 'moment-timezone'
import type { GoogleCalendarEvent } from '@/services/date/get-google-calendar-events.hook'
import type { TodoistTimelineItem } from '../utils/task-timeline'
import type { TodoistTaskView } from '../utils/task-view'
import { TodoistCalendarEvent } from './todoist-calendar-event'
import { TodoistReschedule } from './todoist-reschedule'
import { t } from '@/common/i18n'
import { cn } from '@/common/utils/cn'
import { Icon } from '@/icons'
import type { TodoistSnapshot, TodoistTask } from '@/services/todoist/todoist.interface'

interface TodoistTaskListProps {
	items: TodoistTimelineItem[]
	timezone: string
	view: TodoistTaskView
	calendarSaving: boolean
	onCalendarComplete: (event: GoogleCalendarEvent) => void
	snapshot: TodoistSnapshot
	busy: boolean
	onEdit: (task: TodoistTask) => void
	onComplete: (id: string) => void
	overdue?: boolean
	onReschedule: (ids: string[], date: string) => Promise<boolean>
}

function dueLabel(task: TodoistTask, timezone: string) {
	if (!task.due) return ''
	const hasTime = task.due.date.includes('T')
	const date = hasTime
		? momentTz.tz(task.due.date, timezone).toDate()
		: new Date(`${task.due.date}T12:00:00`)
	return date.toLocaleString('fa-IR', {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		...(hasTime
			? ({
					hour: '2-digit',
					minute: '2-digit',
					timeZone: timezone,
				} as const)
			: {}),
	})
}

export function TodoistTaskList({
	items,
	timezone,
	view,
	calendarSaving,
	onCalendarComplete,
	snapshot,
	busy,
	onEdit,
	onComplete,
	overdue = false,
	onReschedule,
}: TodoistTaskListProps) {
	return (
		<ul className="flex flex-col gap-1">
			{items.map((item) => {
				if (item.kind === 'calendar')
					return (
						<TodoistCalendarEvent
							key={`calendar:${item.event.id}:${item.event.start.dateTime || item.event.start.date}`}
							event={item.event}
							timezone={timezone}
							view={view}
							saving={calendarSaving}
							onComplete={onCalendarComplete}
						/>
					)
				const task = item.task
				return (
					<li
						key={`task:${task.id}`}
						className="flex items-start gap-2.5 px-2 py-1.5 rounded-xl hover:bg-fill transition-ui"
					>
						<button
							type="button"
							disabled={busy}
							aria-label={t('todoist.completeTask', {
								title: task.content,
							})}
							className={cn(
								'flex items-center justify-center w-8 h-8 shrink-0 rounded-full cursor-pointer focus-visible:focus-ring disabled:opacity-50',
								task.priority > 1 ? 'text-brand' : 'text-fg-muted'
							)}
							onClick={() => onComplete(task.id)}
						>
							<span className="w-4 h-4 border rounded-full border-current" />
						</button>
						<div className="flex flex-col flex-1 min-w-0 items-start gap-1">
							<button
								type="button"
								disabled={busy}
								className="flex flex-col w-full min-w-0 gap-1 py-1 text-start rounded-lg cursor-pointer focus-visible:focus-ring"
								onClick={() => onEdit(task)}
							>
								<span
									dir="auto"
									className="w-full text-xs text-fg break-words"
								>
									{task.content}
								</span>
								<span
									className={cn(
										'text-3xs',
										overdue ? 'text-danger' : 'text-fg-muted'
									)}
								>
									{[
										dueLabel(task, timezone),
										snapshot.projects.find(
											(project) => project.id === task.project_id
										)?.name,
									]
										.filter(Boolean)
										.join(' · ')}
									{task.due?.is_recurring && (
										<Icon
											name="refresh"
											size={10}
											className="inline-block ms-1"
											aria-label={t('todoist.repeat')}
										/>
									)}
								</span>
							</button>
							{overdue && (
								<TodoistReschedule
									ids={[task.id]}
									taskName={task.content}
									timezone={timezone}
									busy={busy}
									onReschedule={onReschedule}
								/>
							)}
						</div>
					</li>
				)
			})}
		</ul>
	)
}
