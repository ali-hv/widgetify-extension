import { t } from '@/common/i18n'
import { Button, Chip, EmptyState, ScrollRow, TabNavigation } from '@/components/ui'
import { useWallpaperContext } from '@/context/wallpaper.context'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'
import {
	useGetWallpaperCategories,
	useGetWallpapersInfiniteQuery,
} from '@/services/wallpapers/get-wallpaper-categories.hook'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useItemState } from '../hooks/use-item-state'
import { useStoreTryOn } from '../store-try-on.context'
import type { StoreItem, WallpaperKind } from '../types'
import {
	faNumber,
	matchesWallpaperFilter,
	wallpaperToStoreItem,
} from '../utils/store-item'
import { WallpaperTile } from './store-item/wallpaper-tile'
import { TileGrid, TileSkeletons } from './tile-grid'

const PAGE_SIZE = 18

const KIND_TABS: { id: WallpaperKind; label: string }[] = [
	{ id: 'all', label: t('market.category.allFilter') },
	{ id: 'image', label: t('market.wallpaperBrowser.staticFilter') },
	{ id: 'animated', label: t('market.wallpaperTile.animatedBadge') },
]

interface WallpaperBrowserProps {
	selectedId: string | null
	onPick: (item: StoreItem) => void
	leading?: ReactNode
}

export function WallpaperBrowser({ selectedId, onPick, leading }: WallpaperBrowserProps) {
	const { data: folders } = useGetWallpaperCategories()
	const { syncWithFetchedWallpapers } = useWallpaperContext()
	const stateOf = useItemState()
	const { tryOn } = useStoreTryOn()
	const [folderId, setFolderId] = useState<string | null>(null)
	const [kind, setKind] = useState<WallpaperKind>('all')

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		isError,
		refetch,
	} = useGetWallpapersInfiniteQuery(
		{ categoryId: folderId ?? undefined, limit: PAGE_SIZE },
		true
	)

	const { loadMoreRef } = useInfiniteScroll({
		hasNextPage: hasNextPage ?? false,
		isFetchingNextPage,
		fetchNextPage,
	})

	const wallpapers = useMemo(
		() => data?.pages.flatMap((page) => page.wallpapers) ?? [],
		[data]
	)

	useEffect(() => {
		if (wallpapers.length) syncWithFetchedWallpapers(wallpapers)
	}, [wallpapers])

	const visible = wallpapers
		.filter((wallpaper) => matchesWallpaperFilter(wallpaper, kind))
		.map(wallpaperToStoreItem)

	const clearFilters = () => {
		setFolderId(null)
		setKind('all')
	}

	return (
		<div className="flex flex-col gap-3">
			<ScrollRow>
				<Chip
					size="sm"
					selected={folderId === null}
					onClick={() => setFolderId(null)}
					className="shrink-0"
				>
					{t('market.category.allFilter')}
				</Chip>
				{folders.categories.map((folder) => (
					<Chip
						key={folder.id}
						size="sm"
						selected={folderId === folder.id}
						onClick={() => setFolderId(folder.id)}
						className="gap-1.5 shrink-0"
					>
						{folder.name}
						{folder.hasNewContent && (
							<span
								role="img"
								aria-label={t('market.nav.newBadge')}
								className="rounded-full size-1.5 bg-danger"
							/>
						)}
					</Chip>
				))}
			</ScrollRow>

			<div className="flex flex-wrap items-center justify-between gap-2">
				<TabNavigation
					tabs={KIND_TABS}
					activeTab={kind}
					onTabClick={setKind}
					tabMode="simple"
					size="sm"
					className="w-48"
				/>
			</div>

			{isError ? (
				<EmptyState
					icon="image"
					title={t('market.wallpaperBrowser.loadErrorTitle')}
					description={t('market.category.loadErrorHint')}
					action={
						<Button size="sm" onClick={() => refetch()}>
							{t('market.category.retry')}
						</Button>
					}
				/>
			) : isLoading ? (
				<TileSkeletons count={6} />
			) : (
				<>
					{(leading || visible.length > 0) && (
						<TileGrid>
							{leading}
							{visible.map((item) => (
								<WallpaperTile
									key={item.id}
									item={item}
									state={stateOf(item)}
									selected={selectedId === item.id}
									onPick={() => onPick(item)}
									onTry={() => tryOn(item)}
								/>
							))}
						</TileGrid>
					)}
					{visible.length === 0 && !hasNextPage && (
						<EmptyState
							icon="image"
							title={t('market.wallpaperBrowser.emptyFilteredTitle')}
							description={t('market.wallpaperBrowser.emptyFilteredHint')}
							action={
								<Button size="sm" onClick={clearFilters}>
									{t('market.wallpaperBrowser.clearFilters')}
								</Button>
							}
						/>
					)}
				</>
			)}

			{hasNextPage && (
				<div ref={loadMoreRef}>
					<TileSkeletons count={3} />
				</div>
			)}

			{visible.length > 0 && (
				<p className="text-2xs text-fg-faint">
					{t('market.wallpaperBrowser.viewLabel')} {faNumber(visible.length)}{' '}
					{t('market.wallpaperBrowser.wallpaperLabel')}
				</p>
			)}
		</div>
	)
}
