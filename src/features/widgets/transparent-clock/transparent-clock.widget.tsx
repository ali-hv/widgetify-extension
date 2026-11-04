import Analytics from '@/analytics'
import { t } from '@/common/i18n'
import { Badge, PopoverMenuItem } from '@/components/ui'
import { useGeneralSetting } from '@/context/general-setting.context'
import { useZonedClock } from '@/features/widgets/hooks/use-zoned-clock'
import { Icon } from '@/icons'
import { useRef } from 'react'
import { WidgetContainer } from '../components/widget-container'
import type { WidgetSize } from '../utils/layout-engine/types'
import { useWidgetMenuActions } from '../widget-menu.context'
import { ClockStyleEditor } from './components/clock-style-editor'
import { CLOCK_FACE_LABELS, CLOCK_FINISH_LABELS } from './constants'
import { useClockStyleDraft } from './hooks/use-clock-style-draft'
import type { TransparentClockVariant } from './types'
import { resolveClockFace } from './utils/normalize-style'
import { normalizeTransparentClockVariant } from './utils/normalize-variant'
import { TransparentClockEnglish } from './variants/transparent-clock-english'
import { TransparentClockPersian } from './variants/transparent-clock-persian'

interface TransparentClockWidgetProps {
	instanceId?: string
	size?: WidgetSize
	meta?: { variant?: TransparentClockVariant | string } & Record<string, unknown>
}

export function TransparentClockWidget({
	instanceId,
	size,
	meta,
}: TransparentClockWidgetProps) {
	const { selected_timezone: timezone } = useGeneralSetting()

	const time = useZonedClock(timezone?.value)

	const hours = time.getHours().toString().padStart(2, '0')
	const minutes = time.getMinutes().toString().padStart(2, '0')
	const isoDateTime = `${time.getFullYear()}-${String(time.getMonth() + 1).padStart(2, '0')}-${String(time.getDate()).padStart(2, '0')}T${hours}:${minutes}`

	const variant = normalizeTransparentClockVariant(meta?.variant)
	const draft = useClockStyleDraft(instanceId, meta)

	const editableStyle = draft.style
	const clockStyle = size
		? { ...editableStyle, face: resolveClockFace(editableStyle.face, size) }
		: editableStyle
	const anchorRef = useRef<HTMLDivElement>(null)

	const openEditor = () => {
		Analytics.event('transparent_clock_settings_opened')
		draft.start()
	}

	const saveStyle = () => {
		Analytics.event('transparent_clock_style_saved')
		draft.save()
	}

	useWidgetMenuActions(
		<PopoverMenuItem
			icon={<Icon name="brush" size={14} />}
			label={t('widgets.transparentClock.customize')}
			badge={<Badge>{t('widgets.transparentClock.newBadge')}</Badge>}
			description={t('widgets.transparentClock.summary', {
				face: t(CLOCK_FACE_LABELS[clockStyle.face]),
				finish: t(CLOCK_FINISH_LABELS[clockStyle.finish]),
			})}
			onClick={openEditor}
		/>
	)

	const ClockVariant =
		variant === 'english' ? TransparentClockEnglish : TransparentClockPersian

	return (
		<WidgetContainer
			background={false}
			padding={false}
			className="w-full h-full select-none"
		>
			<div ref={anchorRef} className="w-full h-full">
				<ClockVariant
					time={time}
					hours={hours}
					minutes={minutes}
					isoDateTime={isoDateTime}
					clockStyle={clockStyle}
				/>
			</div>

			<ClockStyleEditor
				isOpen={draft.isEditing}
				anchorRef={anchorRef}
				clockStyle={editableStyle}
				canStack={size?.h !== 1}
				script={variant === 'english' ? 'latin' : 'persian'}
				onChange={draft.update}
				onSave={saveStyle}
				onCancel={draft.cancel}
			/>
		</WidgetContainer>
	)
}
