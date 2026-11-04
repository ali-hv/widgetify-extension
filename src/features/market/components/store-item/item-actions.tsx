import { useState } from 'react'
import { t } from '@/common/i18n'
import { Button, Alert } from '@/components/ui'
import { Icon } from '@/icons'
import { PetTypes } from '@/features/widgets/pet/pet.widget'
import { ITEM_TYPE_META } from '../../constants'
import { useApplyItem } from '../../hooks/use-apply-item'
import { useItemState } from '../../hooks/use-item-state'
import type { StoreItem } from '../../types'

const KNOWN_PETS = new Set<string>(Object.values(PetTypes))

export function ItemActions({
	item,
	onApplied,
}: {
	item: StoreItem
	onApplied?: () => void
}) {
	const apply = useApplyItem()
	const stateOf = useItemState()
	const [isApplying, setIsApplying] = useState(false)
	const use = async () => {
		setIsApplying(true)
		try {
			if (await apply(item)) onApplied?.()
		} finally {
			setIsApplying(false)
		}
	}
	if (item.type === 'PET' && !KNOWN_PETS.has(item.value))
		return <Alert tone="warning">{t('market.purchase.versionMismatchHint')}</Alert>
	if (item.type === 'PET' || item.type === 'PET_BACKGROUND')
		return (
			<p className="p-3 text-xs rounded-xl bg-success-fill text-fg">
				{ITEM_TYPE_META[item.type].whereToChange}
			</p>
		)
	if (stateOf(item) === 'active')
		return (
			<p className="flex items-center gap-2 p-3 text-xs font-medium rounded-xl bg-brand-fill text-brand">
				<Icon name="check" size={16} />
				{t('market.purchase.inUseHint')}
			</p>
		)
	return (
		<Button
			color="brand"
			fullWidth
			onClick={use}
			loading={isApplying}
			loadingText={t('market.purchase.switching')}
			icon={<Icon name="check" size={16} />}
		>
			{t('market.purchase.use')}
		</Button>
	)
}
