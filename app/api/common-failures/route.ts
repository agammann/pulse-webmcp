import { searchRepairs } from '@/lib/database';
import { apiError } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const repairs = await searchRepairs({
      brand: url.searchParams.get('brand') ?? '',
      model: url.searchParams.get('model') ?? '',
      category: url.searchParams.get('category') ?? '',
      limit: 50,
    });
    const groups = Object.values(
      repairs.reduce<
        Record<
          string,
          {
            problem: string;
            reports: number;
            successful_solutions: string[];
            outcomes: Record<string, number>;
          }
        >
      >((acc, item) => {
        const key = item.symptoms[0] ?? item.problem_description;
        const current = acc[key] ?? {
          problem: key,
          reports: 0,
          successful_solutions: [],
          outcomes: {},
        };
        current.reports += 1;
        if (
          item.outcome?.final_fix &&
          ['fixed', 'improved'].includes(item.outcome.outcome)
        )
          current.successful_solutions.push(item.outcome.final_fix);
        const outcome = item.outcome?.outcome ?? 'open';
        current.outcomes[outcome] = (current.outcomes[outcome] ?? 0) + 1;
        acc[key] = current;
        return acc;
      }, {}),
    ).sort((a, b) => b.reports - a.reports);
    return Response.json({
      ok: true,
      source: 'community_self_report',
      sampled_cases: repairs.length,
      sample_limit: 50,
      common_failures: groups,
    });
  } catch (error) {
    return apiError(error);
  }
}
