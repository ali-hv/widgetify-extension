import { useEffect, useRef } from 'react'
import { v4 as uuid } from 'uuid'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getFromStorage, watchStorage } from '@/common/storage'
import { SwEventType } from '@/common/types/sw-events.interface'
import { normalizeTodoistAccount, todoistView } from './sync-state'
import { todoistKeys } from './todoist.keys'
import type { TodoistReply, TodoistRequest, TodoistView } from './todoist.interface'

async function requestTodoist(request: TodoistRequest): Promise<TodoistView> {
	let reply: TodoistReply
	try {
		reply = await browser.runtime.sendMessage({
			type: SwEventType.TodoistRequest,
			request,
		})
	} catch {
		throw new Error('network')
	}
	if (!reply) throw new Error('network')
	if (!reply.ok) throw new Error(reply.error)
	return reply.view
}

export function useTodoist() {
	const client = useQueryClient()
	const pendingWrite = useRef<{ fingerprint: string; id: string } | null>(null)
	const query = useQuery({
		queryKey: todoistKeys.account,
		queryFn: () => requestTodoist({ action: 'sync' }),
		retry: false,
		staleTime: 0,
		refetchOnMount: 'always',
		refetchOnWindowFocus: false,
	})
	useEffect(() => {
		let active = true
		let changed = false
		const stop = watchStorage('todoistAccount', (value) => {
			changed = true
			client.setQueryData(
				todoistKeys.account,
				todoistView(normalizeTodoistAccount(value))
			)
		})
		getFromStorage('todoistAccount')
			.then((value) => {
				if (active && !changed && !client.getQueryData(todoistKeys.account))
					client.setQueryData(
						todoistKeys.account,
						todoistView(normalizeTodoistAccount(value))
					)
			})
			.catch(() => {})
		return () => {
			active = false
			stop()
		}
	}, [client])
	const mutation = useMutation({
		mutationKey: todoistKeys.action,
		mutationFn: requestTodoist,
		retry: false,
		onSuccess: (view) => client.setQueryData(todoistKeys.account, view),
	})
	const perform = async (request: TodoistRequest): Promise<boolean> => {
		const isWrite =
			request.action === 'save' ||
			request.action === 'complete' ||
			request.action === 'delete'
		if (isWrite) {
			const taskId = request.action === 'complete' ? request.id : undefined
			const revision =
				request.action === 'complete'
					? query.data?.snapshot?.items.find((task) => task.id === taskId)?.due
							?.date
					: undefined
			const fingerprint = JSON.stringify({ ...request, revision })
			if (pendingWrite.current?.fingerprint !== fingerprint)
				pendingWrite.current = { fingerprint, id: uuid() }
			request = { ...request, operationId: pendingWrite.current.id }
		}
		try {
			await mutation.mutateAsync(request)
			if (isWrite && pendingWrite.current?.id === request.operationId)
				pendingWrite.current = null
			return true
		} catch {
			return false
		}
	}
	return {
		view: query.data,
		busy: query.isFetching || mutation.isPending,
		ready: query.data !== undefined || query.isError,
		error: mutation.error?.message ?? query.data?.error ?? query.error?.message,
		perform,
	}
}
