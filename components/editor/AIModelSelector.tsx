'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Brain,
  Check,
  ChevronDown,
  Globe,
  Settings2,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  AI_MODELS,
  AIProviderId,
  AIClientConfig,
  findModelDefinition,
} from '@/lib/ai/models';
import AIModelSettingsDialog from './AIModelSettingsDialog';

interface AIModelSelectorProps {
  config: AIClientConfig;
  onChange: (config: AIClientConfig) => void;
  disabled?: boolean;
  placement?: 'top' | 'bottom';
  align?: 'left' | 'right';
}

export default function AIModelSelector({
  config,
  onChange,
  disabled = false,
  placement = 'bottom',
  align = 'right',
}: AIModelSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeModelId = config.model ?? 'gemini-2.5-flash';
  const activeModelDef = findModelDefinition(activeModelId);

  const activeModelName = activeModelDef ? activeModelDef.name : activeModelId;
  const activeProvider = config.provider ?? (activeModelDef?.provider ?? 'gemini');

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const selectModel = (modelId: string, provider: AIProviderId) => {
    setDropdownOpen(false);
    onChange({
      ...config,
      provider,
      model: modelId,
    });
  };

  const getProviderIcon = (provider: AIProviderId) => {
    switch (provider) {
      case 'deepseek':
        return <Zap size={12} className="text-[#FF3B00]" />;
      case 'openrouter':
        return <Globe size={12} className="text-blue-500" />;
      case 'gemini':
        return <Sparkles size={12} className="text-amber-500" />;
      case 'openai':
        return <Brain size={12} className="text-emerald-600" />;
      default:
        return <Settings2 size={12} className="text-neutral-500" />;
    }
  };

  const positionClasses =
    placement === 'top'
      ? `bottom-[calc(100%+6px)] ${align === 'right' ? 'right-0' : 'left-0'}`
      : `top-[calc(100%+6px)] ${align === 'right' ? 'right-0' : 'left-0'}`;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setDropdownOpen((open) => !open)}
        className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-neutral-700 shadow-2xs hover:bg-neutral-50 hover:border-neutral-300 transition disabled:opacity-60 cursor-pointer"
        title="Change AI Model (DeepSeek, OpenRouter, Gemini, OpenAI)"
      >
        <span className="flex items-center gap-1">
          {getProviderIcon(activeProvider)}
          <span className="max-w-[120px] sm:max-w-[140px] truncate">{activeModelName}</span>
        </span>
        <ChevronDown
          size={11}
          strokeWidth={2.4}
          className={`text-neutral-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {dropdownOpen && (
        <div
          className={`absolute ${positionClasses} z-50 w-72 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.14)] animate-in fade-in-50 zoom-in-95 duration-150`}
        >
          <div className="px-2.5 py-1.5 border-b border-neutral-100 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Select AI Model
            </span>
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                setSettingsOpen(true);
              }}
              className="flex items-center gap-1 text-[10px] font-semibold text-[#FF3B00] hover:underline cursor-pointer"
            >
              <Settings2 size={11} />
              <span>API Settings</span>
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto py-1 space-y-0.5">
            {AI_MODELS.map((m) => {
              const isSelected = activeModelId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => selectModel(m.id, m.provider)}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#FFF3EE] text-[#FF3B00] font-bold'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0">{getProviderIcon(m.provider)}</span>
                    <span className="truncate text-[11px]">{m.name}</span>
                    {m.badge && (
                      <span className="rounded-md bg-neutral-100 px-1 py-0.2 text-[9px] font-bold text-neutral-500 border border-neutral-200 shrink-0">
                        {m.badge}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check size={12} strokeWidth={3} className="text-[#FF3B00] shrink-0 ml-1.5" />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-neutral-100 p-1 mt-0.5">
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                setSettingsOpen(true);
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-neutral-50 py-1.5 text-[11px] font-bold text-neutral-700 hover:bg-[#FFF3EE] hover:text-[#FF3B00] transition cursor-pointer"
            >
              <Settings2 size={12} />
              <span>Custom Provider & API Keys...</span>
            </button>
          </div>
        </div>
      )}

      <AIModelSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        config={config}
        onSave={(newConfig) => {
          onChange(newConfig);
        }}
      />
    </div>
  );
}
