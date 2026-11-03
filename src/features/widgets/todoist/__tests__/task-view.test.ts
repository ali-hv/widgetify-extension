import { describe, expect, it } from 'bun:test'
import momentTz from 'moment-timezone'
import type { TodoistTask } from '@/services/todoist/todoist.interface'
import { filterTodoistTasks, todoistDateRange } from '../utils/task-view'

function task(
	id: string,
	due: string | null,
	change: Partial<TodoistTask> = {}
): TodoistTask {
	return {
		id,
		content: id,
		description: '',
		project_id: 'inbox',
		section_id: null,
		parent_id: null,
		priority: 1,
		labels: [],
		checked: false,
		due: due ? { date: due, string: due, lang: 'en', is_recurring: false } : null,
		...change,
	}
}
const tasks = [
	task('today', '2026-11-04'),
	task('tomorrow', '2026-11-05'),
	task('overdue', '2026-11-03'),
	task('undated', null),
	task('local-evening', '2026-11-04T23:00:00'),
	task('fixed-late', '2026-11-04T22:00:00Z'),
	task('done', '2026-11-04', { checked: true }),
	task('deleted', '2026-11-04', { is_deleted: true }),
]

describe('Todoist task views', () => {
	it('keeps Today strict, including floating times, without shifting all-day dates', () => {
		expect(
			filterTodoistTasks(tasks, 'today', '2026-11-04', 'Asia/Tehran', '').map(
				(item) => item.id
			)
		).toEqual(['today', 'local-evening'])
	})
	it('selects tomorrow in the app timezone when a fixed timestamp crosses midnight', () => {
		expect(
			filterTodoistTasks(tasks, 'tomorrow', '2026-11-05', 'Asia/Tehran', '').map(
				(item) => item.id
			)
		).toEqual(['tomorrow', 'fixed-late'])
	})
	it('includes overdue and undated tasks in Upcoming while excluding completed and deleted tasks', () => {
		expect(
			filterTodoistTasks(tasks, 'upcoming', '2026-11-04', 'Asia/Tehran', '').map(
				(item) => item.id
			)
		).toEqual([
			'today',
			'tomorrow',
			'overdue',
			'undated',
			'local-evening',
			'fixed-late',
		])
	})
	it('combines the project filter with each date view', () => {
		expect(
			filterTodoistTasks(
				[...tasks, task('other', '2026-11-04', { project_id: 'work' })],
				'today',
				'2026-11-04',
				'Asia/Tehran',
				'work'
			).map((item) => item.id)
		).toEqual(['other'])
	})
	it('builds a 23-hour calendar day across daylight saving time', () => {
		const range = todoistDateRange(
			'today',
			new Date('2026-03-08T16:00:00Z'),
			'America/New_York'
		)
		expect(range).toEqual({
			day: '2026-03-08',
			start: '2026-03-08T05:00:00.000Z',
			end: '2026-03-09T04:00:00.000Z',
		})
	})
	it('rolls tomorrow into the next year and keeps day keys independent of the global locale', () => {
		const previous = momentTz.locale()
		try {
			momentTz.locale('ar-sa')
			expect(
				todoistDateRange(
					'tomorrow',
					new Date('2026-12-31T12:00:00Z'),
					'Asia/Tehran'
				).day
			).toBe('2027-01-01')
			expect(
				filterTodoistTasks(
					tasks,
					'tomorrow',
					'2026-11-05',
					'Asia/Tehran',
					''
				).map((item) => item.id)
			).toEqual(['tomorrow', 'fixed-late'])
		} finally {
			momentTz.locale(previous)
		}
	})
	it('limits only calendar events to 30 days in Upcoming', () => {
		const range = todoistDateRange(
			'upcoming',
			new Date('2026-11-04T12:00:00Z'),
			'Asia/Tehran'
		)
		expect(range.day).toBe('2026-11-04')
		expect(range.end).toBe('2026-12-03T20:30:00.000Z')
		expect(
			filterTodoistTasks(
				[task('distant', '2030-01-01')],
				'upcoming',
				range.day,
				'Asia/Tehran',
				''
			)
		).toHaveLength(1)
	})
})
