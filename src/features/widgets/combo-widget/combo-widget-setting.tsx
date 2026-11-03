import { t } from '@/common/i18n'
import { Spinner, TabNavigation } from '@/components/ui'
import { Icon } from '@/icons'
import { WidgetSettingWrapper } from '@/features/widgets/components/widget-settings-wrapper'
import { RssFeedSetting } from '../news/news-setting'
import { WigiArzSetting } from '../wigi-arz/wigi-arz-setting'

import type { ComboTabType } from './types'
import { useComboTab } from './hooks/use-combo-tab'

interface ComboSettingProps {
	instanceId?: string
	size?: { w: number; h: number }
}

export function ComboSetting({ instanceId, size }: ComboSettingProps) {
	const { activeTab, selectTab } = useComboTab('settings')
	if (activeTab === null)
		return (
			<WidgetSettingWrapper>
				<div className="flex items-center justify-center h-[30rem]">
					<Spinner size="sm" />
				</div>
			</WidgetSettingWrapper>
		)

	return (
		<WidgetSettingWrapper>
			<div className="flex flex-col gap-4">
				<TabNavigation<ComboTabType>
					tabMode="simple"
					activeTab={activeTab}
					onTabClick={selectTab}
					tabs={[
						{
							id: 'currency',
							label: t('widgets.combo.settings.currency'),
							icon: <Icon name="currency" size={14} />,
						},
						{
							id: 'news',
							label: t('widgets.combo.settings.news'),
							icon: <Icon name="outlineNewspaper" size={14} />,
						},
					]}
					size="md"
					className="w-full"
				/>

				<div className="h-[30rem] overflow-y-auto">
					{activeTab === 'currency' ? (
						<WigiArzSetting instanceId={instanceId} size={size} />
					) : (
						<RssFeedSetting />
					)}
				</div>
			</div>
		</WidgetSettingWrapper>
	)
}
