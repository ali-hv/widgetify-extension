declare module '@/common/constants/store-keys' {
	interface StorageKV {
		[key: `todoistCalendarCompletion:${string}`]: boolean
	}
}

export {}
