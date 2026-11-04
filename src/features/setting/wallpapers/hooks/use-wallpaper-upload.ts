import Analytics from '@/analytics'
import { t } from '@/common/i18n'
import { showToast } from '@/common/toast'
import type { Wallpaper } from '@/common/types/wallpaper.interface'
import { readFileDataUrl } from '@/common/utils/read-file-data-url'
import { translateError } from '@/common/utils/translate-error'
import { useAuth } from '@/context/auth.context'
import { type ApiError, safeAwait } from '@/services/api'
import {
	DEFAULT_MAX_UPLOAD_SIZE,
	useGetWallpaperConfig,
} from '@/services/wallpapers/get-wallpaper-config.hook'
import { useUploadCustomWallpaper } from '@/services/wallpapers/upload-custom-wallpaper.hook'

interface UseWallpaperUploadProps {
	onWallpaperChange: (wallpaper: Wallpaper) => void
}

export function useWallpaperUpload({ onWallpaperChange }: UseWallpaperUploadProps) {
	const { isAuthenticated } = useAuth()
	const { data: config, isLoading: isLoadingConfig } = useGetWallpaperConfig()
	const { mutateAsync: uploadCustomWallpaper, isPending: isUploading } =
		useUploadCustomWallpaper()

	const maxSize = config?.maxUploadSizeVip ?? DEFAULT_MAX_UPLOAD_SIZE

	const processFile = async (file: File) => {
		Analytics.event('custom_wallpaper_upload_started')
		const isImage = file.type.startsWith('image/')
		const isVideo = file.type.startsWith('video/')

		if (!isImage && !isVideo) {
			showToast(t('setting.wallpaperUpload.pickMediaFile'), 'error')
			return
		}
		if (file.size > maxSize * 1024 * 1024) {
			showToast(t('setting.wallpaperUpload.fileTooLarge', { p0: maxSize }), 'error')
			return
		}

		if (isAuthenticated) {
			const [error, uploadedWallpaper] = await safeAwait<ApiError, Wallpaper>(
				uploadCustomWallpaper(file)
			)

			if (error) {
				Analytics.event('custom_wallpaper_upload_failed')
				showToast(translateError(error) as string, 'error')
				return
			}

			if (uploadedWallpaper) {
				onWallpaperChange(uploadedWallpaper)
				showToast(
					isVideo
						? t('setting.wallpaperUpload.videoSyncedToast')
						: t('setting.wallpaperUpload.photoSyncedToast'),
					'success'
				)
				Analytics.event('custom_wallpaper_selected')
			}
			return
		}

		const [error, src] = await safeAwait<Error, string>(readFileDataUrl(file))
		if (error || !src) {
			Analytics.event('custom_wallpaper_upload_failed')
			showToast(t('error.uploadFailed'), 'error')
			return
		}
		onWallpaperChange({
			id: 'custom-wallpaper',
			type: isVideo ? 'VIDEO' : 'IMAGE',
			previewSrc: '',
			src,
			name: t('setting.wallpaperUpload.customPhotoLabel'),
			isCustom: true,
		})
		Analytics.event('custom_wallpaper_selected')
	}

	return {
		processFile,
		isUploading,
		isLoadingConfig,

		maxSize,
	}
}
