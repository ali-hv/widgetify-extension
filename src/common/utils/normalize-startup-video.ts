import type { StartupVideoSettings } from '@/common/types/startup-video.interface'

export function normalizeVideoSettings(value: unknown): StartupVideoSettings | null {
	if (!value || typeof value !== 'object') return null
	const stored = value as Partial<StartupVideoSettings>
	const directory = stored.directory
	if (
		directory?.kind !== 'directory' ||
		typeof directory.name !== 'string' ||
		typeof directory.values !== 'function' ||
		typeof directory.getFileHandle !== 'function' ||
		typeof directory.queryPermission !== 'function' ||
		typeof directory.requestPermission !== 'function'
	)
		return null
	return {
		directory,
		enabled: stored.enabled === true,
		count:
			typeof stored.count === 'number' &&
			Number.isInteger(stored.count) &&
			stored.count > 0
				? stored.count
				: 0,
	}
}
