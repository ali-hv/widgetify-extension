# Pro tab archive

The owner retired subscriptions and payments. These boards record the former Pro tab; the extension no longer implements it.

## Boards

| File | Shows |
|---|---|
| `boards/ProBlend.dc.html` | The tab at rest: hero, four benefit cards, four plans, the payment bar |
| `boards/ProBlendDetail.dc.html` | The tab with the details window open on the widgets page |
| `boards/ProPrototype.dc.html` | The working prototype: cards open the window on their page, arrows and dots move between pages, plans can be selected |

## The tab

1. **Hero.** `assets/hero-pro.webp` (option H4, approved): a brand-blue gradient with a large faint copy of the Pro icon bleeding off the edge and the icon on top. Over it sit the Pro badge, a headline and one line of text, with no dark overlay. The card radius is 16px, like any card.
2. **Benefit cards.** Four cards that overlap the bottom of the hero by 64px, all the same height. Each card has a small picture, a title, two reserved lines of text and a «جزئیات» link pinned to the bottom. A click opens the details window on that card's page.
3. **Plans.** Every plan in one row: the free trial first, then monthly, three months and a year. The selected plan has a brand ring, and the plan the server marks gets the «محبوب» badge. Each paid plan shows its monthly cost or its saving against monthly.
4. **Payment bar.** The amount, the renewal line and «فعال‌سازی پرو». The amount follows the selected plan.

The free trial has no separate link. It is one of the plans.

## The details window

A one-feature-per-page window, like Telegram Premium:

- a 520px window
- a 320px picture on `assets/stage.webp`
- one title and one line
- dots with previous and next buttons
- a full-width «فعال‌سازی پرو» button

| Page | Picture |
|---|---|
| Layout | three clocks for three cities, two weather widgets |
| Widgets | example widgets in several sizes and styles, without naming them |
| Wallpaper | a fan of three new tabs on `assets/wallpaper.webp` with only a search box, and a card that says «عکس، گیف و ویدیو تا ۴۰ مگابایت» |
| Gallery | one «رایگان با پرو» badge over three tiles: avatar, bookmark icon, photo widget picture |
| Small extras | a preset layout, a mini app open in its own window |

Owner decisions this design must keep:

- Every widget in a picture is white, never glass.
- Pictures carry the message, and text stays short.
- No feature list names the Pro widgets, because that list changes.
- The Pro hero art appears only in the hero, never as a wallpaper.

## Current product

All former Pro features are available through their existing controls. The subscription tab, plans, payment bar and upgrade prompts have been removed. These archived boards do not specify the current UI.

## Art

`art/` holds the PhotoCraft scripts that draw `stage.webp`, `hero-pro.webp` and `wallpaper.webp`.

1. Set `PHOTOCRAFT_RECIPE_RUNNER` to the recipe runner script.
2. Run a script, for example `python stage.py`. It writes a PNG next to itself.
3. Convert the PNG to WebP into `assets/`.

`hero_pro.py` also needs Pillow. It upscales `assets/pro-icon.png` before placing it.
