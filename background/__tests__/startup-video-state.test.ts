import { describe, expect, it } from 'bun:test'
import { createStartupVideoCoordinator } from '../startup-video-state'

function setup() {
	const state = {
		enabled: true,
		token: null as string | null,
		tabs: [] as string[],
		failure: false,
		knownWindows: [] as number[],
		windows: [1],
	}
	const dependencies = {
		isEnabled: async () => state.enabled,
		getRequest: async () => state.token,
		setRequest: async (value: string | null) => {
			state.token = value
		},
		getWindowIds: async () => state.knownWindows,
		setWindowIds: async (ids: number[]) => {
			state.knownWindows = ids
		},
		getNormalWindowIds: async () => state.windows,
		createToken: () => 'browser-start',
		openDashboard: async (token: string) => {
			if (state.failure) throw new Error('TAB_FAILED')
			if (!state.windows.length) state.windows = [100]
			state.tabs.push(token)
		},
	}
	return {
		state,
		dependencies,
		coordinator: createStartupVideoCoordinator(dependencies),
	}
}

describe('startup video requests', () => {
	it('opens once after closing all windows while Chrome keeps running', async () => {
		const { state, coordinator } = setup()
		await coordinator.start()
		await coordinator.claim('browser-start')
		state.windows = []
		await coordinator.windowRemoved(1)
		state.windows = [2]
		await Promise.all([coordinator.windowOpened(2), coordinator.windowOpened(2)])
		expect(state.tabs).toHaveLength(2)
		expect(await coordinator.claim('browser-start')).toBe(true)
		expect(await coordinator.claim('browser-start')).toBe(false)
	})

	it('does not treat an additional window or worker wake as a browser reopening', async () => {
		const { state, dependencies, coordinator } = setup()
		state.windows = [1, 2]
		await coordinator.windowOpened(2)
		expect(state.tabs).toHaveLength(0)
		await coordinator.start()
		await createStartupVideoCoordinator(dependencies).windowOpened(2)
		expect(state.tabs).toHaveLength(1)
	})

	it('remembers closed windows across worker restarts and respects disabling', async () => {
		const { state, dependencies, coordinator } = setup()
		state.windows = []
		await coordinator.windowRemoved(1)
		const restarted = createStartupVideoCoordinator(dependencies)
		state.windows = [2]
		state.enabled = false
		await restarted.windowOpened(2)
		expect(state.tabs).toHaveLength(0)
		state.enabled = true
		await restarted.windowOpened(2)
		expect(state.tabs).toHaveLength(0)
	})

	it('does not duplicate the startup request when startup also creates a window', async () => {
		const { state, coordinator } = setup()
		await Promise.all([
			coordinator.windowOpened(1),
			coordinator.start(),
			coordinator.windowOpened(1),
		])
		expect(state.tabs).toHaveLength(1)
		expect(await coordinator.claim('browser-start')).toBe(true)
	})

	it('reopens even when no shutdown state was saved before the next window arrived', async () => {
		const { state, dependencies, coordinator } = setup()
		await coordinator.start()
		await coordinator.claim('browser-start')
		state.windows = [2]
		await createStartupVideoCoordinator(dependencies).windowOpened(2)
		expect(state.tabs).toHaveLength(2)
		expect(await coordinator.claim('browser-start')).toBe(true)
	})

	it('handles a queued close after the replacement window is already open', async () => {
		const { state, coordinator } = setup()
		await coordinator.start()
		const closing = coordinator.windowRemoved(1)
		state.windows = [2]
		await Promise.all([closing, coordinator.windowOpened(2)])
		expect(state.tabs).toHaveLength(2)
	})

	it('deduplicates the window created by startup when Chrome had no windows', async () => {
		const { state, coordinator } = setup()
		state.windows = []
		await coordinator.start()
		await coordinator.windowOpened(100)
		expect(state.tabs).toHaveLength(1)
	})

	it('opens once when Chrome restores multiple windows before the startup event', async () => {
		const { state, coordinator } = setup()
		state.windows = [1, 2]
		await coordinator.windowOpened(1)
		await coordinator.windowOpened(2)
		await coordinator.start()
		expect(state.tabs).toHaveLength(1)
	})

	it('recognizes restored windows on a later launch without another profile startup', async () => {
		const { state, coordinator } = setup()
		await coordinator.start()
		state.windows = [2, 3]
		await Promise.all([coordinator.windowOpened(2), coordinator.windowOpened(3)])
		expect(state.tabs).toHaveLength(2)
	})

	it('tracks additional windows when the original window closes', async () => {
		const { state, coordinator } = setup()
		await coordinator.start()
		state.windows = [1, 2]
		await coordinator.windowOpened(2)
		state.windows = [2]
		await coordinator.windowRemoved(1)
		state.windows = [2, 3]
		await coordinator.windowOpened(3)
		expect(state.tabs).toHaveLength(1)
	})

	it('opens no startup tab when disabled and clears an older request', async () => {
		const { state, coordinator } = setup()
		state.enabled = false
		state.token = 'older'
		await coordinator.start()
		expect(state.tabs).toEqual([])
		expect(state.token).toBeNull()
	})

	it('opens once on startup and lets exactly one concurrent tab consume the request', async () => {
		const { state, coordinator } = setup()
		await coordinator.start()
		expect(state.tabs).toEqual(['browser-start'])
		expect(
			await Promise.all([
				coordinator.claim('browser-start'),
				coordinator.claim('browser-start'),
			])
		).toEqual([true, false])
		expect(await coordinator.claim('browser-start')).toBe(false)
		expect(state.tabs).toHaveLength(1)
	})

	it('rejects a new tab or reload with no matching startup request', async () => {
		const { coordinator } = setup()
		expect(await coordinator.claim('')).toBe(false)
		expect(await coordinator.claim('invented')).toBe(false)
		await coordinator.start()
		expect(await coordinator.claim('invented')).toBe(false)
		expect(await coordinator.claim('browser-start')).toBe(true)
	})

	it('does not show a pending request after the setting has been disabled', async () => {
		const { state, coordinator } = setup()
		await coordinator.start()
		state.enabled = false
		expect(await coordinator.claim('browser-start')).toBe(false)
		expect(state.token).toBeNull()
	})

	it('keeps a consumed request consumed after a worker restart', async () => {
		const { dependencies, coordinator } = setup()
		await coordinator.start()
		await coordinator.claim('browser-start')
		const restarted = createStartupVideoCoordinator(dependencies)
		expect(await restarted.claim('browser-start')).toBe(false)
	})

	it('retains a pending request across a worker restart', async () => {
		const { dependencies, coordinator } = setup()
		await coordinator.start()
		const restarted = createStartupVideoCoordinator(dependencies)
		expect(await restarted.claim('browser-start')).toBe(true)
	})

	it('removes a request when opening its tab fails and recovers for a later startup', async () => {
		const { state, coordinator } = setup()
		state.failure = true
		await expect(coordinator.start()).rejects.toThrow('TAB_FAILED')
		expect(state.token).toBeNull()
		state.failure = false
		await coordinator.start()
		expect(await coordinator.claim('browser-start')).toBe(true)
	})
})
