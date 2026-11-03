import { describe, expect, it } from 'bun:test'
import {
	mergeTodoistSync,
	normalizeTodoistAccount,
	todoistView,
} from '@/services/todoist/sync-state'
import { syncTodoist } from '@/services/todoist/sync-request'
import { todoistCommands } from '@/services/todoist/task-commands'
import type {
	TodoistTask,
	TodoistSnapshot,
	TodoistSyncResponse,
	TodoistTaskInput,
} from '@/services/todoist/todoist.interface'

const task = (id: string): TodoistTask => ({
	id,
	content: id,
	description: '',
	project_id: 'inbox',
	section_id: null,
	parent_id: null,
	priority: 1,
	labels: [],
	due: null,
	checked: false,
})
const base: TodoistSnapshot = {
	items: [task('keep'), task('edit'), task('remove'), task('done')],
	projects: [{ id: 'inbox', name: 'Inbox' }],
	sections: [],
	labels: [],
	syncToken: 'cursor-a',
	lastSyncedAt: 1,
}
const response = (change: Partial<TodoistSyncResponse> = {}): TodoistSyncResponse => ({
	full_sync: false,
	sync_token: 'cursor-b',
	...change,
})
const input: TodoistTaskInput = {
	content: 'New task',
	description: '',
	project_id: 'inbox',
	section_id: null,
	priority: 1,
	labels: [],
}

describe('Todoist incremental cache', () => {
	it('retains untouched tasks and merges edits, tombstones and completions with their cursor', () => {
		const changes = [
			{ ...task('edit'), content: 'Changed' },
			{ id: 'remove', is_deleted: true },
			{ id: 'done', checked: true },
			task('new'),
		] as TodoistTask[]
		const next = mergeTodoistSync(base, response({ items: changes }), 10)
		expect(next.items.map((item) => item.id)).toEqual(['keep', 'edit', 'new'])
		expect(next.items[1].content).toBe('Changed')
		expect(next.syncToken).toBe('cursor-b')
		expect(next.lastSyncedAt).toBe(10)
		expect(base.items).toHaveLength(4)
	})
	it('replaces old data after a full sync and drops archived resources', () => {
		const next = mergeTodoistSync(
			base,
			response({
				full_sync: true,
				items: [task('new')],
				projects: [{ id: 'old', name: 'Old', is_archived: true }],
			}),
			10
		)
		expect(next.items.map((item) => item.id)).toEqual(['new'])
		expect(next.projects).toEqual([])
	})
	it('keeps a recurring task when Todoist moves its due date forward', () => {
		const recurring = {
			...task('edit'),
			due: {
				date: '2026-11-04',
				string: 'every day',
				lang: 'en',
				is_recurring: true,
			},
		}
		const next = mergeTodoistSync(base, response({ items: [recurring] }), 10)
		expect(next.items.find((item) => item.id === 'edit')?.due?.date).toBe(
			'2026-11-04'
		)
	})
	it('rejects broken accounts and salvages valid rows without exposing credentials to query state', () => {
		expect(normalizeTodoistAccount({ token: 123, snapshot: base })).toBeNull()
		const account = normalizeTodoistAccount({
			token: ' secret ',
			snapshot: { ...base, items: [task('valid'), null, { id: 'broken' }] },
		})
		expect(account?.snapshot.items.map((item) => item.id)).toEqual(['valid'])
		expect(account?.snapshot.syncToken).toBe('*')
		expect(JSON.stringify(todoistView(account))).not.toContain('secret')
	})
})

describe('Todoist commands', () => {
	it('reuses command and temporary ids after an uncertain write, while keeping move ids distinct', () => {
		const request = {
			action: 'save' as const,
			input,
			operationId: 'a74bfb5c-5f1d-4d14-baea-b7415446a871',
		}
		expect(todoistCommands(request)).toEqual(todoistCommands(request))
		const move = todoistCommands({
			...request,
			id: 'task',
			previousProject: 'different',
			previousSection: null,
		})
		expect(move[0].uuid).not.toBe(move[1].uuid)
		expect(
			todoistCommands({
				action: 'complete',
				id: 'task',
				operationId: request.operationId,
			})
		).toEqual(
			todoistCommands({
				action: 'complete',
				id: 'task',
				operationId: request.operationId,
			})
		)
	})
	it('closes tasks using the recurring-aware operation', () => {
		expect(todoistCommands({ action: 'complete', id: 'repeat' })[0]).toMatchObject({
			type: 'item_close',
			args: { id: 'repeat' },
		})
	})
	it('moves sections with a dedicated command and never moves a task on a title-only edit', () => {
		const unchanged = todoistCommands({
			action: 'save',
			id: 'task',
			input,
			previousProject: 'inbox',
			previousSection: null,
		})
		expect(unchanged.map((command) => command.type)).toEqual(['item_update'])
		expect(unchanged[0].args).not.toHaveProperty('due')
		const moved = todoistCommands({
			action: 'save',
			id: 'task',
			input: { ...input, section_id: 'section' },
			previousProject: 'inbox',
			previousSection: null,
		})
		expect(moved[1]).toMatchObject({
			type: 'item_move',
			args: { id: 'task', section_id: 'section' },
		})
		expect(moved[1].args).not.toHaveProperty('project_id')
	})
	it('gives new tasks and commands distinct UUIDs', () => {
		const command = todoistCommands({ action: 'save', input })[0]
		expect(command.type).toBe('item_add')
		expect(command.temp_id).toMatch(/^[a-f0-9-]{36}$/)
		expect(command.uuid).not.toBe(command.temp_id)
	})
})

function respond(status: number, body: unknown, headers?: Record<string, string>) {
	return (async () =>
		new Response(JSON.stringify(body), { status, headers })) as typeof fetch
}

describe('Todoist HTTP boundary', () => {
	it('sends the token only in a bearer header and bypasses caches', async () => {
		const send = (async (url, init) => {
			expect(String(url)).toBe('https://api.todoist.com/api/v1/sync')
			expect(init?.headers).toMatchObject({ Authorization: 'Bearer private-token' })
			expect(init?.cache).toBe('no-store')
			const form = init?.body as URLSearchParams
			expect(form.get('sync_token')).toBe('cursor-a')
			expect(form.has('token')).toBe(false)
			expect(JSON.parse(form.get('resource_types') ?? '')).toEqual([
				'items',
				'projects',
				'sections',
				'labels',
			])
			return new Response(JSON.stringify(response()))
		}) as typeof fetch
		expect(
			(await syncTodoist('private-token', 'cursor-a', [], send)).sync_token
		).toBe('cursor-b')
	})
	it('reports an invalid credential without leaking the server response', async () => {
		const send = respond(401, { detail: 'secret server text' })
		await expect(syncTodoist('private-token', '*', [], send)).rejects.toMatchObject({
			code: 'auth',
			message: 'auth',
		})
	})
	it('honors rate-limit cooldowns and rejects malformed successful replies', async () => {
		const send = respond(429, {}, { 'Retry-After': '90' })
		try {
			await syncTodoist('token', '*', [], send)
			throw new Error('expected failure')
		} catch (error) {
			expect(error).toMatchObject({ code: 'rate_limit' })
			expect((error as { retryAt: number }).retryAt).toBeGreaterThan(
				Date.now() + 88000
			)
		}
		const malformed = respond(200, {
			full_sync: true,
			sync_token: 'next',
			items: [null],
		})
		await expect(syncTodoist('token', '*', [], malformed)).rejects.toMatchObject({
			code: 'request',
		})
	})
	it('maps server outages to a network failure', async () => {
		await expect(
			syncTodoist('token', '*', [], respond(503, {}))
		).rejects.toMatchObject({ code: 'network' })
	})
})
