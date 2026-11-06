import { describe, expect, it } from 'bun:test'
import type { VideoDirectory } from '@/common/types/startup-video.interface'
import { normalizeVideoSettings } from '@/common/utils/normalize-startup-video'
import type { VideoFile } from '../types'
import {
	readVideoFiles,
	refreshVideoOrder,
	shuffleVideos,
	videoIndex,
	videoMime,
} from '../utils/video-library'

function video(name: string): VideoFile {
	return { name, getFile: async () => new File(['content'], name) }
}

function directory(entries: Array<VideoFile & { kind: string }> = []): VideoDirectory {
	return {
		kind: 'directory',
		name: 'videos',
		queryPermission: async () => 'granted',
		requestPermission: async () => 'granted',
		getFileHandle: async () => entries[0],
		async *values() {
			yield* entries
		},
	} as unknown as VideoDirectory
}

const names = (files: VideoFile[]) => files.map((file) => file.name)

describe('live video folder', () => {
	it('defaults disabled and drops invalid stored handles instead of trusting saved JSON', () => {
		for (const value of [
			null,
			{},
			{ enabled: true, directory: {} },
			{ enabled: true, directory: { kind: 'directory' } },
		]) {
			expect(normalizeVideoSettings(value)).toBeNull()
		}
		const handle = directory()
		expect(
			normalizeVideoSettings({ directory: handle, enabled: 'true', count: -3 })
		).toEqual({ directory: handle, enabled: false, count: 0 })
		expect(
			normalizeVideoSettings({ directory: handle, enabled: true, count: 2 })
				?.enabled
		).toBe(true)
	})

	it('recognizes video extensions case-insensitively without treating other files as videos', () => {
		expect(videoMime('clip.MP4')).toBe('video/mp4')
		expect(videoMime('clip.webm')).toBe('video/webm')
		expect(videoMime('cover.png')).toBeUndefined()
		expect(videoMime('clip.mp4.txt')).toBeUndefined()
	})

	it('reads current live entries, excluding folders, empty files and unsupported formats', async () => {
		const entries = [
			{ ...video('2.mp4'), kind: 'file' },
			{ ...video('1.mp4'), kind: 'file' },
			{ ...video('picture.png'), kind: 'file' },
			{ ...video('unsupported.ogv'), kind: 'file' },
			{ ...video('nested.mp4'), kind: 'directory' },
			{
				...video('empty.mp4'),
				kind: 'file',
				getFile: async () => new File([], 'empty.mp4'),
			},
		]
		expect(
			names(
				await readVideoFiles(directory(entries), (mime) => mime === 'video/mp4')
			)
		).toEqual(['1.mp4', '2.mp4'])
		expect(await readVideoFiles(directory(), () => true)).toEqual([])
	})

	it('skips a file deleted during enumeration and preserves permission failures for reconnect', async () => {
		const missing = {
			...video('gone.mp4'),
			kind: 'file',
			getFile: async (): Promise<File> => {
				throw new DOMException('', 'NotFoundError')
			},
		}
		expect(await readVideoFiles(directory([missing]), () => true)).toEqual([])
		const denied = {
			...missing,
			getFile: async (): Promise<File> => {
				throw new DOMException('', 'NotAllowedError')
			},
		}
		await expect(
			readVideoFiles(directory([denied]), () => true)
		).rejects.toHaveProperty('name', 'NotAllowedError')
	})

	it('shuffles a copy and visits each video once before wrapping', () => {
		const files = [video('a.mp4'), video('b.mp4'), video('c.mp4')]
		const shuffled = shuffleVideos(files, () => 0)
		expect(names(files)).toEqual(['a.mp4', 'b.mp4', 'c.mp4'])
		expect(names(shuffled)).toEqual(['b.mp4', 'c.mp4', 'a.mp4'])
		expect(new Set(names(shuffled)).size).toBe(files.length)
		expect(videoIndex(shuffled, 'a.mp4', 1)).toBe(0)
		expect(videoIndex(shuffled, 'b.mp4', -1)).toBe(2)
	})

	it('refreshes handles and removes deleted files while adding new ones to the existing order', () => {
		const previous = [video('a.mp4'), video('b.mp4')]
		const replacement = video('b.mp4')
		const refreshed = refreshVideoOrder(
			previous,
			[replacement, video('new.mp4')],
			() => 0
		)
		expect(names(refreshed)).toEqual(['b.mp4', 'new.mp4'])
		expect(refreshed[0]).toBe(replacement)
		expect(videoIndex(refreshed, 'a.mp4', 1)).toBe(0)
		expect(videoIndex(refreshed, 'a.mp4', -1)).toBe(1)
	})

	it('handles a single video and a folder emptied between navigations', () => {
		const files = [video('only.mp4')]
		expect(videoIndex(files, 'only.mp4', 1)).toBe(0)
		expect(videoIndex(files, 'only.mp4', -1)).toBe(0)
		expect(videoIndex([], 'only.mp4', 1)).toBe(-1)
		expect(refreshVideoOrder(files, [])).toEqual([])
	})
})

describe('local captions', () => {
	it('pairs a video with its live VTT sidecar regardless of listing order', async () => {
		const caption = new File(['WEBVTT\n'], 'clip.vtt')
		const files = await readVideoFiles(
			directory([
				{ ...video('clip.MP4'), kind: 'file' },
				{ name: 'clip.vtt', kind: 'file', getFile: async () => caption },
			]),
			() => true
		)
		expect(files).toHaveLength(1)
		expect(await files[0].getCaptions?.()).toBe(caption)
	})
})
