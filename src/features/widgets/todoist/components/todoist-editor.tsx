import { useId, useState } from 'react'
import jalaliMoment from 'jalali-moment'
import Analytics from '@/analytics'
import { t } from '@/common/i18n'
import { callEvent } from '@/common/utils/call-event'
import {
	Button,
	DatePicker,
	Dropdown,
	SelectBox,
	TextArea,
	TextInput,
} from '@/components/ui'
import type {
	TodoistSnapshot,
	TodoistTask,
	TodoistTaskInput,
} from '@/services/todoist/todoist.interface'
import { createTaskDraft, taskDraftInput } from '../utils/task-draft'

interface TodoistEditorProps {
	task: TodoistTask | null
	snapshot: TodoistSnapshot
	initialProject: string
	busy: boolean
	onSave: (input: TodoistTaskInput) => void
	onDelete: () => void
	onCancel: () => void
}

export function TodoistEditor({
	task,
	snapshot,
	initialProject,
	busy,
	onSave,
	onDelete,
	onCancel,
}: TodoistEditorProps) {
	const id = useId()
	const [draft, setDraft] = useState(() =>
		createTaskDraft(
			task,
			initialProject ||
				snapshot.projects.find((project) => project.is_inbox_project)?.id ||
				snapshot.projects[0]?.id ||
				''
		)
	)
	const [confirmDelete, setConfirmDelete] = useState(false)
	const customRecurrence = !['', 'every day', 'every week', 'every month'].includes(
		draft.recurrence
	)
	const sections = snapshot.sections.filter(
		(section) => section.project_id === draft.project
	)
	const chooseDue = (change: Partial<typeof draft>) =>
		setDraft((previous) => ({ ...previous, ...change, dueChanged: true }))
	return (
		<form
			className="flex flex-col min-w-0 gap-3 p-3 rounded-xl bg-fill"
			onSubmit={(event) => {
				event.preventDefault()
				if (!busy && draft.content.trim() && draft.project)
					onSave(taskDraftInput(draft))
			}}
		>
			<h4 className="text-xs font-bold text-fg-strong">
				{task ? t('todoist.edit') : t('todoist.add')}
			</h4>
			<label htmlFor={`${id}-title`} className="text-2xs text-fg-muted">
				{t('todoist.taskTitle')}
			</label>
			<TextInput
				id={`${id}-title`}
				value={draft.content}
				onChange={(content) => setDraft({ ...draft, content })}
				disabled={busy}
				maxLength={500}
			/>
			<label htmlFor={`${id}-description`} className="text-2xs text-fg-muted">
				{t('todoist.description')}
			</label>
			<TextArea
				id={`${id}-description`}
				value={draft.description}
				onChange={(event) =>
					setDraft({ ...draft, description: event.target.value })
				}
				disabled={busy}
				maxLength={16000}
				rows={2}
			/>
			<p className="text-2xs text-fg-muted">{t('todoist.project')}</p>
			<SelectBox
				label={t('todoist.project')}
				value={draft.project}
				disabled={busy}
				className="w-full min-w-0"
				options={snapshot.projects.map((project) => ({
					value: project.id,
					label: project.name,
				}))}
				onChange={(project: string) =>
					setDraft({ ...draft, project, section: '' })
				}
			/>
			<p className="text-2xs text-fg-muted">{t('todoist.section')}</p>
			<SelectBox
				label={t('todoist.section')}
				value={draft.section}
				disabled={busy}
				className="w-full min-w-0"
				options={[
					{ value: '', label: t('todoist.noSection') },
					...sections.map((section) => ({
						value: section.id,
						label: section.name,
					})),
				]}
				onChange={(section: string) => setDraft({ ...draft, section })}
			/>
			<div className="flex flex-wrap items-center min-w-0 gap-2">
				<Dropdown
					disabled={busy || customRecurrence}
					trigger={
						<Button size="sm" disabled={busy || customRecurrence}>
							{draft.date
								? jalaliMoment(draft.date)
										.locale('fa')
										.format('jD jMMMM jYYYY')
								: t('todoist.date')}
						</Button>
					}
				>
					<DatePicker
						selectedDate={
							draft.date ? jalaliMoment(draft.date).locale('fa') : undefined
						}
						onDateSelect={(date) => {
							chooseDue({
								date: date.clone().locale('en').format('YYYY-MM-DD'),
							})
							callEvent('closeAllDropdowns')
						}}
					/>
					<Button
						size="sm"
						variant="ghost"
						onClick={() => {
							chooseDue({ date: '', time: '', recurrence: '' })
							callEvent('closeAllDropdowns')
						}}
					>
						{t('todoist.clearDate')}
					</Button>
				</Dropdown>
				<TextInput
					type="time"
					aria-label={t('todoist.time')}
					value={draft.time}
					direction="ltr"
					className="min-w-0 flex-1"
					disabled={busy || !draft.date || customRecurrence}
					onChange={(time) => chooseDue({ time })}
				/>
			</div>
			<p className="text-2xs text-fg-muted">{t('todoist.repeat')}</p>
			<SelectBox
				label={t('todoist.repeat')}
				className="w-full min-w-0"
				disabled={busy}
				value={
					['', 'every day', 'every week', 'every month'].includes(
						draft.recurrence
					)
						? draft.recurrence
						: 'custom'
				}
				options={[
					{ value: '', label: t('todoist.noRepeat') },
					{ value: 'every day', label: t('todoist.daily') },
					{ value: 'every week', label: t('todoist.weekly') },
					{ value: 'every month', label: t('todoist.monthly') },
					{ value: 'custom', label: t('todoist.customRepeat') },
				]}
				onChange={(value: string) =>
					chooseDue({ recurrence: value === 'custom' ? 'every ' : value })
				}
			/>
			{!!draft.recurrence &&
				!['every day', 'every week', 'every month'].includes(
					draft.recurrence
				) && (
					<TextInput
						aria-label={t('todoist.customRepeat')}
						direction="ltr"
						value={draft.recurrence}
						disabled={busy}
						placeholder={t('todoist.repeatExample')}
						onChange={(recurrence) => chooseDue({ recurrence })}
					/>
				)}
			{customRecurrence && (
				<p className="text-2xs text-fg-muted">{t('todoist.customRepeatHint')}</p>
			)}
			<p className="text-2xs text-fg-muted">{t('todoist.priority')}</p>
			<SelectBox
				label={t('todoist.priority')}
				value={String(draft.priority)}
				className="w-full min-w-0"
				disabled={busy}
				options={[
					{ value: '4', label: t('todoist.priorityOne') },
					{ value: '3', label: t('todoist.priorityTwo') },
					{ value: '2', label: t('todoist.priorityThree') },
					{ value: '1', label: t('todoist.priorityFour') },
				]}
				onChange={(priority: string) =>
					setDraft({ ...draft, priority: Number(priority) })
				}
			/>
			<label htmlFor={`${id}-labels`} className="text-2xs text-fg-muted">
				{t('todoist.labels')}
			</label>
			<TextInput
				id={`${id}-labels`}
				value={draft.labels}
				disabled={busy}
				onChange={(labels) => setDraft({ ...draft, labels })}
				placeholder={t('todoist.labelsHint')}
			/>
			<div className="flex flex-wrap items-center gap-2">
				<Button
					type="submit"
					color="brand"
					size="sm"
					loading={busy}
					disabled={busy || !draft.content.trim() || !draft.project}
				>
					{t('todoist.save')}
				</Button>
				<Button size="sm" variant="ghost" disabled={busy} onClick={onCancel}>
					{t('todoist.cancel')}
				</Button>
				{task && !confirmDelete && (
					<Button
						size="sm"
						color="danger"
						variant="ghost"
						disabled={busy}
						onClick={() => {
							setConfirmDelete(true)
							Analytics.event('todoist_delete_opened')
						}}
					>
						{t('todoist.delete')}
					</Button>
				)}
			</div>
			{confirmDelete && (
				<section
					className="flex flex-wrap items-center gap-2 text-xs text-fg"
					aria-label={t('todoist.deleteQuestion')}
				>
					<p>{t('todoist.deleteQuestion')}</p>
					<Button
						size="sm"
						color="danger"
						variant="soft"
						disabled={busy}
						onClick={onDelete}
					>
						{t('todoist.delete')}
					</Button>
					<Button
						size="sm"
						variant="ghost"
						disabled={busy}
						onClick={() => setConfirmDelete(false)}
					>
						{t('todoist.no')}
					</Button>
				</section>
			)}
		</form>
	)
}
