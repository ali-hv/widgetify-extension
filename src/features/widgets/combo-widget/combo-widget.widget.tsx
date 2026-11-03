import { t } from '@/common/i18n'
import { PopoverMenuItem, Spinner } from '@/components/ui'
import { NewsComboView } from '@/features/widgets/news/news.widget'
import { WigiArzComboView } from '@/features/widgets/wigi-arz/wigi-arz.widget'
import { Icon } from '@/icons'
import { useRefreshCurrencies } from '@/services/currency/get-currency-by-code.hook'
import { useRefreshRssFeeds } from '@/services/news/get-news.hook'
import { WidgetContainer } from '../components/widget-container'
import { WidgetHeader, WidgetHeaderTabs } from '../components/widget-header'
import { useWidgetMenuActions, useWidgetSettingsSummary } from '../widget-menu.context'
import { COMBO_TAB_LIST } from './constants'
import { useComboTab } from './hooks/use-combo-tab'

export function ComboWidget() {
	const { activeTab, selectTab } = useComboTab('widget')
	const { refresh: refreshCurrencies } = useRefreshCurrencies()
	const { refresh: refreshNews } = useRefreshRssFeeds()

	useWidgetSettingsSummary(t('widgets.combo.settingsSummary'))
	useWidgetMenuActions(
		<PopoverMenuItem
			icon={<Icon name="refresh" size={14} />}
			label={t('widgets.combo.refresh')}
			onClick={activeTab === 'currency' ? refreshCurrencies : refreshNews}
		/>
	)

	if (activeTab === null)
		return (
			<WidgetContainer contentClassName="p-3 gap-2">
				<WidgetHeader title={t('widgets.combo.menuLabel')} />
				<div className="flex items-center justify-center flex-1">
					<Spinner size="sm" />
				</div>
			</WidgetContainer>
		)

	const tabs = (
		<WidgetHeaderTabs
			label={t('widgets.combo.menuLabel')}
			tabs={COMBO_TAB_LIST}
			activeTab={activeTab}
			onChange={selectTab}
		/>
	)

	return (
		<WidgetContainer contentClassName="p-3 gap-2">
			{activeTab === 'currency' ? (
				<WigiArzComboView tabs={tabs} />
			) : (
				<NewsComboView tabs={tabs} />
			)}
		</WidgetContainer>
	)
}
