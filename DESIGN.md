# Commuter interface

The approved direction is a mobile-first Material utility: neutral surfaces, navy actions, system Chinese typography, restrained borders, and official line colors used only as route identifiers. Favorites open first; one expanded station supplies compact arrivals. Detail sections emphasize the next train, then quieter subsequent rows.

Use `ui/theme.ts` for semantic light/dark themes, spacing and content width. Controls retain Paper feedback and native navigation; use no decorative motion. Body text wraps and scales. Tap targets are at least 48 units. Search selectors use Material fields and accessible React Native Modal bottom sheets, with selected checkmarks and line-scoped station filtering. Sheets dismiss on selection, close, backdrop, Android Back or web Escape. Web uses a centered constrained content column.

Status text distinguishes loading, refreshing, stale data, delays, empty schedules and errors. Never imply a service is normal from missing data. Preserve destination, platform, arrival/departure wording and Racecourse routing.
