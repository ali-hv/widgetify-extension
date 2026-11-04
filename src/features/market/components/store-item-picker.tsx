import { t } from '@/common/i18n'
import { cn } from '@/common/utils/cn'
import { SectionPanel, Tile } from '@/components/ui'
import { useAuth } from '@/context/auth.context'
import { Icon } from '@/icons'
import { useGetUserInventory } from '@/services/market/get-user-inventory.hook'
import type { UserInventoryResponse } from '@/services/market/market.interface'
import { APPEARANCE_INVENTORY_TYPES, BUNDLED_OPTIONS, INVENTORY_LIST } from '../constants'
import { useActiveValues } from '../hooks/use-active-values'
import { useApplyItem } from '../hooks/use-apply-item'
import { useStoreItems } from '../hooks/use-store-items'
import type { AppearanceItemType, StoreItem } from '../types'
import { inventoryItemToStoreItem, uniqueByValue } from '../utils/store-item'
import { ItemPreview, previewAspect } from './previews/item-preview'

interface StoreItemPickerProps {
	type: AppearanceItemType
	title: string
	description: string
	onOpenStore: () => void
}

export function StoreItemPicker({
	type,
	title,
	description,
	onOpenStore,
}: StoreItemPickerProps) {
	const { isAuthenticated } = useAuth()
	const { data: inventory } = useGetUserInventory(isAuthenticated, {
		type: APPEARANCE_INVENTORY_TYPES,
	})
	const { items } = useStoreItems()
	const active = useActiveValues()
	const apply = useApplyItem()

	const ofType = items.filter((item) => item.type === type)
	const options = usableOptions(inventory, type, ofType)

	const wide = previewAspect(type) !== 'video'
	const grid = cn(
		'grid gap-2.5',
		wide
			? 'grid-cols-[repeat(auto-fill,minmax(12rem,1fr))]'
			: 'grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))]'
	)

	return (
		<SectionPanel
			title={title}
			size="sm"
			action={
				<button
					type="button"
					onClick={onOpenStore}
					className="inline-flex items-center gap-1 text-xs font-semibold rounded-lg cursor-pointer text-brand hover:underline focus-visible:focus-ring"
				>
					<Icon name="shoppingBag" size={14} />
					{t('market.picker.storeLink')}
				</button>
			}
		>
			<p className="mb-3 text-xs text-fg-muted">{description}</p>
			<div className={grid}>
				{options.map((item) => {
					const isActive = active[type] === item.value
					return (
						<Tile
							key={item.id}
							media={<ItemPreview item={item} />}
							aspect={previewAspect(type)}
							title={item.name}
							selected={isActive}
							meta={
								isActive && (
									<span className="grid rounded-full size-5 place-items-center bg-brand text-on-brand">
										<Icon
											name="check"
											size={12}
											aria-label={t('market.picker.selectedBadge')}
										/>
									</span>
								)
							}
							onClick={() => apply(item)}
						/>
					)
				})}
			</div>
		</SectionPanel>
	)
}

function usableOptions(
	inventory: UserInventoryResponse | undefined,
	type: AppearanceItemType,
	storeItems: StoreItem[]
): StoreItem[] {
	const fromInventory = (inventory?.[INVENTORY_LIST[type]] ?? []).map((item) =>
		inventoryItemToStoreItem(item, type)
	)
	return uniqueByValue([...BUNDLED_OPTIONS[type], ...fromInventory, ...storeItems])
}
