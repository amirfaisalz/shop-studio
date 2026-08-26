'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileArchive,
  Loader2,
  RefreshCw,
  Store,
  X,
} from 'lucide-react';
import { getLatestExport, type ThemeExportRow } from '@/lib/exports';
import { runShopifyExport, type RunExportResult } from '@/lib/shopify/export';
import type { ExportPage, ExportProgress, ExportStepId } from '@/lib/shopify/types';

/**
 * "Export to Shopify" dialog (AGENTS.md §10/§16). Orchestrates the full flow:
 * check for an existing export, run the client-side export with live progress,
 * and show success (Download ZIP) or a retryable error. The dialog is
 * non-closable while an export is in progress so a run can't be interrupted or
 * duplicated.
 */

type DialogState = 'checking' | 'existing' | 'exporting' | 'success' | 'error';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  pages: ExportPage[];
  themeCss: string;
  styleGuide: string | null;
}

const STEP_LIST: { id: ExportStepId; label: string }[] = [
  { id: 'analyze', label: 'Analyzing generated pages' },
  { id: 'convert', label: 'Converting HTML into Shopify Liquid' },
  { id: 'sections', label: 'Generating reusable sections' },
  { id: 'templates', label: 'Creating templates and snippets' },
  { id: 'assets', label: 'Processing images and assets' },
  { id: 'validate', label: 'Validating the Shopify theme structure' },
  { id: 'zip', label: 'Creating the ZIP archive' },
  { id: 'upload', label: 'Uploading the ZIP file to InsForge Storage' },
];

function formatSize(bytes: number): string {
  if (!bytes) return '—';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function triggerDownload(href: string, name: string, revoke = false) {
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (revoke) setTimeout(() => URL.revokeObjectURL(href), 5000);
}

export default function ExportDialog({
  open,
  onClose,
  projectId,
  projectName,
  pages,
  themeCss,
  styleGuide,
}: ExportDialogProps) {
  const [state, setState] = useState<DialogState>('checking');
  const [existing, setExisting] = useState<ThemeExportRow | null>(null);
  const [progress, setProgress] = useState<ExportProgress>({
    step: 'analyze',
    message: 'Starting…',
    percent: 0,
  });
  const [result, setResult] = useState<RunExportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const runningRef = useRef(false);

  const startExport = useCallback(async () => {
    if (runningRef.current) return; // guard against duplicate runs
    runningRef.current = true;
    setState('exporting');
    setProgress({ step: 'analyze', message: 'Analyzing generated pages…', percent: 2 });
    try {
      const res = await runShopifyExport({
        projectId,
        projectName,
        pages,
        themeCss,
        styleGuide,
        onProgress: setProgress,
      });
      setResult(res);
      setState('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Export failed. Please try again.');
      setState('error');
    } finally {
      runningRef.current = false;
    }
  }, [projectId, projectName, pages, themeCss, styleGuide]);

  // On open: reset, then check for an existing export. If one exists, offer the
  // choices; otherwise begin the export immediately.
  useEffect(() => {
    if (!open) return;
    let active = true;

    (async () => {
      // Reset inside the async callback (not the effect body) so a fresh open
      // starts from the checking state without a synchronous cascading render.
      setState('checking');
      setResult(null);
      setExisting(null);
      setErrorMessage('');
      try {
        const latest = await getLatestExport(projectId);
        if (!active) return;
        if (latest && latest.status === 'ready') {
          setExisting(latest);
          setState('existing');
          return;
        }
      } catch {
        // A lookup failure shouldn't block exporting — fall through to start one.
      }
      if (active) void startExport();
    })();

    return () => {
      active = false;
    };
  }, [open, projectId, startExport]);

  const dismissable = state !== 'exporting' && state !== 'checking';
  const handleBackdrop = () => {
    if (dismissable) onClose();
  };

  // Block Escape while an export is running.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissable) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, dismissable, onClose]);

  if (!open) return null;

  const activeStepIndex = STEP_LIST.findIndex((s) => s.id === progress.step);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onMouseDown={handleBackdrop}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Export to Shopify"
          className="flex max-h-[min(720px,calc(100vh-2rem))] w-[min(42rem,calc(100vw-2rem))] min-w-[320px] flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_32px_64px_rgba(0,0,0,0.22)]"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#FFF3EE] text-[#FF3B00] border border-[#FFCCBC]">
                <Store size={18} strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold text-neutral-950">Export to Shopify OS 2.0</h2>
                <p className="truncate text-xs text-neutral-500 font-medium">
                  {projectName || 'Storefront theme'}
                </p>
              </div>
            </div>
            {dismissable && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-xl text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 cursor-pointer"
              >
                <X size={16} strokeWidth={2} />
              </button>
            )}
          </div>

          <div className="min-h-0 overflow-y-auto px-6 py-5">
            {state === 'checking' && (
              <div className="flex items-center gap-3 py-6 text-xs font-semibold text-neutral-600">
                <Loader2 size={18} className="animate-spin text-[#FF3B00]" />
                Checking for existing theme packages…
              </div>
            )}

            {state === 'existing' && existing && (
              <div>
                <p className="text-xs text-neutral-600 font-medium">
                  A Shopify Online Store 2.0 export already exists for this storefront project.
                </p>
                <div className="mt-3.5 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 shadow-2xs">
                  <FileArchive size={22} className="shrink-0 text-neutral-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-neutral-900">
                      {existing.file_name}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {formatSize(existing.file_size)} · v{existing.theme_version} ·{' '}
                      {new Date(existing.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-2.5">
                  <button
                    onClick={() => triggerDownload(existing.download_url, existing.file_name)}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] px-4 text-xs font-bold text-white shadow-[0_2px_12px_rgba(255,59,0,0.3)] transition hover:brightness-105 cursor-pointer"
                  >
                    <Download size={16} strokeWidth={2.2} />
                    <span>Download Existing Theme ZIP</span>
                  </button>
                  <button
                    onClick={() => void startExport()}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-xs font-bold text-neutral-800 shadow-2xs transition hover:bg-neutral-50 hover:border-neutral-300 cursor-pointer"
                  >
                    <RefreshCw size={15} strokeWidth={2} />
                    <span>Regenerate Theme Package</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="flex h-10 items-center justify-center rounded-xl px-4 text-xs font-semibold text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {state === 'exporting' && (
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-neutral-900">{progress.message}</span>
                  <span className="shrink-0 text-xs font-black tabular-nums text-[#FF3B00]">
                    {Math.round(progress.percent)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] transition-all duration-300 ease-out"
                    style={{ width: `${Math.max(2, progress.percent)}%` }}
                  />
                </div>
                <ul className="mt-5 space-y-2.5">
                  {STEP_LIST.map((step, index) => {
                    const done = index < activeStepIndex;
                    const active = index === activeStepIndex;
                    return (
                      <li key={step.id} className="flex items-center gap-2.5 text-xs">
                        {done ? (
                          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                        ) : active ? (
                          <Loader2 size={16} className="shrink-0 animate-spin text-[#FF3B00]" />
                        ) : (
                          <span className="grid h-4 w-4 shrink-0 place-items-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
                          </span>
                        )}
                        <span
                          className={
                            done
                              ? 'text-neutral-500 font-medium'
                              : active
                                ? 'font-bold text-neutral-950'
                                : 'text-neutral-400'
                          }
                        >
                          {step.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-5 text-[11px] text-neutral-400">
                  Please keep this window open while the Liquid theme archive is being generated.
                </p>
              </div>
            )}

            {state === 'success' && result && (
              <div className="text-center py-2">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 border border-emerald-200">
                  <CheckCircle2 size={30} strokeWidth={2.2} className="text-emerald-600" />
                </span>
                <h3 className="mt-3.5 text-base font-extrabold text-neutral-950">Theme Package Ready</h3>
                <p className="mt-1 text-xs text-neutral-500 leading-relaxed font-medium">
                  Your Shopify Online Store 2.0 theme was generated and verified successfully.
                </p>
                <div className="mt-3.5 flex items-center justify-center gap-2 text-xs font-semibold text-neutral-600">
                  <FileArchive size={14} className="text-neutral-400" />
                  <span>{result.fileName} · {formatSize(result.row.file_size)} · v{result.row.theme_version}</span>
                </div>
                {result.sectionStats.total > 0 && (
                  <p className="mt-2 text-[11px] text-neutral-400">
                    {result.sectionStats.total} editable section
                    {result.sectionStats.total === 1 ? '' : 's'} generated
                    {result.sectionStats.ai > 0 && ` · ${result.sectionStats.ai} AI-authored`}
                    {result.sectionStats.fallback > 0 &&
                      ` · ${result.sectionStats.fallback} standard sections`}
                  </p>
                )}
                <div className="mt-6 flex flex-col gap-2.5">
                  <button
                    onClick={() => {
                      if (result.row.download_url) {
                        triggerDownload(result.row.download_url, result.fileName);
                        return;
                      }
                      const url = URL.createObjectURL(result.blob);
                      triggerDownload(url, result.fileName, true);
                    }}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] px-4 text-xs font-bold text-white shadow-[0_2px_12px_rgba(255,59,0,0.3)] transition hover:brightness-105 cursor-pointer"
                  >
                    <Download size={16} strokeWidth={2.2} />
                    <span>Download Theme ZIP</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="flex h-10 items-center justify-center rounded-xl px-4 text-xs font-semibold text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {state === 'error' && (
              <div className="text-center py-2">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 border border-red-200">
                  <AlertTriangle size={28} strokeWidth={2.2} className="text-red-600" />
                </span>
                <h3 className="mt-3.5 text-base font-extrabold text-neutral-950">Export Failed</h3>
                <p className="mt-1 break-words text-xs text-neutral-500 leading-relaxed font-medium">{errorMessage}</p>
                <div className="mt-6 flex flex-col gap-2.5">
                  <button
                    onClick={() => void startExport()}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] px-4 text-xs font-bold text-white shadow-[0_2px_12px_rgba(255,59,0,0.3)] transition hover:brightness-105 cursor-pointer"
                  >
                    <RefreshCw size={15} strokeWidth={2} />
                    <span>Retry Export</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="flex h-10 items-center justify-center rounded-xl px-4 text-xs font-semibold text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

