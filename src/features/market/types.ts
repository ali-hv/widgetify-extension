import type { Wallpaper } from '@/common/types/wallpaper.interface'

export type StoreItemType =
	| 'THEME'
	| 'FONT'
	| 'BROWSER_TITLE'
	| 'PET'
	| 'PET_BACKGROUND'
	| 'WALLPAPER'

export type ItemState = 'active' | 'free'

export type StoreView = 'home' | 'WALLPAPER' | 'THEME' | 'FONT' | 'PET' | 'BROWSER_TITLE'

export type CategoryType = 'THEME' | 'FONT' | 'BROWSER_TITLE' | 'PET'

export type AppearanceItemType = 'THEME' | 'FONT' | 'BROWSER_TITLE'

export type WallpaperKind = 'all' | 'image' | 'animated'

export interface StoreItem {
	id: string
	type: StoreItemType
	name: string
	value: string
	price: number
	isOwned: boolean
	canTryOn: boolean
	description?: string
	image?: string
	wallpaper?: Wallpaper
}

export interface StoreTarget {
	view: StoreView
	petKind: 'PET' | 'PET_BACKGROUND'
}
