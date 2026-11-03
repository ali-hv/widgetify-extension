# Combo widget

Currencies and news in one widget at 2x3, 2x4, 2x5 or 2x6, switched by two tabs in the header.

## Files

| Path | Holds |
|---|---|
| `combo-widget.widget.tsx` | Entry. The active tab, the tabs passed as the header title of `WigiArzComboView` or `NewsComboView`, the menu summary and «به‌روز کن». |
| `combo-widget-setting.tsx` | Settings: the currency and the news settings under two tabs. |
| `hooks/use-combo-tab.ts` | Shared tab state for the widget and settings. Watches storage changes and saves the selected tab. |
| `constants.ts` | The tabs and the default one. |
| `utils/normalize-combo-tab.ts` | Reads the stored tab. Tested. |

## Data

`comboTabs` in storage holds the last selected tab and opens it on the next new tab. Choosing news in the widget or settings makes news the startup tab. Both surfaces watch the same key, including changes in another browser tab. They wait for the initial read before drawing a tab; a late read cannot overwrite a newer choice. Failed reads fall back to currencies and show an error; failed saves show an error instead of claiming the choice was saved. The currencies are the shared `currencies` list from `CurrencyProvider`; the news feeds are the news widget's `rssOptions`.

## Menu

The menu calls the widget "ارز و اخبار" (`menuLabel` in the registry; the catalog keeps the long name). Settings comes first with "ارزها و منابع خبری" under it, then «به‌روز کن», which refreshes the tab on screen through the same `useRefreshCurrencies` or `useRefreshRssFeeds` as the standalone widgets. The currency add button is not offered here.

## Settings

Switching a settings tab also updates the widget and its saved startup tab. The currency panel is `WigiArzSetting` with the combo's `instanceId`. It edits the shared `currencies` list, because `ownsCurrencyList` gives a list of its own only to the wigi-arz widget.

Only the active panel is drawn, in an area of fixed height (`h-[30rem]`, about the news panel's own height) that scrolls if a panel ever needs more. Swapping panels used to change the modal's height: the modal re-centred, the tab bar moved up or down, and the tab's pill (a framer-motion `layoutId`) slid vertically on its way across. Keeping both panels mounted in one grid cell with the hidden one `invisible` fixed the height, but on screen both panels showed through each other while switching, so that approach is gone.

## Invariants

The two views never set the menu summary or actions; only `ComboWidget` does. A view that did would overwrite or clear the combo's summary when it re-rendered or when the tab changed.

## Not checked on screen

Every size, restoring news in a new tab, selecting news in settings while the widget is open, and changing tabs across two browser tabs. Both tabs, the header info changing with the tab (the update time of each), the empty currency list, «به‌روز کن» on each tab, the settings tabs switching without the pill jumping.
