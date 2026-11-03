# Architecture

[Documentation index](../README.md#project-documentation)

## Runtime and routing

The project uses Expo SDK 58, React Native 0.88, React 19.3, and Expo Router.
Expo-compatible native module versions take precedence over independent npm latest tags,
so JavaScript and native binaries remain compatible. npm records exact resolutions in the lockfile.

`app/_layout.tsx` owns the root Stack, preference-selected light/dark Paper theme,
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
| `/settings` | SettingsScreen | Appearance preference and future notification placeholder |
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
Paper renders controls and typography; Expo vector icons supply Paper icons, including the train and star tab icons.

`AppearanceProvider` owns the session appearance and resolves `system`, `light`, or `dark`
against the device color scheme. AsyncStorage key `appearance_preference` stores that string
independently of favorites. Missing/invalid values use `system`; read failures use system
with feedback, and save failures keep the current session choice with retry guidance.
Controls wait for the initial read and serialize changes while saving. Theme changes update
the existing navigation tree rather than remounting it. Settings is pushed from the Favorites
header, preserving the expanded station underneath. Its notification switch is disabled/off;
there is no notification storage, permission request, or notification module.

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
