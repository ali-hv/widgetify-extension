import type { VideoDirectory } from '@/common/types/startup-video.interface'
import { readVideoFiles } from './video-library'

export function canPlayVideo(type: string): boolean {
	return document.createElement('video').canPlayType(type) !== ''
}

export async function pickVideoDirectory() {
	const picker = window as Window & {
		showDirectoryPicker?: (options: { mode: 'read' }) => Promise<VideoDirectory>
	}
	if (!picker.showDirectoryPicker) throw new Error('DIRECTORY_PICKER_UNAVAILABLE')
	const directory = await picker.showDirectoryPicker({ mode: 'read' })
	const files = await readVideoFiles(directory, canPlayVideo)
	if (files.length === 0) throw new Error('EMPTY_VIDEO_DIRECTORY')
	return { directory, files }
}

export function folderFailure(error: unknown): 'empty' | 'permission' | 'unavailable' {
	if (error instanceof Error && error.message === 'EMPTY_VIDEO_DIRECTORY')
		return 'empty'
	if (
		error instanceof Error &&
		['NotAllowedError', 'SecurityError'].includes(error.name)
	)
		return 'permission'
	return 'unavailable'
}
