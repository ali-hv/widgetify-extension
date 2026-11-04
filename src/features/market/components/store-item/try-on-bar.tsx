import { t } from '@/common/i18n'
import { showToast } from '@/common/toast'
import { Button, Portal } from '@/components/ui'
import { Icon } from '@/icons'
import { useEffect, useRef, useState } from 'react'
import { useApplyItem } from '../../hooks/use-apply-item'
import type { StoreItem } from '../../types'
import { ItemPreview } from '../previews/item-preview'

interface TryOnBarProps {
	item: StoreItem
	onKept: () => void
	onBack: () => void
}

export function TryOnBar({ item, onKept, onBack }: TryOnBarProps) {
	const apply = useApplyItem()
	const [isApplying, setIsApplying] = useState(false)
	const keepRef = useRef<HTMLButtonElement>(null)

	useEffect(() => {
		keepRef.current?.focus()
	}, [])

	useEffect(() => {
		const backOnEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onBack()
		}
		window.addEventListener('keydown', backOnEscape)
		return () => window.removeEventListener('keydown', backOnEscape)
	}, [onBack])

	const keepEscapeFromHost = (event: React.KeyboardEvent) => {
		if (event.key !== 'Escape') return
		event.stopPropagation()
		onBack()
	}

	const keep = async () => {
		setIsApplying(true)
		const applied = await apply(item)
		setIsApplying(false)
		if (!applied) return
		showToast(t('market.tryOn.activatedToast', { p0: item.name }), 'success')
		onKept()
	}

	return (
		<Portal>
			<section
				aria-label={t('market.tryOn.previewAria')}
				onKeyDown={keepEscapeFromHost}
				className="fixed z-nav flex items-center gap-3 p-2 -translate-x-1/2 border shadow-xl bottom-20 left-1/2 rounded-widget bg-glass-surface-2 border-surface-3 max-w-[calc(100vw-2rem)]"
			>
				<span className="relative w-20 overflow-hidden border rounded-xl aspect-video shrink-0 border-line bg-fill">
					<ItemPreview item={item} />
				</span>
				<span className="min-w-0 pe-2">
					<span className="block text-2xs text-fg-muted">
						{t('market.tryOn.tryingHint')}
					</span>
					<span className="block text-sm font-bold truncate text-fg-strong">
						{item.name}
					</span>
				</span>
				<Button
					ref={keepRef}
					color="brand"
					size="sm"
					className="shrink-0"
					onClick={keep}
					loading={isApplying}
					loadingText={t('market.tryOn.loading')}
				>
					{t('market.tryOn.keep')}
				</Button>
				<Button
					size="sm"
					variant="ghost"
					className="shrink-0"
					onClick={onBack}
					icon={<Icon name="undo" size={14} />}
				>
					{t('market.tryOn.revert')}
				</Button>
			</section>
		</Portal>
	)
}
