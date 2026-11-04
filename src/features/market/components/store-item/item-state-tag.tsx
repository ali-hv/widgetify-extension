import { t } from '@/common/i18n'
import { cn } from '@/common/utils/cn'
import { Icon } from '@/icons'
import type { ItemState } from '../../types'

const TAG = 'inline-flex items-center gap-1 h-6 px-2 rounded-lg text-2xs font-semibold'

export function ItemStateTag({ state }: { state: ItemState }) {
	if (state === 'active') {
		return (
			<span className={cn(TAG, 'bg-brand-fill text-brand')}>
				<Icon name="check" size={12} />
				{t('market.itemState.inUse')}
			</span>
		)
	}

	return (
		<span className={cn(TAG, 'bg-fill-2 text-fg')}>{t('market.itemState.free')}</span>
	)
}
