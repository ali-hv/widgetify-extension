import { describe, expect, it } from 'bun:test'
import {
	canSyncWallpaperSelection,
	wallpaperSelectionToStorage,
} from '../utils/wallpaper-sync'
import type { Wallpaper } from '@/common/types/wallpaper.interface'

const wallpaper: Wallpaper = {
	id: 'image',
	name: '',
	src: 'image.webp',
	previewSrc: '',
	type: 'IMAGE',
}

describe('wallpaper selection without charges', () => {
	it('keeps legacy priced wallpapers local when selection could spend coins', () => {
		expect(canSyncWallpaperSelection({ ...wallpaper, coin: 80 })).toBe(false)
		expect(
			canSyncWallpaperSelection({ ...wallpaper, coin: 80, isOwned: false })
		).toBe(false)
	})
	it('preserves backend sync for free and already owned wallpapers', () => {
		expect(canSyncWallpaperSelection(wallpaper)).toBe(true)
		expect(canSyncWallpaperSelection({ ...wallpaper, coin: 0 })).toBe(true)
		expect(canSyncWallpaperSelection({ ...wallpaper, coin: 80, isOwned: true })).toBe(
			true
		)
	})
})

describe('local wallpaper persistence', () => {
	it('stores a priced selection locally so account sync cannot replace it on reload', () => {
		expect(wallpaperSelectionToStorage({ ...wallpaper, coin: 80 }).localOnly).toBe(
			true
		)
	})
	it('keeps signed-out media local after a later sign-in', () => {
		expect(
			wallpaperSelectionToStorage({
				...wallpaper,
				src: 'data:video/mp4;base64,AAAA',
				type: 'VIDEO',
				isCustom: true,
			}).localOnly
		).toBe(true)
	})
	it('allows a subsequent synced selection to clear the local marker', () => {
		expect(wallpaperSelectionToStorage(wallpaper).localOnly).toBe(false)
	})
	it('preserves the gradient colours with the selection', () => {
		const gradient = { from: '#000000', to: '#ffffff', direction: 'to-r' } as const
		expect(
			wallpaperSelectionToStorage({ ...wallpaper, type: 'GRADIENT', gradient })
				.gradient
		).toEqual(gradient)
	})
})
