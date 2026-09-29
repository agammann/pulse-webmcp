import { seedCases } from '../lib/seed-data.ts';

const categories = [...new Set(seedCases.map((repair) => repair.category))].sort();
const outcomes = seedCases.reduce<Record<string, number>>((counts, repair) => {
  const key = repair.outcome?.outcome ?? 'open';
  counts[key] = (counts[key] ?? 0) + 1;
  return counts;
}, {});

if (seedCases.length < 25) throw new Error(`Expected at least 25 demo repairs, found ${seedCases.length}.`);
if (categories.length < 6) throw new Error(`Expected at least six categories, found ${categories.length}.`);
if (!seedCases.every((repair) => repair.demo_record)) throw new Error('Every synthetic seed must be labeled as a demo record.');

console.log(JSON.stringify({ records: seedCases.length, categories, outcomes }, null, 2));
