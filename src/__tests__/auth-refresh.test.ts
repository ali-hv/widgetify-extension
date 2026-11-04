import { describe, expect, it } from 'bun:test'
import { shouldRefreshAuth } from '@/services/auth/should-refresh-auth'

describe('authentication recovery', () => {
	it('does not refresh or log out a signed-out user after a public request returns 401', () => {
		expect(shouldRefreshAuth(401, false, undefined)).toBe(false)
	})

	it('refreshes an authenticated request once', () => {
		expect(shouldRefreshAuth(401, true, undefined)).toBe(true)
		expect(shouldRefreshAuth(401, true, true)).toBe(false)
	})

	it('leaves access denials, network errors and server errors on the normal error path', () => {
		for (const status of [undefined, 403, 404, 429, 500]) {
			expect(shouldRefreshAuth(status, true, undefined)).toBe(false)
		}
	})
})
