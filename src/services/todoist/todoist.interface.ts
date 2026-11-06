interface TodoistDue {
	date: string
	string: string
	lang: string
	is_recurring: boolean
	timezone?: string | null
}

export interface TodoistTask {
	id: string
	content: string
	description: string
	project_id: string
	section_id: string | null
	parent_id: string | null
	priority: number
	labels: string[]
	due: TodoistDue | null
	checked: boolean | number
	is_deleted?: boolean | number
}

interface TodoistProject {
	id: string
	name: string
	is_inbox_project?: boolean
	is_deleted?: boolean | number
	is_archived?: boolean | number
}

interface TodoistSection {
	id: string
	name: string
	project_id: string
	is_deleted?: boolean | number
	is_archived?: boolean | number
}

interface TodoistLabel {
	id: string
	name: string
	is_deleted?: boolean | number
}

export interface TodoistSnapshot {
	items: TodoistTask[]
	projects: TodoistProject[]
	sections: TodoistSection[]
	labels: TodoistLabel[]
	syncToken: string
	lastSyncedAt: number
}

export type TodoistErrorCode = 'auth' | 'network' | 'rate_limit' | 'request' | 'storage'

export interface TodoistAccount {
	connectionId: string
	token: string
	snapshot: TodoistSnapshot
	error?: TodoistErrorCode
	retryAt?: number
}

export interface TodoistView {
	connectionId: string | null
	connected: boolean
	snapshot: TodoistSnapshot | null
	error?: TodoistErrorCode
}

export interface TodoistSyncResponse {
	full_sync: boolean
	sync_token: string
	items?: TodoistTask[]
	projects?: TodoistProject[]
	sections?: TodoistSection[]
	labels?: TodoistLabel[]
	sync_status?: Record<string, 'ok' | { error_code: number; error: string }>
}

export interface TodoistTaskInput {
	content: string
	description: string
	project_id: string
	section_id: string | null
	priority: number
	labels: string[]
	due?: {
		date?: string
		string?: string
		lang?: string
		timezone?: string | null
	} | null
}

export type TodoistRequest = (
	| { action: 'sync' }
	| { action: 'connect'; token: string }
	| { action: 'disconnect' }
	| { action: 'reschedule'; ids: string[]; date: string; timezone: string }
	| {
			action: 'save'
			id?: string
			input: TodoistTaskInput
			previousProject?: string
			previousSection?: string | null
	  }
	| { action: 'complete' | 'delete'; id: string }
) & { operationId?: string }

export type TodoistReply =
	| { ok: true; view: TodoistView }
	| { ok: false; error: TodoistErrorCode }

export interface TodoistCommand {
	type: string
	uuid: string
	temp_id?: string
	args: Record<string, unknown>
}
