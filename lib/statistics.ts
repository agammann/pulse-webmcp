import type { RepairCase } from './domain.ts';
export function summarizeCases(all: RepairCase[]) {
  const cases = all.filter((item) => !item.demo_record);
  const completed = cases.filter((item) => item.outcome);
  const successful = completed.filter((item) =>
    ['fixed', 'improved'].includes(item.outcome!.outcome),
  );
  const costs = completed
    .map((item) => item.outcome!.cost)
    .sort((a, b) => a - b);
  const middle = Math.floor(costs.length / 2);
  const median = costs.length
    ? costs.length % 2
      ? costs[middle]
      : (costs[middle - 1] + costs[middle]) / 2
    : null;
  const categories = new Map<string, number>();
  for (const item of cases)
    categories.set(item.category, (categories.get(item.category) ?? 0) + 1);
  return {
    total_repair_cases: cases.length,
    completed_cases: completed.length,
    successful_repairs: successful.length,
    example_cases: all.length - cases.length,
    success_rate: completed.length
      ? Math.round((successful.length / completed.length) * 100)
      : null,
    median_recorded_cost: median,
    most_repaired_categories: [...categories]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([category, count]) => ({ category, count })),
    recent_outcomes: completed
      .sort((a, b) =>
        b.outcome!.created_at.localeCompare(a.outcome!.created_at),
      )
      .slice(0, 5),
  };
}
export type RepairStatistics = ReturnType<typeof summarizeCases>;
