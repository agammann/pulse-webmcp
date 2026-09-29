'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Filter,
  LoaderCircle,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { RepairCard } from './repair-card';
import { seedCases } from '@/lib/seed-data';
import type { RepairSearchResult } from '@/lib/domain';

export function SearchExplorer({
  initialQuery = '',
  initialSource = 'community',
}: {
  initialQuery?: string;
  initialSource?: string;
}) {
  const [source, setSource] = useState(initialSource);
  const requestId = useRef(0);
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState('');
  const [outcome, setOutcome] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [results, setResults] = useState<RepairSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = useMemo(
    () => [...new Set(seedCases.map((item) => item.category))].sort(),
    [],
  );

  const runSearch = useCallback(
    async (filters: {
      query: string;
      category: string;
      outcome: string;
      difficulty: string;
      source: string;
    }) => {
      const request = ++requestId.current;
      const {
        query: searchQuery,
        category: searchCategory,
        outcome: searchOutcome,
        difficulty: searchDifficulty,
      } = filters;
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        limit: '50',
        source: filters.source,
      });
      if (searchQuery.trim()) params.set('query', searchQuery.trim());
      if (searchCategory) params.set('category', searchCategory);
      if (searchOutcome) params.set('outcome', searchOutcome);
      if (searchDifficulty) params.set('difficulty', searchDifficulty);
      try {
        const response = await fetch(`/api/repairs?${params}`);
        const data = (await response.json()) as {
          repairs: RepairSearchResult[];
          error?: string;
        };
        if (!response.ok) throw new Error(data.error ?? 'Search failed.');
        if (request === requestId.current) setResults(data.repairs);
      } catch {
        if (request === requestId.current) {
          setResults([]);
          setError(
            'Search is unavailable. Try again; no example records have been substituted.',
          );
        }
      } finally {
        if (request === requestId.current) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const timer = window.setTimeout(
      () =>
        void runSearch({
          query: initialQuery,
          category: '',
          outcome: '',
          difficulty: '',
          source: initialSource,
        }),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [initialQuery, initialSource, runSearch]);

  return (
    <div className="explorer-layout">
      <aside className="filter-panel">
        <div className="filter-title">
          <Filter /> <strong>Filter evidence</strong>
        </div>
        <label>
          Record source
          <select
            value={source}
            onChange={(event) => {
              setSource(event.target.value);
              void runSearch({
                query,
                category,
                outcome,
                difficulty,
                source: event.target.value,
              });
            }}
          >
            <option value="community">Community cases</option>
            <option value="examples">Examples / practice</option>
            <option value="all">All records</option>
          </select>
        </label>
        <label>
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Outcome
          <select
            value={outcome}
            onChange={(event) => setOutcome(event.target.value)}
          >
            <option value="">Any outcome</option>
            <option value="fixed">Fixed</option>
            <option value="improved">Improved</option>
            <option value="not_fixed">Not fixed</option>
            <option value="professional_repair_required">
              Professional repair
            </option>
            <option value="replacement_required">Replacement</option>
            <option value="abandoned">Abandoned</option>
          </select>
        </label>
        <label>
          Difficulty
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
          >
            <option value="">Any difficulty</option>
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>
        <button
          className="secondary-button"
          onClick={() =>
            void runSearch({ query, category, outcome, difficulty, source })
          }
        >
          <SlidersHorizontal /> Apply filters
        </button>
        {(category || outcome || difficulty) && (
          <button
            className="text-button"
            onClick={() => {
              setCategory('');
              setOutcome('');
              setDifficulty('');
              void runSearch({
                query,
                category: '',
                outcome: '',
                difficulty: '',
                source,
              });
            }}
          >
            Clear filters <X />
          </button>
        )}
        <div className="filter-note">
          <strong>Evidence, not confidence.</strong>
          <p>
            We show what people attempted and what actually happened—not an
            unexplained AI score.
          </p>
        </div>
      </aside>
      <section className="results-panel">
        <form
          className="explorer-search"
          onSubmit={(event) => {
            event.preventDefault();
            void runSearch({ query, category, outcome, difficulty, source });
          }}
        >
          <Search />
          <label className="sr-only" htmlFor="repair-query">
            Search the repair memory
          </label>
          <input
            id="repair-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Brand, model, symptom, or problem"
          />
          <button type="submit">
            {loading ? <LoaderCircle className="spin" /> : 'Search'}
          </button>
        </form>
        <div className="results-heading">
          <div>
            <p className="mono-label">PUBLIC REPAIR MEMORY</p>
            <h1>
              {loading
                ? 'Searching repair evidence…'
                : `${results.length} repair cases`}
            </h1>
          </div>
          <span>
            Ranked by model match, symptom overlap, outcome, and reported
            feedback.
          </span>
        </div>
        <p className="inline-notice">
          Showing up to 50 matches. Examples and practice cases contain
          fictional data; community outcomes are self-reported.
        </p>
        {error && <p className="inline-notice">{error}</p>}
        <div className="repair-grid">
          {results.map((repair) => (
            <RepairCard key={repair.id} repair={repair} />
          ))}
        </div>
        {!loading && !results.length && (
          <div className="empty-state">
            <Search />
            <h2>No matching repair evidence yet</h2>
            <p>
              Start a case and help create the first reported trail for this
              problem.
            </p>
            <Link href="/repair/new">Start this repair</Link>
          </div>
        )}
      </section>
    </div>
  );
}
