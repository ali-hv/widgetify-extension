import { t } from '@/common/i18n'
import { Button, EmptyState, TabNavigation } from '@/components/ui'
import { useState } from 'react'
import { CATEGORY_COPY } from '../constants'
import { useItemState } from '../hooks/use-item-state'
import { useStoreItems } from '../hooks/use-store-items'
import type { CategoryType, StoreItem } from '../types'
import { sortByState } from '../utils/store-item'
import { CategoryHeader } from './category-header'
import { StoreItemTile } from './store-item/store-item-tile'
import { TileGrid, TileSkeletons } from './tile-grid'

type PetKind = 'PET' | 'PET_BACKGROUND'

const PET_KINDS: { id: PetKind; label: string }[] = [
	{ id: 'PET', label: t('market.category.petsTab') },
	{ id: 'PET_BACKGROUND', label: t('market.category.environmentsTab') },
]

interface CategoryViewProps {
	type: CategoryType
	defaultPetKind: PetKind
	selectedId: string | null
	onOpen: (item: StoreItem) => void
}

export function CategoryView({
	type,
	defaultPetKind,
	selectedId,
	onOpen,
}: CategoryViewProps) {
	const { items, isLoading, isError, refetch } = useStoreItems()
	const stateOf = useItemState()
	const [petKind, setPetKind] = useState<PetKind>(defaultPetKind)
	const copy = CATEGORY_COPY[type]

	const shownType = type === 'PET' ? petKind : type
	const source = items.filter((item) => item.type === shownType)

	const visible = sortByState(source, stateOf)

	return (
		<>
			<CategoryHeader title={copy.title} description={copy.description}>
				<div className="flex flex-wrap items-center gap-2">
					{type === 'PET' && (
						<TabNavigation
							tabs={PET_KINDS}
							activeTab={petKind}
							onTabClick={setPetKind}
							tabMode="simple"
							size="sm"
							className="w-44 me-2"
						/>
					)}
				</div>
			</CategoryHeader>

			{isError ? (
				<EmptyState
					icon="shoppingBag"
					title={t('market.category.loadErrorTitle')}
					description={t('market.category.loadErrorHint')}
					action={
						<Button size="sm" onClick={() => refetch()}>
							{t('market.category.retry')}
						</Button>
					}
				/>
			) : isLoading ? (
				<TileSkeletons count={6} wide={copy.wide} />
			) : visible.length === 0 ? (
				<EmptyState icon="shoppingBag" title={t('market.category.emptyTitle')} />
			) : (
				<TileGrid wide={copy.wide}>
					{visible.map((item) => (
						<StoreItemTile
							key={item.id}
							item={item}
							state={stateOf(item)}
							selected={selectedId === item.id}
							onOpen={() => onOpen(item)}
						/>
					))}
				</TileGrid>
			)}
		</>
	)
}
