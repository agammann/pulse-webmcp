import Image from 'next/image';
import {
  ArrowRight,
  Bot,
  Eye,
  HeartHandshake,
  Network,
  ShieldCheck,
  UserRound,
  Wrench,
} from 'lucide-react';
import { SiteHeader } from '@/components/site-header';

const agentTasks = [
  'Searches previous repair cases',
  'Compares successful and failed attempts',
  'Organizes diagnostic steps',
  'Records structured outcomes',
];
const humanTasks = [
  'Identifies the actual object',
  'Observes symptoms and test results',
  'Performs appropriate safe repairs',
  'Verifies what really happened',
];

export default function AboutPage() {
  return (
    <main>
      <SiteHeader />
      <section className="about-hero">
        <p className="eyebrow">The open repair mission</p>
        <h1>
          Humans test the fix.
          <br />
          <span>Agents remember what worked.</span>
        </h1>
        <p>
          Repair knowledge is everywhere and nowhere. Pulse turns individual
          physical-world observations into structured evidence the next
          person—and their agent—can use.
        </p>
        <figure className="mission-image">
          <Image
            src="/og.png"
            width={1536}
            height={1024}
            alt="Pulse timeline connecting human repair observations to reported evidence"
          />
        </figure>
      </section>
      <section className="human-agent-grid">
        <article>
          <span>
            <Bot />
          </span>
          <p className="mono-label">THE AGENT</p>
          <h2>Does the information work.</h2>
          <ul>
            {agentTasks.map((task) => (
              <li key={task}>
                <CheckIcon />
                {task}
              </li>
            ))}
          </ul>
        </article>
        <article>
          <span>
            <UserRound />
          </span>
          <p className="mono-label">THE HUMAN</p>
          <h2>Touches the physical world.</h2>
          <ul>
            {humanTasks.map((task) => (
              <li key={task}>
                <CheckIcon />
                {task}
              </li>
            ))}
          </ul>
        </article>
      </section>
      <section className="mission-loop">
        <div>
          <span>
            <Eye />
          </span>
          <strong>Observe</strong>
          <p>A person describes what is physically happening.</p>
        </div>
        <ArrowRight />
        <div>
          <span>
            <Network />
          </span>
          <strong>Compare</strong>
          <p>An agent retrieves matching repair evidence.</p>
        </div>
        <ArrowRight />
        <div>
          <span>
            <Wrench />
          </span>
          <strong>Test</strong>
          <p>The person performs the next appropriate action.</p>
        </div>
        <ArrowRight />
        <div>
          <span>
            <HeartHandshake />
          </span>
          <strong>Remember</strong>
          <p>The outcome becomes reusable public knowledge.</p>
        </div>
      </section>
      <section className="standards-note">
        <ShieldCheck />
        <div>
          <p className="mono-label">OPEN BY INTENT</p>
          <h2>Inspired by the Open Repair Data Standard.</h2>
          <p>
            Pulse aligns product information, problems, repair status, barriers,
            and outcomes where practical. It is an independent repair journal
            and does not claim affiliation with the Open Repair Alliance.
          </p>
        </div>
      </section>
    </main>
  );
}

function CheckIcon() {
  return <span className="list-check">✓</span>;
}
