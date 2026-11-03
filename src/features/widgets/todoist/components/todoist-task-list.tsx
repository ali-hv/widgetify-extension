import { t } from '@/common/i18n'
import { cn } from '@/common/utils/cn'
import { Icon } from '@/icons'
import type { TodoistSnapshot, TodoistTask } from '@/services/todoist/todoist.interface'

interface TodoistTaskListProps {
	tasks: TodoistTask[]
	snapshot: TodoistSnapshot
	busy: boolean
	onEdit: (task: TodoistTask) => void
	onComplete: (id: string) => void
}

function dueLabel(task: TodoistTask) {
	if (!task.due) return ''
	const hasTime = task.due.date.includes('T')
	const date = new Date(hasTime ? task.due.date : `${task.due.date}T12:00:00`)
	return date.toLocaleString('fa-IR', {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		...(hasTime
			? ({
					hour: '2-digit',
					minute: '2-digit',
					timeZone: task.due.timezone ?? undefined,
				} as const)
			: {}),
	})
}

export function TodoistTaskList({
	tasks,
	snapshot,
	busy,
	onEdit,
	onComplete,
}: TodoistTaskListProps) {
	return (
		<ul className="flex flex-col gap-1">
			{tasks.map((task) => (
				<li
					key={task.id}
					className="flex items-start gap-2.5 px-2 py-1.5 rounded-xl hover:bg-fill transition-ui"
				>
					<button
						type="button"
						disabled={busy}
						aria-label={t('todoist.completeTask', { title: task.content })}
						className={cn(
							'flex items-center justify-center w-8 h-8 shrink-0 rounded-full cursor-pointer focus-visible:focus-ring disabled:opacity-50',
							task.priority > 1 ? 'text-brand' : 'text-fg-muted'
						)}
						onClick={() => onComplete(task.id)}
					>
						<span className="w-4 h-4 border rounded-full border-current" />
					</button>
					<button
						type="button"
						disabled={busy}
						className="flex flex-col flex-1 min-w-0 gap-1 py-1 text-start rounded-lg cursor-pointer focus-visible:focus-ring"
						onClick={() => onEdit(task)}
					>
						<span dir="auto" className="w-full text-xs text-fg break-words">
							{task.content}
						</span>
						<span className="text-3xs text-fg-muted">
							{[
								dueLabel(task),
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
				</li>
			))}
		</ul>
	)
}
