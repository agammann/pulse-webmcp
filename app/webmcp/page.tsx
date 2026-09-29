import { Database, ShieldCheck, UserRound } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { WebMcpToolList } from '@/components/webmcp-tool-list';

const prompts = [
  'Search Pulse community cases for my product and symptoms. Keep example records separate.',
  'Create a public case using only the details I provided. Use practice: true if I am trying fictional data.',
  'Open my case and show its recorded evidence and unanswered questions.',
  'Record the observation I just reported against its diagnostic step.',
  'Record the attempt, cost, and outcome I actually confirmed.',
  'Show community statistics, excluding fictional examples and practice cases.',
];

export default function WebMcpPage() {
  return (
    <main>
      <SiteHeader />
      <section className="webmcp-hero">
        <div>
          <p className="eyebrow">Agent-native by design</p>
          <h1>
            The interface agents
            <br />
            <span>don’t have to guess.</span>
          </h1>
          <p>
            Pulse exposes real application capabilities through the current
            WebMCP imperative API—no DOM scraping, button hunting, or form
            inference.
          </p>
        </div>
        <div className="registration-code">
          <div>
            <span />
            <span />
            <span />
            <small>webmcp.ts</small>
          </div>
          <pre>
            <code>
              <em>await</em> document.modelContext.registerTool({'{'}
              {`\n`} name: <b>&apos;search_repairs&apos;</b>,{`\n`} description:{' '}
              <b>&apos;Search repair evidence…&apos;</b>,{`\n`} inputSchema:{' '}
              {'{'} <i>{'/* JSON Schema */'}</i> {'}'},{`\n`} annotations: {'{'}{' '}
              readOnlyHint: <em>true</em> {'}'},{`\n`} execute: <em>async</em>{' '}
              (input) =&gt; search(input){`\n`}
              {'}'});
            </code>
          </pre>
        </div>
      </section>
      <section className="webmcp-section">
        <div className="section-heading">
          <div>
            <p className="mono-label">LIVE TOOL REGISTRY</p>
            <h2>Explicit capabilities, typed inputs</h2>
          </div>
          <span>Current API: document.modelContext</span>
        </div>
        <WebMcpToolList />
      </section>
      <section className="permission-model">
        <div>
          <p className="mono-label">TRUST MODEL</p>
          <h2>Transparent by default.</h2>
        </div>
        <div>
          <span>
            <Database />
          </span>
          <h3>Read operations</h3>
          <p>
            Agents may search and retrieve public repair evidence immediately.
          </p>
        </div>
        <div>
          <span>
            <UserRound />
          </span>
          <h3>Human observations</h3>
          <p>
            The agent records what the person actually saw, heard, or tested.
          </p>
        </div>
        <div>
          <span>
            <ShieldCheck />
          </span>
          <h3>Safe mutations</h3>
          <p>
            Creating a case publishes it. Only its creating browser can edit it.
            Cases have no public delete action; export a copy at any time.
          </p>
        </div>
      </section>
      <section className="agent-examples">
        <div>
          <p className="eyebrow">Agent examples</p>
          <h2>Try the complete human + agent loop.</h2>
          <p>
            Use a browser and agent that support WebMCP. The same workflow is
            available through the forms. Mutations use this browser’s edit key;
            agents cannot edit other visitors’ cases.
          </p>
        </div>
        <ol>
          {prompts.map((prompt, index) => (
            <li key={prompt}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <code>“{prompt}”</code>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
