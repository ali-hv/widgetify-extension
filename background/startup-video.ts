import Analytics from '../src/analytics'
import {
	getDeviceFileSelection,
	getSessionValue,
	setSessionValue,
} from '../src/common/storage'
import { normalizeVideoSettings } from '../src/common/utils/normalize-startup-video'
import { createStartupVideoCoordinator } from './startup-video-state'

export function setupStartupVideo() {
	const coordinator = createStartupVideoCoordinator({
		isEnabled: async () =>
			normalizeVideoSettings(await getDeviceFileSelection('startupVideoDirectory'))
				?.enabled === true,
		getRequest: () => getSessionValue('startupVideoRequest'),
		setRequest: (token) => setSessionValue('startupVideoRequest', token),
		getWindowIds: async () => {
			const ids = await getSessionValue('startupVideoWindowIds')
			return Array.isArray(ids) ? ids.filter(Number.isInteger) : []
		},
		setWindowIds: (ids) => setSessionValue('startupVideoWindowIds', ids),
		getNormalWindowIds: async () =>
			(await browser.windows.getAll({ windowTypes: ['normal'] })).flatMap(
				(window) =>
					!window.incognito && typeof window.id === 'number' ? [window.id] : []
			),
		createToken: () => crypto.randomUUID(),
		openDashboard: async (token) => {
			await browser.tabs.create({
				url: `${browser.runtime.getURL('/newtab.html')}?startupVideo=${encodeURIComponent(token)}`,
			})
		},
	})
	browser.runtime.onStartup.addListener(() => {
		void coordinator
			.start()
			.catch(() => Analytics.event('startup_video_startup_failed'))
	})
	browser.windows.onCreated.addListener((window) => {
		if (window.type !== 'normal' || window.incognito || typeof window.id !== 'number')
			return
		void coordinator
			.windowOpened(window.id)
			.catch(() => Analytics.event('startup_video_startup_failed'))
	})
	browser.windows.onRemoved.addListener((windowId) => {
		void coordinator
			.windowRemoved(windowId)
			.catch(() => Analytics.event('startup_video_startup_failed'))
	})
	return (token: string, sender: { id?: string; url?: string }) => {
		if (sender.id !== browser.runtime.id) return Promise.resolve(false)
		if (!sender.url || new URL(sender.url).pathname !== '/newtab.html')
			return Promise.resolve(false)
		return coordinator.claim(token)
	}
}
