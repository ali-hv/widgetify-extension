export function shouldRefreshAuth(
	status: number | undefined,
	hasAuthorization: boolean,
	alreadyRetried: boolean | undefined
): boolean {
	return status === 401 && hasAuthorization && !alreadyRetried
}
