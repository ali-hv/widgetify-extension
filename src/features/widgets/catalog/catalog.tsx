import Analytics from '@/analytics'
import { t } from '@/common/i18n'
import { callEvent } from '@/common/utils/call-event'
import { Badge, Button, Modal } from '@/components/ui'
import { usePartnerAccess } from '@/features/widgets/partner-access.context'
import { useWidgetRegistry } from '@/features/widgets/registry'
import type {
	WidgetCategory,
	WidgetSize,
	WidgetVariantOption,
} from '@/features/widgets/utils/layout-engine/types'
import { useOptionalFreeWidgets } from '@/features/widgets/widgets.context'
import { Icon } from '@/icons'
import { useEffect, useMemo, useRef, useState } from 'react'
import { WidgetHelpModal } from '../components/widget-help-modal'
import { WidgetIcon } from '../components/widget-icon'
import { useWidgetCatalog } from '../hooks/use-widget-catalog'
import { widgetTitle } from '../utils/partner-catalog/partner-definitions'
import { AddWidgetActions } from './components/actions'
import { AddWidgetGrid } from './components/grid'
import { WidgetIntroduction } from './components/introduction'
import { AddWidgetOptions } from './components/options'
import { AddWidgetPreview } from './components/preview'
import { CATEGORIES, type AddWidgetModalProps } from './types'
import { buildCatalogView, countByCategory } from './utils/catalog-filter'
import { focusTarget } from './utils/focus-target'

export function AddWidgetModal({
	isOpen,
	editTarget,
	onClose,
	focusWidgetId,
}: AddWidgetModalProps) {
	const { isWidgetNew, featuredWidgetKeys } = useWidgetCatalog(isOpen)
	const freeWidgets = useOptionalFreeWidgets()
	const registry = useWidgetRegistry()
	const { ensureAccess } = usePartnerAccess()

	const runtimeLayout = freeWidgets?.runtimeLayout || []
	const addWidget = freeWidgets?.addWidget
	const updateWidgetVariant = freeWidgets?.updateWidgetVariant
	const removeWidget = freeWidgets?.removeWidget

	const allDefinitions = useMemo(() => Object.values(registry), [registry])

	const [selectedId, setSelectedId] = useState<string>(allDefinitions[0]?.id || '')

	const selectedDef = registry[selectedId] || allDefinitions[0]

	const [selectedSize, setSelectedSize] = useState<WidgetSize>(
		selectedDef?.defaultSize || { w: 2, h: 2 }
	)
	const [selectedVariant, setSelectedVariant] = useState<WidgetVariantOption | null>(
		selectedDef?.variants?.[0] || null
	)
	const [activeCategory, setActiveCategory] = useState<WidgetCategory>('all')
	const [query, setQuery] = useState('')
	const [isHelpOpen, setIsHelpOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(false)

	useEffect(() => {
		if (!isOpen) {
			setIsLoading(false)
		}
	}, [isOpen])

	useEffect(() => {
		if (editTarget) {
			const def = registry[editTarget.widgetId]
			if (def) {
				setSelectedId(def.id)
				const currentWidget = runtimeLayout.find(
					(w) => w.instanceId === editTarget.instanceId
				)
				if (def.variants && def.variants.length > 0) {
					const storedModel = currentWidget?.meta?.variant
					const isSameModel = (v: WidgetVariantOption) =>
						!storedModel || v.meta?.variant === storedModel
					const isSameSize = (v: WidgetVariantOption) =>
						v.size.w === currentWidget?.size.w &&
						v.size.h === currentWidget?.size.h
					const match =
						def.variants.find((v) => isSameModel(v) && isSameSize(v)) ||
						def.variants.find(isSameModel) ||
						def.variants[0]
					setSelectedVariant(match)
					setSelectedSize(match.size)
				} else {
					setSelectedVariant(null)
					setSelectedSize(currentWidget?.size || def.defaultSize)
				}
			}
		}
	}, [editTarget, runtimeLayout])

	const isEditMode = Boolean(editTarget)

	const appliedFocusRef = useRef<string | null>(null)

	useEffect(() => {
		if (!isOpen || isEditMode) {
			appliedFocusRef.current = null
			return
		}

		const target = focusTarget(focusWidgetId, registry)

		if (!target || appliedFocusRef.current === target) return

		appliedFocusRef.current = target
		setActiveCategory('all')
		setQuery('')
		selectWidget(target)
	}, [isOpen, isEditMode, focusWidgetId, registry])

	const selectWidget = (id: string) => {
		setSelectedId(id)
		const def = registry[id]
		if (def) {
			if (def.variants && def.variants.length > 0) {
				setSelectedVariant(def.variants[0])
				setSelectedSize(def.variants[0].size)
			} else {
				setSelectedVariant(null)
				setSelectedSize(def.defaultSize)
			}
		}
	}

	const handleSelectWidget = (id: string) => {
		if (isEditMode) return
		Analytics.event('widget_catalog_selected')
		selectWidget(id)
	}

	const handleOpenSelectedSettings = () => {
		if (selectedDef?.settingsTab) {
			callEvent('openWidgetsSettings', { tab: selectedDef.settingsTab })
		}
	}

	const handleVariantChange = (variant: WidgetVariantOption) => {
		setSelectedVariant(variant)
		setSelectedSize(variant.size)
		Analytics.event('widget_catalog_variant_picked')
	}

	const handleSizeChange = (sizeOption: WidgetSize) => {
		setSelectedVariant(null)
		setSelectedSize(sizeOption)
		Analytics.event('widget_catalog_size_picked')
	}

	const activeCount = runtimeLayout.filter((w) => w.id === selectedDef?.id).length

	const isCurrentlyActive = activeCount > 0

	const canAddCustom = Boolean(selectedDef?.canDuplicate || !isCurrentlyActive)

	const handleRemove = () => {
		if (!selectedDef || !removeWidget) return
		const target = runtimeLayout.find((w) => w.id === selectedDef.id)
		if (!target) return
		removeWidget(target.instanceId)
	}

	const handleSave = async () => {
		if (!selectedDef || isLoading) return

		if (isEditMode && editTarget && updateWidgetVariant) {
			const success = updateWidgetVariant(
				editTarget.instanceId,
				selectedSize,
				selectedVariant?.meta
			)
			if (success) {
				onClose()
			}
			return
		}

		if (!canAddCustom || !addWidget) return

		setIsLoading(true)
		try {
			if (
				selectedDef.id.startsWith('widget:') &&
				!(await ensureAccess(selectedDef.id))
			) {
				return
			}

			const success = await addWidget(
				selectedDef.id,
				undefined,
				selectedSize,
				selectedVariant?.meta
			)
			if (success) {
				onClose()
			}
		} finally {
			setIsLoading(false)
		}
	}

	const categoryCounts = useMemo(
		() => countByCategory(allDefinitions),
		[allDefinitions]
	)

	const categories = useMemo(
		() =>
			CATEGORIES.filter((item) => item.id === 'all' || categoryCounts[item.id] > 0),
		[categoryCounts]
	)

	const buildView = (category: WidgetCategory, text: string) =>
		buildCatalogView({
			items: allDefinitions,
			category,
			query: text,
			featuredKeys: featuredWidgetKeys,
			titleOf: (def) => widgetTitle(def, t),
			isNew: isWidgetNew,
		})

	const view = buildView(activeCategory, query)

	const keepSelectionIn = (next: ReturnType<typeof buildView>) => {
		if (isEditMode) return
		const visible = [...next.fresh, ...next.rest]
		if (visible.length > 0 && !visible.some((def) => def.id === selectedId)) {
			handleSelectWidget(visible[0].id)
		}
	}

	const handleCategoryChange = (category: WidgetCategory) => {
		setActiveCategory(category)
		setQuery('')
		keepSelectionIn(buildView(category, ''))
	}

	const handleQueryChange = (text: string) => {
		setQuery(text)
		keepSelectionIn(buildView(activeCategory, text))
	}

	const previewSize = selectedSize

	return (
		<>
			<Modal
				isOpen={isOpen}
				onClose={onClose}
				closeLabel={t('ui.common.close')}
				title={
					<div className="flex items-center gap-2.5">
						<span>
							{editTarget
								? t('widgets.catalog.title.edit')
								: t('widgets.catalog.title.add')}
						</span>
						<Button
							type="button"
							size="xs"
							rounded="xl"
							onClick={() => setIsHelpOpen(true)}
							variant="ghost"
							className="gap-1 text-xs px-2.5 py-1 border-line font-normal"
						>
							<Icon name="help" size={12} />
							<span>{t('widgets.catalog.help')}</span>
						</Button>
					</div>
				}
				size="xl"
				closeOnBackdropClick
				className="max-w-4xl md:max-w-6xl"
			>
				<div className="flex flex-col md:flex-row gap-4 select-none w-full h-[calc(100dvh-11rem)] overflow-y-auto scrollbar-none md:h-[min(34.375rem,calc(100dvh-14rem))] md:overflow-visible">
					<AddWidgetGrid
						activeCategory={activeCategory}
						onSelectCategory={handleCategoryChange}
						categories={categories}
						categoryCounts={categoryCounts}
						query={query}
						onQueryChange={handleQueryChange}
						view={view}
						selectedId={selectedId}
						onSelectWidget={handleSelectWidget}
						runtimeLayout={runtimeLayout}
						isWidgetNew={isWidgetNew}
					/>

					<div className="flex flex-col w-full pr-0 md:min-h-0 md:w-6/12 md:pr-1">
						{selectedDef ? (
							<div className="flex flex-col gap-3 md:flex-1 md:min-h-0">
								<div className="flex flex-col gap-3 pr-0.5 scrollbar-none md:flex-1 md:min-h-0 md:overflow-y-auto">
									<div className="flex items-center justify-between pb-2 border-b border-line">
										<div className="flex items-center gap-2">
											<span className="flex items-center justify-center rounded-xl w-9 h-9 shrink-0 bg-brand-fill text-brand">
												<WidgetIcon
													definition={selectedDef}
													size={24}
												/>
											</span>
											<div>
												<div className="flex items-center gap-1.5">
													<h3 className="text-sm font-bold text-fg">
														{widgetTitle(selectedDef, t)}
													</h3>
													{isWidgetNew?.(selectedDef.id) && (
														<Badge>
															{t(
																'widgets.catalog.badge.new'
															)}
														</Badge>
													)}
												</div>
												<p className="text-2xs text-fg-muted">
													{selectedDef.canDuplicate
														? t(
																'widgets.catalog.duplicateHint'
															)
														: t('widgets.catalog.singleHint')}
												</p>
											</div>
										</div>

										{selectedDef.settingsTab && (
											<Button
												size="xs"
												rounded="xl"
												onClick={handleOpenSelectedSettings}
												variant="outline"
												className="gap-1.5 text-xs px-3 py-1.5 hover:text-brand"
											>
												<Icon name="settings" size={12} />
												<span>
													{t('widgets.catalog.widgetSettings')}
												</span>
											</Button>
										)}
									</div>

									{selectedDef.description && (
										<WidgetIntroduction
											description={selectedDef.description}
										/>
									)}

									<AddWidgetOptions
										definition={selectedDef}
										selectedSize={selectedSize}
										selectedVariant={selectedVariant}
										onSelectSize={handleSizeChange}
										onSelectVariant={handleVariantChange}
									/>

									<AddWidgetPreview
										definition={selectedDef}
										previewSize={previewSize}
										selectedVariant={selectedVariant}
									/>
								</div>

								<div className="pt-2 border-t border-line shrink-0">
									<AddWidgetActions
										isEditMode={isEditMode}
										canAddCustom={canAddCustom}
										isCurrentlyActive={isCurrentlyActive}
										selectedSize={selectedSize}
										isLoading={isLoading}
										onSave={handleSave}
										onRemove={handleRemove}
									/>
								</div>
							</div>
						) : null}
					</div>
				</div>
			</Modal>

			{isHelpOpen && (
				<WidgetHelpModal
					isOpen={isHelpOpen}
					onClose={() => setIsHelpOpen(false)}
				/>
			)}
		</>
	)
}

export type { AddWidgetModalProps } from './types'
