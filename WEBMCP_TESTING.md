# Pulse browser and WebMCP verification

## Ordinary browser

Create a case with the practice checkbox selected. Add a diagnostic check, record its observation, record an attempt, and save an outcome with notes. Reload, verify every field, and download its JSON export. Open the case in a separate browser profile: it stays readable, but editing is unavailable. The original browser retains editing access while its cookie remains.

Practice and seeded examples are public fictional records. They appear under **Examples / practice** and do not increase community totals. A professional-recommended practice case should omit the proposed-check form and reject that write on the server while still accepting a reported outcome.

## Native WebMCP

Open [Pulse](https://pulse.alx21.chatgpt.site/) in a browser and agent that support WebMCP. Expand the activity dock and check that ten tools registered. The implementation follows the [WebMCP imperative API](https://github.com/webmachinelearning/webmcp/blob/main/README.md). Browser support changes; absence of the API is shown explicitly and does not disable forms.

1. Call `search_repairs` with `{ "source": "examples", "query": "controller stick drift", "limit": 5 }`. Check that each result identifies fictional/example provenance.
2. Call `get_repair_case` with a returned ID. Check complete JSON, all steps, attempts, outcome fields, and `can_edit`.
3. Call `create_repair_case` with a clearly fictional desk-accessory example and **`practice: true`**. Supply category, brand, model, product_name, problem_description, symptoms, and safety_classification.
4. Open the returned case page. On this new practice case, call `add_diagnostic_step`, `add_diagnostic_result`, `record_repair_attempt`, and `record_repair_outcome` with fictional text explicitly labeled as such. For real cases, record only what a person actually reported.
5. Verify the visible timeline after each change. Reload and retrieve it again to prove durable state, not just a UI update.
6. Call `mark_case_helpful` twice with the same type. Its count should increase only once for this browser.
7. Call `list_common_failures` and `get_repair_statistics`. The sample limit is disclosed, and the new practice case affects only the separate example count.

Use the registered schemas for required fields and limits. Agents share the browser cookie and cannot edit cases owned by other browsers. Reads and exports reveal no edit key or stored hash.

## Automated checks

`pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `pnpm test:e2e` are required. Playwright uses real local D1 through the built Worker. Its adapter test captures registrations in a **test-only stand-in**, so a passing adapter test does not establish native browser support. Native registration and calls must be checked separately after deployment.

Negative cases include wrong types/ranges, unknown tool fields, another browser attempting an edit, repeated votes, professional diagnostic proposals, and a failed search request. Preserve the prior seven workflow tests; actual database/browser coverage lives in `e2e/repair.spec.ts`.
