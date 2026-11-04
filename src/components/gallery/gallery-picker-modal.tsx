import Analytics from '@/analytics'
import { t } from '@/common/i18n'
import { playNativeToastSound } from '@/common/toast'
import { Chip, Modal } from '@/components/ui'
import { Icon } from '@/icons'
import {
	useGetGalleryAssets,
	useGetGalleryCategories,
	type GalleryAsset,
	type GalleryAssetType,
} from '@/services/gallery/get-gallery-assets.hook'
import { useEffect, useState } from 'react'
import { GalleryBookmarkIconItem } from './gallery-bookmark-icon-item'
import { GalleryPhotoItem } from './gallery-photo-item'

interface GalleryPickerModalProps {
	isOpen: boolean
	onClose: () => void
	type: GalleryAssetType
	title?: string
	onSelect: (asset: GalleryAsset) => void
	selectedAssetUrl?: string
}

export function GalleryPickerModal({
	isOpen,
	onClose,
	type,
	title = t('gallery.picker.title'),
	onSelect,
	selectedAssetUrl,
}: GalleryPickerModalProps) {
	const [selectedCategory, setSelectedCategory] = useState<string>('ALL')

	const { data: categories = [] } = useGetGalleryCategories(type, isOpen)

	const { data, isLoading, isError } = useGetGalleryAssets(
		{
			type,
			limit: 100,
			category: selectedCategory === 'ALL' ? undefined : selectedCategory,
		},
		isOpen
	)

	useEffect(() => {
		if (isOpen) Analytics.event('gallery_opened', { type })
	}, [isOpen, type])
	useEffect(() => {
		if (isOpen && isError) Analytics.event('gallery_load_failed', { type })
	}, [isOpen, isError, type])
	const assets = data?.data?.assets ?? []

	const handleItemClick = (asset: GalleryAsset) => {
		Analytics.event('gallery_selected', { type })
		onSelect(asset)
		onClose()
		playNativeToastSound('success')
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={title}
			size="xl"
			className=""
			closeOnBackdropClick={true}
			closeLabel={t('ui.common.close')}
		>
			<div className="flex flex-col w-full gap-4 p-1 h-[70vh]">
				{categories.length > 0 && (
					<div className="flex items-center gap-1.5 overflow-y-hidden h-12 overflow-x-auto scrollbar-none">
						<Chip
							selected={selectedCategory === 'ALL'}
							onClick={() => setSelectedCategory('ALL')}
							className="text-xs"
						>
							{t('gallery.picker.all')}
						</Chip>
						{categories.map((cat) => (
							<Chip
								key={cat}
								selected={selectedCategory === cat}
								onClick={() => setSelectedCategory(cat)}
								className="text-xs"
							>
								{cat}
							</Chip>
						))}
					</div>
				)}

				<div className="flex-1 pr-1 overflow-y-auto">
					{isLoading ? (
						type === 'BOOKMARK_ICON' ? (
							<div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5 md:grid-cols-6">
								{[...Array(18)].map((_, idx) => (
									<div
										key={idx}
										className="w-full aspect-square rounded-2xl skeleton"
									/>
								))}
							</div>
						) : (
							<div className="gap-3 space-y-3 columns-2 sm:columns-3 md:columns-4">
								{[...Array(8)].map((_, idx) => (
									<div
										key={idx}
										className="w-full rounded-2xl skeleton break-inside-avoid"
										style={{
											height: `${(idx % 3) * 35 + 110}px`,
										}}
									/>
								))}
							</div>
						)
					) : assets.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-full py-20 text-fg-muted">
							<Icon name="image" size={32} className="mb-2 opacity-30" />
							<p className="text-sm font-medium">
								{t('gallery.picker.empty')}
							</p>
						</div>
					) : type === 'BOOKMARK_ICON' ? (
						<div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5 md:grid-cols-6">
							{assets.map((asset) => (
								<GalleryBookmarkIconItem
									key={asset.id}
									asset={asset}
									isSelected={selectedAssetUrl === asset.url}
									onClick={() => handleItemClick(asset)}
								/>
							))}
						</div>
					) : (
						<div className="gap-3 space-y-3 columns-2 sm:columns-3 md:columns-4">
							{assets.map((asset) => (
								<GalleryPhotoItem
									key={asset.id}
									asset={asset}
									isSelected={selectedAssetUrl === asset.url}
									onClick={() => handleItemClick(asset)}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</Modal>
	)
}
