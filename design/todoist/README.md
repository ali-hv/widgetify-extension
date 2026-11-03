# Todoist widget design

Status: the owner approved the proposal in this conversation before UI implementation.

[Proposal](assets/proposal.png) shows the first-use token form, connected task list, task editor and the empty, offline, invalid-token and deletion states. It uses light-theme surface, ink and brand values, Vazirmatn FD, 24px widget corners and the existing form controls. The sync action stays visible.

The editor expands inside the widget and scrolls to its date, recurrence, priority and labels fields. The larger editor view in the proposal shows those fields without the narrow widget frame. Implementation uses the shared Button, TextInput, TextArea, SelectBox, Dropdown, DatePicker, Tooltip and Alert components. No new primitive is needed.

The proposal is a raster reference because the design canvas was unavailable during this session. There is no canvas export; do not treat it as one. The owner approved proceeding from this draft.

Overlap checks: the sync tooltip, project and section selectors, recurrence and priority selectors, and date dropdown. Check them in dark, glass and icy themes, with long names and a busy wallpaper. Also check the widget at the narrowest canvas and light theme without wallpaper.

Copy is the approved direction, with additional error and connection text in the Persian catalog. Custom repeat expressions use Todoist's English date syntax. Date selection uses the extension's Jalali picker.

For custom recurrence the expression supplies its date and time, so the separate date and time controls are disabled. Preset recurrences keep those controls enabled. This handles advanced Todoist expressions without appending a second time or start date.

The empty list and a failed load with no visible tasks use the shared WidgetEmpty and WidgetError components, keeping their retry and task artwork consistent with the existing task widget.

The owner requested 3x3, 4x3 and 4x5 in addition to 2x3 after checking the built widget. These sizes keep the approved list and editor layout and expand its available width and height.

## Task views and calendar

The owner accepted the task-view proposal with one correction: center each filter label within its selected pill. [The corrected proposal](assets/task-views.png) centers the text using its measured bounds. `art/task-views.py` draws this reference; the implementation uses TabNavigation, whose buttons center their labels with flex.

Today is the default and shows only tasks due today. Tomorrow shows only tasks due tomorrow. Upcoming includes all active tasks, including overdue and undated ones. The existing project filter applies to tasks in each view. New tasks inherit Today or Tomorrow while adding from that view.

Google Calendar events form a separate section below tasks and open in Google Calendar. The integration reuses Widgetify's Google connection and requires its own Widgetify sign-in and Google authorization; the Todoist token cannot read native calendar events. Upcoming calendar events cover the next 30 days, while Upcoming tasks have no date limit. Signed-out and disconnected states offer the existing connection flow. Errors leave tasks visible.

Visual checks: centered text on each selected tab at every widget size, long project names, empty Today/Tomorrow, midnight changes, all-day and overnight calendar events, signed-out Google connection, expired Google authorization, and glass/icy dropdowns.
