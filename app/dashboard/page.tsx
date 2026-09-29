import { DashboardView } from '@/components/dashboard-view';
import { SiteHeader } from '@/components/site-header';

export default function DashboardPage() {
  return (
    <main>
      <SiteHeader />
      <section className="page-intro dashboard-intro">
        <p className="eyebrow">Open repair network</p>
        <h1>
          Repair knowledge that
          <br />
          <span>grows through use.</span>
        </h1>
        <p>
          Saved community cases and self-reported outcomes, with fictional
          examples kept separate.
        </p>
      </section>
      <DashboardView />
    </main>
  );
}
