import { useRef, useState } from 'react'
import jalaliMoment from 'jalali-moment'
import Analytics from '@/analytics'
import { t } from '@/common/i18n'
import { nowDate } from '@/common/utils/trusted-time'
import { Alert, Button, DatePicker, PopoverMenu, PopoverMenuItem } from '@/components/ui'
import { todoistDateRange } from '../utils/task-view'

interface TodoistRescheduleProps {
	ids: string[]
	bulk?: boolean
	taskName?: string
	timezone: string
	busy: boolean
	onReschedule: (ids: string[], date: string) => Promise<boolean>
}

export function TodoistReschedule({
	ids,
	bulk = false,
	taskName,
	timezone,
	busy,
	onReschedule,
}: TodoistRescheduleProps) {
	const trigger = useRef<HTMLButtonElement>(null)
	const saving = useRef(false)
	const [targets, setTargets] = useState<string[] | null>(null)
	const [custom, setCustom] = useState(false)
	const [date, setDate] = useState('')
	const [failed, setFailed] = useState(false)
	const close = () => setTargets(null)
	const save = async (day: string, choice: 'today' | 'tomorrow' | 'custom') => {
		if (busy || saving.current || !targets?.length) return
		saving.current = true
		setFailed(false)
		Analytics.event('todoist_reschedule_submitted', {
			bulk,
			choice,
			count: targets.length,
		})
		try {
			if (await onReschedule(targets, day)) close()
			else {
				setFailed(true)
				Analytics.event('todoist_reschedule_failed', { bulk })
			}
		} finally {
			saving.current = false
		}
	}
	return (
		<>
			<Button
				ref={trigger}
				size="sm"
				variant="soft"
				color="brand"
				className="shrink-0 text-2xs bg-brand-fill hover:bg-brand-fill-2"
				disabled={busy || !ids.length}
				aria-label={
					taskName
						? t('todoist.rescheduleTask', { title: taskName })
						: t('todoist.rescheduleAll')
				}
				aria-expanded={!!targets}
				aria-haspopup="dialog"
				onClick={() => {
					if (targets) {
						close()
						return
					}
					setTargets([...ids])
					setCustom(false)
					setFailed(false)
					setDate(todoistDateRange('today', nowDate(), timezone).day)
					Analytics.event('todoist_reschedule_opened', {
						bulk,
						count: ids.length,
					})
				}}
			>
				{bulk ? t('todoist.rescheduleAll') : t('todoist.reschedule')}
			</Button>
			<PopoverMenu
				isOpen={!!targets}
				onClose={close}
				triggerRef={trigger}
				width={264}
				reserveHeight={400}
			>
				<div
					role="dialog"
					aria-label={
						bulk ? t('todoist.rescheduleAll') : t('todoist.reschedule')
					}
					dir="rtl"
					className="flex flex-col gap-2"
				>
					<h4 className="px-2 pt-1 text-xs font-bold text-fg-strong">
						{custom
							? t('todoist.chooseRescheduleDate')
							: bulk
								? t('todoist.rescheduleAll')
								: t('todoist.reschedule')}
					</h4>
					{bulk && (
						<p className="px-2 text-2xs text-fg-muted">
							{t('todoist.rescheduleCount', {
								count: (targets?.length ?? 0).toLocaleString('fa-IR'),
							})}
						</p>
					)}
					{!bulk && taskName && (
						<p dir="auto" className="px-2 truncate text-2xs text-fg-muted">
							{taskName}
						</p>
					)}
					{failed && (
						<Alert tone="warning" className="text-2xs">
							{t('todoist.rescheduleError')}
						</Alert>
					)}
					{custom ? (
						<>
							<DatePicker
								size="sm"
								className="w-full bg-transparent border-0 p-1"
								selectedDate={jalaliMoment(date, 'YYYY-MM-DD')}
								onDateSelect={(selected) => {
									if (!busy && !saving.current)
										setDate(
											selected
												.clone()
												.locale('en')
												.format('YYYY-MM-DD')
										)
								}}
							/>
							<div className="flex gap-2">
								<Button
									size="sm"
									color="brand"
									disabled={busy}
									loading={busy}
									onClick={() => void save(date, 'custom')}
								>
									{t('todoist.save')}
								</Button>
								<Button size="sm" variant="ghost" onClick={close}>
									{t('todoist.cancel')}
								</Button>
							</div>
						</>
					) : (
						<>
							{(['today', 'tomorrow'] as const).map((choice) => (
								<PopoverMenuItem
									key={choice}
									label={
										choice === 'today'
											? t('todoist.today')
											: t('todoist.tomorrow')
									}
									disabled={busy}
									onClick={() =>
										void save(
											todoistDateRange(choice, nowDate(), timezone)
												.day,
											choice
										)
									}
								/>
							))}
							<PopoverMenuItem
								label={t('todoist.chooseRescheduleDate')}
								disabled={busy}
								onClick={() => setCustom(true)}
							/>
						</>
					)}
				</div>
			</PopoverMenu>
		</>
	)
}
