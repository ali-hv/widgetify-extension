import { t } from '@/common/i18n'
import type { Wallpaper } from '@/common/types/wallpaper.interface'
import type { MarketItem, UserInventoryItem } from '@/services/market/market.interface'
import type {
	ItemState,
	StoreItem,
	StoreItemType,
	StoreTarget,
	StoreView,
	WallpaperKind,
} from '../types'

const MARKET_ITEM_TYPES: StoreItemType[] = [
	'THEME',
	'FONT',
	'BROWSER_TITLE',
	'PET',
	'PET_BACKGROUND',
]

const TRY_ON_TYPES: StoreItemType[] = ['THEME', 'FONT', 'BROWSER_TITLE', 'WALLPAPER']

const STATE_ORDER: Record<ItemState, number> = { free: 0, active: 1 }

const VIEW_BY_FILTER: Record<string, StoreView> = {
	THEME: 'THEME',
	FONT: 'FONT',
	BROWSER_TITLE: 'BROWSER_TITLE',
	PET: 'PET',
	PET_BACKGROUND: 'PET',
	wallpapers: 'WALLPAPER',
}

const VIEW_BY_TAB: Record<string, StoreView> = {
	wallpapers: 'WALLPAPER',
	other: 'home',
}

export function marketItemToStoreItem(item: MarketItem): StoreItem | null {
	const type = MARKET_ITEM_TYPES.find((known) => known === item.type)
	if (!type) return null

	return {
		id: item.id,
		type,
		name: item.name,
		value: item.itemValue ?? '',
		price: item.price,
		isOwned: item.isOwned,
		canTryOn: item.canPreview !== false && TRY_ON_TYPES.includes(type),
		description: item.description || undefined,
		image: item.imageUrl || item.previewUrl || undefined,
	}
}

export function inventoryItemToStoreItem(
	item: UserInventoryItem,
	type: StoreItemType
): StoreItem {
	return {
		id: item.id,
		type,
		name: item.name || t('market.storeItem.untitled'),
		value: item.value,
		price: 0,
		isOwned: true,
		canTryOn: false,
		description: item.description || undefined,
	}
}

export function wallpaperCaption(wallpaper: Wallpaper): string {
	return wallpaper.name && wallpaper.name !== '-' ? wallpaper.name : ''
}

export function wallpaperToStoreItem(wallpaper: Wallpaper): StoreItem {
	return {
		id: wallpaper.id,
		type: 'WALLPAPER',
		name: wallpaperCaption(wallpaper) || t('market.wallpaperBrowser.wallpaperLabel'),
		value: wallpaper.id,
		price: wallpaper.coin ?? 0,
		isOwned: Boolean(wallpaper.isOwned),
		canTryOn: true,
		image: wallpaper.previewSrc,
		wallpaper,
	}
}

export function isAnimatedWallpaper(wallpaper: Wallpaper): boolean {
	return (
		wallpaper.type === 'VIDEO' ||
		Boolean(wallpaper.src?.endsWith('.gif')) ||
		Boolean(wallpaper.previewSrc?.endsWith('.gif'))
	)
}

export function matchesWallpaperFilter(
	wallpaper: Wallpaper,
	kind: WallpaperKind
): boolean {
	const animated = isAnimatedWallpaper(wallpaper)
	if (kind === 'image' && animated) return false
	if (kind === 'animated' && !animated) return false
	return true
}

export function getItemState(item: StoreItem, activeValue?: string): ItemState {
	if (activeValue && activeValue === item.value) return 'active'
	return 'free'
}

export function uniqueByValue(items: StoreItem[]): StoreItem[] {
	const seen = new Set<string>()
	return items.filter((item) => {
		if (seen.has(item.value)) return false
		seen.add(item.value)
		return true
	})
}

export function sortByState(
	items: StoreItem[],
	stateOf: (item: StoreItem) => ItemState
): StoreItem[] {
	return [...items].sort((a, b) => STATE_ORDER[stateOf(a)] - STATE_ORDER[stateOf(b)])
}

export function toStoreTarget(tab?: string, filter?: string): StoreTarget {
	const view = (filter && VIEW_BY_FILTER[filter]) || (tab && VIEW_BY_TAB[tab]) || 'home'
	return { view, petKind: filter === 'PET_BACKGROUND' ? 'PET_BACKGROUND' : 'PET' }
}

export function faNumber(value: number): string {
	return value.toLocaleString('fa-IR')
}
