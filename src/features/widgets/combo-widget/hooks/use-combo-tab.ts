import { useEffect, useRef, useState } from 'react'
import Analytics from '@/analytics'
import { t } from '@/common/i18n'
import { getFromStorage, setToStorage, watchStorage } from '@/common/storage'
import { showToast } from '@/common/toast'
import { DEFAULT_COMBO_TAB } from '../constants'
import type { ComboTabType } from '../types'
import { normalizeComboTab } from '../utils/normalize-combo-tab'

export function useComboTab(source: 'widget' | 'settings') {
	const [activeTab, setActiveTab] = useState<ComboTabType | null>(null)
	const revision = useRef(0)
	useEffect(() => {
		let mounted = true
		const initialRevision = revision.current
		const stop = watchStorage('comboTabs', (value) => {
			revision.current += 1
			setActiveTab(normalizeComboTab(value))
		})
		getFromStorage('comboTabs')
			.then((value) => {
				if (mounted && revision.current === initialRevision)
					setActiveTab(normalizeComboTab(value))
			})
			.catch(() => {
				if (!mounted || revision.current !== initialRevision) return
				setActiveTab(DEFAULT_COMBO_TAB)
				Analytics.event('combo_tab_load_failed')
				showToast(t('widgets.combo.tabLoadFailed'), 'error')
			})
		return () => {
			mounted = false
			stop()
		}
	}, [])
	const selectTab = (tab: ComboTabType) => {
		if (tab === activeTab) return
		revision.current += 1
		setActiveTab(tab)
		Analytics.event('combo_tab_changed', { tab, source })
		setToStorage('comboTabs', tab).catch(() => {
			Analytics.event('combo_tab_save_failed')
			showToast(t('widgets.combo.tabSaveFailed'), 'error')
		})
	}
	return { activeTab, selectTab }
}
