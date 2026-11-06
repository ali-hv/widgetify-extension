# Startup video proposal

Status: the owner approved the raster proposal and UI in this conversation. The owner confirmed Chrome-only support with a live folder connection; Firefox stays unchanged. Stay on the current branch as requested for this session.

[Proposal](assets/proposal.png) shows the General settings section and the paused video modal in the light theme. `art/proposal.py` draws the draft at 2x with the repository's Vazirmatn FD fonts. The design canvas is unavailable in this session; this is a raster proposal, not a canvas export. The owner approved proceeding from this raster reference.

## Confirmed requirements

- The owner requires a live connection to the selected folder. Do not import copies of the videos or silently substitute a cached collection.
- The user opts in through General settings. The feature starts off and needs a selected folder containing at least one video the browser can attempt to play.
- The browser startup event triggers the feature once per normal browser profile session. Opening another tab or window, reloading a tab, updating the extension or waking its worker does not trigger it.
- A random video starts paused. The user chooses when to play it. Selecting the previous or next video also leaves it paused.
- Previous and next browse a shuffled sequence; they wrap at the ends. With one video both controls are disabled.
- Closing the modal, pressing Escape or dismissing its backdrop pauses the media and releases its object URL. No video continues playing behind the dashboard.
- Videos, file names, folder names and paths never go to the backend or analytics.

## Approved browser scope

The extension supports Chrome 109 and Firefox 115. Chrome supports the live folder picker, but Firefox does not. The owner chose a Chrome-only feature. Do not show its controls, register its startup action or ask for folder permissions in Firefox. No desktop helper is in scope.

Sources: [MDN browser compatibility data](https://github.com/mdn/browser-compat-data/blob/main/api/Window.json) and [Chrome file access and permission persistence](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access#stored_file_or_directory_handles_and_permissions).

A Chrome folder handle can outlive a tab, but access permission may not survive a restart. Check it before enumerating. If permission is missing, the modal must offer an explicit reconnect action; a background listener cannot silently grant permission. The owner accepted the Chrome-only scope; the missing-permission state remains part of the UI proposal.

## Startup flow

Use the existing browser startup listener independently of Todoist sync. When this feature is enabled, open one Widgetify dashboard tab for the startup modal. This also works when the browser restores unrelated tabs instead of opening the new-tab page. A background-owned startup request prevents restored tabs and newly opened tabs from showing duplicate modals. Do not open a tab when the feature is off.

Chrome and Firefox define startup per browser profile, and private-window startup does not fire this event. Closing every window while the browser keeps running in the background is not a fresh profile startup. See [runtime.onStartup](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onStartup).

## Settings

Use an existing `SectionPanel` in General with `ToggleSwitch`, a folder action built from `Button`, the selected folder name and video count. Off keeps the folder selection. Choosing a replacement validates it before replacing the previous working selection. Cancelling the picker leaves the current selection alone.

The shown copy is the approved direction. All production strings belong in the i18n catalog. Do not put Persian in feature source.

## Modal

Use the existing `Modal` with `bg-glass-modal`, 24px corners and a desktop width of 720px, shrinking to the available width at 500px. The video uses object-contain so portrait and landscape files remain intact. The draft's empty dark viewport represents a paused video without a poster.

Keep the close action in the modal header, outside the video, throughout loading, permission and playback states. The footer has the file name, position in the sequence and Previous/Next buttons. Clicking Play starts the selected video and exposes normal media controls. Do not autoplay after a file change or at the end of a video.

Read the current folder listing when opening the startup modal. Recheck selected files before loading them so deleted files do not continue to appear as usable entries. A reconnect rescans the folder. No background file watching is proposed.

## Required states

| State | Behavior |
|---|---|
| Off or no folder yet | No startup tab or modal; settings offers folder selection |
| Valid folder | Toggle available; folder name and video count visible |
| Picker cancelled | Keep the current folder and enabled state |
| Empty folder or no supported video candidates | Explain the issue; do not enable or replace a working selection |
| Folder permission missing | Keep Close available and offer reconnect; do not fake access or play an old copy |
| Folder moved, removed or emptied | Show a clear local-folder error and offer folder selection or Close |
| Loading media | Keep Close available; show Spinner rather than a frozen frame |
| Unsupported or corrupt file | Explain the playback failure; allow another video or Close |
| One video | Keep playback available; disable Previous and Next |
| Long file or folder name | Truncate the display without growing the dialog |

## Verification

Test startup consumption across multiple tabs, disabled state, first-run activation, random selection and navigation, empty folders, deleted videos, one-video folders and permission recovery in dependency-free modules. Add analytics for setup, enable/disable, opening, playback, navigation, closing and failures, without file names or paths. Local storage access stays behind `src/common/storage.ts`.

Visual checks: a full browser restart versus new tabs and new windows; a browser that restores old tabs; signed-out use; a portrait video; denied folder access; closing during loading and playback; the header and footer at 500px; light without wallpaper, dark, and the modal overlap in glass and icy over a busy wallpaper.

## Implementation notes

The implementation uses the shared Modal's standard accessible close icon in place of the draft's text button. The control stays outside the video and works throughout loading and permission recovery. A matching local `.vtt` file supplies captions through the native video controls; no subtitle file leaves the device.
