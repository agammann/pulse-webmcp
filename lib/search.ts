import type { RepairCase, RepairSearchResult } from './domain.ts';

const evidenceFor = (item: RepairCase) => ({
  symptom_reports: 1,
  attempts: item.attempt_count ?? item.repair_attempts.length,
  fixed:
    item.outcome?.outcome === 'fixed'
      ? item.votes.worked_for_me + 1
      : item.votes.worked_for_me,
  improved: item.outcome?.outcome === 'improved' ? 1 : 0,
  did_not_work: item.votes.did_not_work,
  recorded_time_minutes: item.outcome?.time_minutes ?? 0,
  recorded_cost: item.outcome ? `$${item.outcome.cost}` : 'Unknown',
});

export function rankRepairCases(
  cases: RepairCase[],
  filters: Record<string, string | number | undefined>,
): RepairSearchResult[] {
  const query = String(filters.query ?? '')
    .toLowerCase()
    .trim();
  const category = String(filters.category ?? '')
    .toLowerCase()
    .trim();
  const brand = String(filters.brand ?? '')
    .toLowerCase()
    .trim();
  const model = String(filters.model ?? '')
    .toLowerCase()
    .trim();
  const symptom = String(filters.symptom ?? '')
    .toLowerCase()
    .trim();
  const outcome = String(filters.outcome ?? '')
    .toLowerCase()
    .trim();
  const difficulty = String(filters.difficulty ?? '')
    .toLowerCase()
    .trim();
  const limit = Math.min(50, Math.max(1, Number(filters.limit ?? 20)));
  const queryTerms = query.split(/[^a-z0-9-]+/).filter(Boolean);
  return cases
    .filter((item) =>
      filters.source === 'community'
        ? !item.demo_record
        : filters.source === 'examples'
          ? item.demo_record
          : true,
    )
    .map((item) => {
      const haystack = [
        item.category,
        item.brand,
        item.model,
        item.product_name,
        item.problem_description,
        ...item.symptoms,
        item.outcome?.final_fix ?? '',
      ]
        .join(' ')
        .toLowerCase();
      const haystackTerms = new Set(
        haystack.split(/[^a-z0-9-]+/).filter(Boolean),
      );
      const queryMatches = queryTerms.filter((term) =>
        haystackTerms.has(term),
      ).length;
      let relevance =
        item.outcome?.outcome === 'fixed'
          ? 12
          : item.outcome?.outcome === 'improved'
            ? 6
            : 0;
      if (query) relevance += haystack.includes(query) ? 45 : queryMatches * 9;
      if (model && item.model.toLowerCase() === model) relevance += 35;
      if (brand && item.brand.toLowerCase().includes(brand)) relevance += 18;
      if (category && item.category.toLowerCase().includes(category))
        relevance += 14;
      if (
        symptom &&
        item.symptoms.some((value) => value.toLowerCase().includes(symptom))
      )
        relevance += 22;
      relevance += Math.min(16, item.votes.worked_for_me);
      return { ...item, relevance, evidence: evidenceFor(item), queryMatches };
    })
    .filter(
      (item) =>
        (!query || item.queryMatches > 0) &&
        (!category || item.category.toLowerCase().includes(category)) &&
        (!brand || item.brand.toLowerCase().includes(brand)) &&
        (!model || item.model.toLowerCase().includes(model)) &&
        (!symptom ||
          item.symptoms.some((value) =>
            value.toLowerCase().includes(symptom),
          )) &&
        (!outcome || item.outcome?.outcome === outcome) &&
        (!difficulty || item.difficulty === difficulty),
    )
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit)
    .map(({ queryMatches: _queryMatches, ...item }) => item);
}
