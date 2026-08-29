'use client';

import { useState } from 'react';
import {
  BrainCircuit,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  RotateCcw,
  Server,
  Sparkles,
  X,
} from 'lucide-react';
import {
  AI_PROVIDERS,
  AI_MODELS,
  AIProviderId,
  AIClientConfig,
  DEFAULT_AI_CONFIG,
  getDefaultModelForProvider,
} from '@/lib/ai/models';

interface AIModelSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  config: AIClientConfig;
  onSave: (config: AIClientConfig) => void;
}

export default function AIModelSettingsDialog({
  open,
  onClose,
  config,
  onSave,
}: AIModelSettingsDialogProps) {
  if (!open) return null;

  return (
    <AIModelSettingsModalContent
      onClose={onClose}
      config={config}
      onSave={onSave}
    />
  );
}

function AIModelSettingsModalContent({
  onClose,
  config,
  onSave,
}: {
  onClose: () => void;
  config: AIClientConfig;
  onSave: (config: AIClientConfig) => void;
}) {
  const [provider, setProvider] = useState<AIProviderId>(config.provider ?? 'gemini');
  const [model, setModel] = useState<string>(config.model ?? 'gemini-2.5-flash');
  const [apiKey, setApiKey] = useState<string>(config.apiKey ?? '');
  const [baseUrl, setBaseUrl] = useState<string>(config.baseUrl ?? '');
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const currentProviderInfo = AI_PROVIDERS[provider];
  const providerModels = AI_MODELS.filter((m) => m.provider === provider);

  const handleProviderChange = (newProvider: AIProviderId) => {
    setProvider(newProvider);
    const defaultM = getDefaultModelForProvider(newProvider);
    setModel(defaultM);
    if (newProvider === 'custom') {
      if (!baseUrl) setBaseUrl('http://localhost:11434/v1');
    } else {
      setBaseUrl(AI_PROVIDERS[newProvider]?.defaultBaseUrl ?? '');
    }
  };

  const handleSave = () => {
    onSave({
      provider,
      model: model.trim() || getDefaultModelForProvider(provider),
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    setProvider(DEFAULT_AI_CONFIG.provider);
    setModel(DEFAULT_AI_CONFIG.model);
    setApiKey('');
    setBaseUrl('');
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="AI Model & API Key Settings"
        className="flex max-h-[min(700px,calc(100vh-2rem))] w-[min(38rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_32px_64px_rgba(0,0,0,0.2)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] text-white shadow-2xs">
              <BrainCircuit size={20} strokeWidth={2.2} />
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-neutral-950">AI Model & Provider Settings</h2>
              <p className="text-xs text-neutral-500 font-medium">
                Configure DeepSeek, OpenRouter, OpenAI, Gemini, or Custom endpoints
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-xl text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 cursor-pointer"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-2">
              Select AI Provider
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(AI_PROVIDERS) as AIProviderId[]).map((pid) => {
                const pInfo = AI_PROVIDERS[pid];
                const isSelected = provider === pid;
                return (
                  <button
                    key={pid}
                    type="button"
                    onClick={() => handleProviderChange(pid)}
                    className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#FF3B00] bg-[#FFF3EE] text-[#FF3B00] shadow-2xs font-bold ring-1 ring-[#FF3B00]'
                        : 'border-neutral-200 bg-neutral-50/70 text-neutral-700 hover:bg-neutral-100/80 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold">{pInfo.name}</span>
                      {isSelected && <Check size={13} strokeWidth={3} className="text-[#FF3B00]" />}
                    </div>
                    <span className="mt-1 text-[10px] text-neutral-500 line-clamp-1">
                      {pid === 'deepseek'
                        ? 'DeepSeek V3 & R1'
                        : pid === 'openrouter'
                          ? 'All top models'
                          : pid === 'gemini'
                            ? 'Google AI Studio'
                            : pid === 'openai'
                              ? 'GPT-4o & o3-mini'
                              : 'Custom base URL'}
                    </span>
                  </button>
                );
              })}
            </div>
            {currentProviderInfo && (
              <p className="mt-2 text-[11px] text-neutral-500 font-medium">
                {currentProviderInfo.description}
              </p>
            )}
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-2">
              Model Selection
            </label>
            {providerModels.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {providerModels.map((m) => {
                  const isSelected = model === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setModel(m.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        isSelected
                          ? 'border-[#FF3B00] bg-[#FFF3EE] text-neutral-950 font-bold'
                          : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{m.name}</span>
                          {m.badge && (
                            <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[9px] font-bold text-neutral-600 border border-neutral-200">
                              {m.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-400 truncate mt-0.5">{m.description}</p>
                      </div>
                      {isSelected ? (
                        <Check size={14} strokeWidth={2.5} className="text-[#FF3B00] shrink-0" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* Custom Model ID field */}
            <div className="mt-2">
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Or enter custom model ID (e.g. deepseek-chat, mistral-large)"
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-3.5 py-2 text-xs text-neutral-900 focus:border-[#FF3B00] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Custom Base URL (if custom or openrouter/deepseek) */}
          {(provider === 'custom' || baseUrl) && (
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                API Base URL
              </label>
              <div className="relative">
                <Server size={14} className="absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder={currentProviderInfo?.defaultBaseUrl ?? 'https://api.openai.com/v1'}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50/60 pl-9 pr-3 py-2 text-xs font-mono text-neutral-900 focus:border-[#FF3B00] focus:bg-white focus:outline-none"
                />
              </div>
              <p className="mt-1 text-[10px] text-neutral-400">
                Endpoint base URL (Chat Completions are sent to <code className="bg-neutral-100 px-1 py-0.5 rounded">/chat/completions</code>)
              </p>
            </div>
          )}

          {/* API Key Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-neutral-800">
                API Key (Optional / BYOK)
              </label>
              {currentProviderInfo?.docUrl && (
                <a
                  href={currentProviderInfo.docUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#FF3B00] hover:underline"
                >
                  <span>Get {currentProviderInfo.name} Key</span>
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
            <div className="relative">
              <Key size={14} className="absolute left-3 top-2.5 text-neutral-400" />
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Leave blank to use server environment ${currentProviderInfo?.apiKeyEnvVar ?? 'API key'}`}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50/60 pl-9 pr-10 py-2 text-xs font-mono text-neutral-900 focus:border-[#FF3B00] focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                aria-label="Toggle key visibility"
                className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-neutral-500 leading-relaxed">
              Your API key stays stored securely in your browser&apos;s local storage and is sent only with generation requests to our server API route.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-100 px-6 py-4 bg-neutral-50/60">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Reset Defaults</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-200/60 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] px-5 py-2 text-xs font-bold text-white shadow-2xs hover:brightness-105 transition cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check size={14} strokeWidth={2.4} />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} strokeWidth={2} />
                  <span>Apply Model</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
