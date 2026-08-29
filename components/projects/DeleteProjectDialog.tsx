'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle, Loader2, X } from 'lucide-react';
import { deleteProject } from '@/lib/projects';

interface DeleteProjectDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onDeleted?: (projectId: string) => void;
}

export default function DeleteProjectDialog({
  open,
  onClose,
  projectId,
  projectName,
  onDeleted,
}: DeleteProjectDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteProject(projectId);
      onClose();
      onDeleted?.(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-red-50 text-red-600 border border-red-200">
              <Trash2 size={20} />
            </span>
            <div>
              <h2 className="text-base font-bold text-neutral-950">Delete Storefront</h2>
              <p className="text-xs text-neutral-500">This action cannot be undone.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="grid h-8 w-8 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-neutral-100 bg-neutral-50/80 p-3.5">
          <p className="text-xs text-neutral-600 leading-relaxed">
            Are you sure you want to permanently delete{' '}
            <strong className="text-neutral-950 font-bold">&quot;{projectName}&quot;</strong>?
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200/80">
            <AlertTriangle size={13} className="shrink-0 text-amber-600" />
            <span>All generated pages, Liquid sections, and theme revisions will be deleted.</span>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Deleting…</span>
              </>
            ) : (
              <>
                <Trash2 size={13} />
                <span>Delete Storefront</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
