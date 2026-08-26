'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ChevronDown,
  ChevronLeft,
  Code2,
  Download,
  Eye,
  FileImage,
  Loader2,
  Redo2,
  Save,
  Store,
  Undo2,
} from 'lucide-react';
import { useBuilder } from './BuilderContext';
import ExportDialog from './ExportDialog';
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
  } = useBuilder();
  const { entitlement } = useSubscription();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
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
    { id: 'shopify', label: 'Export to Shopify', icon: Store, action: () => openExport() },
    { id: 'zip', label: 'Download ZIP', icon: Download, action: () => openExport() },
    { id: 'code', label: 'Export Code', icon: Code2, action: () => void runCodeExport() },
    { id: 'png', label: 'Export to PNG image', icon: FileImage, action: () => void runPngExport() },
    { id: 'preview', label: 'Preview Theme', icon: Eye, action: () => {} },
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
      setExportError(err instanceof Error ? err.message : 'PNG export failed. Please try again.');
    } finally {
      setBusy(null);
      setPngStatus('');
    }
  }

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
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[#ece6e2] bg-white px-4">
      <div className="flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="Shopify Theme Builder"
          width={34}
          height={34}
          className="shrink-0 rounded-lg"
          priority
        />
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[14px] font-bold text-[#111827]">
            Shopify Theme Builder
          </span>
          <span className="text-[#d1d5db]">/</span>
          <span
            className="text-[13px] font-semibold text-[#ff6747] max-w-[200px] truncate"
            title={projectName}
          >
            {projectName}
          </span>
        </div>
        <button
          aria-label={collapsed ? 'Expand chat panel' : 'Collapse chat panel'}
          onClick={onToggleSidebar}
          className="grid h-8 w-8 place-items-center rounded-lg border border-[#e8e2de] bg-white text-[#4b5563] transition hover:bg-[#fff8f5]"
        >
          <ChevronLeft
            size={17}
            strokeWidth={2}
            className={`transition-transform ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Undo / Redo buttons */}
        <div className="flex items-center gap-1 border-l border-[#ece6e2] pl-3 ml-1">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo || isStreaming}
            title="Undo last change (Ctrl+Z / Cmd+Z)"
            aria-label="Undo last change"
            className="grid h-8 w-8 place-items-center rounded-lg border border-[#e8e2de] bg-white text-[#4b5563] transition hover:bg-[#fff8f5] hover:text-[#111827] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Undo2 size={15} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo || isStreaming}
            title="Redo (Ctrl+Y / Cmd+Shift+Z)"
            aria-label="Redo"
            className="grid h-8 w-8 place-items-center rounded-lg border border-[#e8e2de] bg-white text-[#4b5563] transition hover:bg-[#fff8f5] hover:text-[#111827] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Redo2 size={15} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Center Status Badge */}
      <div className="hidden items-center gap-2 md:flex">
        {isStreaming ? (
          <div className="flex items-center gap-2 rounded-full border border-[#ffe4dc] bg-[#fff5f2] px-3.5 py-1 text-xs font-semibold text-[#ff6747] animate-pulse">
            <Loader2 size={13} className="animate-spin text-[#ff6747]" />
            <span className="max-w-[260px] truncate">{currentStep?.message ?? 'Generating storefront…'}</span>
          </div>
        ) : hasExportablePages ? (
          <div className="flex items-center gap-1.5 rounded-full border border-[#d1fae5] bg-[#f0fdf4] px-3 py-1 text-xs font-semibold text-[#065f46]">
            <span className="h-2 w-2 rounded-full bg-[#10b981]" />
            <span>{exportPages.length} {exportPages.length === 1 ? 'page' : 'pages'} live in preview</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-full border border-[#eee7e3] bg-[#faf8f6] px-3 py-1 text-xs font-medium text-[#9aa2af]">
            <span>Ready for prompt</span>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            disabled={dialogOpen || busy !== null}
            className="flex h-11 items-center gap-2 rounded-xl border border-[#e8e2de] bg-white px-4 text-sm font-medium text-[#111827] shadow-[0_8px_20px_rgba(31,41,55,0.04)] transition hover:bg-[#fff8f5] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 size={16} strokeWidth={2} className="animate-spin text-[#ff6747]" />
                {busy === 'png' ? pngStatus || 'Exporting…' : 'Exporting…'}
              </>
            ) : (
              <>
                <Store size={17} strokeWidth={1.9} className="text-[#35b86b]" />
                Export to Shopify
                <ChevronDown
                  size={16}
                  strokeWidth={2}
                  className={`text-[#9aa2af] transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                />
              </>
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-2xl border border-[#eee7e3] bg-white p-2 shadow-[0_24px_48px_rgba(31,41,55,0.14)]">
              <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#9aa2af]">
                Export options
              </p>
              {!hasExportablePages && (
                <p className="px-3 pb-2 text-[11px] text-[#b7ada4]">
                  Generate a page first to enable export.
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
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#111827] transition hover:bg-[#fff3ef] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Icon size={17} strokeWidth={1.9} className="text-[#6b7280]" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}

          {exportError && !menuOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 rounded-xl border border-[#f6d5cf] bg-[#fdeceb] px-3.5 py-2.5 text-[12px] text-[#c0432f] shadow-[0_16px_32px_rgba(31,41,55,0.12)]">
              {exportError}
            </div>
          )}
        </div>

        <button className="flex h-11 items-center gap-2 rounded-xl bg-[#ff6747] px-5 text-sm font-semibold text-white shadow-[0_12px_22px_rgba(255,103,71,0.2)] transition hover:bg-[#f85b3a]">
          <Save size={17} strokeWidth={1.9} />
          Save
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
      />

      <UpgradeDialog
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        title="Exporting is a Pro feature"
        description="Upgrade to export your design as a Shopify theme ZIP and unlock unlimited projects."
      />
    </header>
  );
}
