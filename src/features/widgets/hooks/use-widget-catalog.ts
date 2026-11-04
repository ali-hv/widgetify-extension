import { useCallback, useMemo } from 'react'
import { useGetWidgetCatalog } from '@/services/widgets/widget-catalog.hook'

export function useWidgetCatalog(enabled = true) {
	const { data: serverCatalog } = useGetWidgetCatalog(enabled)
	const isWidgetNew = useCallback(
		(widgetKey?: string): boolean => {
			return Boolean(
				serverCatalog?.widgets?.find((item) => item.widgetKey === widgetKey)
					?.isNew
			)
		},
		[serverCatalog]
	)
	const featuredWidgetKeys = useMemo(
		() => serverCatalog?.config?.featuredWidgetKeys ?? [],
		[serverCatalog]
	)
	return { isWidgetNew, featuredWidgetKeys }
}
