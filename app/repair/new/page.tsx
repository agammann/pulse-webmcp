import { NewRepairForm } from '@/components/new-repair-form';
import { SiteHeader } from '@/components/site-header';

export default function NewRepairPage() {
  return (
    <main>
      <SiteHeader />
      <section className="page-intro form-intro">
        <p className="eyebrow">Start a structured repair trail</p>
        <h1>
          The object is physical.
          <br />
          <span>The memory is shared.</span>
        </h1>
        <p>
          Tell Pulse what you own and what you observe. Your agent can organize
          the next steps; you stay in control of the physical repair.
        </p>
      </section>
      <NewRepairForm />
    </main>
  );
}
