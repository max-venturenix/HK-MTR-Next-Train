# Architecture

[Documentation index](../README.md#project-documentation)

## Runtime and routing

The project uses Expo SDK 58, React Native 0.88, React 19.3, and Expo Router.
Expo-compatible native module versions take precedence over independent npm latest tags,
so JavaScript and native binaries remain compatible. npm records exact resolutions in the lockfile.

`app/_layout.tsx` owns the root Stack, preference-selected Paper theme,
icon provider and status bar. Shared tokens live in `ui/theme.ts`. Native appearance
uses SDK-matched `expo-system-ui`; app configuration permits landscape. Rebuild native
clients after these configuration changes.

The tabs use Expo Router JavaScript tabs and Paper's labeled `BottomNavigation.Bar`.
Favorites open first. Native controls, platform back gestures and safe areas remain intact.
Web uses a centered content column of at most 720 units.

| URL | Screen | Purpose |
| --- | --- | --- |
| `/` | FrequentStationScreen | Saved stations, first saved station initially expanded |
| `/search` | SelectStationScreen | Select line/station and view arrivals |
| `/favorites` | Redirect | Compatibility redirect to `/` |
| `/settings` | SettingsScreen | Appearance preference, Android facility alerts, version and credit |
| `/dev` | DeveloperScreen | English developer tools, Android notification tests and expandable six-hour background activity |
| `/station/[stationCode]` | NextTrainByStationScreen | Arrivals and favorite toggle |
| `/facilities` | FacilityOutageScreen | Facility notices or official-site web fallback |
| `/station/[stationCode]/facilities` | FacilityOutageScreen | Station-scoped facility notices |

Route files are thin wrappers around `ui/screen/`. Shared UI is in `ui/component/`.
Details sit above tabs, so back restores the originating tab. The root anchor supplies
home beneath directly opened detail routes. The URL scheme is `mtr-next-train`.
Invalid station parameters show a Chinese error and link to search before any data access.
Station detail instances are keyed by station code; request generations discard stale results.

## Data flow

1. `data/json/` contains line and station metadata, exposed through typed modules in `data/`.
2. Search supplies a station code to the detail route. Expanded favorites provide a visible details button for the same route.
3. `api/MTRApi.ts` requests the public endpoint
   `https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php` with `line` and `sta` parameters.
4. `useStationArrivals` requests serving lines independently, keyed by line/station. It polls every
   10 seconds only while the route is focused and AppState is active. Favorites request only the
   expanded station; focus and manual refresh reload the saved list. Cancellation and generation
   guards prevent obsolete results, and overlapping refreshes share the active request.
5. Requests use Traditional Chinese, a 10-second timeout, and HTTP 429 cooldowns (`Retry-After`,
   default 30 seconds). Failed lines retain labeled stale results; successful alerts/empty schedules
   replace old arrivals. Both surfaces provide refresh buttons and pull-to-refresh. Countdown
   parsing uses explicit Hong Kong UTC+08:00; East Rail arrival/departure and Racecourse routing
   appear in rows. The metadata includes all ten supported lines and Racecourse.
6. Favorites reload on focus, including when returning from a detail screen.

## Persistence and boundaries

`api/FrequentStationsApi.ts` uses AsyncStorage key `favorite_station_list`, storing a JSON
array of station-code strings. Keep that key and representation compatible across upgrades.
Paper renders controls and typography. Expo vector icons supply Paper icons and the standard tab icons.

`AppearanceProvider` owns the session appearance. `system` follows the device; `light`, `dark`,
and `little-twin-stars` are fixed overrides. The Little Twin Stars option uses a light Paper palette
and the corresponding dark status-bar icons. `LittleTwinStarsArtwork` selects a bundled 3:1 JPEG
cover for each tab through its `cover` prop. Each cover fills the content width at a 3:1 aspect ratio. Settings
and station-specific screens use the official portrait PNG. See the [asset notes](../assets/themes/little-twin-stars/README.md)
for image sources. The shared SVG background stays behind content, with an 88-unit railway strip
reserved below the scroller. `LittleTwinStarsTabIcon` draws 24-unit SVGs combining Kiki or Lala
with the star, magnifier and wheelchair symbols. Paper supplies the tab labels and selected
indicators. AsyncStorage key `appearance_preference` stores the selected string
independently of favorites. Missing/invalid values use `system`; read failures use system
with feedback, and save failures keep the current session choice with retry guidance.
Controls wait for the initial read and serialize changes while saving. Theme changes update
the existing navigation tree rather than remounting it. Settings is pushed from the Favorites
header, preserving the expanded station underneath. Android notification settings are described below.

This is an Expo managed project: native projects are generated when needed, not maintained
in this repository. `eas.json` holds existing build profiles; `app.json` holds app identity and
EAS linkage. No backend or authentication service is required.

## Search selection sheets

`ui/component/SelectionSheet.tsx` supplies the themed field and React Native Modal sheet.
Line/station wrappers supply ordered metadata options and selection callbacks. Station
filtering is local to the selected line and matches Chinese/English names or station codes.
Changing lines selects its first station; reselecting the current line preserves the station.
Search resets on open, the selected row is revealed, and route blur dismisses the sheet.
The screen keeps handled keyboard taps so choosing a result works with the IME open.
No API, route, favorite storage, or dependency changes are required.

## Facility outage notices

`/facilities` is the third bottom tab. Station details link to
`/station/[stationCode]/facilities`, reusing the outage screen with a validated station scope.
Native apps request `https://tnews.mtr.com.hk/facility/outage.xml` through
`api/FacilityOutageApi.ts`. The XML parser validates records and decodes character references
inside CDATA. Notices are grouped by station; the default accessibility filter includes
MTR's AJ/VJ/HJ/MJ families. All facilities also includes escalators and unknown types.

The outage hook refreshes on focus/foreground return, every 60 seconds while focused and
active, and through manual refresh. Requests have a 10-second timeout, overlap protection,
cancellation/generation guards and HTTP 429 cooldowns. Failures retain explicitly stale
results. Dates are interpreted as Hong Kong time; restoration wording comes from MTR's
message. Empty feeds are not evidence that all facilities are operating.

The source does not currently permit browser cross-origin requests. Web therefore shows
an explanation and an official MTR facility-information link, without requesting the XML.
No backend, persistent outage cache or change to favorites storage is introduced.

## Android facility alerts

`index.js` imports the platform notification service before Expo Router. Android defines
one headless TaskManager task using Expo BackgroundTask / WorkManager, with a 15-minute
minimum interval. Android restores scheduled work after reboot, subject to battery and
network restrictions. Force-stop suspends work until the app is opened again.
`plugins/withWorkManagerKeepRules.js` preserves the generated Room database constructor
used reflectively by WorkManager. The rule is applied during Android prebuild so optimized
release builds can initialize background scheduling at startup.

Settings defaults alerts off and scope to favorites. The independent AsyncStorage key
`facility_alert_state_v1` stores enabled/scope preferences and per-station observed facility
keys. Existing `favorite_station_list` remains a JSON string array. Successful bookmark
writes invalidate removed stations' baselines. Newly monitored stations silently establish
baselines on their first successful check. Re-enabling alerts starts fresh baselines.
The Android service serializes preference changes, bookmark invalidation and checks.
Foreground startup/resume also reconciles registration and checks enabled alerts.

The existing XML parser and AJ/VJ/HJ/MJ classifier supply observations. Station/facility ID
identifies an ongoing outage, falling back to notice ID. Failed requests and malformed XML
preserve observations. A successful feed absence clears the observed outage so recurrence
can alert. Each station's new facilities share one Traditional Chinese local notification.
A high-importance channel requests sound and a banner, subject to system settings.
The notifications config plugin bundles `assets/notification-icon.png` as the small icon
for facility alerts and test messages. Android tints the train glyph in the status bar and
on the left of each notification. Rebuild the native app to apply it.
Tapping an outage alert or either developer-screen test notification opens the main 設施 tab (`/facilities`).
No push token or backend is required. Other platforms show Android availability information.

Before notification submission, a station snapshot is persisted to avoid repeating an alert
if Android terminates the process after submission. A rejected submission restores that
station's previous snapshot for retry, while other stations retain their progress. A process
termination between persistence and submission can lose that alert. Storage and Android's
notification service cannot commit atomically. Reinstalling or clearing app data resets history.

## Developer diagnostics

A normal Favorites gear tap opens Settings; long press or its named accessibility action pushes
`/dev`. Both preserve the Favorites screen underneath. Settings reads the version from
`Constants.expoConfig.version` and shows `Development by Max Wong`.

Android's TaskManager callback alone writes `facility_activity_log_v1`, separate from alert
preferences and baselines. Each run persists start, request and parsed-feed stages, followed by
success, skip or failure. Entries retain the monitored scope, API-call indicator, station count,
accessible outage details and successfully submitted notification count. API request failures,
invalid feeds and post-feed processing failures have distinct reasons. An unfinished entry shows
its last recorded stage. Diagnostic write failures do not change monitor outcomes. Foreground
startup/resume checks, setting changes and notification tests do not create background records.

History expires six hours after each run starts and is pruned on reads/writes. The virtualized
viewer orders runs newest first, renders Hong Kong timestamps, and rereads local history on focus,
foreground return or refresh. It never requests the facility feed. No entries can be recovered
from before installation of this logging feature. Notification tests retain their existing
Android behavior, while iOS/web explain Android availability.

The Developer Tools screen uses English labels and diagnostics. Background runs initially show
a Hong Kong time and short outcome. Tapping a row expands its saved details, with one row
open at a time. Local refresh preserves the expanded run until it expires. New records retain
MTR's English facility text alongside the existing fields. Older records fall back to labeled
source text, and known persisted Chinese diagnostic reasons are displayed in English.
