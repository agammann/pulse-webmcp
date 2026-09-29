import { SiteHeader } from '@/components/site-header';
import { HomeStatistics } from '@/components/home-statistics';
import {
  ArrowRight,
  Bot,
  Check,
  CircleDot,
  Search,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';

const evidence = [
  { value: '12', label: 'reported this symptom' },
  { value: '8', label: 'attempted this repair' },
  { value: '6', label: 'reported fixed' },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <SiteHeader />

      <section className="hero-shell">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles /> Open repair memory for humans and agents
          </div>
          <h1>
            Broken before?
            <br />
            <span>Someone may have already fixed it.</span>
          </h1>
          <p className="hero-lede">
            Keep a public repair journal. Search reported outcomes, record what
            you tried, and share what happened—with or without an agent.
          </p>

          <form className="hero-search" action="/repairs">
            <Search aria-hidden="true" />
            <label className="sr-only" htmlFor="hero-query">
              Search repairs
            </label>
            <input
              id="hero-query"
              name="query"
              placeholder="Try “controller stick drift”"
            />
            <button type="submit">
              Search repairs <ArrowRight />
            </button>
          </form>

          <div className="connection-note">
            <span className="status-dot" />
            <strong>Agent connected?</strong>
            Pulse exposes structured repair tools directly through WebMCP.
          </div>

          <HomeStatistics />
        </div>

        <div className="evidence-stage" aria-label="Example repair evidence">
          <div className="case-card">
            <div className="case-card-top">
              <span className="case-category">
                <CircleDot /> Game controllers
              </span>
              <span className="risk-chip">
                <ShieldCheck /> Low risk
              </span>
            </div>
            <p className="case-id">ILLUSTRATIVE EXAMPLE · FICTIONAL DATA</p>
            <h2>Left analog stick drifts upward</h2>
            <p>DualSense Wireless Controller · CFI-ZCT1W</p>
            <div className="symptom-row">
              <span>ghost input</span>
              <span>stick drift</span>
              <span>deadzone</span>
            </div>
            <div className="evidence-panel">
              <div className="evidence-heading">
                <span>
                  <Check /> Repair evidence
                </span>
                <strong>6 fixed</strong>
              </div>
              <div className="evidence-grid">
                {evidence.map((item) => (
                  <div key={item.label}>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="evidence-foot">
                <span>
                  Example time <strong>24 min</strong>
                </span>
                <span>
                  Example cost <strong>$8–$15</strong>
                </span>
              </div>
            </div>
          </div>

          <aside className="agent-card">
            <div className="agent-card-title">
              <span>
                <Bot />
              </span>
              <div>
                <strong>Agent activity</strong>
                <small>Example agent workflow</small>
              </div>
            </div>
            <ol>
              <li>
                <span>
                  <Search />
                </span>
                <div>
                  <strong>Search repair history</strong>
                  <small>Compare symptoms and prior attempts</small>
                </div>
              </li>
              <li>
                <span>
                  <CircleDot />
                </span>
                <div>
                  <strong>Open a matching case</strong>
                  <small>Read its observations and limitations</small>
                </div>
              </li>
              <li className="active">
                <span>
                  <Wrench />
                </span>
                <div>
                  <strong>Ready to troubleshoot</strong>
                  <small>Ask your agent to start a case</small>
                </div>
              </li>
            </ol>
          </aside>
        </div>
      </section>

      <section className="workflow-strip" aria-label="How Pulse works">
        <div>
          <span>01</span>
          <strong>Describe the symptom</strong>
          <p>Share what you see, hear, or feel.</p>
        </div>
        <ArrowRight aria-hidden="true" />
        <div>
          <span>02</span>
          <strong>Test with your agent</strong>
          <p>Compare evidence and record observations.</p>
        </div>
        <ArrowRight aria-hidden="true" />
        <div>
          <span>03</span>
          <strong>Remember the outcome</strong>
          <p>Your result helps the next repair.</p>
        </div>
      </section>
    </main>
  );
}
