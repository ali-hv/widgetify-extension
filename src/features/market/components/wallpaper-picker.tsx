import type { ReactNode } from 'react'
import { useActiveValues } from '../hooks/use-active-values'
import { useApplyItem } from '../hooks/use-apply-item'
import { WallpaperBrowser } from './wallpaper-browser'

export function WallpaperPicker({ leading }: { leading?: ReactNode }) {
	const active = useActiveValues()
	const apply = useApplyItem()
	return (
		<WallpaperBrowser
			selectedId={active.WALLPAPER ?? null}
			onPick={apply}
			leading={leading}
		/>
	)
}
