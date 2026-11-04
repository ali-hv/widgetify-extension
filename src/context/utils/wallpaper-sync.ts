import type { StoredWallpaper, Wallpaper } from '@/common/types/wallpaper.interface'

export function canSyncWallpaperSelection(wallpaper: Wallpaper): boolean {
	return !wallpaper.coin || wallpaper.isOwned === true
}

export function wallpaperSelectionToStorage(wallpaper: Wallpaper): StoredWallpaper {
	return {
		id: wallpaper.id,
		type: wallpaper.type,
		src: wallpaper.src,
		localOnly:
			!canSyncWallpaperSelection(wallpaper) || wallpaper.src.startsWith('data:'),
		...(wallpaper.type === 'GRADIENT' && wallpaper.gradient
			? { gradient: wallpaper.gradient }
			: {}),
	}
}
