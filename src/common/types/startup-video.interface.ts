export interface VideoDirectory extends FileSystemDirectoryHandle {
	queryPermission(options: { mode: 'read' }): Promise<PermissionState>
	requestPermission(options: { mode: 'read' }): Promise<PermissionState>
}

export interface StartupVideoSettings {
	directory: VideoDirectory
	enabled: boolean
	count: number
}

declare module '@/common/constants/store-keys' {
	interface StorageKV {
		startupVideoDirectory: StartupVideoSettings
		startupVideoRequest: string | null
		startupVideoWindowsClosed: boolean
		startupVideoWindowIds: number[]
	}
}
