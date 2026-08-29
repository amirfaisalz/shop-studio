'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronLeft,
  Code2,
  Download,
  FileImage,
  Loader2,
  Redo2,
  Save,
  Store,
  Undo2,
  Flame,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { useBuilder } from './BuilderContext';
import ExportDialog from './ExportDialog';
import DeleteProjectDialog from '@/components/projects/DeleteProjectDialog';
import { useSubscription } from '@/components/billing/SubscriptionProvider';
import UpgradeDialog from '@/components/billing/UpgradeDialog';
import { exportPagesAsCodeZip } from '@/lib/export/code';
import { exportPagesAsPng } from '@/lib/export/png';
import type { ExportPage } from '@/lib/shopify/types';

interface EditorTopBarProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
  projectId: string;
  projectName: string;
}

export default function EditorTopBar({
  collapsed,
  onToggleSidebar,
  projectId,
  projectName,
}: EditorTopBarProps) {
  const router = useRouter();
  const {
    pages,
    themeCss,
    styleGuide,
    isStreaming,
    currentStep,
    undo,
    redo,
    canUndo,
    canRedo,
    aiConfig,
  } = useBuilder();
  const { entitlement } = useSubscription();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);
  // Which direct export (code/png) is currently running, plus any last error.
  const [busy, setBusy] = useState<null | 'code' | 'png'>(null);
  const [pngStatus, setPngStatus] = useState('');
  const [exportError, setExportError] = useState('');
  const exportRef = useRef<HTMLDivElement>(null);

  // Only fully generated pages (with HTML) are exportable.
  const exportPages = useMemo<ExportPage[]>(
    () =>
      pages
        .filter((p) => p.html && p.html.trim())
        .map((p) => ({ key: p.id, label: p.label, type: p.type, path: p.path, html: p.html })),
    [pages]
  );
  const hasExportablePages = exportPages.length > 0;

  const EXPORT_OPTIONS = [
    { id: 'shopify', label: 'Export to Shopify OS 2.0', icon: Store, action: () => openExport() },
    { id: 'zip', label: 'Download Theme ZIP', icon: Download, action: () => openExport() },
    { id: 'code', label: 'Export HTML & CSS Code', icon: Code2, action: () => void runCodeExport() },
    { id: 'png', label: 'Export to PNG Screenshots', icon: FileImage, action: () => void runPngExport() },
  ];

  // Shopify theme export is a paid feature. Free users get the upgrade dialog
  // instead of the export flow (product spec §"Free Plan Limits").
  const canExport = entitlement?.canExport ?? false;

  function openExport() {
    setMenuOpen(false);
    if (!canExport) {
      setUpgradeOpen(true);
      return;
    }
    setDialogOpen(true);
  }

  async function runCodeExport() {
    if (busy) return;
    setMenuOpen(false);
    setExportError('');
    setBusy('code');
    try {
      await exportPagesAsCodeZip(exportPages, themeCss, projectName);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  async function runPngExport() {
    if (busy) return;
    setMenuOpen(false);
    setExportError('');
    setPngStatus('Rendering pages…');
    setBusy('png');
    try {
      await exportPagesAsPng(exportPages, themeCss, projectName, ({ processed, total, label }) => {
        setPngStatus(
          processed < total ? `Rendering ${label || 'page'}… (${processed + 1}/${total})` : 'Packaging…'
        );
      });
    } catch (err) {
      console.error('[png-export] error:', err);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'type' in err
            ? `Failed to render page (${String((err as { type?: unknown }).type)} event)`
            : String(err || 'PNG export failed. Please try again.');
      setExportError(message);
    } finally {
      setBusy(null);
      setPngStatus('');
    }
  }

  const handleManualSave = () => {
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 2500);
  };

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(event: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-neutral-200/80 bg-white px-4">
      {/* Brand & Project Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          title="Back to Dashboard"
          className="flex items-center gap-2.5 transition-transform hover:opacity-90 shrink-0"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] text-white shadow-[0_2px_10px_rgba(255,59,0,0.35)]">
            <Flame size={20} className="fill-white" />
          </div>
        </Link>

        <div className="hidden sm:flex items-center gap-2">
          <Link
            href="/dashboard"
            className="text-xs font-bold text-neutral-900 hover:text-[#FF3B00] transition-colors"
          >
            ShopStudio
          </Link>
          <span className="text-neutral-300">/</span>
          <span
            className="text-xs font-bold text-[#FF3B00] max-w-[180px] sm:max-w-[240px] truncate"
            title={projectName}
          >
            {projectName}
          </span>
          <span className="rounded-md bg-[#FFF3EE] px-1.5 py-0.5 text-[10px] font-bold text-[#FF3B00] border border-[#FFCCBC]">
            OS 2.0
          </span>
          <button
            type="button"
            onClick={() => setDeleteDialogOpen(true)}
            title="Delete this storefront"
            className="grid h-6 w-6 place-items-center rounded-md text-neutral-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        </div>

        <button
          aria-label={collapsed ? 'Expand chat panel' : 'Collapse chat panel'}
          onClick={onToggleSidebar}
          title={collapsed ? 'Show chat sidebar' : 'Hide chat sidebar'}
          className="grid h-8 w-8 place-items-center rounded-xl border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-950 cursor-pointer"
        >
          <ChevronLeft
            size={16}
            strokeWidth={2}
            className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Undo / Redo buttons */}
        <div className="flex items-center gap-1 border-l border-neutral-200 pl-2.5 ml-1">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo || isStreaming}
            title="Undo last change (Ctrl+Z / Cmd+Z)"
            aria-label="Undo last change"
            className="grid h-8 w-8 place-items-center rounded-xl border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-950 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <Undo2 size={14} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo || isStreaming}
            title="Redo (Ctrl+Y / Cmd+Shift+Z)"
            aria-label="Redo"
            className="grid h-8 w-8 place-items-center rounded-xl border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-950 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <Redo2 size={14} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Center Status Badge */}
      <div className="hidden items-center gap-2 md:flex">
        {isStreaming ? (
          <div className="flex items-center gap-2 rounded-full border border-[#FFCCBC] bg-[#FFF3EE] px-3.5 py-1 text-xs font-bold text-[#FF3B00] animate-pulse shadow-2xs">
            <Loader2 size={13} className="animate-spin text-[#FF3B00]" />
            <span className="max-w-[260px] truncate">{currentStep?.message ?? 'Generating storefront…'}</span>
          </div>
        ) : hasExportablePages ? (
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-[#F0FDF4] px-3.5 py-1 text-xs font-bold text-emerald-800 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-[#10B981]" />
            <span>{exportPages.length} {exportPages.length === 1 ? 'page' : 'pages'} live in preview</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-500">
            <span>Ready for prompt</span>
          </div>
        )}
      </div>

      {/* Right Actions: Export & Save */}
      <div className="flex shrink-0 items-center gap-2.5">
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            disabled={dialogOpen || busy !== null}
            className="flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 text-xs font-bold text-neutral-800 shadow-2xs transition hover:bg-neutral-50 hover:border-neutral-300 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {busy ? (
              <>
                <Loader2 size={14} strokeWidth={2} className="animate-spin text-[#FF3B00]" />
                <span>{busy === 'png' ? pngStatus || 'Exporting…' : 'Exporting…'}</span>
              </>
            ) : (
              <>
                <Store size={15} strokeWidth={2} className="text-[#10B981]" />
                <span>Export to Shopify</span>
                <ChevronDown
                  size={14}
                  strokeWidth={2}
                  className={`text-neutral-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                />
              </>
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-2 shadow-[0_20px_48px_rgba(0,0,0,0.12)] animate-in fade-in-50 zoom-in-95 duration-150">
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Export Options
              </p>
              {!hasExportablePages && (
                <p className="px-3 pb-2 text-[11px] text-neutral-400">
                  Generate a page first to enable export options.
                </p>
              )}
              {EXPORT_OPTIONS.map((option) => {
                const Icon = option.icon;
                const needsPages = ['shopify', 'zip', 'code', 'png'].includes(option.id);
                const disabled = (needsPages && !hasExportablePages) || busy !== null;
                return (
                  <button
                    key={option.id}
                    onClick={option.action}
                    disabled={disabled}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-neutral-800 transition hover:bg-[#FFF3EE] hover:text-[#FF3B00] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                  >
                    <Icon size={15} strokeWidth={2} className="text-neutral-400" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {exportError && !menuOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700 shadow-lg">
              {exportError}
            </div>
          )}
        </div>

        <button
          onClick={handleManualSave}
          className="flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] px-4 text-xs font-bold text-white shadow-[0_2px_12px_rgba(255,59,0,0.3)] transition-all hover:brightness-105 hover:shadow-[0_4px_16px_rgba(255,59,0,0.4)] cursor-pointer"
        >
          {savedBadge ? (
            <>
              <CheckCircle2 size={15} strokeWidth={2.4} />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Save size={15} strokeWidth={2} />
              <span>Save Theme</span>
            </>
          )}
        </button>
      </div>

      <ExportDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        projectId={projectId}
        projectName={projectName}
        pages={exportPages}
        themeCss={themeCss}
        styleGuide={styleGuide}
        aiConfig={aiConfig}
      />

      <DeleteProjectDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        projectId={projectId}
        projectName={projectName}
        onDeleted={() => {
          router.push('/projects');
        }}
      />

      <UpgradeDialog
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        title="Exporting is a Pro Merchant feature"
        description="Upgrade to export your design as a Shopify Online Store 2.0 theme ZIP and unlock unlimited storefronts."
      />
    </header>
  );
}
