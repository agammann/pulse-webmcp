# Security and safety

## Reporting

Report vulnerabilities privately to the repository owner using GitHub private vulnerability reporting when available. Include affected routes, versions, conditions, and observed impact. Avoid publishing credentials or personal data.

## Data boundaries

Pulse stores public repair journals. It does not store provider credentials or offer private records. Case text is untrusted content, rendered through React and returned as tool data, never evaluated or incorporated into trusted tool metadata.

New cases are tied to a browser edit cookie. The cookie is opaque, HttpOnly, SameSite=Strict, Secure on HTTPS, and expires after one year. D1 stores a SHA-256 hash. Only that browser can write the case's checks, observations, attempts, and outcome. Existing unowned cases cannot be claimed through the public application. Losing the cookie loses edit access; an export is not a recovery key.

Reads are public. Writes require JSON, validate field bounds/enums, check cross-origin request metadata, and use parameterized SQL. Unknown tool properties are rejected by the page-side schema validator. HTTP parsing selects recognized fields. Feedback is deduplicated per case/type/browser. The instance-local IP limiter is a basic abuse limit, not a durable identity or anti-spam service.

Response headers set CSP, HSTS, content-type protection, framing restrictions, referrer policy, and permissions policy. No public delete action or tool exists. There is no moderation interface, authenticated contributor identity, edit recovery, or revision archive for corrected observations/outcomes. Operators should review these limitations before hosting a large public community.

## Physical observations

Safety classification is supplied by the contributor, not automatically verified. Pulse is a record-keeping tool, not a diagnosis or safety certification. Cases classified `professional_recommended` stay readable, but their diagnostic-step endpoint refuses new procedural instructions. People report physical observations and completed attempts; agents organize those reports. Fictional examples and practice records are explicitly separated from community totals.
