# Changelog

## 1.0.3

- Bound repair mutation JSON bodies and check editor access before processing owner-only requests.
- Use Cloudflare client IP metadata for the basic instance-local mutation limiter, with a shared anonymous bucket when that metadata is absent.

## 1.0.2

- Replace the unbounded brace dependency with a maintained compatibility package that preserves ordinary glob behavior and the upstream license.
- Reject excessive brace, parenthesis and AST-array nesting before stack exhaustion.
- Require dependency audits without accepted advisories and verify the replacement in freshly installed source distributions.

## 1.0.1

- Keep built-Worker local D1 outside `dist` so rebuilding preserves journal data
  and the creating browser's edit permission.
- Keep the favicon redirect relative to the current origin for local HTTP use.
- Pin available source-map-js, tinypool and sharp patches.
- Document public exports, browser-bound editing, stopped local database recovery,
  and independent source packaging. Add a real rebuild-persistence regression.

## 1.0.0

Public repair journal with ten optional native WebMCP tools, browser-scoped
editing, fictional examples and practice cases, structured observations, attempts,
reported outcomes, and public JSON exports.
