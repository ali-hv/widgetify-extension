import type { Wallpaper } from '@/common/types/wallpaper.interface'
import { type MarketItem, MarketItemType } from '@/services/market/market.interface'
import { describe, expect, it } from 'bun:test'
import type { StoreItem } from '../types'
import {
	getItemState,
	marketItemToStoreItem,
	matchesWallpaperFilter,
	toStoreTarget,
	uniqueByValue,
	wallpaperToStoreItem,
} from '../utils/store-item'

function marketItem(overrides: Partial<MarketItem> = {}): MarketItem {
	return {
		id: 'item-1',
		name: 'نازگل',
		description: '',
		type: MarketItemType.THEME,
		price: 80,
		meta: {},
		previewUrl: null,
		itemValue: 'naazgol',
		isOwned: false,
		...overrides,
	}
}

function storeItem(overrides: Partial<StoreItem> = {}): StoreItem {
	return {
		id: 'item-1',
		type: 'THEME',
		name: 'نازگل',
		value: 'naazgol',
		price: 80,
		isOwned: false,
		canTryOn: true,
		...overrides,
	}
}

describe('marketItemToStoreItem', () => {
	it('drops a type this version cannot show, so it never reaches a use button', () => {
		expect(
			marketItemToStoreItem(marketItem({ type: 'STICKER' as MarketItemType }))
		).toBe(null)
	})

	it('lets only themes, fonts and tab titles be tried on', () => {
		const pet = marketItemToStoreItem(
			marketItem({ type: MarketItemType.PET, itemValue: 'owl', canPreview: true })
		)
		const hiddenTheme = marketItemToStoreItem(marketItem({ canPreview: false }))
		expect(pet?.canTryOn).toBe(false)
		expect(hiddenTheme?.canTryOn).toBe(false)
		expect(marketItemToStoreItem(marketItem())?.canTryOn).toBe(true)
	})
})

describe('wallpaperToStoreItem', () => {
	const wallpaper: Wallpaper = {
		id: 'wp-1',
		name: '-',
		type: 'IMAGE',
		src: 'full.jpg',
		previewSrc: 'small.jpg',
		coin: 80,
	}

	it('names a wallpaper the server left as a dash', () => {
		expect(wallpaperToStoreItem(wallpaper).name).toBe('تصویر زمینه')
	})

	it('compares by id, the value the wallpaper context keeps', () => {
		expect(wallpaperToStoreItem(wallpaper).value).toBe('wp-1')
	})
})

describe('matchesWallpaperFilter', () => {
	const bought: Wallpaper = {
		id: 'wp-2',
		name: 'قطار شب',
		type: 'VIDEO',
		src: 'train.mp4',
		previewSrc: 'train.jpg',
		coin: 80,
		isOwned: true,
	}

	it('counts a video as animated and not as a still', () => {
		expect(matchesWallpaperFilter(bought, 'animated')).toBe(true)
		expect(matchesWallpaperFilter(bought, 'image')).toBe(false)
	})

	it('counts a gif as animated even though the server calls it an image', () => {
		const gif: Wallpaper = { ...bought, type: 'IMAGE', src: 'rain.gif', coin: 0 }
		expect(matchesWallpaperFilter(gif, 'animated')).toBe(true)
	})
})

describe('uniqueByValue', () => {
	it('shows an item the inventory and the store both list once, as the inventory has it', () => {
		const fromInventory = storeItem({
			id: 'inventory-7',
			name: 'کهربا',
			value: 'luxury',
		})
		const fromStore = storeItem({ id: 'market-3', name: 'کهربا', value: 'luxury' })
		expect(uniqueByValue([fromInventory, fromStore])).toEqual([fromInventory])
	})
})

describe('getItemState', () => {
	it('calls the item in use active even when it is owned', () => {
		expect(getItemState(storeItem({ isOwned: true }), 'naazgol')).toBe('active')
	})

	it('never matches an empty value to an empty active value', () => {
		expect(getItemState(storeItem({ value: '', price: 0 }), '')).toBe('free')
	})

	it('allows an item with a legacy price without ownership', () => {
		expect(getItemState(storeItem(), 'light')).toBe('free')
	})
})

describe('toStoreTarget', () => {
	it('opens the pet section on its scenes for a pet background', () => {
		expect(toStoreTarget(undefined, 'PET_BACKGROUND')).toEqual({
			view: 'PET',
			petKind: 'PET_BACKGROUND',
		})
	})

	it('opens the showcase for a retired coins tab', () => {
		expect(toStoreTarget('coins').view).toBe('home')
	})

	it('opens the showcase when nothing is asked for', () => {
		expect(toStoreTarget().view).toBe('home')
	})
})
