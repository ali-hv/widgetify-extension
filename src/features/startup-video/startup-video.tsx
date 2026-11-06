import { useEffect, useRef, useState } from 'react'
import Analytics from '@/analytics'
import { t, type MessageKey } from '@/common/i18n'
import { SwEventType } from '@/common/types/sw-events.interface'
import { Alert, Button, Modal, Spinner } from '@/components/ui'
import { VideoPlayback } from './components/video-playback'
import { useVideoFolder } from './hooks/use-video-folder'

const FOLDER_MESSAGES: Record<'permission' | 'empty' | 'unavailable', MessageKey> = {
	permission: 'startupVideo.permissionError',
	empty: 'startupVideo.emptyFolder',
	unavailable: 'startupVideo.folderError',
}

export function StartupVideo() {
	const [isOpen, setIsOpen] = useState(false)
	const claimRef = useRef<Promise<boolean> | null>(null)
	const folder = useVideoFolder(isOpen)
	const selected = folder.files[folder.index]

	useEffect(() => {
		const url = new URL(window.location.href)
		const token = url.searchParams.get('startupVideo')
		if (!token) return
		let active = true
		claimRef.current ??= browser.runtime.sendMessage({
			type: SwEventType.ClaimStartupVideo,
			token,
		})
		void claimRef.current
			.then((claimed) => {
				if (!active) return
				url.searchParams.delete('startupVideo')
				window.history.replaceState(null, '', url)
				if (!claimed) return
				Analytics.event('startup_video_opened')
				setIsOpen(true)
			})
			.catch(() => Analytics.event('startup_video_startup_failed'))
		return () => {
			active = false
		}
	}, [])

	const close = () => {
		Analytics.event('startup_video_closed')
		setIsOpen(false)
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={close}
			size="xl"
			className="max-w-180"
			title={t('startupVideo.title')}
			closeLabel={t('ui.common.close')}
		>
			<div className="flex flex-col gap-3">
				{folder.status === 'loading' ? (
					<div className="flex items-center justify-center aspect-video">
						<Spinner />
					</div>
				) : folder.status === 'ready' && selected ? (
					<VideoPlayback
						key={selected.name}
						file={selected}
						active={isOpen}
						onPermissionDenied={folder.permissionDenied}
					/>
				) : (
					<div className="flex flex-col gap-3 py-8">
						{folder.status !== 'ready' && (
							<Alert tone="warning">
								{t(FOLDER_MESSAGES[folder.status])}
							</Alert>
						)}
						<div className="flex flex-wrap gap-2">
							{folder.status === 'permission' && (
								<Button
									size="sm"
									color="brand"
									onClick={folder.reconnect}
								>
									{t('startupVideo.reconnect')}
								</Button>
							)}
							<Button size="sm" onClick={folder.chooseFolder}>
								{t('startupVideo.chooseFolder')}
							</Button>
						</div>
					</div>
				)}
				<div className="flex items-center justify-between gap-3 min-w-0">
					<p className="text-xs text-fg-muted shrink-0">
						{t('startupVideo.position', {
							current: (folder.files.length
								? folder.index + 1
								: 0
							).toLocaleString('fa-IR'),
							total: folder.files.length.toLocaleString('fa-IR'),
						})}
					</p>
					<p dir="auto" className="text-sm text-fg truncate min-w-0">
						{selected?.name}
					</p>
				</div>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<p className="text-xs text-fg-muted">{t('startupVideo.closeHint')}</p>
					<div className="flex items-center gap-2">
						<Button
							size="sm"
							disabled={
								folder.status !== 'ready' || folder.files.length < 2
							}
							onClick={() => folder.navigate(-1)}
						>
							{t('startupVideo.previous')}
						</Button>
						<Button
							size="sm"
							disabled={
								folder.status !== 'ready' || folder.files.length < 2
							}
							onClick={() => folder.navigate(1)}
						>
							{t('startupVideo.next')}
						</Button>
					</div>
				</div>
			</div>
		</Modal>
	)
}
