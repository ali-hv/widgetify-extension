# features

One folder per product feature. Widgets are features too and live in `widgets/` (see `widgets/README.md`).

## What is here

`explorer`, `friends`, `market`, `mini-apps`, `navbar`, `release-notes`, `setting`, `startup-video`, `widgets`. `src/features/` holds only feature folders, nothing loose.

## Rules

- The shape of a feature folder and its names are in `src/README.md`. The architecture test names the rule a misplaced file breaks.
- **A feature reaches another only through its public files:** the entry (and what it re-exports), the settings panel and `*.context.tsx`. Example: `friends.tsx` exports `FriendsDirectView` for the navbar.
- **Settings panels** are `<feature>-setting.tsx` at the feature root and are public.
- **Contexts** are `<name>.context.tsx` at the feature root and are public.
- Server calls go through `src/services`. A feature never calls the API client.
- A feature's own storage keys and events are declared in its `types.ts` (see `src/common/README.md`).
- UI is built from `@/components/ui`. Text is Persian, right to left, and friendly (see `src/components/ui/README.md`). A feature's copy goes in its area file under `src/common/i18n/fa/`, not in the feature folder.
- Do not animate a container-query sized element, and draw loading, error and empty states distinctly (see `widgets/README.md`; the same defects appear outside widgets).

## Adding a feature

1. Make `<feature>/` with `<feature>.tsx` as the entry.
2. Add role folders only when you have a file of that role.
3. Count importers before you put anything in a shared layer.
4. Run `npm test`. The architecture test says what is wrong, in words.

## Mistakes that happened

- `google-calendar` imported fifteen files from `calendar/utils`. The shared code moved to the common parent.
- A shared file sat in a global folder with one user, which hid who owned it.
- A deep import into another feature broke when that feature reorganised.

## Tests

Feature logic is tested where it is pure, in `<feature>/__tests__/`. Rules about where files go are in `architecture.test.ts`.

## Friends: the profile card

Any user shown in the friends sheet (a friend or a request in the list, a friend's status bubble, a person under the reactions) opens a profile card, and so does a row of the pomodoro leaderboard, through `ProfileCardTrigger`, which `friends.tsx` re-exports. It is a `PopoverMenu`, so it rises above the sheet and above a modal. The data is `GET /friends/users/{username}/card` (`useGetFriendCard`, keyed under `['friends']`, so every friend mutation refreshes an open card); the contract and the chosen design are in the workspace's `docs/friends/`. A stranger sees only what introduces the person; a friend, and you on your own card, also see the status, wallpaper banner, friendship length, city, Jalali birthday, member since and collection. Removing a friend is confirmed inside the card, because a modal would count as a click outside the popover. Labels are in `friends/utils/profile-card.ts` (tested).

The sheet also shows «شاید بشناسیشون» between the statuses and the list (`friends/components/friend-suggestions.tsx`, `GET /friends/suggestions`): each card opens the profile card, «افزودن» sends a request and drops the person (the server leaves out anyone with a pair row), and «نه» is kept on the device under the storage key `friendSuggestionsDismissed`. The reason line comes from `friends/utils/suggestion-reason.ts` (tested): mutual friends, then a shared interest, then the city. A user with no friends yet sees an invitation to send their first request. The settings friends tab starts with «حالت مخفی» (`GET` and `PUT /friends/privacy`): a hidden user is never suggested, and a request by username still works.

Statuses: your own status says who reacted («سارا و ۲ نفر دیگه واکنش دادن»; names from the reactions route, only when there are reactions), and a friend's status you have not seen carries a dot for that open (seen ids are kept on the device under `seenFriendActivities`, the newest 200). Both rules are in `friends/utils/activity-seen.ts` (tested). On a friend's birthday (`isBirthdayToday` in `GET /friends`) their row shows 🎂 and «🎂 تبریک», and so does their card; it calls `POST /friends/users/{username}/congratulate`, once a day per friend. Statuses expire on their own (1, 4 or 24 hours, kept by the content service).

## Notifications that open a mini-app

A notification (the navbar card or the home dialog) can open one mini-app. In the panel the item is `type` action, `goTo` `openMiniApp` and `target` the mini-app's `appId`. The click calls `callEvent('openMiniApp', appId)`; `pages/root.tsx` moves to the mini-apps page and hands the id to `MiniAppsLayout` (`focusAppId`), which runs the app in the page, brings its window forward when it already runs in one, and scrolls its card into view. An id that is not shaped like an app id (`mini-apps/utils/focus-app.ts`, letters, digits, `_`, `.` and `-`, at most 100) is ignored, and an id with no app shows the runner's own error. An extension from before this event shows a card that does nothing, so publish such a notification after the release has rolled out.

## Settings: storage

`setting/general/components/storage-usage.tsx` is a `SectionPanel` like the other General sections, kept small: the total, a bar split by what the space holds, how much can be freed, and a soft danger button that clears the cache after a confirmation. Each colour in the bar is a button: clicking it opens a `ClickableTooltip` with that part's name, size and reason, the way a phone's storage screen does. A segment is at least `min-w-1.5` wide so a small one can still be clicked. It replaced a panel that listed every row at once and took too much of the tab. The segments use status colours and ink fills only (app files `fill-3`, the browser's extra `danger-fill-2`, your data `secondary`), never a text token as a background.

| Row | Comes from | Cleared by the button |
|---|---|---|
| Wallpaper, explorer images, online data, fonts and icons | Each `wgf-` cache, grouped by its base name | Yes |
| Leftovers from older versions | Any cache name the app no longer uses, such as `images-cache-v1` | Yes |
| Counted by the browser | `navigator.storage.estimate()` minus the measured cache files. Mostly the padding Chrome adds for opaque responses | Yes, it goes with the caches |
| App files | The Workbox precache | No |
| Your data | The size of `browser.storage.local` as JSON: settings, widgets, notes | No |

- `setting/general/utils/storage-usage.ts` is pure: it groups cache names, adds the rows up, sorts them and picks a unit. `setting/general/__tests__/storage-usage.test.ts` covers it.
- `setting/general/hooks/use-storage-usage.ts` measures on mount, deletes the clearable caches and measures again; the toast reports the difference.
- A cache file is counted by its `content-length`, or by reading its body when the header is missing. An opaque response reads as 0 bytes, which is why the browser row exists.
- On Firefox the browser row is skipped: the background there has no service worker, and `browser.storage.local` lives inside the same origin quota, so the estimate would count your data twice.
- The cache names come from `src/common/types/sw-events.interface.ts`, shared with `background/cache-names.ts`. A new cache needs a category here, or it shows as leftovers.

## Free features and catalogs

The market now offers direct selection and previews. Themes, fonts and titles from the catalog join bundled and inventory options without a claim step. Gallery photos, bookmark icons and avatars select directly. Settings has no subscription or coin-rewards tab, and profiles show no balance or Pro status. Existing sign-in and consent requirements remain for account-backed integrations.

## Startup video

`startup-video/` is Chrome-only. Its entry mounts the paused startup modal in the page shell; `startup-video-setting.tsx` is the public General settings section. The user selects a live directory, then enables the feature. Selection validates a readable video candidate before saving, and disabling retains the folder. The folder handle and preference stay on the device across account sign-out.

`startup-video/hooks/use-video-folder.ts` checks read permission, scans direct child files when the modal opens and before navigation, and merges added or removed files into the current shuffled order. Previous and next wrap, remain paused, and are disabled for one file. The supported containers depend on the browser's `canPlayType`; a corrupt or unsupported codec shows a playback error. No video is copied or uploaded. A matching `.vtt` sidecar can supply native captions.

`startup-video/components/video-playback.tsx` creates local object URLs, starts only after Play and pauses and releases media and caption URLs on close or navigation. The modal stays mounted; its Close button, Escape and backdrop dismissal work during loading and permission errors. Missing permission offers reconnect; an empty or missing folder offers another selection. The shared Modal supplies its standard accessible close icon.

The background owns a one-use startup request. The startup dashboard consumes it before opening the modal and removes the token from its URL. Ordinary tabs, reloads, additional windows and worker wakes do not create requests. Reopening after all normal windows close creates one request even when Chrome keeps running in the background. Private profile startup is outside this feature's scope. Firefox builds omit the setting, picker and startup listener.

Tests cover startup consumption, missed or delayed close events, repeated launches with restored windows, worker restarts, stored settings validation, live file filtering, deleted files, shuffled ordering, navigation and empty folders. Check actual startup, permissions, local playback and the modal in light, dark, glass and icy by eye, including 500px and signed out. Analytics records feature actions and failures without file or directory names or paths.
