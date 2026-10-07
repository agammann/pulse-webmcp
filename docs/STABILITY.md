# Pulse 1.0.1 contract

Pulse is a public journal, not a diagnosis service. A person supplies observations,
attempts, costs, and outcomes. Fictional exercises must be marked as practice.
Cases and exports are public; do not submit private data. No model, paid API key,
or assistant account is required for the ordinary form workflow.

## Journal and editing

A case owns a sequence of diagnostic checks, reported observations, and repair
attempts, plus one current outcome. Correcting an outcome replaces that outcome;
it does not erase the checks or attempts. Professional-recommended cases reject
new diagnostic procedures. Failed form writes preserve entered text. If a
connection fails after submission, reload and check the saved history before
retrying, because the server may already have committed the write.

The creating browser receives an opaque HttpOnly cookie. Only its hash is stored
in D1. That same cookie and database are required for editing. Public JSON exports
contain readable history, not the edit credential. They cannot restore editing,
import a case, or recover a cleared cookie. Pulse has no account or cross-device
edit recovery. A database backup also does not recreate a lost browser cookie.

Feedback is counted once per browser and feedback type. Cookies are not verified
identities. Practice and example records are excluded from community totals.

## Local persistence and recovery

Node 24 and pnpm 11.19.0 are the supported development baseline. `pnpm start`
keeps local D1 under `.wrangler/state`, outside the disposable `dist` directory.
Stopping the Worker, rebuilding, and restarting preserves cases and browser
ownership. Use the same browser profile, host, and scheme when returning.
Local storage is separate from the hosted public D1 database.

Before upgrading from 1.0.0's built Worker, stop it and back up
`dist/server/.wrangler/state` **before running a build**. The previous default
stored local D1 under `dist`; rebuilding removed it. If that directory exists,
copy the complete state to the new location while both Workers are stopped.
Do not overwrite or merge an existing destination. For PowerShell, from the
repository root:

```powershell
if (Test-Path -LiteralPath '.wrangler/state') { throw 'Existing state: back it up and resolve the destination first.' }
New-Item -ItemType Directory -Path '.wrangler' -Force | Out-Null
Copy-Item -LiteralPath 'dist/server/.wrangler/state' -Destination '.wrangler/state' -Recurse
```

For an existing 1.0.1 local database, stop the Worker and copy the entire
`.wrangler/state` directory to a new backup folder outside the repository. Restore
that complete folder to `.wrangler/state` while the Worker is stopped, retaining
the original browser cookie. SQLite sidecars and ownership/vote tables are part
of the backup. Treat database and browser-profile backups as private. This is a
local developer recovery procedure; hosted D1 backup and recovery belong to the
hosting operator and are not controlled by these commands.

## Browser tools

Ordinary browsers keep the full journal workflow. Native WebMCP is experimental;
the browser must expose its real API. `pnpm test:webmcp` checks ten native tools,
shared HTTP/D1 writes, ownership, validation, and lifecycle behavior. The ordinary
suite separately tests form use and a test-only adapter registry. An adapter
registry passing does not prove a browser supports native WebMCP.

## Source and release gate

`pnpm release:package` requires a clean committed tree and creates a source ZIP
with SHA-256 sidecars in `release-artifacts`. The archive contains tracked source,
the lockfile, MIT license, and these guides; it excludes runtime databases, keys,
dependencies, and build output. `scripts/unpack-release.py --out <new-folder>`
checks both sidecars, exact tracked bytes, and safe archive paths before extracting
an independent source consumer. Python 3.12 or newer is needed only for this check.

The main-only publisher verifies the checked commit, tag and source-asset digests. Hosted deployment has a separate acceptance check.
