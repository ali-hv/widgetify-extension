import { t } from '@/common/i18n'
import { Button } from '@/components/ui'
import type { WidgetSize } from '@/features/widgets/utils/layout-engine/types'

interface AddWidgetActionsProps {
	isEditMode: boolean

	canAddCustom: boolean
	isCurrentlyActive: boolean

	selectedSize: WidgetSize
	isLoading?: boolean
	onSave: () => void
	onRemove: () => void
}

function RemoveFromPageButton({ onRemove }: { onRemove: () => void }) {
	return (
		<Button
			type="button"
			onClick={onRemove}
			className="w-full"
			rounded={'2xl'}
			variant={'outline'}
			color={'danger'}
		>
			<span>{t('widgets.catalog.removeFromPage')}</span>
		</Button>
	)
}

export function AddWidgetActions({
	isEditMode,

	canAddCustom,
	isCurrentlyActive,

	selectedSize,
	isLoading = false,
	onSave,
	onRemove,
}: AddWidgetActionsProps) {
	if (isEditMode) {
		return (
			<Button
				type="button"
				onClick={onSave}
				className="w-full"
				rounded={'2xl'}
				color={'brand'}
				loading={isLoading}
				disabled={isLoading}
			>
				<span>{t('widgets.catalog.saveChanges')}</span>
			</Button>
		)
	}

	if (canAddCustom) {
		return (
			<Button
				type="button"
				onClick={onSave}
				className="w-full"
				rounded={'2xl'}
				color={'brand'}
				loading={isLoading}
				disabled={isLoading}
			>
				<span>+</span>
				<span>
					{t('widgets.catalog.addWithSize', {
						w: selectedSize.w,
						h: selectedSize.h,
					})}
				</span>
			</Button>
		)
	}

	if (isCurrentlyActive) {
		return <RemoveFromPageButton onRemove={onRemove} />
	}

	return (
		<Button
			type="button"
			onClick={onSave}
			className="w-full"
			rounded={'2xl'}
			color={'brand'}
			loading={isLoading}
			disabled={isLoading}
		>
			<span>+</span>
			<span>{t('widgets.catalog.addToPage')}</span>
		</Button>
	)
}
