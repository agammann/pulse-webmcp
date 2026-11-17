# Changelog

## 1.0.4

- Update Vite from 8.2.4 to 8.3.7 with its patched Rolldown dependency for [GHSA-p4f5-76q4-ffq7](https://github.com/vitejs/vite/security/advisories/GHSA-p4f5-76q4-ffq7). The affected condition is a development server explicitly exposed to the network, not the deployed production Worker.
- Align the PostCSS tooling on 8.5.33 so the updated Vite and existing Tailwind plugin share compatible types without weakening configuration checks.
- Keep RSC server chunks beside the generated Worker manifests so the updated bundler's split entry resolves its sidecars and starts correctly. Client asset paths are unchanged.
- Deliver the current tested React, chart, TypeScript, RSC plugin and CI changes with their frozen lockfile under a matching source version.
- Align source-download and current v1 recovery guidance while preserving dated verification history, browser ownership, D1 schema, practice-data separation and all ten WebMCP contracts.

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
