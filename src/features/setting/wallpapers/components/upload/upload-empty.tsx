import { t } from '@/common/i18n'
import { cn } from '@/common/utils/cn'
import { Spinner } from '@/components/ui'
import { Icon } from '@/icons'

interface UploadEmptyProps {
	isDragging: boolean
	isUploading: boolean

	maxSize: number

	onFileSelect: () => void
	onDragOver: (e: React.DragEvent) => void
	onDragLeave: (e: React.DragEvent) => void
	onDrop: (e: React.DragEvent) => void
}

export function UploadEmpty({
	isDragging,
	isUploading,

	maxSize,

	onFileSelect,
	onDragOver,
	onDragLeave,
	onDrop,
}: UploadEmptyProps) {
	return (
		<div className="relative">
			<button
				type="button"
				disabled={isUploading}
				onClick={onFileSelect}
				onDragOver={onDragOver}
				onDragEnter={onDragOver}
				onDragLeave={onDragLeave}
				onDrop={onDrop}
				className={cn(
					'flex flex-col items-center justify-center w-full gap-1.5 p-3 text-center border-2 border-dashed cursor-pointer aspect-video rounded-2xl transition-ui focus-visible:focus-ring disabled:cursor-wait',
					isDragging
						? 'border-brand bg-brand-fill text-brand'
						: 'border-line bg-fill text-fg-muted hover:border-brand-muted hover:bg-brand-fill hover:text-brand'
				)}
			>
				{isUploading ? (
					<Spinner aria-hidden="true" />
				) : (
					<Icon name="uploadImage" size={24} />
				)}
				<span className="text-xs font-semibold text-fg">
					{isDragging
						? t('setting.wallpaperUpload.dropHere')
						: isUploading
							? t('setting.wallpaperUpload.uploading')
							: t('setting.wallpaperUpload.customMediaTitle')}
				</span>
				<span className="text-3xs text-fg-faint">
					{t('setting.wallpaperUpload.sizeLimitHint', {
						p0: maxSize,
					})}
				</span>
			</button>
		</div>
	)
}
