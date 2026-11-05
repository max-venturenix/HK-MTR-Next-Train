---
name: MTR Next Train
colors:
  twin-stars-primary: "#71518F"
  twin-stars-background: "#FFF5F8"
  twin-stars-on-surface: "#392D43"
  twin-stars-secondary-container: "#DCEFF6"
  twin-stars-tertiary-container: "#F9DFE9"
---

# Commuter interface

## Overview

The approved direction is a mobile-first Material utility: neutral surfaces, navy actions, system Chinese typography, restrained borders, and official line colors used only as route identifiers. Favorites open first; one expanded station supplies compact arrivals. Detail sections emphasize the next train, then quieter subsequent rows.

Use `ui/theme.ts` for semantic light/dark themes, spacing and content width. Controls retain Paper feedback and native navigation; use no decorative motion. Body text wraps and scales. Tap targets are at least 48 units. Search selectors use Material fields and accessible React Native Modal bottom sheets, with selected checkmarks and line-scoped station filtering. Sheets dismiss on selection, close, backdrop, Android Back or web Escape. Web uses a centered constrained content column.

Status text distinguishes loading, refreshing, stale data, delays, empty schedules and errors. Never imply a service is normal from missing data. Preserve destination, platform, arrival/departure wording and Racecourse routing.

## Colors

The default 跟隨系統 follows the device. 淺色 and 深色 select the commuter light and dark palettes. In 設定 → 外觀, Little Twin Stars（雙子星） selects a fixed light palette on iOS, Android and web.

Use the Paper roles from `littleTwinStarsTheme` in `ui/theme.ts`. Lavender `primary` marks actions and selected controls. Sky blue and blush pink fill secondary and tertiary containers. Use the matching `on*` roles for text and icons against each surface. Reserve `error` for failures and official line colors for route identification.

## Components

`LittleTwinStarsArtwork` gives each main tab a distinct Kiki and Lala scene. Let the screen gradient show through the transparent artwork. Center the complete 3:1 cover above the controls and let it shrink on narrow phones. The official Sanrio portrait appears separately in Settings and station details, with clouds and cream stars around its panel. Keep artwork outside arrival rows and notices. It ignores touch and stays outside the accessibility tree.

| Variant | Placement |
| --- | --- |
| Tab cover · full content width, 3:1 | A ticket album on Favorites, a route map on Search and an accessible lift on Facilities. |
| Full portrait · 160 units high | Selected theme preview in Settings, with the Sanrio credit beneath it. |
| Compact portrait · 104 units high | Station arrivals and station-specific facilities. |
| Thumbnail · 54 × 36 units | The theme’s radio row in every appearance. The text label and radio indicator identify the option and its selection state. |

Developer Tools uses the active palette and keeps its layout free of character artwork.

The Little Twin Stars appearance uses a stationary sky-to-blush gradient behind each main screen.
A dedicated 88-unit strip below the scroll area carries clouds and railway tracks, keeping all
foreground labels and controls clear of the rails. `LittleTwinStarsBackground` and
`LittleTwinStarsRailway` share decorative color tokens in `ui/theme.ts`. Each gradient has a
unique ID so retained navigation screens render independently on web.

The bottom tabs use 24-unit outlined icons. Kiki sits inside the Favorites star, Lala appears
inside the Search magnifying glass, and Kiki forms the head of the Facilities wheelchair symbol.
Paper retains the selected indicator and Chinese labels. All decorative vectors ignore touch
and remain outside accessibility traversal.
