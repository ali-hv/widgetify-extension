import { describe, expect, it } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

function serviceSources(directory: string): string {
	return readdirSync(directory, { withFileTypes: true })
		.map((entry) => {
			const path = join(directory, entry.name)
			if (entry.isDirectory()) return serviceSources(path)
			return path.endsWith('.ts') ? readFileSync(path, 'utf8') : ''
		})
		.join('\n')
}

describe('free access', () => {
	it('has no asset-purchase or payment-package endpoint in the service layer', () => {
		expect(serviceSources('src/services')).not.toMatch(
			/\/(?:market|gallery)[^'"`\n]*\/(?:purchase|packages)/
		)
	})
})
