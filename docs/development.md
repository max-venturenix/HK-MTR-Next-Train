# Development workflow

[Documentation index](../README.md#project-documentation)

## Branch and local changes

Check `git status` and `git branch --show-current` before editing. Use `dev-ai` for all
project development. Preserve unrelated working-tree changes. Pushing to `main` needs
the owner's explicit approval; development completion does not imply that approval.

## Required agent workflow

1. Read the required skills listed in [AGENTS.md](../AGENTS.md#required-skills-and-documentation-tools).
   Apply Karpathy guidelines: state assumptions and acceptance checks, then make only the
   changes needed for the request. Preserve unrelated local work.
2. Before library-specific implementation or configuration, use Context7 MCP's library-ID
   resolver and documentation query tools. Scope queries to the relevant concept and installed
   version; never include credentials or private project data. If that version is not indexed,
   disclose the gap and verify against version-matched official documentation and local package
   definitions. Context7 results do not authorize dependency upgrades.
3. For UI work, use UI UX Pro Max before implementation: a design-system search for a new
   visual direction, or a focused domain/stack search for a targeted change. Verify that results
   fit React Native, Expo, Paper, and the affected platform. Preserve Traditional Chinese copy,
   existing icon conventions, and the documented Material appearance unless a redesign is requested.
4. Audit affected UI with Impeccable before delivery. Follow its context setup and audit
   playbook, using the native variant for iOS/Android and the web variant for web. An audit-only
   request produces findings, not unsolicited fixes. For implementation work, address in-scope
   issues and report remaining findings without expanding the task into a redesign.
5. Run the applicable [verification checks](verification.md), and report tools used, checks
   actually performed, and limitations. Documentation-only changes need link and whitespace
   checks; they do not require a UI audit or app export.

## Local development

Use `npm ci` for the committed dependency tree and the startup commands in the
[README](../README.md#setup-and-run). To clear Metro caches, use `npm start -- --clear`.

An Expo Go client must support SDK 58. If it does not, create a development build:

```sh
npx expo install expo-dev-client
npx expo run:android
# On macOS with Xcode and simulator tooling:
npx expo run:ios
```

Installing the development client changes dependencies; keep its lockfile update if adopting
that workflow. Rebuild the client after native dependency or native configuration changes.
A JavaScript reload cannot update a native binary. Existing EAS profiles are available for
builds when explicitly needed; building or publishing remotely is not part of routine checks.

## Adding or changing screens

Add routes under `app/` and keep screen UI under `ui/screen/`. Add tab declarations in the
tabs layout; keep station details in the root Stack. Use `router.push`, `Link`,
`useLocalSearchParams`, `Stack.Screen`, and `useFocusEffect` from Expo Router.
Validate external parameters before metadata lookup or API access. Account for safe areas
without duplicating the tab bar's bottom inset.

## Dependency upgrades

1. Review the target stable Expo SDK release notes and minimum Node/OS requirements.
2. Update Expo, then use `npx expo install --fix` to align its supported modules.
3. Update other packages to compatible stable releases and retain npm peer validation.
4. Run `npm run check` and `npm run export:all`; inspect the lockfile diff.
5. Rebuild native clients and complete the [verification checklist](verification.md).

Expo SDK 58 selects React Native 0.88.1 and React 19.3.0. Babel remains on the compatible
7.x line and TypeScript on Expo’s supported 6.0.x line. Do not independently select a newer incompatible React Native or Babel major.
Keep generated `.expo/`, `dist/`, `node_modules/`, and `expo-env.d.ts` out of commits.
Update documentation whenever commands or behavior change.

## Android notification development

Install the committed dependency tree with `npm ci`. Background alerts require a rebuilt
native binary containing `expo-background-task`, `expo-task-manager`, `expo-notifications`
and `react-native-background-fetch`. The Settings slider also requires the SDK-matched
`@react-native-community/slider` native module.
Use `npx expo run:android` to generate/build locally. Keep generated native projects out of
commits. Use an installed build for background/reboot acceptance, since Expo Go does not
establish the standalone app's permission, scheduling or reboot behavior. Keep `index.js`
as the entry so the Android task is defined before Router, including headless execution.
`node scripts/verify-facilities.cjs` includes notification monitor assertions with mocked
storage, feed, permission, scheduling and presentation, alongside existing facility checks.

Android prebuild applies the local `withWorkManagerKeepRules` config plugin from `app.json`.
It appends an idempotent R8 rule for `androidx.work.impl.WorkDatabase_Impl`'s no-argument
constructor, which Room 2.6.1 instantiates reflectively. Preserve this rule when generating
native clients. Release-mode device checks should use a fresh generated project so R8 startup
failures are exercised alongside development builds.
