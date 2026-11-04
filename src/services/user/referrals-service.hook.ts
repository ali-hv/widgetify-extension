import { getMainClient } from '@/services/api'
import { userKeys } from '@/services/user/user.keys'
import { useQuery } from '@tanstack/react-query'

async function getOrCreateReferralCode(): Promise<{ referralCode: string }> {
	const client = getMainClient()
	const response = await client.get<{ referralCode: string }>('/users/@me/rewards/code')
	return response.data
}

export function useGetOrCreateReferralCode(enabled: boolean) {
	return useQuery({
		queryKey: userKeys.referralCode,
		queryFn: getOrCreateReferralCode,
		staleTime: Infinity,
		enabled,
	})
}
