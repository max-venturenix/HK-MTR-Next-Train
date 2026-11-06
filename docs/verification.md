# Verification

[Documentation index](../README.md#project-documentation)

## Automated commands

Run from the repository root after `npm ci`:

| Command | Expected result |
| --- | --- |
| `npm run typecheck` | Strict TypeScript check, no errors |
| `npm run check:deps` | Dependencies match the installed Expo SDK |
| `npm run doctor` | Expo configuration and package checks pass |
| `npm run check` | The three preceding checks pass sequentially |
| `npm run export:all` | Production bundles for Android, iOS, and web in ignored `dist/` |

Doctor needs network access for current package metadata. Exporting bundles does not compile
native binaries or validate device interactions. No automated test framework or CI is configured.

## Manual acceptance checklist

Run on Android, iOS, and web, recording each platform actually tested:

- Open favorites: Traditional Chinese controls and labeled Material star/train tabs. Check system light and dark appearances.
- From Favorites, open 設定 using the gear beside refresh. Select 跟隨系統, 淺色, 深色, and Little Twin Stars（雙子星）;
  verify screens, navigation and status bar update immediately. Restart/reload to check persistence.
  Change device appearance: only 跟隨系統 should respond. Return with Back and verify the same
  expanded (or collapsed) favorite remains. Check header fit at narrow widths and large text sizes.
- In Little Twin Stars, check the Settings thumbnail and larger preview, full artwork on Favorites/Search,
  and compact artwork on station details and facilities. Test narrow screens, landscape, large text and
  offline artwork. Check that decorations do not receive focus or obscure controls, line markers, arrivals,
  or service messages. Changing appearance must preserve the search selection and expanded favorite;
  leaving this theme removes the decorated panels. Developer Tools uses the palette without a panel.
- In Settings, verify 允許通知 is off/disabled, explains 通知功能尚未開放, and never requests
  permission. Check radio labels/checked states with a screen reader and web keyboard controls.
- With invalid/missing `appearance_preference`, expect system appearance. Simulate storage
  failures: read failure uses system with feedback; save failure keeps the session choice with
  feedback and allows reselecting to retry. Preserve `favorite_station_list` throughout.
- Open search, select a line and station; search opens the correct named station with arrivals.
- Pull to refresh; arrivals and update timestamp reload.
- Toggle the header star, return to favorites, and confirm the saved list updates.
- Expand a favorite and use the visible details action to open station details.
- Back returns to the originating tab with selection preserved.
- Restart the app and confirm favorites persist. For an upgrade, install over the previous
  app using the same identity without clearing data and confirm existing favorites survive.
- Open `/station/DIH` directly and confirm data loads and back can return home.
  On native builds, test `mtr-next-train://station/DIH` as well.
- Open `/station/INVALID`; expect a Chinese error and working return-to-search action.
- Navigate between stations quickly or change the station URL while loading; older responses
  must not overwrite the current station. Test a failed detail request and retry.
- Check notches, Android system bars, tab-bar overlap, scrolling, and visible header actions.
- On web, refresh a detail URL with the hosting server configured to serve the SPA fallback.

## Little Twin Stars appearance — 2026-11-05

- `npm run check`: passed, including all 20 Expo Doctor checks. The first sandboxed attempt
  could not fetch metadata; the network-enabled run passed. `npm run export:all`: passed for
  Android, iOS and web after the final train asset and star placement changes.
- `node scripts/verify-api.cjs` and `node scripts/verify-facilities.cjs`: passed, including
  failure retention, stale results, lifecycle and background monitor assertions.
- Targeted temporary provider assertions with mocked storage passed: pending load blocks changes,
  missing/invalid values use system, failed reads show feedback, failed writes retain the session
  choice, and reselecting the theme retries saving. No test framework was added.
- Android: tested current source through Expo Go on the AVD whose boot identity is
  `Samsung_Galaxy_S26_Ultra_API_36`, API 36. Its missing Galaxy skin and stale display overrides
  initially produced a generic 1080×1440 surface; those captures are not S26 layout evidence.
  Relaunched that AVD with its configured 1440×3120 display at 480 dpi, removed the stale overrides,
  and verified its boot identity and physical display before subsequent tests.
- Passed on that corrected profile: light/dark/theme radio selection; saved theme after reopening;
  theme stays light under dark OS; follow-system switches between dark/light OS; 150% text;
  Search, live station arrivals, Facilities, Settings and landscape Settings. Font scale, rotation
  and OS night mode were restored. Expo Go occasionally required reopening/dismissing its dev menu.
- Web: checked 390×844 and desktop, keyboard Space selection and checked semantics, reload
  persistence, selection sheet, live arrivals, facilities fallback, and expanded favorite/search
  selection preservation across theme changes. Removed the temporary favorite afterward.
- Contrast measured from theme tokens: body 12.57:1, secondary text 5.77:1, white action text
  6.41:1; meaningful outline against surfaceVariant 3.44:1. All audited text/container pairs
  met 4.5:1. Decorations are hidden from accessibility traversal and ignore pointer events.
- Impeccable audit: native source/captures and web source/runtime, with independent finish review.
  Web detector returned no findings. Resolved a web SVG attribute warning and the reviewer's P2
  finding that narrow headers cropped the cream stars; independent side anchoring keeps both visible.
  That P2 was located in `ui/component/LittleTwinStarsArtwork.tsx` (the cropped background layer);
  the fix anchors each cream star separately at 9% side insets. The final reviewer confirmed the
  crop resolved and reported no new in-scope findings for the generated train, station/facility
  screens, landscape and enlarged-text captures. This verdict covers the reviewed evidence only.
  React review confirmed stable component identity, unchanged navigation tree, no added timers,
  data fetching, dependency changes or conditional hooks.
- Generated `star-train.png` with built-in image generation for Search; official portrait remains
  on other screens. Both assets are bundled locally. See the asset README for source and prompt.
- Evidence: `/private/tmp/mtr-theme-qa/`, including `settings-restarted-s26.png`,
  `settings-large-s26.png`, `search-train-s26-final.png`, `station-s26.png`, `facilities-s26.png`,
  `landscape-s26.png` and `search-train-web-final.jpg`.
- Limits: the AVD uses Google's Android image; Samsung One UI and the unavailable Samsung frame
  were not tested. iOS is source-reviewed and bundle-exported only. No physical device, TalkBack/
  VoiceOver traversal, tablet, device storage-failure injection or airplane-mode runtime test.
  Storage failures and stale/error transitions were assertion-tested; exports do not prove native behavior.

## Reporting

For UI changes, complete the required Impeccable audit from the
[agent workflow](development.md#required-agent-workflow). Record scope, platform, severity,
file/line, user impact, and recommended action for each finding. Review accessibility,
performance, theming, platform conformance, and responsive/adaptive behavior as applicable.
Check affected layouts at small widths and in landscape, text scaling, reduced motion,
touch targets, safe areas, and keyboard/screen-reader access on supported platforms.
Evaluate supported themes separately; do not add a new theme solely to satisfy an audit.
Distinguish source inspection from runtime observations and flag checks that could not run.

Record command, result, tested platform/device, and any failure. Distinguish an unavailable
network or simulator from a passing check. Include actionable remaining checks in the handoff;
never mark unexecuted manual scenarios as passed.

## Settings and appearance — 2026-11-03

- `npm run check`: passed TypeScript, dependency alignment and all 20 Doctor checks with
  network access. Initial checks encountered stale generated route types (refreshed by Expo
  start) and restricted-network Doctor metadata failures; both resolved on the final run.
- `npm run export:all`: passed Android, iOS and web after final UI changes.
- `git diff --check`: passed. No new dependencies or test framework.
- Interactive browser verification used the Expo web development server at desktop and
  320×640. Verified all three choices, saved light/dark choices after reload, Space/Enter
  activation, visible focus, a single labeled checked-state radio per choice, disabled/off
  notification control, and theme changes reaching the Favorites screen/header/tab bar.
  Returning from Settings preserved a deliberately collapsed favorite; the original expanded
  state was restored after verification. The small-width header now wraps actions below its title.
- Impeccable audit: native source review and web source/runtime review of Settings, appearance
  provider and affected Favorites header. No remaining confirmed in-scope P0–P3 findings.
  Duplicate radio semantics/missing web checked states and compressed header text found during
  review were corrected. Controls use Material feedback, semantic themes, safe areas, wrapping
  text, 48+ unit targets, and existing Reduce Motion handling. Body contrast: light primary
  15.91:1, light secondary 6.64:1, dark primary 13.08:1, dark secondary 10.70:1.
- React best-practices review confirmed stable component identity, cleaned-up appearance
  subscription/load effects, serialized persistence, and no added dependency or polling work.
  Context7 Expo SDK 58 and installed Paper 5.15.3/RN 0.88.1 sources informed routing, radio
  semantics and system-scheme subscription. RN Context7 search returned unrelated compatibility
  examples, so the installed `useColorScheme` implementation supplied the subscription evidence.
- Not executed in the initial pass: native device/simulator runtime, live OS appearance changes, large system text,
  landscape, VoiceOver/TalkBack, invalid-storage or storage-failure injection. Complete these
  manual scenarios before release; platform bundle exports do not establish native behavior.

### Android emulator follow-up — 2026-11-03

Tested the running `Samsung_Galaxy_S26_Ultra_API_36` emulator (`emulator-5554`),
Android API 36, using Expo Go 58.0.5 and the current local Expo development server.
ADB interaction was explicitly authorized. No application source changes were needed.

- Passed: Settings opens from the Favorites gear; all three radio choices respond immediately
  and native accessibility metadata exposes the selected choice. Dark appearance persisted
  after force-stopping/reopening Expo Go.
- Passed: Light overrides a dark OS setting; follow-system renders dark under OS dark and
  returns to light when the OS changes to light. Screenshots confirmed theme background colors
  `#11171D` and `#F5F6F7`; status-bar icons remain legible in both themes.
- Passed: notification control reports disabled and unchecked; tapping it leaves Settings
  unchanged and presents no permission prompt.
- Passed: Settings and the Favorites header fit at 150% system text. Appearance controls
  retain full labels, notification copy wraps without overlap, and content respects system insets.
- Passed: temporarily favorited Diamond Hill, expanded it, opened Settings, selected dark,
  then used Android Back. Diamond Hill remained expanded with live arrivals and themed tabs.
- Restored and read back OS night mode `no` and font scale `1.0`; selected follow-system and
  removed the temporary Favorite, confirming the original empty saved list.
- Impeccable native runtime review found no new Settings-specific P0–P3 issues. The inspected
  AndroidRuntime/ReactNativeJS error-log tail was empty. Expo Go recreated the experience on
  system configuration changes; startup required waiting/reopening before continuing.

Remaining: iOS, physical devices, TalkBack traversal, landscape/tablet layouts and injected
storage failures were not tested in this follow-up. Native screenshots are in
`/private/tmp/mtr-native-*.png` (dark, light override, system light/dark and 150% text).

## Migration verification — 2026-10-30

- `npm run check`: passed, including all 20 Expo Doctor checks with network access.
- `npm run export:all`: passed for Android, iOS, and web.
- Local Markdown links and `git diff --check`: passed.
- Exported web app: verified search to DIH, live arrivals for both serving lines, favorite
  toggle, persistence through page reload, favorites tab, accordion expansion, long-press
  navigation, back to the originating favorites tab, and invalid-station recovery.
- Native device/simulator execution, native upgrade persistence, pull-to-refresh gestures,
  and request-race/error simulation remain untested. Complete those checks before release.
- npm audit reports eight transitive Expo tooling findings (five low, three high), originating
  in deepmerge and Zod. The reported remediation includes downgrading Expo to SDK 51;
  no force-based downgrade or unverified overrides were applied. Recheck upstream fixes
  during the next dependency update.

## Bottom bar correction

Restored the original Paper Material bar across platforms: icon-only train/star controls,
light-gray background, and Paper's selected indicator. Expo Router still manages navigation.
TypeScript, dependency checks, all 20 Doctor checks, and all-platform exports passed.
Visually checked the exported web bar and confirmed switching to favorites works.
Native device appearance remains to be checked.

## MTR API and automatic refresh

Run `node scripts/verify-api.cjs` for deterministic response, timezone, metadata, cooldown,
and hook lifecycle assertions using Node and the installed TypeScript compiler.

Verify DRL SUN/DIS and EAL RAC in search and favorites. Empty schedules must show a Chinese
message; alerts, delays, and line failures must remain distinguishable. Expand one favorite,
switch to another, collapse it, and confirm only the expanded station is polled. Check the
10-second cadence, no overlapping requests, blur/background cancellation, resume refresh,
and manual refresh. Check stale timestamps, partial line failures, and HTTP 429 cooldown.

Implementation checks: fixture and lifecycle assertions passed; `npm run check` passed all
20 Doctor checks after a network-enabled rerun. Android/iOS/web production exports passed.
The initial sandboxed Doctor attempt failed because remote metadata was unavailable.
The Impeccable detector reported no findings for the changed arrival surfaces. Source review
confirmed labeled refresh controls, explicit empty/error states, and retained Material controls.
Native device gestures, screen readers, text scaling, landscape, and native runtime polling
remain manual release checks; bundle export does not establish those behaviors.

Web runtime checks for this update passed: DRL picker coverage; Sunny Bay live arrivals for
both serving lines; observed 10-second timestamp advancement; favorite toggle and expanded
compact arrivals; and Racecourse's successful empty schedule message. These checks used the
exported app. Source audit found insufficient white-text contrast on bright line headers;
headers now choose black/white by measured relative luminance. Broader responsive and
assistive-technology validation remains unexecuted.

## Mobile-first redesign — 2026-10-30

Implemented favorites-first navigation, `/search`, `/favorites` compatibility redirect,
shared light/dark themes, labeled tabs, native pickers, arrival groups, visible details
navigation, and favorite-storage error feedback. `expo-system-ui` 58.0.7 was added using
`expo install` for Android automatic appearance. Native clients must be rebuilt for the
appearance and orientation configuration; installed Expo/React/RN versions were not upgraded.

Validation performed:

- `npm run check`: passed all 20 Doctor checks on the network-enabled rerun. The initial
  restricted attempt passed TypeScript/dependency checks but failed two remote metadata checks.
- `npm run export:all`: passed Android, iOS and web; repeated successfully after the final
  accessibility/reduced-motion corrections. Final `npm run typecheck` passed.
- `node scripts/verify-api.cjs`: passed API fixtures, Hong Kong time, countdowns, cooldown,
  metadata, overlap, partial failures, background/resume, cancellation and stale-result tests.
- `git diff --check`: passed.
- Exported web runtime: empty favorites, search to DIH, live arrival groups for both lines,
  visible timestamp advancement, favorite toggle, back to preserved search selection,
  saved station appearing in favorites, persistence across reload, first favorite initially
  expanded, collapse, `/favorites` redirect, and invalid-station recovery to `/search` passed.
- Visual review: light appearance at 375px and wide browser layout. A landscape viewport
  was attempted but its capture was unreliable; landscape is not marked passed.
- Inactive tabs initially remained in the web accessibility tree. Added focused-screen
  visibility without unmounting; confirmed only the active screen remains in the tree.
- Source review found custom PaperProvider themes bypass its reduced-motion subscription.
  Root now subscribes to AccessibilityInfo, supplies a nested ThemeProvider with motion scale,
  and disables Stack animation when reduced motion is enabled. Runtime motion testing remains.
- Calculated normal/secondary text, primary-action text and primary-on-surface contrast in
  both themes: minimum 7.18:1 across these checked pairs. This is token verification, not a
  claim that every runtime combination or OS picker appearance was tested.

### Impeccable review

Scope: changed route shell, favorites, search, arrival presentation and shared themes.
Applied native and web audit guidance, UI UX Pro Max focused searches, Karpathy guidelines,
and the React component checklist. Context7 returned newer Paper examples rather than an
indexed 5.15.3 reference; installed definitions were checked. Expo's indexed versions also
lag SDK 58, so the installed SDK module map supplied the SystemUI version.

Mechanical detector returned no findings. Source review and browser inspection found and
fixed the inactive-tab accessibility issue (P1: favorites/search SafeAreaView roots exposed
hidden controls) and reduced-motion handling (P2: app/_layout.tsx custom theme did not inherit
Paper's subscription). No remaining verified P0/P1 defect was identified in the inspected
scope. Full native conformance and a composite health score are withheld without native
runtime evidence. Retained strengths: semantic labels, wrapping text, visible recovery,
line-name text alongside colors, and unchanged focus-aware arrival polling.

Remaining release checks: iOS/Android native appearance and upgrade persistence, dark-mode
visual inspection, largest Dynamic Type/font scale, tablet/landscape, VoiceOver/TalkBack,
full keyboard focus traversal, reduced motion, pull-to-refresh and back gestures. No iOS
simulator was booted (`simctl` confirmed); Android `adb` was unavailable. Error/empty service
states were covered by the existing data fixtures and source review, not forced in this
browser pass. API fixtures and exports do not establish native runtime behavior.

## Search selection sheets — 2026-10-30

Replaced line/station pickers with shared Material fields and React Native Modal bottom
sheets. Station search filters the selected line by Chinese name, English name or code.
No dependencies, routes, API contracts or favorite storage were changed.

- `npm run typecheck`: passed after the final changes.
- `npm run export:all`: passed Android, iOS and web after the final changes.
- `git diff --check`: passed.
- Runtime testing was Android-only, as requested: Samsung Galaxy S26 Ultra API 36 emulator,
  Android 16, SDK-compatible Expo Go installed by Expo CLI; ADB interactions authorized by user.
- Verified field labels, line-color markers, selected checkmarks/state, selected-row reveal,
  no automatic keyboard on opening, mixed-case code with surrounding spaces (` dIh `),
  English names (`Diamond`, `race`), line-scoped no-result search (`airport` on KTL),
  clear search, query reset on reopening, same-line reselection preserving DIH, EAL change
  resetting to LMC, Racecourse selection, and close/Back/backdrop dismissal.
- Found and fixed a P1 native interaction issue: the outer search ScrollView consumed the
  first selection tap while the IME was visible. `keyboardShouldPersistTaps="handled"`
  now permits one-tap result selection. Confirmed Racecourse selection with software IME open.
- Visually reviewed light/dark sheets, keyboard visibility, 375dp width with font scale 1.3,
  and landscape at that scale. Header/close/search remain visible and options scroll.
- Restored original emulator resolution, font scale 1.0, light appearance, automatic rotation,
  and keyboard/stylus settings after testing. Changing resolution/font configuration reloaded
  Expo Go; this was not treated as a selection persistence test.

Impeccable audit: detector returned no findings on the changed selection components.
Native source/runtime review confirmed semantic field/option labels, selected state,
minimum 48-unit controls, wrapping labels, themed surfaces, modal isolation and safe insets.
Removed the unnecessary interactive search icon and enlarged the clear-search target during
review. No remaining verified P0/P1 issue in the tested selection flows. TalkBack focus
restoration, largest supported font scale, Chinese IME entry, reduced-motion runtime behavior,
web Escape/focus trapping and iOS remain untested. These are follow-up verification items,
not passed checks. Modal focus handling uses installed RN/RN Web behavior and explicit
native accessibility focus requests; Context7 0.88 documentation and installed types were
consulted. Retain the existing picker package pending a separate dependency cleanup.

## Facility outage screen

Run `node scripts/verify-facilities.cjs` for XML/CDATA decoding, empty/malformed responses,
classification, station search, unknown stations/types, Hong Kong timestamps, refresh overlap,
failure retention, cancellation and stale-response assertions.

Manual checks on iOS and Android:

- Open 設施; confirm 無障礙 initially, switch to 全部, and check escalator notices appear.
- Search using Chinese/English station names and station codes. Check no-match and empty-feed wording.
- Open 查看設施狀況 from station arrivals; only that station appears and Back restores arrivals.
- Check refresh button/pull gesture, 60-second refresh, background/resume and blur cancellation.
- Simulate failure after success: retain notices and show stale warning; retry clears the warning.
- Verify complete MTR messages, alternatives/remarks, timestamps and telephone actions.
- Check both themes, large text, screen readers, small/landscape layouts and safe areas.

On web, verify both routes show the official-site fallback and make no outage XML requests.
Check tab labels, keyboard navigation, link opening, direct URL reload and invalid station recovery.

Implementation validation — 2026-11-02:

- `node scripts/verify-facilities.cjs` and `node scripts/verify-api.cjs`: passed.
- The downloaded live MTR snapshot parsed into 20 notices, including three accessibility notices.
- `npm run check`: TypeScript passed; dependency validation failed on existing Expo patch
  recommendations (Expo 58.0.21 → 58.0.22, Router 58.0.28 → 58.0.29, Metro runtime
  58.0.15 → 58.0.16). No unrelated dependency upgrades were applied.
- Separate network-enabled `npx expo-doctor`: 19/20 passed; the same patch-version mismatch failed.
- `npm run export:all`: Android, iOS and web passed. `git diff --check`: passed.
- Web development runtime: facilities tab, station entry, Back to arrivals, invalid station
  recovery, and opening the official MTR site passed. Light-theme screenshots at 1280×720,
  375×812 and 812×375 showed readable wrapping and no overlap.
- Context7 informed routing/parser/control decisions; Paper results referenced newer documentation,
  so the installed 5.15 component definitions were checked. The focused UI UX Pro Max search did
  not provide a verified text-scaling match; existing project/platform guidance supplied that review.
- Native runtime, pull-to-refresh, phone dialing, VoiceOver/TalkBack, large text, dark-theme runtime
  and complete web keyboard traversal remain untested. Native tooling was unavailable; exports
  do not establish those behaviors. Theme-token and lifecycle source inspection is not runtime QA.
- Impeccable fresh finish review found one P2 large-text issue in the phone action. The
  number was moved into wrapping text and the action shortened to 聯絡車站; the reviewer’s
  verdict pass marked that issue resolved in source and returned `ship` within the stated
  validation limits. Native runtime accessibility remains unverified.
- The web-target detector returned no findings for the new screen; it does not validate native UI.

### Android emulator runtime — 2026-11-02

Device: Samsung_Galaxy_S26_Ultra_API_36 AVD, Android 16 / API 36, 1440×3120,
480 dpi; Expo Go 58.0.5, development server on port 8084. These are emulator results,
not release-build or physical-device verification.

Passed:

- Native XML loading: three accessibility notices; 全部 shows 20 notices and escalators.
- Station-code `FAN` and English `Fanling` searches return the Fanling escalator notice.
  Switching that result to 無障礙 produces the explicit zero-match message.
- Offline refresh retains the previous notice and shows the stale-data warning. Restoring
  Wi-Fi/mobile data and pulling to refresh removes the warning and retains the result.
- Opening 聯絡車站 launches the dialer with 26761716. No call was placed.
- Disneyland Resort arrivals → 查看設施狀況 shows its single lift notice; Android Back
  returns to Disneyland Resort arrivals.
- Light/default text and dark/150% text screenshots show wrapping notices, timestamps and
  phone numbers. Landscape at 150% text scrolls to the notices without fixed-bar overlap.
- Font scale (1.0), night mode (no), automatic rotation (1), user rotation (0), Wi-Fi (1)
  and mobile data (1) were restored and read back. The app was left on 設施 / 無障礙.

Finding:

- **P2 — facility toggle has a short active touch area**, `FacilityOutageScreen.tsx:48–50`.
  At default text, UIAutomator reports the button's active bounds at y=609–723 (38 dp),
  while its visible outline extends to approximately y=750. A tap at (1050,738) inside
  the lower outlined area leaves the count at three; a center tap at (1050,666) changes
  it to 20. The minHeight is on Paper's outer View, while its TouchableRipple remains
  content-sized. Users tapping near the lower edge can miss the action. Extend the actual
  touch region to at least 48 dp (for example, the supported per-button hitSlop) and retest.
  Recorded as a test finding; no application source was changed during this test pass.

Limits: TalkBack traversal, Chinese keyboard input, exact 60-second request cadence,
background cancellation/overlap at runtime, native invalid-station recovery, tablet and
physical-device behavior were not verified. Existing deterministic lifecycle/Chinese-filter
checks remain separate evidence. Rapid appearance/text configuration changes recreated
Expo Go; one restoration stayed on the development splash and required restarting Expo Go.
This was not isolated as an application defect. AndroidRuntime/ReactNativeJS error-log
inspection did not return a crash in the inspected tail.

Native screenshots were captured under `/tmp/mtr-android-review/` (light, offline,
dark with large text, landscape, and final restored state).

## Version 2.0.0 release preparation — 2026-11-02

- App and npm package versions are 2.0.0; Android versionCode is 2 (previous local APK: 1).
- Aligned Expo 58.0.22, Router 58.0.29 and Metro runtime 58.0.16 using `expo install`.
- `npm run check`: passed, including all 20 Expo Doctor checks.
- `node scripts/verify-api.cjs` and `node scripts/verify-facilities.cjs`: passed.
- `npm run export:all`: passed for Android, iOS and web.
- npm reports 12 moderate dependency vulnerabilities; no forced dependency changes applied.
- The facility-toggle P2 touch-target finding above remains open. No UI source changes or
  new native runtime checks were part of release preparation. Existing runtime results
  above are separate from validation of the final APK.
- Local APK builds use the generated template's debug signing key for installation testing.
  Production distribution and upgrades from differently signed builds need the original
  production signing key.

### Facility toggle touch-area fix — 2026-11-03

Resolved the P2 finding above by replacing the outer-only minimum height with vertical
label padding inside Paper's TouchableRipple. The actual clickable target now measures
144 physical pixels / 48 dp at the emulator's 480 dpi, rather than 114 pixels / 38 dp.
Paper 5.15.3 source/types were checked against Context7's SegmentedButtons guidance.

Android retest: same Android 16 / API 36 phone emulator with SDK 58 Expo Go, current
project served by Expo on port 8081. UIAutomator measured both targets at 48 dp. For both
filters, taps at the original failing y=738, the new bottom edge y=751, top edge y=611,
and center correctly switched between three accessibility notices and 20 total notices.
At font scale 1.5, both targets measured 54 dp and bottom-edge taps still switched correctly.
Native dark-appearance screenshots at default/150% text showed readable labels and intact
Material styling. The existing app appearance override was preserved; light appearance
was not separately exercised in this retest. System night mode and font scale were restored
to their original values (no / 1.0); rotation was unchanged.

`npm run typecheck`, `node scripts/verify-facilities.cjs`, `node scripts/verify-api.cjs`
and `git diff --check` passed. No dependency or route changes were made. Native Impeccable
review of the affected toggle found the reported target-size issue resolved, with labels,
filter results and text scaling preserved. TalkBack and iOS runtime remain untested.
Evidence: UI dumps and emulator screenshots in `/tmp/mtr-toggle-retest/`.

## Android facility alert acceptance

Use a newly built installed Android app containing the notification/background modules.

- Tap 測試通知 with monitoring off and on. Expect one immediate Chinese test notification
  per tap using the facility alert channel. Verify permission requests/denial feedback,
  a loading indicator, and unchanged monitoring preferences and outage history.
- Tap 10 秒後測試通知, confirm scheduling feedback, then leave the app. Expect one test
  notification after 10 seconds. It must use a one-shot trigger and preserve monitoring settings.
- Both test notifications show 樂富站升降機停用（測試） and describe a simulated lift outage.
- After rebuilding Android, check the train glyph in the status bar with the shade closed.
  Expand the shade and verify the glyph is on the left of test and facility notifications
  and the right-hand app thumbnail is gone.
- Fresh install shows alerts off and 收藏車站 selected. An empty bookmark list explains how
  monitoring starts. iOS/web show Android availability information.
- Enable with permission allowed, denied and permanently denied. Confirm Settings recovery
  link opens Android app settings and returning refreshes permission status.
- The first successful check silently baselines current outages. Two new accessible outages
  at one station produce one Chinese notification naming both. Other stations alert separately.
- Dismiss and run another check, reopen and reboot. An ongoing outage stays silent.
  Message/timestamp/classification changes stay silent. A previously tracked facility absent from
  one valid feed generates one recovery notification with its saved name/location, including when
  the feed is empty. Repeated checks/restarts stay silent; returning outages alert again.
  Offline/invalid feeds preserve history and retry later. Check legacy key-only state uses generic
  recovery wording. Mixed outage/recovery checks submit separate station notifications; failure of
  either retries only that event. Scope removals do not imply recovery.
- Add/remove/re-add bookmarks and switch scopes. Newly monitored stations baseline silently,
  while previously monitored stations still alert for subsequent new outages.
- Tap a facility outage/recovery alert and each developer-screen test notification. Verify the main 設施 tab
  opens when the app is running, in the background, or starting from a closed state.
- Disable alerts and verify the WorkManager registration is removed. Re-enable and confirm
  existing outages establish fresh silent baselines.
- After enabling, reboot without reopening. Verify a headless check executes with network
  available. Android schedules at least 15 minutes apart and can defer for power/network.
  Force-stop requires reopening the app before work resumes.
- Inspect Settings on a phone/tablet, both appearances and increased font scale. Use TalkBack
  to check the switch's label/state, scope radio selection, errors and system-settings button.

The monitor reserves a station's snapshot before submitting its notification to avoid repeats
across process death. An interruption between reservation and submission may lose that alert.
Mocked assertions and exports do not prove native presentation or reboot execution.

### Facility alert verification, 2026-11-03

`npm run check` passed all 20 Expo Doctor checks. `npm run export:all` exported Android,
iOS and web. Both existing API/facility verification scripts passed, including the new
Android monitor assertions. A generated temporary Android project built successfully with
`:app:assembleDebug` and the APK was installed on an Android 16 / API 36 phone emulator.

Native checks exercised the permission prompt, denial, recovery via permission grant,
empty-favorites copy, all-stations selection, saved preferences, background job registration,
and a forced WorkManager execution that completed successfully and rescheduled at 15 minutes.
Two staged station-baseline changes against the real feed produced separate Chinese station
notifications. Tapping the individual 油塘 alert opened 油塘設施 with its lift notice.
Reboot restored WorkManager scheduling. Without opening the app, a forced restored job
completed successfully with the launcher still foregrounded and no duplicate notifications.
These forced executions verify the headless path. Natural 15-minute timing remains pending.

Impeccable native review found and fixed a blocking Android `status` accessibility-role
crash in Settings using native polite live regions. Local notification content uses
`sound: true`, since this SDK build treated the string `default` as a missing custom sound.
The final notification had high importance and no SILENT flag. Native Settings captures in
light appearance/default text and dark appearance/150% text showed wrapping labels and intact
Material styling. Display settings were restored to night mode off and font scale 1.0.
Native audit scores are provisional, 17/20, with accessibility 3, performance 3, theming 4,
platform conformance 4 and adaptivity 3. No remaining blocking UI issue was identified in
these reviewed states. TalkBack speech, tablet/orientation layouts, audible playback and
natural interval scheduling still need device acceptance. iOS/web were exported only.
Screenshots and UI dumps are in `/tmp/mtr-alert-qa/`; the debug APK is under
`/tmp/mtr-alert-native/android/app/build/outputs/apk/debug/`.

Cancellation was verified through the native switch. The saved state changed to disabled and
the WorkManager job disappeared. The switch exposed Android Switch/checkable/checked semantics
and a 440 by 64 dp clickable row. Test monitoring was left off.

### Notification test buttons, 2026-11-03

Added 測試通知 and 30 秒後測試通知 to Android Settings (subsequently moved to the developer screen). Both delivered through the existing
high-importance channel on the installed Android 16 / API 36 emulator with monitoring off.
The delayed test was absent at 25 seconds and appeared after the requested 30-second delay
while the app was backgrounded. Stored state remained disabled/favorites with empty history.
TypeScript, facility assertions, whitespace checks and Android/iOS/web exports passed.
The focused Impeccable native review found no blocking issue in the rendered buttons,
with Paper feedback, themed colors and 48 dp targets. TalkBack and other screen sizes were
not exercised for this addition. Evidence is in `/tmp/mtr-alert-qa/test-buttons.png`.

### Notification channel error fix, 2026-11-03

The reported error was `expo-notifications: Custom sound 'default' not found in native app`.
The installed SDK treats an explicit channel sound string as a bundled resource filename.
Channel creation now omits `sound`, which selects Android's default notification sound.
Notification content continues to use `sound: true`. A regression assertion checks the channel
options. After restarting the installed Android app, both test buttons delivered notifications,
including delayed delivery while backgrounded, with zero fresh Expo/ReactNativeJS errors.
TypeScript, facility assertions, whitespace checks and all-platform exports passed.
Evidence is in `/tmp/mtr-alert-qa/sound-retest.log` and `sound-retest-notifications.txt`.

### Earlier right-side notification icon trial, 2026-11-03

Configured the Expo notifications plugin's `largeIcon` with the existing app icon.
Generated manifest metadata and density-specific notification icon resources were verified.
`npm run check` passed all 20 Doctor checks, facility assertions and all-platform exports
passed, and the rebuilt debug APK installed successfully. On Android 16 / API 36, the
Lok Fu test notification visibly showed the full-color train app icon in its card.
Android reported a bitmap large icon. The focused native visual audit found the existing
app asset recognizable and correctly placed by the system. Evidence is in
`/tmp/mtr-alert-qa/app-icon-notification.png`. Native rebuilding is required on other devices.

### Android small notification icon, 2026-11-03

On the rebuilt Android 16 emulator app, tapping 測試通知 showed the monochrome train
on the left of the Lok Fu heads-up banner and expanded card. After the banner closed,
the train appeared beside the clock in the status bar. The card had no right-hand image
and the Android notification record reported `android.largeIcon=null`.

On Android 16, tapping the immediate Lok Fu test notification opened the main 設施 tab
both from Settings and after the app process was killed in the background. Tapping the
delayed test from the launcher also opened the tab. Each check found 設施服務狀況 with
the bottom tab bar visible.

## Developer diagnostics acceptance

- Tap the Favorites gear to open Settings. Verify the configured app version and exact
  `Development by Max Wong` credit at the bottom, including short screens and large text.
- Long-press and release the same gear. Only 開發者工具 opens. Android Back restores the
  expanded favorite. Verify the named 開啟開發者工具 screen-reader action.
- Both notification test buttons live in 開發者工具. Verify immediate and 10-second delivery,
  permission denial feedback and unchanged monitoring preferences with monitoring off.
- Enable monitoring, leave the app and force the registered WorkManager job. Reopen 開發者工具
  and verify a new background run with Hong Kong timestamp, scope, API outcome, station count,
  accessible outage details and notification count. A valid empty feed says 未有相關停用通告.
- Reopening, resuming and refreshing the viewer must add no background run. Force an offline
  execution, restore networking and retry. Verify failure then success and intact outage baselines.
- Verify history across process restart and six-hour expiry. An interrupted run retains its
  last recorded stage. Empty history explains Android scheduling and when recording begins.
- Review light/dark appearance, increased text size and system Back on Android. On iOS/web,
  verify the Android availability explanation. Native exports alone do not establish runtime behavior.

### Developer diagnostics implementation checks, 2026-11-04

TypeScript, facility/monitor/log assertions, existing arrival assertions and whitespace checks
passed. `npm run export:all` exported Android, iOS and web. A temporary generated Android
project with the updated embedded JavaScript built successfully with `:app:assembleDebug`.
`npm run check` stopped at dependency alignment because Expo recommends updates for
8 existing dependencies. Dependencies were kept unchanged. The initial sandboxed Doctor
run could not reach its online services. After the user explicitly approved metadata sharing,
the online `npm run doctor` retry completed with 19/20 checks passing, including config-schema
and React Native Directory validation. Only dependency alignment failed, with seven patch
updates and a minor update for `react-native-safe-area-context` from 5.10.1 to ~5.11.1.

Context7 supplied SDK 58 configuration guidance. Its React Native 0.88.1 query returned no
matching guidance; installed Paper/React Native/native-web sources and types were checked
for long-press suppression and accessibility props. UI UX Pro Max's focused React Native
search and Impeccable's native/web audit playbooks informed the affected UI review.

Native acceptance used a separate Pixel 8a Android API 35 emulator after the existing API 36
emulator stopped responding to shell/screenshot commands. The new debug APK installed and
ran. A forced WorkManager job with the app process closed fetched the real MTR feed and
persisted a successful run with 99 monitored stations, three accessible-facility notices and
zero new notifications. Both immediate and delayed tests delivered. Reopening/resuming and
refreshing the viewer retained exactly one background run. A fresh app start followed by
long-press/release opened only 開發者工具; Android Back restored 鑽石山 expanded.

Light/default and dark/150% text captures showed wrapping log details and readable footer
copy. Source/native Impeccable review found no blocking issue in these states. Provisional
native scores are accessibility 3, performance 3, theming 4, platform conformance 4 and
adaptivity 3 (17/20). TalkBack speech/custom action execution, tablet/landscape, iOS runtime,
web interaction and natural scheduling remain unverified. Evidence is in `/tmp/mtr-dev-qa/`.

During combined forced-headless and repeated display/deep-link tests, the temporary debug
app displayed a blank surface with ReactHost reporting its context was not ready. Restarting
the app restored it and the normal long-press/Back test passed. That combined lifecycle case
needs confirmation in a fresh production build; no native lifecycle change was made here.
The new emulator's display settings were restored to light/system and font scale 1.0.

### SDK 58 dependency alignment, 2026-11-04

Ran `npx expo install --fix --npm` using Context7's SDK 58 upgrade guidance. The lockfile
now resolves Expo 58.0.23, Metro runtime 58.0.17, Constants 58.0.15, Linking 58.0.16,
Notifications 58.1.8, Router 58.0.30, Splash Screen 58.0.13 and Safe Area Context 5.11.1,
plus their compatible transitive updates. npm preserved peer dependency validation.

`npm run check` passed TypeScript, dependency alignment and all 20 online Doctor checks.
`npm run export:all` exported Android, iOS and web. Both existing verification scripts
(`verify-api.cjs` and `verify-facilities.cjs`) and `git diff --check` passed.
npm reports five moderate audit vulnerabilities. No forced audit fixes were applied.

Native acceptance was pending at this dependency-only checkpoint. The Android release
verification below covers the updated modules. iOS native-client testing remains pending.
Earlier screenshots and background-job results above used the previous dependency set.

### Updated Android release verification, 2026-11-04

Generated a fresh temporary Android project with SDK 58.0.23 and built an optimized ARM64
release APK. Testing used the Pixel 8a Android 15 / API 35 emulator and preserved its saved
DIH favorite and alert preferences through installation.

The first optimized release had a P0 startup crash before JavaScript loaded. R8 removed the
public no-argument constructor of `androidx.work.impl.WorkDatabase_Impl`, which Room 2.6.1
loads reflectively. The new local Expo config plugin preserves that constructor. Two prebuild
runs produced exactly one rule. The rebuilt optimized release installed and started successfully.
Context7's AndroidX reflection guidance was checked against the installed Room AAR's keep
rules and R8's removed-member report.

Passed native checks included live arrivals, saved favorites, normal Settings navigation,
version/credit footer, long-press/release to 開發者工具, and Back preserving expanded DIH.
Both immediate and 10-second test notifications delivered with monitoring off, including
delayed delivery while backgrounded. Facility notices loaded after the lifecycle tests.

Forced background jobs recorded successful checks of 99 stations with three accessible-facility
outage notices and zero new notifications. Turning Wi-Fi and mobile data off produced
`檢查失敗 · API 請求失敗`. Restoring networking and forcing the rescheduled job produced
a new successful run. Reopening/refreshing the viewer added no run. A separate test confirmed
the app PID was absent after process termination, forced background work with the launcher
foregrounded, then verified a new successful timestamp in persisted history after reopening.
WorkManager process-restart reconciliation sometimes replaced its scheduled job, so the
verification forced the current job again after reconciliation.

Light/default text, dark/150% text, and landscape captures showed readable controls, wrapping
facility details, reachable footer copy and intact safe areas. Impeccable native review found
no remaining blocking issue in these reviewed states. Provisional scores remain accessibility
3, performance 3, theming 4, platform conformance 4 and adaptivity 3 (17/20). The earlier blank
surface was not reproduced in these release-mode headless/appearance/rotation checks.
The final logcat scan found no new fatal exception, missing constructor, React context-not-ready
message or ReactNativeJS error matching the startup failure after the corrected installation.

`npm run check` passed all 20 Doctor checks. All-platform exports, both existing verification
scripts and whitespace checks passed after the config fix. Monitoring was returned to off,
with the original light/system appearance, 1.0 font scale, portrait rotation and networking
restored. TalkBack/custom action speech, tablet layouts, natural 15-minute scheduling and
reboot execution were not tested in this pass. Evidence, automation logs and screenshots are
in `/tmp/mtr-sdk58-evidence/`. The locally debug-key-signed release-mode test APK is at
`/tmp/mtr-sdk58-qa/android/app/build/outputs/apk/release/app-release.apk`.

## English developer tools and expandable activity

- Open Developer Tools using the Favorites gear shortcut. Verify English headings, controls,
  permission feedback, empty/loading/error states and Android-only information on iOS/web.
- Runs start collapsed, newest first, with a Hong Kong time and short outcome. Tap to expand
  saved details, tap again to collapse, and open another row to close the previous row.
- Refresh while a run is expanded. It stays open if retained, and disappears after six-hour expiry.
  Refreshing, opening and expanding must not call MTR or add background entries.
- Check English station names, MTR English facility text for new runs, labeled source text
  for older records and English explanations for skips, invalid feeds and API/post-feed failures.
- Review light/dark themes, enlarged text, landscape and TalkBack expanded/collapsed state.

### English expandable log verification, 2026-11-04

`npm run check` passed, including all 20 online Expo Doctor checks. `npm run export:all`
exported Android, iOS and web. API/facility verification scripts and `git diff --check` passed.
New assertions cover retaining English facility fields alongside Traditional Chinese and
persisting them in background history, including feeds without English fields.

Built and installed the optimized 2.2.1 Android release on the Samsung API 36 AVD.
Verified initial collapsed rows, expansion/collapse, local refresh retaining the selected
run and latest timestamp, and a real forced WorkManager run with 99 stations and three
English facility notices. A favorite-only run showed the English empty-outage result.
Both notification controls produced English success feedback and submitted notifications.
Restored monitoring to enabled/Favorites and system appearance with normal text after testing.
Light and dark/150% text captures showed readable titles and controls. Native source audit
found no blocking layout/theming issues. TalkBack speech, iOS runtime and web interaction
were not exercised in this pass. Older-record source fallback was checked in source and
fixtures, without a native older nonempty record in the inspected viewport.

The AVD booted with a launcher crash and an incorrect 320×480 physical display. Runtime
size/density overrides of 1080×1440 and 320 dpi made it usable for these tests. These emulator
settings were retained for manual testing. No application data was cleared.

## Little Twin Stars icons and railway — 2026-11-05

- Added custom 24-unit shooting-star, train and wheelchair/star tab icons, a sky-to-blush gradient,
  and an 88-unit cloud railway strip below the scroll area on the five main screen implementations.
- `npm run check` passed all 20 Doctor checks. Final typecheck and all-platform export passed.
- Web runtime covered 390×844 and desktop, all three tabs, keyboard theme switching, expanded
  favorite and search-selection preservation. Temporary favorite removed after verification.
- Verified S26 AVD boot identity and 1440×3120/480 dpi before Android checks through Expo Go.
  All tabs and theme round-trip were exercised. Rechecked themed Settings at the bottom of its
  scroll area, with enlarged text and landscape after waiting for confirmed selected-theme hydration.
- Impeccable review found P2 track/control overlap and P3 uneven tie endpoints in the first pass.
  Reserved the railway strip outside scrolling content and aligned all ties across both rails.
  Unique gradient IDs also fix web rendering across retained screen instances. Decorative vectors
  ignore touch and accessibility traversal, with the tab owning its accessible label.
- Native evidence and web captures use `/private/tmp/mtr-theme-qa/railway-*`. Initial large-text
  and landscape captures were loading states and were discarded as verification evidence.
- iOS runtime, physical hardware, One UI and spoken VoiceOver/TalkBack traversal remain untested.

The final native landscape pass also found a P2 gradient seam at the old portrait width.
Explicit window dimensions on the SVG and gradient rectangle fixed it. Recaptured after theme
hydration in `railway-landscape-fixed-s26.png`, then restored portrait orientation. Text contrast
across the new background stops is at least 5.55:1 for secondary text and 10.28:1 for primary
text/icon outlines. The final export and typecheck passed after this correction.

Independent Impeccable verdict passes confirmed the P2 overlap, P3 ties and P2 landscape seam
resolved against their recaptured evidence. The documentation check matched the implemented
screen placements, strip height and icons to DESIGN.md and the existing color metadata.

### Compact Little Twin Stars tab covers · 2026-11-05

- Select the theme and visit 收藏, 搜尋 and 設施. Check the ticket album, route map
  and station lift respectively. Each cover should fill the content width at a 3:1 aspect ratio and scroll with content. Each tab has one named navigation action and
  keeps its selected indicator when tapped.
- Opened all three tabs on web at 390 × 844 and on the verified
  Samsung_Galaxy_S26_Ultra_API_36 AVD at 1440 × 3120, 480 dpi. The browser
  loaded all three local JPEGs at 276 × 92. Runtime captures are in
  `/private/tmp/mtr-theme-qa/cover-{web,native}-*`.
- `npm run check` and `npm run export:all` passed. iOS runtime and spoken
  screen-reader output were outside this visual pass.
- Impeccable found a P2 Android layout issue in `LittleTwinStarsArtwork.tsx`.
  The percentage-width cover reserved extra vertical space and left the JPEG
  corners square. Using a 276-unit preferred width constrained by the parent
  restored rounded corners and the normal gap before controls on the S26 AVD.


### Facility recovery alerts — 2026-11-06

- Facility assertions passed for silent baseline recovery, partial/full removal, valid empty feeds,
  unchanged identities/classifications, duplicate records, repeat checks, restart, recurrence,
  older key-only state, metadata cleanup, station scope, permissions, offline/invalid feeds,
  independent outage/recovery retries, notification content/counts and response handling.
  Arrival assertions also passed. No test framework or dependency was added.
- `npm run check` passed all 20 Expo Doctor checks with network access. The first restricted
  attempt passed TypeScript and local dependency validation, but two online Doctor checks
  failed because Expo/React Native Directory services were unreachable.
- `npm run export:all` exported Android, iOS and web. `git diff --check` passed.
- Impeccable native/web source review of `ui/component/FacilityNotificationSettings.tsx`
  found no new in-scope issue: the switch's visible/accessibility labels match, checked/disabled
  semantics remain intact, the Paper row can grow beyond its 64-unit minimum, copy wraps without
  line limits, and existing semantic theme colors are preserved. Native layout, enlarged text,
  light/dark presentation and spoken TalkBack output remain unverified; source inspection alone
  does not establish rendered accessibility or contrast. No runtime audit score is assigned.
- Android SDK tooling is present, but `adb devices` returned no connected device/emulator.
  Installed-build foreground/background banners and tapping after app restart were unavailable.
  iOS/web runtime checks were also not performed. Exported bundles and mocked notification
  response assertions do not prove native notification delivery or background execution.
- Context7's Expo SDK 58 notification guidance, the focused UI UX Pro Max searches and
  Impeccable's native audit guidance informed this change. No native modules/configuration changed.

### S26 Ultra recovery notification runtime verification — 2026-11-06

- Started the `Samsung_Galaxy_S26_Ultra_API_36` AVD, verified by both `emu avd name`
  and `ro.boot.qemu.avd_name`. Its configured Galaxy skin is missing; cold boot initially
  used 320×480. Restarted with an explicit 1440×3120 skin and confirmed 480 dpi. This is
  Google's Android 16 / API 36 image using the S26 Ultra display profile, not Samsung One UI.
- Generated native projects in `/private/tmp/mtr-recovery-native` from the current source.
  Both debug and optimized ARM64 release builds succeeded. Installed the locally debug-key-signed
  release APK over the existing app without clearing its data. No repository native project,
  dependency, or implementation change was required for this verification.
- Backed up local storage and staged an observed DIH outage with a synthetic facility ID and
  saved name/location. The real feed omitted that ID. Foreground monitoring submitted the
  recovery message with its saved details; tapping opened the main Facilities tab.
- The debug build required its local Metro connection and did not complete the first forced
  headless attempt. Release-mode testing removed that dependency. After closing the app process,
  WorkManager's first forced execution was replaced during process-start reconciliation.
  Retrying its current job executed the headless callback while the launcher stayed foregrounded.
  Persisted activity recorded a successful API request and exactly one recovery notification.
- The recovery notification displayed `鑽石山站無障礙設施已恢復服務` and
  `升降機（背景測試大堂）已恢復服務。`. After terminating the app process again,
  tapping the notification opened `設施服務狀況` with the main tab bar. A subsequent forced
  background check completed successfully with zero notifications, confirming no repeat.
- Impeccable review of native captures found no new in-scope UI issue in the notification shade
  or Settings at light/default text and dark/150% text. The switch label, full explanation and
  scope choices fit, text wraps, semantic checked state is present, and the footer stays reachable.
  These captures do not establish spoken TalkBack output, tablet layouts, physical-device behavior,
  audible sound, natural 15-minute scheduling, or reboot execution; those were not tested here.
- Restored the original DIH favorite, enabled/Favorites monitoring state, baseline/history and
  system appearance; returned to light OS mode and font scale 1.0. Removed staged recovery data
  and stopped Metro. Left the current self-contained release build installed and the AVD running.
- Evidence: `/private/tmp/mtr-recovery-evidence/`, including `foreground-shade.png`,
  `foreground-tap.png`, `background-shade.png`, `cold-notification-tap.png`,
  `release-settings-light.png`, `release-settings-dark-large.png`, `background-result.json`,
  `repeat-result.json` and native build logs. These native results supersede the earlier
  no-connected-device limitation for the tested scenarios above.
