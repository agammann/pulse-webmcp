import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RepairDetail } from '@/components/repair-detail';
import { SiteHeader } from '@/components/site-header';
import { getRepairCase } from '@/lib/database';
import { seedCases } from '@/lib/seed-data';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const repair = seedCases.find((item) => item.id === id);
  if (!repair)
    return {
      title: `${id} · Pulse`,
      openGraph: { images: [] },
      twitter: { images: [] },
    };
  const title = `${repair.problem_description} · Pulse`;
  const description = `${repair.brand} ${repair.product_name}: ${repair.outcome?.final_fix ?? repair.symptoms.join(', ')}`;
  return {
    title,
    description,
    openGraph: { title, description, images: [] },
    twitter: { title, description, images: [] },
  };
}

export default async function RepairPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const repair = await getRepairCase(id);
  if (!repair) notFound();
  return (
    <main>
      <SiteHeader />
      <RepairDetail key={repair.id} initialRepair={repair} />
    </main>
  );
}
