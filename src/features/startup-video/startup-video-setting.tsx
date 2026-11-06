import { useEffect, useState } from 'react'
import Analytics from '@/analytics'
import { t, type MessageKey } from '@/common/i18n'
import { getDeviceFileSelection, setDeviceFileSelection } from '@/common/storage'
import type { StartupVideoSettings } from '@/common/types/startup-video.interface'
import { normalizeVideoSettings } from '@/common/utils/normalize-startup-video'
import { Alert, Button, SectionPanel, ToggleSwitch } from '@/components/ui'
import { canPlayVideo, folderFailure, pickVideoDirectory } from './utils/folder-access'
import { readVideoFiles } from './utils/video-library'

const FAILURE_KEYS: Record<ReturnType<typeof folderFailure>, MessageKey> = {
	empty: 'startupVideo.emptyFolder',
	permission: 'startupVideo.permissionError',
	unavailable: 'startupVideo.folderError',
}

export function StartupVideoSetting() {
	const [settings, setSettings] = useState<StartupVideoSettings | null>(null)
	const [busy, setBusy] = useState(true)
	const [error, setError] = useState<MessageKey | null>(null)

	useEffect(() => {
		let active = true
		Analytics.event('startup_video_settings_opened')
		getDeviceFileSelection('startupVideoDirectory')
			.then((value) => {
				if (active) setSettings(normalizeVideoSettings(value))
			})
			.catch(() => {
				if (active) setError('startupVideo.storageError')
				Analytics.event('startup_video_settings_failed')
			})
			.finally(() => {
				if (active) setBusy(false)
			})
		return () => {
			active = false
		}
	}, [])

	const chooseFolder = async () => {
		Analytics.event('startup_video_folder_opened')
		setBusy(true)
		setError(null)
		try {
			const { directory, files } = await pickVideoDirectory()
			const next = {
				directory,
				count: files.length,
				enabled: settings?.enabled === true,
			}
			await setDeviceFileSelection('startupVideoDirectory', next)
			setSettings(next)
			Analytics.event('startup_video_folder_selected')
		} catch (failure) {
			if (failure instanceof Error && failure.name === 'AbortError') {
				Analytics.event('startup_video_folder_cancelled')
			} else {
				setError(FAILURE_KEYS[folderFailure(failure)])
				Analytics.event('startup_video_folder_failed')
			}
		} finally {
			setBusy(false)
		}
	}

	const toggle = async () => {
		if (!settings) return
		setBusy(true)
		setError(null)
		try {
			let count = settings.count
			if (!settings.enabled) {
				if (
					(await settings.directory.requestPermission({ mode: 'read' })) !==
					'granted'
				)
					throw new DOMException('', 'NotAllowedError')
				count = (await readVideoFiles(settings.directory, canPlayVideo)).length
				if (count === 0) throw new Error('EMPTY_VIDEO_DIRECTORY')
			}
			const next = { ...settings, enabled: !settings.enabled, count }
			await setDeviceFileSelection('startupVideoDirectory', next)
			setSettings(next)
			Analytics.event('startup_video_toggled', { enabled: next.enabled })
		} catch (failure) {
			setError(FAILURE_KEYS[folderFailure(failure)])
			Analytics.event('startup_video_toggle_failed')
		} finally {
			setBusy(false)
		}
	}

	return (
		<SectionPanel
			title={t('startupVideo.settingTitle')}
			size="sm"
			action={
				<ToggleSwitch
					label={t('startupVideo.settingTitle')}
					enabled={settings?.enabled === true}
					disabled={!settings}
					loading={busy}
					onToggle={toggle}
				/>
			}
		>
			<div className="flex flex-col gap-3">
				<p className="text-sm text-fg">{t('startupVideo.settingDescription')}</p>
				<p className="text-xs text-fg-muted">
					{t('startupVideo.manualPlayHint')}
				</p>
				<div className="flex items-center justify-between gap-3 min-w-0">
					<p className="flex-1 min-w-0 truncate text-sm font-medium">
						{settings
							? t('startupVideo.folderSummary', {
									name: settings.directory.name,
									count: settings.count.toLocaleString('fa-IR'),
								})
							: t('startupVideo.noFolder')}
					</p>
					<Button size="sm" loading={busy} onClick={chooseFolder}>
						{settings
							? t('startupVideo.changeFolder')
							: t('startupVideo.chooseFolder')}
					</Button>
				</div>
				<p className="text-xs text-fg-muted">{t('startupVideo.localHint')}</p>
				<p className="text-xs text-fg-muted">{t('startupVideo.liveHint')}</p>
				{error && <Alert tone="warning">{t(error)}</Alert>}
			</div>
		</SectionPanel>
	)
}
