import { cn } from '@/common/utils/cn'
import type { ReactNode } from 'react'

interface Prop {
	label: string
	selected?: boolean
	onSelect: () => void
	children: ReactNode
}

export function PetOptionTile({ label, selected, onSelect, children }: Prop) {
	return (
		<button
			type="button"
			onClick={onSelect}
			aria-pressed={selected}
			className={cn(
				'relative flex flex-col items-center min-w-0 gap-1 px-1 pt-2 pb-1.5 rounded-xl text-3xs cursor-pointer transition-ui focus-visible:focus-ring',
				selected
					? 'font-bold bg-brand-fill text-brand ring-[1.5px] ring-inset ring-brand-muted'
					: 'font-semibold bg-fill text-fg-muted hover:bg-fill-2'
			)}
		>
			{children}
			<span className="max-w-full truncate">{label}</span>
		</button>
	)
}
