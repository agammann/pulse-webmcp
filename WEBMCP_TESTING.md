# Pulse browser and WebMCP verification

## Ordinary browser

Create a case with the practice checkbox selected. Add a diagnostic check, record its observation, record an attempt, and save an outcome with notes. Reload, verify every field, and download its JSON export. Open the case in a separate browser profile: it stays readable, but editing is unavailable. The original browser retains editing access while its cookie remains.

Practice and seeded examples are public fictional records. They appear under **Examples / practice** and do not increase community totals. A professional-recommended practice case should omit the proposed-check form and reject that write on the server while still accepting a reported outcome.

## Native WebMCP

Open [Pulse](https://pulse.alx21.chatgpt.site/) in a browser and agent that support WebMCP. WebMCP is experimental: the native automated suite launches an isolated Chrome or Edge profile with `--enable-features=WebMCP`. See [Chrome's current setup instructions](https://developer.chrome.com/docs/ai/webmcp). Ordinary unflagged browsers keep the forms and show tools as unavailable. Expand the activity dock and check that ten tools registered. The implementation follows the [WebMCP imperative API](https://github.com/webmachinelearning/webmcp/blob/main/README.md).

1. Call `search_repairs` with `{ "source": "examples", "query": "controller stick drift", "limit": 5 }`. Check that each result identifies fictional/example provenance.
2. Call `get_repair_case` with a returned ID. Check complete JSON, all steps, attempts, outcome fields, and `can_edit`.
3. Call `create_repair_case` with a clearly fictional desk-accessory example and **`practice: true`**. Supply category, brand, model, product_name, problem_description, symptoms, and safety_classification.
4. Open the returned case page. On this new practice case, call `add_diagnostic_step`, `add_diagnostic_result`, `record_repair_attempt`, and `record_repair_outcome` with fictional text explicitly labeled as such. For real cases, record only what a person actually reported.
5. Verify the visible timeline after each change. Reload and retrieve it again to prove durable state, not just a UI update.
6. Call `mark_case_helpful` twice with the same type. Its count should increase only once for this browser.
7. Call `list_common_failures` and `get_repair_statistics`. The sample limit is disclosed, and the new practice case affects only the separate example count.

Use the registered schemas for required fields and limits. Agents share the browser cookie and cannot edit cases owned by other browsers. Reads and exports reveal no edit key or stored hash.

## Automated checks

Run the release checks from a fresh checkout:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm seed:check
pnpm lint
pnpm typecheck
pnpm audit
pnpm exec playwright install chromium chrome
pnpm build
pnpm test:e2e
pnpm test:webmcp
pnpm test:persistence
```

The persistence regression uses a separate local port (3019 by default), saves a fictional case in actual D1, stops the Worker, rebuilds it, and checks the exact case and same-cookie edit permission after restarting. Set `PULSE_PERSISTENCE_PORT` to another free port if needed. Its local fixture remains in the isolated database. See [STABILITY](docs/STABILITY.md) for the stopped backup/restore procedure and export limitations.

The ordinary suite uses the built Worker on port 3015; the native suite uses port 3017. Both use real project-local D1. Run suites sequentially because their database directory is shared. The adapter test captures registrations in a **test-only stand-in**. The separate native suite verifies `[native code]`, discovers all ten schemas, titles and annotations, then calls every tool through `document.modelContext.executeTool` without replacing the API. It checks visible updates after every journal write, database persistence and export, duplicate feedback, unchanged community totals, thirteen invalid inputs, browser ownership, professional cases, cleanup, actual back-forward caching and reload.

For an installed Edge, use PowerShell:

```powershell
$env:PULSE_WEBMCP_CHANNEL = 'msedge'
pnpm test:webmcp
Remove-Item Env:PULSE_WEBMCP_CHANNEL
```

For public-site verification:

```powershell
$env:PULSE_WEBMCP_URL = 'https://pulse.alx21.chatgpt.site'
pnpm test:webmcp
Remove-Item Env:PULSE_WEBMCP_URL
```

Remote runs deliberately skip fixture-writing tests and run two native discovery/read/lifecycle tests. Perform the controlled practice journal above once with a connected browser agent to verify public writes. Registrations are aborted on page hide and restored on `pageshow` when its `persisted` flag is true. Local tests require actual cache restoration; remote checks record whether the host allowed it. CI runs native Chrome and uploads `test-results/` even on success. JSON reports include the exact browser version and cache result. See the dated compatibility record in [README](README.md).

Negative cases include wrong types/ranges, unknown tool fields, another browser attempting an edit, repeated votes, professional diagnostic proposals, and a failed search request. Preserve the prior seven workflow tests; actual database/browser coverage lives in `e2e/repair.spec.ts`.
