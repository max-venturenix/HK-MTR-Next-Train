# MTR Next Train

An Expo / React Native app for Hong Kong MTR arrivals, with station search,
live arrival groups, and persistent favorite stations. Favorites open first; station search
is available from the labeled bottom navigation. Settings opens from the gear beside refresh
on Favorites. Appearance follows the system by default, with saved light/dark overrides.
Settings offers opt-in Android accessibility facility outage alerts for favorites or all stations.
Existing outages establish a silent baseline, and new outages notify once per station per check.
Background checks request a 15-minute minimum interval and resume after normal device reboot.
Android Settings includes 測試通知 and 10 秒後測試通知 buttons, including when alerts are off.
Android battery/network restrictions can delay checks. Rebuild the native app for this feature. The interface uses Traditional Chinese. The 設施 tab shows native facility outage notices
with accessibility filtering; station details also link to station-specific notices. Web links
to MTR’s official facility information.

## Requirements

- Node.js satisfying `package.json` engines (Node 22.13+ within the supported Node 22 range,
  or the supported newer major versions).
- npm; Android emulator/device, iOS simulator/device on macOS, or a web browser.
- Expo SDK 58 supports Android 7+ and iOS 16.4+. Native development requires compatible
  Android tooling or Xcode 26.4+.

## Setup and run

```sh
npm ci
npm start
npm run android
npm run ios
npm run web
```

The platform scripts open the Expo development server. They do not compile a new native binary.
Use an SDK 58 compatible Expo Go client, or create a development build as described in
[development](docs/development.md). MTR API requests require internet access; no API key is needed.

## Verify

```sh
npm run check
npm run export:all
```

See [verification](docs/verification.md) for individual checks and device scenarios.

## Project documentation

- [Agent instructions and branch policy](AGENTS.md)
- [Product brief](PRODUCT.md)
- [Design direction](DESIGN.md)
- [Architecture and data flow](docs/architecture.md)
- [Development and dependency upgrades](docs/development.md)
- [Verification and manual acceptance checks](docs/verification.md)

All development uses `dev-ai`. Pushing to `main` requires the owner's explicit approval.
