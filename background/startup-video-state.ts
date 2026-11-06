interface StartupVideoDependencies {
	isEnabled(): Promise<boolean>
	getRequest(): Promise<string | null>
	setRequest(token: string | null): Promise<void>
	getWindowIds(): Promise<number[]>
	setWindowIds(ids: number[]): Promise<void>
	getNormalWindowIds(): Promise<number[]>
	createToken(): string
	openDashboard(token: string): Promise<void>
}

export function createStartupVideoCoordinator(dependencies: StartupVideoDependencies) {
	let queue: Promise<unknown> = Promise.resolve()
	function serial<T>(action: () => Promise<T>): Promise<T> {
		const result = queue.then(action)
		queue = result.catch(() => {})
		return result
	}
	async function start() {
		await dependencies.setRequest(null)
		if (!(await dependencies.isEnabled())) return
		const token = dependencies.createToken()
		await dependencies.setRequest(token)
		try {
			await dependencies.openDashboard(token)
			await dependencies.setWindowIds(await dependencies.getNormalWindowIds())
		} catch (error) {
			await dependencies.setRequest(null)
			await dependencies.setWindowIds([])
			throw error
		}
	}
	return {
		start: () =>
			serial(async () => {
				const current = await dependencies.getNormalWindowIds()
				const known = await dependencies.getWindowIds()
				if (current.some((id) => known.includes(id))) return
				await dependencies.setWindowIds(current)
				await start()
			}),
		windowOpened: (windowId: number) =>
			serial(async () => {
				const current = await dependencies.getNormalWindowIds()
				if (!current.includes(windowId)) return
				const known = await dependencies.getWindowIds()
				if (!known.length && current.length > 1) return
				const alreadyOpen = current.some((id) => known.includes(id))
				await dependencies.setWindowIds(current)
				if (alreadyOpen) return
				await start()
			}),
		windowRemoved: (windowId: number) =>
			serial(async () => {
				const remaining = (await dependencies.getNormalWindowIds()).filter(
					(id) => id !== windowId
				)
				if (!remaining.length) await dependencies.setRequest(null)
			}),
		claim: (token: string) =>
			serial(async () => {
				if (!token || token !== (await dependencies.getRequest())) return false
				await dependencies.setRequest(null)
				return dependencies.isEnabled()
			}),
	}
}
