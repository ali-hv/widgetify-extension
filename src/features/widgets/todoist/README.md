# Todoist widget

A separate task list at 2x3, 3x3, 4x3 or 4x5 connected to Todoist with a personal API token. It works without a Widgetify login. The owner approved the light-theme proposal in `design/todoist/assets/proposal.png` before implementation.

## UI

`todoist.widget.tsx` owns token setup, the project filter, task rows, sync status, connection actions and the editor. The small sync button stays visible. `components/todoist-task-list.tsx` owns the rows so their markup does not bury the connection and editor state. Clicking a task opens `components/todoist-editor.tsx` inside the widget; the content scrolls at narrow widths. The shared scrollbar-none utility hides the scrollbar while keeping wheel, touchpad and keyboard scrolling available. All four sizes use the same list and editor; wider sizes give rows more room, and taller sizes show more tasks. The editor supports title, description, an existing project and section, labels, four priorities, a Jalali date picker, time, and recurrence. New tasks default to the filtered project, or Inbox when no project filter is selected. Labels accept comma-separated names. Common recurrence choices have Persian labels; custom recurrence accepts Todoist's English date syntax, including its own date and time. In that mode the separate date and time controls are disabled; choosing a preset enables them again.

Saving a title or priority preserves the task's existing schedule. Changing the date or recurrence sends the new schedule. Clearing the date also clears time and recurrence. Delete and disconnect ask for confirmation in place. Completing a recurring task advances it to its next occurrence through Todoist's `item_close` command.

## Data and sync

The service domain is `src/services/todoist/`. The background worker serializes connection, sync and task commands across tabs. It synchronizes on browser startup, every widget mount in a new tab, reconnect after a network interruption and manual sync. An initial full sync loads active tasks, projects, sections and labels; later requests use the saved cursor and merge changes and deletion markers. Commands include unique ids and do not retry automatically. Retrying the same failed edit or completion in the open tab reuses its command ids, so a lost response does not create a second task or skip another recurring occurrence.

`todoistAccount` stores the token, task snapshot, cursor, last successful sync time and last error in local extension storage through the storage gateway. It is shared by tabs and watched for updates. Disconnect clears that account and its cached tasks. The app's existing Widgetify logout also clears local storage. A sync finishing after that clear does not restore the credential. Replacing the token closes open editors across tabs. The token is sent only as a bearer header to Todoist; it never enters query keys, analytics parameters or Widgetify server requests. Queries hold a token-free view.

A failed refresh preserves cached tasks and shows an error. An invalid token opens token setup. A rate-limit response records a cooldown from Retry-After. A timeout aborts the request after 20 seconds. A command failure does not claim success; the next sync reconciles the snapshot. Offline writes are not queued.

## Scope

This is a task widget, not the full Todoist client. It reads existing projects and sections; it does not manage projects, comments, reminders, attachments, collaborators or completed-task history. Todoist still applies the account's plan limits. It does not copy or merge tasks from Widgetify's existing task widget.

## Verification

Pure tests cover incremental merges, completion and deletion markers, full replacements, corrupted storage, privacy of the query view and schedule payloads. Browser interaction and a real-account API round trip need the owner's check.

Visual checks: token setup without a Widgetify login, long task titles, the list and expanded editor at all four sizes and at the narrowest canvas, completion of a recurring task, failed refresh with cached tasks, reconnect and disconnect. Check light with no wallpaper, a dark theme, and glass/icy over a busy wallpaper. The sync tooltip, project and section lists, recurrence and priority lists, and date dropdown are overlaps.
