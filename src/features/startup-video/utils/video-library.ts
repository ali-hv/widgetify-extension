import type { VideoDirectory } from '@/common/types/startup-video.interface'
import type { VideoFile } from '../types'

const VIDEO_TYPES: Record<string, string> = {
	mp4: 'video/mp4',
	m4v: 'video/mp4',
	webm: 'video/webm',
	ogv: 'video/ogg',
	ogg: 'video/ogg',
	mov: 'video/quicktime',
}

export function videoMime(name: string): string | undefined {
	return VIDEO_TYPES[name.split('.').pop()?.toLowerCase() ?? '']
}

export async function readVideoFiles(
	directory: VideoDirectory,
	canPlay: (type: string) => boolean
): Promise<VideoFile[]> {
	const videos: VideoFile[] = []
	const captions = new Map<string, FileSystemFileHandle>()
	for await (const entry of directory.values()) {
		if (entry.kind !== 'file') continue
		if (entry.name.toLowerCase().endsWith('.vtt'))
			captions.set(entry.name.toLowerCase(), entry)
		const mime = videoMime(entry.name)
		if (!mime || !canPlay(mime)) continue
		try {
			const file = await entry.getFile()
			if (file.size > 0) videos.push(entry)
		} catch (error) {
			if (!(error instanceof Error) || error.name !== 'NotFoundError') throw error
		}
	}
	return videos
		.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
		.map((video) => {
			const caption = captions.get(
				video.name.replace(/\.[^.]+$/, '.vtt').toLowerCase()
			)
			return {
				name: video.name,
				getFile: () => video.getFile(),
				...(caption ? { getCaptions: () => caption.getFile() } : {}),
			}
		})
}

export function shuffleVideos<T>(videos: T[], random = Math.random): T[] {
	const shuffled = [...videos]
	for (let index = shuffled.length - 1; index > 0; index--) {
		const other = Math.floor(random() * (index + 1))
		;[shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]]
	}
	return shuffled
}

export function refreshVideoOrder(
	previous: VideoFile[],
	available: VideoFile[],
	random = Math.random
): VideoFile[] {
	const byName = new Map(available.map((file) => [file.name, file]))
	const kept: VideoFile[] = []
	for (const file of previous) {
		const current = byName.get(file.name)
		if (!current) continue
		kept.push(current)
		byName.delete(file.name)
	}
	return [...kept, ...shuffleVideos([...byName.values()], random)]
}

export function videoIndex(
	files: VideoFile[],
	current: string | undefined,
	step: -1 | 1
): number {
	if (files.length === 0) return -1
	const index = files.findIndex((file) => file.name === current)
	if (index < 0) return step === 1 ? 0 : files.length - 1
	return (index + step + files.length) % files.length
}
