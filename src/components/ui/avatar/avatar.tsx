import { cn } from '@/common/utils/cn'
import type { VariantProps } from 'class-variance-authority'
import { useEffect, useState } from 'react'
import { avatarVariants } from './avatar.variants'

interface AvatarProps extends VariantProps<typeof avatarVariants> {
	url?: string | null
	file?: File | null
	placeholder?: string
	className?: string
}

export function AvatarComponent({
	url,
	file,
	placeholder = '',
	size,
	className,
}: AvatarProps) {
	const [imageError, setImageError] = useState(false)
	const [previewUrl, setPreviewUrl] = useState<string | null>(null)

	useEffect(() => {
		if (file) {
			const objectUrl = URL.createObjectURL(file)
			setPreviewUrl(objectUrl)
			setImageError(false)

			return () => {
				URL.revokeObjectURL(objectUrl)
			}
		} else {
			setPreviewUrl(null)
		}
	}, [file])

	useEffect(() => {
		setImageError(false)
	}, [url])

	const handleImageError = () => {
		setImageError(true)
	}

	const displayUrl = previewUrl || url
	const shouldShowImage = displayUrl && !imageError

	return (
		<div className={cn(avatarVariants({ size }), className)}>
			{shouldShowImage ? (
				<img
					src={displayUrl}
					alt="Avatar"
					className="object-cover w-full h-full"
					onError={handleImageError}
				/>
			) : (
				<div className="font-medium text-fg-muted">
					{placeholder.charAt(0)?.toUpperCase() || '?'}
				</div>
			)}
		</div>
	)
}
