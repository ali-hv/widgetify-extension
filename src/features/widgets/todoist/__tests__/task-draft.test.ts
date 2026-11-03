import { describe, expect, it } from 'bun:test'
import { createTaskDraft, taskDraftInput } from '../utils/task-draft'
import type { TodoistTask } from '@/services/todoist/todoist.interface'

const task: TodoistTask = {
	id: 'task',
	content: 'Read',
	description: '',
	project_id: 'inbox',
	section_id: null,
	parent_id: null,
	priority: 4,
	labels: ['book'],
	checked: false,
	due: {
		date: '2026-11-03T07:00:00Z',
		timezone: 'Asia/Tehran',
		string: 'every day at 10:30',
		lang: 'en',
		is_recurring: true,
	},
}

describe('Todoist schedule editing', () => {
	it('omits due when a title changes so Todoist preserves the recurrence and timezone', () => {
		const draft = createTaskDraft(task, 'inbox')
		draft.content = 'Read more'
		expect(taskDraftInput(draft)).not.toHaveProperty('due')
		expect(draft.time).toBe('10:30')
	})
	it('clears a schedule with null and deduplicates trimmed labels', () => {
		const draft = {
			...createTaskDraft(task, 'inbox'),
			dueChanged: true,
			date: '',
			time: '',
			recurrence: '',
			labels: 'book, work, book, ',
		}
		expect(taskDraftInput(draft)).toMatchObject({
			due: null,
			labels: ['book', 'work'],
		})
	})
	it('builds a weekly rule from a picked date and time', () => {
		const draft = {
			...createTaskDraft(null, 'inbox'),
			dueChanged: true,
			date: '2026-11-03',
			time: '10:30',
			recurrence: 'every week',
		}
		expect(taskDraftInput(draft).due).toEqual({
			string: 'every week at 10:30 starting 2026-11-03',
			lang: 'en',
		})
	})
	it('leaves a custom expression intact instead of appending duplicate times', () => {
		const draft = { ...createTaskDraft(task, 'inbox'), dueChanged: true }
		expect(taskDraftInput(draft).due).toEqual({
			string: 'every day at 10:30',
			lang: 'en',
		})
	})
	it('converts an edited fixed-time task back to UTC in its original timezone', () => {
		const draft = {
			...createTaskDraft(task, 'inbox'),
			dueChanged: true,
			time: '11:30',
			recurrence: '',
		}
		expect(taskDraftInput(draft).due).toEqual({
			date: '2026-11-03T08:00:00.000Z',
			timezone: 'Asia/Tehran',
		})
	})
})
