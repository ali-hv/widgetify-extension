import { useCallback, useEffect, useRef, useState } from 'react'
import Analytics from '@/analytics'
import { getDeviceFileSelection, setDeviceFileSelection } from '@/common/storage'
import type {
	StartupVideoSettings,
	VideoDirectory,
} from '@/common/types/startup-video.interface'
import { normalizeVideoSettings } from '@/common/utils/normalize-startup-video'
import type { VideoFile } from '../types'
import { canPlayVideo, folderFailure, pickVideoDirectory } from '../utils/folder-access'
import {
	readVideoFiles,
	refreshVideoOrder,
	shuffleVideos,
	videoIndex,
} from '../utils/video-library'

type FolderStatus = 'loading' | 'permission' | 'empty' | 'unavailable' | 'ready'

export function useVideoFolder(isOpen: boolean) {
	const [status, setStatus] = useState<FolderStatus>('loading')
	const [files, setFiles] = useState<VideoFile[]>([])
	const [index, setIndex] = useState(0)
	const settingsRef = useRef<StartupVideoSettings | null>(null)
	const filesRef = useRef<VideoFile[]>([])
	const currentRef = useRef<string | undefined>(undefined)
	const generation = useRef(0)

	const scan = useCallback(
		async (directory: VideoDirectory, request: number, step?: -1 | 1) => {
			if ((await directory.queryPermission({ mode: 'read' })) !== 'granted') {
				if (request === generation.current) setStatus('permission')
				return
			}
			const available = await readVideoFiles(directory, canPlayVideo)
			if (request !== generation.current) return
			const ordered = step
				? refreshVideoOrder(filesRef.current, available)
				: shuffleVideos(available)
			const selected = step ? videoIndex(ordered, currentRef.current, step) : 0
			filesRef.current = ordered
			currentRef.current = ordered[selected]?.name
			setFiles(ordered)
			setIndex(Math.max(0, selected))
			setStatus(ordered.length ? 'ready' : 'empty')
		},
		[]
	)

	useEffect(() => {
		if (!isOpen) return
		const request = ++generation.current
		filesRef.current = []
		currentRef.current = undefined
		setFiles([])
		setStatus('loading')
		void getDeviceFileSelection('startupVideoDirectory')
			.then(async (stored) => {
				if (request !== generation.current) return
				const settings = normalizeVideoSettings(stored)
				settingsRef.current = settings
				if (!settings?.enabled) {
					setStatus('unavailable')
					return
				}
				await scan(settings.directory, request)
			})
			.catch((error) => {
				if (request === generation.current) setStatus(folderFailure(error))
				Analytics.event('startup_video_folder_failed')
			})
		return () => {
			generation.current++
		}
	}, [isOpen, scan])

	const navigate = async (step: -1 | 1) => {
		const directory = settingsRef.current?.directory
		if (!directory) return
		const request = ++generation.current
		setStatus('loading')
		Analytics.event('startup_video_navigated', {
			direction: step === 1 ? 'next' : 'previous',
		})
		try {
			await scan(directory, request, step)
		} catch (error) {
			if (request === generation.current) setStatus(folderFailure(error))
			Analytics.event('startup_video_navigation_failed')
		}
	}

	const reconnect = async () => {
		const directory = settingsRef.current?.directory
		if (!directory) return
		const request = ++generation.current
		Analytics.event('startup_video_reconnect_started')
		setStatus('loading')
		try {
			const permission = await directory.requestPermission({ mode: 'read' })
			if (request !== generation.current) return
			if (permission !== 'granted') {
				setStatus('permission')
				Analytics.event('startup_video_reconnect_failed')
				return
			}
			setStatus('loading')
			await scan(directory, request)
			Analytics.event('startup_video_reconnected')
		} catch (error) {
			if (request === generation.current) setStatus(folderFailure(error))
			Analytics.event('startup_video_reconnect_failed')
		}
	}

	const chooseFolder = async () => {
		const request = ++generation.current
		Analytics.event('startup_video_folder_opened')
		try {
			const { directory, files: selected } = await pickVideoDirectory()
			if (request !== generation.current) return
			const settings = {
				directory,
				enabled: settingsRef.current?.enabled === true,
				count: selected.length,
			}
			await setDeviceFileSelection('startupVideoDirectory', settings)
			if (request !== generation.current) return
			settingsRef.current = settings
			await scan(directory, request)
			Analytics.event('startup_video_folder_selected')
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError')
				Analytics.event('startup_video_folder_cancelled')
			else {
				if (request === generation.current) setStatus(folderFailure(error))
				Analytics.event('startup_video_folder_failed')
			}
		}
	}

	return {
		status,
		files,
		index,
		navigate,
		reconnect,
		chooseFolder,
		permissionDenied: () => setStatus('permission'),
	}
}
