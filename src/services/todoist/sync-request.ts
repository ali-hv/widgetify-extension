import { nowMs } from '@/common/utils/trusted-time'
import type {
	TodoistCommand,
	TodoistErrorCode,
	TodoistSyncResponse,
} from './todoist.interface'
export class TodoistFailure extends Error {
	constructor(
		public code: TodoistErrorCode,
		public retryAt?: number
	) {
		super(code)
	}
}

export async function syncTodoist(
	token: string,
	syncToken: string,
	commands: TodoistCommand[] = [],
	send: typeof fetch = fetch
): Promise<TodoistSyncResponse> {
	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), 20000)
	try {
		const response = await send('https://api.todoist.com/api/v1/sync', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				sync_token: syncToken,
				resource_types: JSON.stringify([
					'items',
					'projects',
					'sections',
					'labels',
				]),
				commands: JSON.stringify(commands),
			}),
			cache: 'no-store',
			signal: controller.signal,
		})
		if (response.status === 401 || response.status === 403)
			throw new TodoistFailure('auth')
		if (response.status === 429) {
			const seconds = Number(response.headers.get('Retry-After'))
			throw new TodoistFailure(
				'rate_limit',
				nowMs() + (Number.isFinite(seconds) && seconds > 0 ? seconds : 60) * 1000
			)
		}
		if (!response.ok)
			throw new TodoistFailure(response.status >= 500 ? 'network' : 'request')
		const data = (await response.json()) as TodoistSyncResponse
		if (typeof data.sync_token !== 'string' || typeof data.full_sync !== 'boolean')
			throw new TodoistFailure('request')
		for (const name of ['items', 'projects', 'sections', 'labels'] as const) {
			if (
				data[name] !== undefined &&
				(!Array.isArray(data[name]) ||
					!data[name].every((row) => row && typeof row.id === 'string'))
			)
				throw new TodoistFailure('request')
		}
		return data
	} catch (error) {
		if (error instanceof TodoistFailure) throw error
		throw new TodoistFailure('network')
	} finally {
		clearTimeout(timeout)
	}
}
