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
