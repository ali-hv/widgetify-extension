import { t } from '@/common/i18n'
import { Spinner } from '@/components/ui'
import { Icon } from '@/icons'
import type { GalleryAsset } from '@/services/gallery/get-gallery-assets.hook'
import { useRef, useState } from 'react'
import { useLazyLoad } from './use-lazy-load'

interface GalleryBookmarkIconItemProps {
	asset: GalleryAsset
	isSelected: boolean
	onClick: () => void
}

export function GalleryBookmarkIconItem({
	asset,
	isSelected,
	onClick,
}: GalleryBookmarkIconItemProps) {
	const [loaded, setLoaded] = useState(false)
	const [error, setError] = useState(false)
	const imgRef = useRef<HTMLImageElement>(null)

	const loadContent = () => {
		if (imgRef.current) {
			imgRef.current.src = asset.previewUrl || asset.url
		}
	}

	const elementRef = useLazyLoad<HTMLButtonElement>(loadContent)

	const itemOutlineStyle = isSelected
		? 'ring-2 ring-brand ring-offset-2 ring-offset-surface border-brand'
		: 'border-line hover:border-brand-muted hover:bg-fill-2'

	return (
		<button
			type="button"
			aria-pressed={isSelected}
			ref={elementRef}
			onClick={onClick}
			className={`relative w-full aspect-square rounded-2xl cursor-pointer group flex flex-col items-center justify-center p-3 select-none transition-ui duration-200 active:scale-96 bg-fill border ${itemOutlineStyle}`}
		>
			<div
				className="absolute inset-0 rounded-2xl pointer-events-none opacity-40"
				style={{
					backgroundImage:
						'radial-gradient(circle, currentColor 1px, transparent 1px)',
					backgroundSize: '12px 12px',
				}}
			/>
			{!loaded && (
				<div className="flex items-center justify-center w-full h-full">
					<Spinner />
				</div>
			)}
			{error && (
				<div className="flex flex-col items-center justify-center w-full h-full text-danger">
					<Icon name="alert" size={20} />
					<p className="mt-1 text-3xs text-fg-muted">
						{t('gallery.bookmark.fetchFailed')}
					</p>
				</div>
			)}
			<div className="relative z-10 flex items-center justify-center w-full h-full p-2">
				<img
					ref={imgRef}
					alt={asset.title || t('gallery.bookmark.iconAlt')}
					onLoad={() => {
						setLoaded(true)
						setError(false)
					}}
					onError={() => {
						setLoaded(true)
						setError(true)
					}}
					className="object-contain w-full h-full max-w-[85%] max-h-[85%] drop-shadow-sm transition-transform duration-200 group-hover:scale-108"
					style={{ opacity: loaded && !error ? 1 : 0 }}
				/>
			</div>
			{loaded && !error && (
				<>
					{asset.title && (
						<div className="absolute inset-x-1 bottom-1 px-1 py-0.5 rounded-lg bg-glass-modal text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30 shadow-sm border border-line">
							<span className="text-3xs font-medium text-fg truncate block">
								{asset.title}
							</span>
						</div>
					)}

					{isSelected && (
						<div className="absolute p-1 text-on-brand rounded-full shadow-sm top-2 left-2 bg-brand z-20">
							<Icon name="check" size={12} />
						</div>
					)}
				</>
			)}
		</button>
	)
}
