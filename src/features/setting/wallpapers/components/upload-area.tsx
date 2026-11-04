import { t } from '@/common/i18n'
import { showToast } from '@/common/toast'
import type { Wallpaper } from '@/common/types/wallpaper.interface'
import { translateError } from '@/common/utils/translate-error'
import { safeAwait } from '@/services/api'
import { useRemoveCustomWallpaper } from '@/services/wallpapers/upload-custom-wallpaper.hook'
import { useRef, useState } from 'react'
import { useWallpaperUpload } from '../hooks/use-wallpaper-upload'
import { UploadActive } from './upload/upload-active'
import { UploadEmpty } from './upload/upload-empty'
import { UploadLoading } from './upload/upload-loading'

interface UploadAreaProps {
	customWallpaper: Wallpaper | null
	isActive: boolean
	onWallpaperChange: (newWallpaper: Wallpaper) => void
	onWallpaperRemove?: () => void | Promise<void>
}

export function UploadArea({
	customWallpaper,
	isActive,
	onWallpaperChange,
	onWallpaperRemove,
}: UploadAreaProps) {
	const [isDragging, setIsDragging] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const { mutateAsync: removeCustomWallpaper, isPending: isRemoving } =
		useRemoveCustomWallpaper()

	const { processFile, isUploading, isLoadingConfig, maxSize } = useWallpaperUpload({
		onWallpaperChange,
	})

	const handleFileSelect = () => {
		if (isUploading || isRemoving || isLoadingConfig) return
		if (fileInputRef.current) {
			fileInputRef.current.click()
		}
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			processFile(file)
			e.target.value = ''
		}
	}

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (!isDragging) setIsDragging(true)
	}

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragging(false)
	}

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragging(false)
		const file = e.dataTransfer.files?.[0]
		if (file) {
			processFile(file)
		}
	}

	const handleRemove = async () => {
		if (isUploading || isRemoving) return
		if (customWallpaper?.src?.startsWith('http')) {
			const [error] = await safeAwait(removeCustomWallpaper())
			if (error) {
				showToast(translateError(error) as string, 'error')
				return
			}
		}
		if (onWallpaperRemove) {
			await onWallpaperRemove()
		}
		showToast(t('setting.wallpaper.removedToast'), 'info')
	}

	return (
		<>
			{isLoadingConfig ? (
				<UploadLoading />
			) : !customWallpaper ? (
				<UploadEmpty
					isDragging={isDragging}
					isUploading={isUploading}
					maxSize={maxSize}
					onFileSelect={handleFileSelect}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
				/>
			) : (
				<UploadActive
					customWallpaper={customWallpaper}
					isActive={isActive}
					isUploading={isUploading}
					isRemoving={isRemoving}
					onFileSelect={handleFileSelect}
					onRemove={handleRemove}
				/>
			)}

			<input
				type="file"
				ref={fileInputRef}
				className="hidden"
				accept="image/*,video/mp4,video/webm"
				onChange={handleFileChange}
			/>
		</>
	)
}
