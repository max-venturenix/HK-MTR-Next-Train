# Project agent guide

## Start here

Read [README.md](README.md), then the relevant [architecture](docs/architecture.md),
[development](docs/development.md), and [verification](docs/verification.md) guidance.

## Required skills and documentation tools

- Use `andrej-karpathy-skills:karpathy-guidelines` for implementation, review, and refactoring.
  State assumptions, define verifiable outcomes, choose the simplest solution, and keep edits surgical.
- Use Context7 MCP for library, framework, SDK, API, and CLI documentation before making
  technical decisions. Resolve the library ID first, then query the relevant documentation;
  check guidance against installed versions rather than assuming latest examples apply.
- Use `ui-ux-pro-max` for UI design and implementation decisions. Follow its focused search
  workflow for the detected React Native/web stack and preserve the established Material UI
  unless the user requests a redesign.
- Use `impeccable:impeccable` with its audit workflow for UI audits and the final review of
  affected UI. Apply native guidance to iOS/Android and web guidance to the web surface.
  Report prioritized findings with locations, user impact, and recommendations.
- Read each applicable skill's `SKILL.md` from the current skill catalog before using it;
  do not hard-code machine-specific plugin cache paths in project instructions.
  If a required skill or Context7 is unavailable, report the limitation explicitly and
  do not claim it was used. See the [required workflow](docs/development.md#required-agent-workflow).

## Branch policy

- Always develop on `dev-ai`. Check the branch before editing; switch to or create it when necessary.
- Pushing to `main` requires the user's explicit approval. Do not merge or push to `main` implicitly.
- Preserve unrelated local edits and never commit credentials or personal scratch files.

## Working conventions

- Use npm and commit `package-lock.json` with dependency changes.
- Keep Expo, React, React Native, and native modules aligned with the installed Expo SDK.
  Use stable releases and `expo install`; do not bypass peer checks with force flags.
- Keep `app/` for Expo Router layouts and route wrappers; screen implementations live in `ui/`.
- Use Router APIs rather than direct `@react-navigation/*` imports.
- Match existing TypeScript conventions: strict types, double quotes, four-space indentation.
- Preserve Traditional Chinese UI, station codes, API behavior, and the favorites storage format.
- Keep changes focused. Update linked docs whenever commands, architecture, or behavior change.

## Completion checks

Run `npm run check` and `npm run export:all` for dependency or routing changes.
Follow the [manual checklist](docs/verification.md) for affected flows.
Report checks actually run, failures, and unavailable platforms; never claim a bundle export
proves native runtime behavior. Do not add a test framework or CI unless requested.
