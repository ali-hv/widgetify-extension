import type {
	TodoistAccount,
	TodoistSnapshot,
	TodoistSyncResponse,
	TodoistView,
} from './todoist.interface'

function record(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function rows<T>(value: unknown, valid: (row: Record<string, unknown>) => boolean): T[] {
	return Array.isArray(value)
		? (value.filter(
				(row) => record(row) && typeof row.id === 'string' && valid(row)
			) as T[])
		: []
}

function validDue(value: unknown) {
	if (value === null) return true
	if (
		!record(value) ||
		typeof value.date !== 'string' ||
		!Number.isFinite(Date.parse(value.date)) ||
		typeof value.string !== 'string' ||
		typeof value.lang !== 'string' ||
		typeof value.is_recurring !== 'boolean'
	)
		return false
	if (value.timezone !== undefined && value.timezone !== null) {
		if (typeof value.timezone !== 'string') return false
		try {
			new Intl.DateTimeFormat('en', { timeZone: value.timezone })
		} catch {
			return false
		}
	}
	return true
}

export function normalizeTodoistAccount(value: unknown): TodoistAccount | null {
	if (
		!record(value) ||
		typeof value.token !== 'string' ||
		!value.token.trim() ||
		!record(value.snapshot)
	)
		return null
	const source = value.snapshot
	const snapshot: TodoistSnapshot = {
		items: rows(
			source.items,
			(row) =>
				typeof row.content === 'string' &&
				typeof row.project_id === 'string' &&
				typeof row.description === 'string' &&
				Array.isArray(row.labels) &&
				row.labels.every((label) => typeof label === 'string') &&
				typeof row.priority === 'number' &&
				Number.isInteger(row.priority) &&
				row.priority >= 1 &&
				row.priority <= 4 &&
				(row.section_id === null || typeof row.section_id === 'string') &&
				validDue(row.due)
		),
		projects: rows(source.projects, (row) => typeof row.name === 'string'),
		sections: rows(
			source.sections,
			(row) => typeof row.name === 'string' && typeof row.project_id === 'string'
		),
		labels: rows(source.labels, (row) => typeof row.name === 'string'),
		syncToken: typeof source.syncToken === 'string' ? source.syncToken : '*',
		lastSyncedAt:
			typeof source.lastSyncedAt === 'number' &&
			Number.isFinite(source.lastSyncedAt)
				? source.lastSyncedAt
				: 0,
	}
	if (
		(['items', 'projects', 'sections', 'labels'] as const).some(
			(key) =>
				!Array.isArray(source[key]) ||
				(source[key] as unknown[]).length !== snapshot[key].length
		)
	)
		snapshot.syncToken = '*'
	return {
		token: value.token.trim(),
		connectionId: typeof value.connectionId === 'string' ? value.connectionId : '',
		snapshot,
		error:
			value.error === 'auth' ||
			value.error === 'network' ||
			value.error === 'rate_limit' ||
			value.error === 'request' ||
			value.error === 'storage'
				? value.error
				: undefined,
		retryAt: typeof value.retryAt === 'number' ? value.retryAt : undefined,
	}
}

function mergeRows<
	T extends {
		id: string
		is_deleted?: boolean | number
		is_archived?: boolean | number
		checked?: boolean | number
	},
>(previous: T[], changes: T[] | undefined): T[] {
	const merged = new Map(previous.map((row) => [row.id, row]))
	for (const row of changes ?? []) {
		if (row.is_deleted || row.is_archived || row.checked) merged.delete(row.id)
		else merged.set(row.id, { ...merged.get(row.id), ...row })
	}
	return [...merged.values()]
}

export function mergeTodoistSync(
	previous: TodoistSnapshot | null,
	response: TodoistSyncResponse,
	now: number
): TodoistSnapshot {
	const base = response.full_sync ? null : previous
	return {
		items: mergeRows(base?.items ?? [], response.items),
		projects: mergeRows(base?.projects ?? [], response.projects),
		sections: mergeRows(base?.sections ?? [], response.sections),
		labels: mergeRows(base?.labels ?? [], response.labels),
		syncToken: response.sync_token,
		lastSyncedAt: now,
	}
}

export function todoistView(account: TodoistAccount | null): TodoistView {
	return {
		connected: account !== null,
		connectionId: account?.connectionId ?? null,
		snapshot: account?.snapshot ?? null,
		error: account?.error,
	}
}
