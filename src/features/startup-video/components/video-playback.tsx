import { useEffect, useRef, useState } from 'react'
import Analytics from '@/analytics'
import { t } from '@/common/i18n'
import { Button, Spinner } from '@/components/ui'
import type { VideoFile } from '../types'
import { videoMime } from '../utils/video-library'

export function VideoPlayback({
	file,
	active,
	onPermissionDenied,
}: {
	file: VideoFile
	active: boolean
	onPermissionDenied: () => void
}) {
	const videoRef = useRef<HTMLVideoElement>(null)
	const [source, setSource] = useState('')
	const [captions, setCaptions] = useState('')
	const [status, setStatus] = useState<'loading' | 'ready' | 'playing' | 'error'>(
		'loading'
	)

	useEffect(() => {
		if (!active) return
		let cancelled = false
		let objectUrl = ''
		let captionUrl = ''
		const video = videoRef.current
		setStatus('loading')
		setSource('')
		setCaptions('')
		void file
			.getCaptions?.()
			.then((caption) => {
				if (cancelled) return
				captionUrl = URL.createObjectURL(
					caption.slice(0, caption.size, 'text/vtt')
				)
				setCaptions(captionUrl)
			})
			.catch(() => {})
		file.getFile()
			.then((current) => {
				if (cancelled) return
				if (current.size === 0) throw new Error('EMPTY_VIDEO')
				const mime = videoMime(current.name)
				objectUrl = URL.createObjectURL(
					mime ? current.slice(0, current.size, mime) : current
				)
				setSource(objectUrl)
			})
			.catch((error) => {
				if (cancelled) return
				if (
					error instanceof Error &&
					['NotAllowedError', 'SecurityError'].includes(error.name)
				)
					onPermissionDenied()
				setStatus('error')
				Analytics.event('startup_video_playback_failed')
			})
		return () => {
			cancelled = true
			video?.pause()
			video?.removeAttribute('src')
			video?.load()
			if (objectUrl) URL.revokeObjectURL(objectUrl)
			if (captionUrl) URL.revokeObjectURL(captionUrl)
		}
	}, [file, active])

	const play = async () => {
		try {
			await videoRef.current?.play()
		} catch {
			if (!active) return
			setStatus('error')
			Analytics.event('startup_video_playback_failed')
		}
	}

	return (
		<div className="relative flex items-center justify-center aspect-video rounded-2xl bg-scrim-strong overflow-hidden">
			<video
				ref={videoRef}
				src={source || undefined}
				preload="metadata"
				playsInline
				controls={status === 'playing'}
				aria-label={file.name}
				className="w-full h-full object-contain"
				onLoadedMetadata={() => {
					if (active) setStatus('ready')
				}}
				onPlay={() => {
					if (!active) {
						videoRef.current?.pause()
						return
					}
					setStatus('playing')
					Analytics.event('startup_video_played')
				}}
				onError={() => {
					if (!active || !source) return
					setStatus('error')
					Analytics.event('startup_video_playback_failed')
				}}
			>
				<track
					kind="captions"
					src={captions || undefined}
					label={t('startupVideo.captions')}
				/>
			</video>
			{status !== 'playing' && (
				<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-scrim text-image-fg p-4 text-center">
					{status === 'loading' ? (
						<Spinner tone="image" />
					) : status === 'error' ? (
						<p className="text-sm">{t('startupVideo.videoError')}</p>
					) : (
						<>
							<Button color="brand" size="sm" onClick={play}>
								{t('startupVideo.play')}
							</Button>
							<p className="text-xs text-image-fg-muted">
								{t('startupVideo.pausedHint')}
							</p>
						</>
					)}
				</div>
			)}
		</div>
	)
}
