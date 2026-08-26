'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Flame, ArrowLeft } from 'lucide-react';
import EditorTopBar from '@/components/editor/EditorTopBar';
import EditorChatPanel from '@/components/editor/EditorChatPanel';
import EditorPreview from '@/components/editor/EditorPreview';
import { BuilderProvider } from '@/components/editor/BuilderContext';
import { getProject, type Project } from '@/lib/projects';
import { useAuth } from '@/components';

export default function EditorPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-found'>('loading');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/sign-in');
      return;
    }

    let active = true;
    (async () => {
      try {
        const result = await getProject(projectId);
        if (!active) return;
        if (!result) {
          setStatus('not-found');
          return;
        }
        setProject(result);
        setStatus('ready');
      } catch {
        if (active) setStatus('not-found');
      }
    })();

    return () => {
      active = false;
    };
  }, [projectId, user, authLoading, router]);

  if (status === 'loading') {
    return (
      <div className="grid h-screen place-items-center bg-[#fffdfc] text-neutral-400">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] text-white shadow-[0_4px_16px_rgba(255,59,0,0.3)] animate-pulse">
            <Flame size={24} className="fill-white" />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600">
            <Loader2 size={16} className="animate-spin text-[#FF3B00]" />
            <span>Loading storefront studio…</span>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="grid h-screen place-items-center bg-[#fffdfc] px-6 text-center">
        <div className="max-w-md rounded-3xl border border-neutral-200/90 bg-white p-8 shadow-xs">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF3EE] text-[#FF3B00] border border-[#FFCCBC]">
            <Flame size={24} className="fill-[#FF3B00]" />
          </div>
          <h1 className="mt-4 text-xl font-extrabold text-neutral-950">Storefront Not Found</h1>
          <p className="mt-2 text-xs text-neutral-500 leading-relaxed">
            This project doesn&apos;t exist or you don&apos;t have authorization to view it.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] px-5 text-xs font-bold text-white shadow-[0_2px_12px_rgba(255,59,0,0.3)] transition hover:brightness-105 cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <BuilderProvider projectId={projectId} initialPrompt={project?.prompt ?? ''}>
      <div className="flex h-screen flex-col overflow-hidden bg-[#fffdfc] selection:bg-[#FF4500]/20 selection:text-[#FF4500]">
        <EditorTopBar
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed((c) => !c)}
          projectId={projectId}
          projectName={project?.name ?? 'Storefront'}
        />

        <div className="flex min-h-0 flex-1">
          {!collapsed && <EditorChatPanel />}

          <EditorPreview />
        </div>
      </div>
    </BuilderProvider>
  );
}

