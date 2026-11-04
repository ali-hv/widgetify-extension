import { type MessageKey, t } from '@/common/i18n'
import { TabNavigation } from '@/components/ui'
import type { FetchedCurrency } from '@/services/currency/get-currency-by-code.hook'
import {
	CURRENCY_HISTORY_RANGES,
	type CurrencyHistoryRange,
	useGetCurrencyHistory,
} from '@/services/currency/get-currency-history.hook'
import { useMemo } from 'react'
import { buildPriceChart } from '../utils/build-price-chart'
import { getPrice } from '../utils/get-price'
import { PriceChart } from './price-chart'

interface CurrencyHistoryProps {
	code: string
	currency: FetchedCurrency
	enabled: boolean
	range: CurrencyHistoryRange
}

export const DEFAULT_HISTORY_RANGE: CurrencyHistoryRange = '7d'

const RANGE_LABEL_KEYS: Record<CurrencyHistoryRange, MessageKey> = {
	'24h': 'widgets.wigiArz.chart.range.24h',
	'7d': 'widgets.wigiArz.chart.range.7d',
	'30d': 'widgets.wigiArz.chart.range.30d',
}

interface HistoryRangeTabsProps {
	range: CurrencyHistoryRange
	onChange: (range: CurrencyHistoryRange) => void
}

export function HistoryRangeTabs({ range, onChange }: HistoryRangeTabsProps) {
	return (
		<TabNavigation
			tabMode="simple"
			size="sm"
			activeTab={range}
			onTabClick={onChange}
			tabs={CURRENCY_HISTORY_RANGES.map((id) => ({
				id,
				label: t(RANGE_LABEL_KEYS[id]),
			}))}
		/>
	)
}

export function CurrencyHistory({
	code,
	currency,
	enabled,
	range,
}: CurrencyHistoryProps) {
	const { data, isPending, isError, refetch } = useGetCurrencyHistory(
		code,
		range,
		enabled
	)
	const isDollar = getPrice(code, currency).isDollar
	const chart = useMemo(
		() => (data ? buildPriceChart(data, isDollar) : null),
		[data, isDollar]
	)

	return (
		<div className="flex items-center justify-center w-full min-h-38">
			{isPending && enabled ? (
				<span
					aria-hidden="true"
					className="block h-33 mx-5 grow rounded-2xl skeleton"
				/>
			) : isError ? (
				<div className="flex flex-col items-center gap-2 text-xs text-fg-muted">
					<p>{t('widgets.wigiArz.chart.loadError')}</p>
					<button
						type="button"
						onClick={() => refetch()}
						className="cursor-pointer text-brand hover:text-brand-hover focus-visible:focus-ring"
					>
						{t('widgets.wigiArz.retry')}
					</button>
				</div>
			) : chart ? (
				<div className="flex-1 min-w-0 -mx-0.5 md:-mx-1">
					<PriceChart
						key={range}
						chart={chart}
						name={currency.name.fa}
						showTime={range === '24h'}
					/>
				</div>
			) : (
				<p className="px-5 text-xs text-center text-fg-faint">
					{t('widgets.wigiArz.chart.empty')}
				</p>
			)}
		</div>
	)
}
