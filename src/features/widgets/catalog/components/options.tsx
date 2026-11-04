import { t } from '@/common/i18n'
import { cn } from '@/common/utils/cn'
import { Chip } from '@/components/ui'
import type {
	WidgetDefinition,
	WidgetSize,
	WidgetVariantOption,
} from '@/features/widgets/utils/layout-engine/types'

interface AddWidgetOptionsProps {
	definition: WidgetDefinition
	selectedSize: WidgetSize
	selectedVariant: WidgetVariantOption | null

	onSelectSize: (size: WidgetSize) => void
	onSelectVariant: (variant: WidgetVariantOption) => void
}

export function AddWidgetOptions({
	definition,
	selectedSize,
	selectedVariant,

	onSelectSize,
	onSelectVariant,
}: AddWidgetOptionsProps) {
	if (definition.variants && definition.variants.length > 0) {
		return (
			<div className="flex flex-col gap-1.5">
				<span className="text-xs font-bold text-fg">
					{t('widgets.catalog.selectVariant')}
				</span>
				<div className="flex flex-wrap gap-1.5">
					{definition.variants.map((variant) => {
						const isCurrent =
							selectedVariant?.id === variant.id ||
							(!selectedVariant &&
								selectedSize.w === variant.size.w &&
								selectedSize.h === variant.size.h)

						return (
							<button
								key={variant.id}
								type="button"
								onClick={() => onSelectVariant(variant)}
								className={cn(
									'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-ui duration-150 cursor-pointer font-medium',
									isCurrent
										? 'bg-brand text-on-brand font-bold shadow-sm'
										: 'bg-fill-2 hover:bg-surface-3 text-fg border border-line'
								)}
							>
								<span>{variant.title ?? t(variant.label)}</span>
							</button>
						)
					})}
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-1.5">
			<span className="text-xs font-bold text-fg">
				{t('widgets.catalog.selectSize')}
			</span>
			<div className="flex flex-wrap gap-1.5">
				{definition.allowedSizes.map((sizeOption) => {
					const isCurrentSize =
						selectedSize.w === sizeOption.w && selectedSize.h === sizeOption.h
					const isDefault =
						definition.defaultSize.w === sizeOption.w &&
						definition.defaultSize.h === sizeOption.h

					return (
						<Chip
							onClick={() => onSelectSize(sizeOption)}
							key={`${sizeOption.w}x${sizeOption.h}`}
							className="py-1 flex items-center gap-1"
							selected={isCurrentSize}
							dir="ltr"
						>
							<span>
								{sizeOption.w} × {sizeOption.h}
							</span>

							{isDefault && !isCurrentSize && (
								<span className="text-4xs text-fg-muted mr-1">
									{t('widgets.catalog.defaultSize')}
								</span>
							)}
						</Chip>
					)
				})}
			</div>
		</div>
	)
}
