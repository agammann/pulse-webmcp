'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  CircleAlert,
  Radio,
  Search,
  Wrench,
} from 'lucide-react';
import type {
  AgentActivity,
  RepairCase,
  RepairSearchResult,
} from '@/lib/domain';
import { validateToolInput } from '@/lib/tool-input';
import { webMcpToolContracts } from '@/lib/webmcp-contracts';

type Status = 'checking' | 'available' | 'unavailable';

const json = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const headers = new Headers(init?.headers);
  if (!headers.has('content-type'))
    headers.set('content-type', 'application/json');
  const response = await fetch(path, { ...init, headers });
  const data: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof data.error === 'string'
        ? data.error
        : 'Pulse request failed.';
    throw new Error(message);
  }
  return data as T;
};

const slimCase = (repair: RepairCase | RepairSearchResult) => ({
  case_id: repair.id,
  record_source: repair.demo_record
    ? 'example_or_practice'
    : 'community_self_report',
  product: `${repair.brand} ${repair.product_name}`,
  model: repair.model,
  problem: repair.problem_description,
  symptoms: repair.symptoms,
  outcome: repair.outcome?.outcome ?? repair.status,
  final_fix: repair.outcome?.final_fix ?? null,
  safety_classification: repair.safety_classification,
  difficulty: repair.difficulty,
  evidence: 'evidence' in repair ? repair.evidence : repair.votes,
});

type RepairPayload = { repair: RepairCase; can_edit?: boolean };

export function WebMcpProvider() {
  const [status, setStatus] = useState<Status>('checking');
  const [activity, setActivity] = useState<AgentActivity[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState('Waiting for an agent');

  const refreshActivity = useCallback(async () => {
    try {
      const data = await json<{ activity: AgentActivity[] }>(
        '/api/activity?limit=6',
      );
      setActivity(data.activity);
    } catch {
      /* Static preview has no D1 binding. */
    }
  }, []);

  useEffect(() => {
    const onMutation = (event: Event) => {
      const detail = (event as CustomEvent<{ description?: string }>).detail;
      setMessage(detail?.description ?? 'The page was updated through WebMCP');
      void refreshActivity();
    };
    window.addEventListener('pulse:mutated', onMutation);
    return () => window.removeEventListener('pulse:mutated', onMutation);
  }, [refreshActivity]);

  const toolDefinitions = useMemo<WebMcpTool[]>(() => {
    const changed = (description: string, repair?: RepairCase) => {
      window.dispatchEvent(
        new CustomEvent('pulse:mutated', { detail: { description, repair } }),
      );
    };
    return [
      {
        ...webMcpToolContracts.searchRepairs,
        execute: async (input) => {
          const query = new URLSearchParams(
            Object.entries(input)
              .filter(([, value]) => value !== undefined)
              .map(([key, value]) => [key, String(value)]),
          );
          const data = await json<{
            count: number;
            repairs: RepairSearchResult[];
          }>(`/api/repairs?${query}`);
          setMessage(`ChatGPT searched repairs · ${data.count} matches`);
          return JSON.stringify({
            count: data.count,
            repairs: data.repairs.map(slimCase),
          });
        },
      },
      {
        ...webMcpToolContracts.getRepairCase,
        execute: async ({ case_id }) => {
          const caseId = String(case_id);
          const data = await json<RepairPayload>(
            `/api/repairs/${encodeURIComponent(caseId)}`,
          );
          setMessage(`ChatGPT opened ${caseId}`);
          return JSON.stringify({
            ...slimCase(data.repair),
            can_edit: data.can_edit,
            outcome_record: data.repair.outcome,
            diagnostic_steps: data.repair.diagnostic_steps,
            repair_attempts: data.repair.repair_attempts,
          });
        },
      },
      {
        ...webMcpToolContracts.createRepairCase,
        execute: async (input) => {
          const data = await json<RepairPayload>('/api/repairs', {
            method: 'POST',
            body: JSON.stringify(input),
          });
          changed(`ChatGPT created ${data.repair.id}`, data.repair);
          return JSON.stringify({
            created: true,
            case: slimCase(data.repair),
            page: `/repairs/${data.repair.id}`,
          });
        },
      },
      {
        ...webMcpToolContracts.addDiagnosticStep,
        execute: async ({ case_id, ...input }) => {
          const caseId = String(case_id);
          const data = await json<RepairPayload>(
            `/api/repairs/${encodeURIComponent(caseId)}/steps`,
            { method: 'POST', body: JSON.stringify(input) },
          );
          changed(`ChatGPT added a diagnostic step to ${caseId}`, data.repair);
          return JSON.stringify({
            updated: true,
            case_id: caseId,
            diagnostic_step: data.repair.diagnostic_steps.at(-1),
          });
        },
      },
      {
        ...webMcpToolContracts.addDiagnosticResult,
        execute: async ({ case_id, ...input }) => {
          const caseId = String(case_id);
          const data = await json<RepairPayload>(
            `/api/repairs/${encodeURIComponent(caseId)}/results`,
            { method: 'POST', body: JSON.stringify(input) },
          );
          changed(`Human observation recorded for ${caseId}`, data.repair);
          return JSON.stringify({
            updated: true,
            case_id: caseId,
            diagnostic_steps: data.repair.diagnostic_steps,
          });
        },
      },
      {
        ...webMcpToolContracts.recordRepairAttempt,
        execute: async ({ case_id, ...input }) => {
          const caseId = String(case_id);
          const data = await json<RepairPayload>(
            `/api/repairs/${encodeURIComponent(caseId)}/attempts`,
            { method: 'POST', body: JSON.stringify(input) },
          );
          changed(
            `ChatGPT recorded a repair attempt for ${caseId}`,
            data.repair,
          );
          return JSON.stringify({
            updated: true,
            case_id: caseId,
            repair_attempt: data.repair.repair_attempts.at(-1),
          });
        },
      },
      {
        ...webMcpToolContracts.recordRepairOutcome,
        execute: async ({ case_id, ...input }) => {
          const caseId = String(case_id);
          const data = await json<RepairPayload>(
            `/api/repairs/${encodeURIComponent(caseId)}/outcome`,
            { method: 'POST', body: JSON.stringify(input) },
          );
          changed(
            `ChatGPT recorded ${String(input.outcome)} for ${caseId}`,
            data.repair,
          );
          return JSON.stringify({ updated: true, case: slimCase(data.repair) });
        },
      },
      {
        ...webMcpToolContracts.markCaseHelpful,
        execute: async ({ case_id, vote_type }) => {
          const caseId = String(case_id);
          const data = await json<RepairPayload>(
            `/api/repairs/${encodeURIComponent(caseId)}/votes`,
            { method: 'POST', body: JSON.stringify({ vote_type }) },
          );
          changed(
            `Community marked ${caseId} as ${String(vote_type).replaceAll('_', ' ')}`,
            data.repair,
          );
          return JSON.stringify({
            updated: true,
            case_id: caseId,
            votes: data.repair.votes,
          });
        },
      },
      {
        ...webMcpToolContracts.listCommonFailures,
        execute: async (input) => {
          const query = new URLSearchParams(
            Object.entries(input).map(([key, value]) => [key, String(value)]),
          );
          const data = await json<{
            common_failures: unknown[];
            sampled_cases: number;
            sample_limit: number;
            source: string;
          }>(`/api/common-failures?${query}`);
          setMessage('ChatGPT compared common failures');
          return JSON.stringify(data);
        },
      },
      {
        ...webMcpToolContracts.getRepairStatistics,
        execute: async () => {
          const data = await json<{ statistics: unknown }>('/api/statistics');
          setMessage('ChatGPT reviewed repair statistics');
          return JSON.stringify(data.statistics);
        },
      },
    ];
  }, []);

  useEffect(() => {
    const context = document.modelContext ?? navigator.modelContext;
    if (!context) {
      const timer = window.setTimeout(() => setStatus('unavailable'), 0);
      return () => window.clearTimeout(timer);
    }
    const controller = new AbortController();
    void Promise.all(
      toolDefinitions.map((tool) =>
        context.registerTool(
          {
            ...tool,
            execute: async (input, options) => {
              options?.signal?.throwIfAborted();
              validateToolInput(tool.inputSchema, input);
              return tool.execute(input, options);
            },
          },
          { signal: controller.signal },
        ),
      ),
    )
      .then(() => {
        setStatus('available');
        setMessage(`${toolDefinitions.length} WebMCP tools registered`);
        void refreshActivity();
      })
      .catch(() => {
        controller.abort();
        setStatus('unavailable');
      });
    return () => controller.abort();
  }, [refreshActivity, toolDefinitions]);

  return (
    <aside
      className={`webmcp-dock ${expanded ? 'expanded' : ''}`}
      aria-label="Agent activity"
    >
      <button
        className="dock-summary"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <span className={`dock-icon ${status}`}>
          <Bot />
        </span>
        <span>
          <strong>Agent activity</strong>
          <small>{message}</small>
        </span>
        {status === 'available' ? (
          <CheckCircle2 className="dock-state" />
        ) : status === 'unavailable' ? (
          <CircleAlert className="dock-state" />
        ) : (
          <Radio className="dock-state pulse" />
        )}
      </button>
      {expanded && (
        <div className="dock-body">
          <div className="dock-status">
            <span className={`status-dot ${status}`} /> WebMCP{' '}
            {status === 'available'
              ? 'available'
              : status === 'unavailable'
                ? 'not detected · human interface remains available'
                : 'checking'}
          </div>
          <ol>
            {activity.length ? (
              activity.map((item) => (
                <li key={item.id}>
                  <span>
                    {item.tool_name.includes('search') ? (
                      <Search />
                    ) : (
                      <Wrench />
                    )}
                  </span>
                  <div>
                    <strong>{item.description}</strong>
                    <small>
                      {new Date(item.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </small>
                  </div>
                </li>
              ))
            ) : (
              <li>
                <span>
                  <Radio />
                </span>
                <div>
                  <strong>Ready for an agent</strong>
                  <small>Tools appear when WebMCP is available.</small>
                </div>
              </li>
            )}
          </ol>
          <Link href="/webmcp">
            View all {toolDefinitions.length} registered tools
          </Link>
        </div>
      )}
    </aside>
  );
}
