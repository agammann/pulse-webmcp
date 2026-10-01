'use client';

import { useEffect, useState } from 'react';
import { Bot, CheckCircle2, Eye, PencilLine } from 'lucide-react';

const tools = [
  ['search_repairs', 'Search the public repair knowledge base', 'read'],
  [
    'get_repair_case',
    'Retrieve the complete structured repair history',
    'read',
  ],
  ['create_repair_case', 'Create a public repair case', 'write'],
  ['add_diagnostic_step', 'Add a proposed diagnostic step', 'write'],
  ['add_diagnostic_result', 'Record the human’s observation', 'write'],
  ['record_repair_attempt', 'Document an attempted repair and parts', 'write'],
  ['record_repair_outcome', 'Record the person’s reported outcome', 'write'],
  ['mark_case_helpful', 'Add self-reported feedback', 'write'],
  ['list_common_failures', 'Compare recurring problems and solutions', 'read'],
  ['get_repair_statistics', 'Return aggregate repair statistics', 'read'],
];

export function WebMcpToolList() {
  const [detected, setDetected] = useState<boolean | null>(null);
  const [registered, setRegistered] = useState<string[]>([]);
  useEffect(() => {
    const context = document.modelContext ?? navigator.modelContext;
    const detectionTimer = window.setTimeout(
      () => setDetected(Boolean(context)),
      0,
    );
    if (!context) return () => window.clearTimeout(detectionTimer);
    let disposed = false;
    const inspect = async () => {
      try {
        const items = (await context.getTools?.()) ?? [];
        if (!disposed) setRegistered(items.map((item) => item.name));
      } catch {
        if (!disposed) setRegistered([]);
      }
    };
    const refresh = () => void inspect();
    const onHide = () => setRegistered([]);
    const onShow = (event: PageTransitionEvent) => {
      if (event.persisted) refresh();
    };
    context.addEventListener?.('toolchange', refresh);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('pageshow', onShow);
    const toolsTimer = window.setTimeout(refresh, 0);
    return () => {
      disposed = true;
      window.clearTimeout(detectionTimer);
      window.clearTimeout(toolsTimer);
      context.removeEventListener?.('toolchange', refresh);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('pageshow', onShow);
    };
  }, []);
  return (
    <>
      <div
        className={`webmcp-availability ${detected === false ? 'missing' : ''}`}
      >
        <span>{detected === false ? <Bot /> : <CheckCircle2 />}</span>
        <div>
          <strong>
            {detected === false
              ? 'WebMCP not detected'
              : detected === null
                ? 'Checking WebMCP…'
                : registered.length
                  ? 'WebMCP available'
                  : 'WebMCP detected'}
          </strong>
          <p>
            {detected === false
              ? 'The human interface remains fully available in ordinary browsers.'
              : `${registered.length} structured tools verified on this page.`}
          </p>
        </div>
      </div>
      <div className="tool-table">
        <div className="tool-table-head">
          <span>Tool</span>
          <span>Capability</span>
          <span>Permission</span>
          <span>Status</span>
        </div>
        {tools.map(([name, description, mode], index) => (
          <div className="tool-row" key={name}>
            <span className="tool-name">
              <i>{String(index + 1).padStart(2, '0')}</i>
              <code>{name}</code>
            </span>
            <span>{description}</span>
            <span className={`permission ${mode}`}>
              {mode === 'read' ? <Eye /> : <PencilLine />}
              {mode === 'read' ? 'Read only' : 'Mutates state'}
            </span>
            <span
              className="registered"
              style={
                registered.includes(name)
                  ? undefined
                  : { color: 'var(--muted-foreground)' }
              }
            >
              {registered.includes(name) ? <CheckCircle2 /> : <Bot />}
              {detected === false
                ? 'Unavailable'
                : registered.includes(name)
                  ? 'Registered'
                  : 'Pending'}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
