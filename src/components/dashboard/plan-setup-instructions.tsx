"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Terminal,
  Zap,
  Key,
  Settings,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Code2,
  FileCode,
  LayoutGrid,
  Info,
  X,
  Cpu,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ToastMessage } from "@/components/ui/toast-message";
import { useToast } from "@/hooks/use-toast";
import { CosmicButton } from "@/components/ui/cosmic-button";
import {
  getApiBaseUrl,
  generateContinueConfig,
  generateCodexConfig,
  generatePowerShellExample,
  generateCurlExample,
  generateJsExample,
  generatePythonExample,
} from "@/lib/integration-config";

const isCodexModel = (model: string) => model.toLowerCase().startsWith("codex/");
const isClaudeModel = (model: string) => model.toLowerCase().startsWith("claude/");
const isGeminiModel = (model: string) => model.toLowerCase().startsWith("gemini/");
const isDeepSeekModel = (model: string) => model.toLowerCase().startsWith("deepseek/");

export interface AllowedModel {
  publicName: string;
  upstreamModel?: string | null;
  apiFamily: string;
  inputCreditRate?: number;
  outputCreditRate?: number;
  isActive: boolean;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  key: string | null;
  maskedKey: string;
  isActive: boolean;
}

interface PlanSetupInstructionsProps {
  bucketId: string;
  productName: string;
  allowedModels: AllowedModel[];
  apiKeys: ApiKey[];
  isOpen: boolean;
  onClose?: () => void;
}

const MAX_VISIBLE_MODELS = 3;

export function PlanSetupInstructions({
  bucketId,
  productName,
  allowedModels,
  apiKeys,
  isOpen,
  onClose,
}: PlanSetupInstructionsProps) {
  const [activeTab, setActiveTab] = useState("quick");
  const [activeLang, setActiveLang] = useState("powershell");
  const [selectedKeyId, setSelectedKeyId] = useState(apiKeys[0]?.id || "");
  const [showFullKey, setShowFullKey] = useState(false);
  const [isExpandedModels, setIsExpandedModels] = useState(false);

  const allowedModelNames = useMemo(() => allowedModels.map((m) => m.publicName), [allowedModels]);
  const [selectedModel, setSelectedModel] = useState<string>(allowedModelNames[0] || "");

  const { toast, showToast, clearToast } = useToast(3000);

  useEffect(() => {
    if (allowedModelNames.length > 0 && !allowedModelNames.includes(selectedModel)) {
      const timer = window.setTimeout(() => {
        setSelectedModel(allowedModelNames[0]);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [allowedModelNames, selectedModel]);

  const selectedKey = useMemo(() => apiKeys.find((k) => k.id === selectedKeyId) || apiKeys[0], [apiKeys, selectedKeyId]);

  const recommendedModel = useMemo(() => {
    if (allowedModelNames.length === 0) return "";
    if (selectedModel && allowedModelNames.includes(selectedModel)) {
      return selectedModel;
    }
    const claude = allowedModelNames.find(isClaudeModel);
    if (claude) return claude;
    const gemini = allowedModelNames.find(isGeminiModel);
    if (gemini) return gemini;
    const deepseek = allowedModelNames.find(isDeepSeekModel);
    if (deepseek) return deepseek;
    return allowedModelNames[0];
  }, [allowedModelNames, selectedModel]);

  const codexModel = useMemo(() => {
    return allowedModelNames.find(isCodexModel) || "";
  }, [allowedModelNames]);

  const hasCodexModel = useMemo(() => allowedModelNames.some(isCodexModel), [allowedModelNames]);

  const tabs = useMemo(() => {
    const list = [
      { id: "quick", label: "Cấu hình nhanh", icon: Zap },
      { id: "continue", label: "Continue", icon: FileCode },
    ];

    if (hasCodexModel) {
      list.push({ id: "codex", label: "Codex", icon: Cpu });
    }

    list.push(
      { id: "cline", label: "Cline", icon: Code2 },
      { id: "roocode", label: "Roo Code", icon: LayoutGrid },
      { id: "api", label: "API mẫu", icon: Terminal }
    );

    return list;
  }, [hasCodexModel]);

  useEffect(() => {
    const tabExists = tabs.some(t => t.id === activeTab);
    if (!tabExists) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab("quick");
    }
  }, [tabs, activeTab]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Đã sao chép ${label}`, "success");
  };

  if (!isOpen) return null;

  if (apiKeys.length === 0) {
    return (
      <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-[0_24px_80px_-28px_rgba(79,70,229,0.25)] md:p-7">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Key className="h-5 w-5" />
        </div>
        <h4 className="text-xl font-bold text-slate-950">Bạn chưa có API key</h4>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
          Tạo API key đầu tiên để cấu hình gói này trong extension hoặc IDE.
        </p>
        <div className="mt-6 flex justify-center">
          <CosmicButton href={`/api-keys?bucketId=${bucketId}`} variant="secondary">
            <Plus className="h-4 w-4" /> Tạo API key
          </CosmicButton>
        </div>
      </div>
    );
  }

  if (allowedModels.length === 0) {
    return (
      <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-[0_24px_80px_-28px_rgba(79,70,229,0.25)] md:p-7">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
          <Cpu className="h-5 w-5" />
        </div>
        <h4 className="text-xl font-bold text-slate-950">Chưa có model khả dụng</h4>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
          Gói này hiện chưa có model khả dụng. Vui lòng liên hệ hỗ trợ hoặc chọn gói khác.
        </p>
      </div>
    );
  }

  const API_KEY = selectedKey?.key || selectedKey?.maskedKey || "YOUR_API_KEY";
  const hiddenModelCount = Math.max(allowedModels.length - MAX_VISIBLE_MODELS, 0);
  const visibleModels = isExpandedModels ? allowedModels : allowedModels.slice(0, MAX_VISIBLE_MODELS);

  return (
    <div className="mt-5 w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.25)] sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Settings className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-indigo-700">
              Tích hợp API
            </span>
            <h3 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">Hướng dẫn tích hợp</h3>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Cấu hình API key của gói {productName} trong extension hoặc IDE.
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
            aria-label="Thu gọn"
            title="Thu gọn"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <CosmicButton href={`/api-keys?bucketId=${bucketId}`} variant="secondary">
          <Plus className="h-4 w-4" /> Tạo API key
        </CosmicButton>
        {onClose ? (
          <CosmicButton variant="secondary" onClick={onClose}>
            Thu gọn
          </CosmicButton>
        ) : null}
        <CosmicButton href="/plans" variant="secondary">
          Mua thêm
        </CosmicButton>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Models được phép</p>
        <button
          type="button"
          onClick={() => hiddenModelCount > 0 && setIsExpandedModels((prev) => !prev)}
          className={cn(
            "w-full rounded-xl border border-transparent p-1 text-left transition-colors",
            hiddenModelCount > 0 ? "cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/30" : "cursor-default"
          )}
        >
          <div className="flex flex-wrap gap-2">
            {visibleModels.map((m) => (
              <span key={m.publicName} className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                {m.publicName}
              </span>
            ))}
            {!isExpandedModels && hiddenModelCount > 0 && (
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">+{hiddenModelCount} model</span>
            )}
          </div>
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">API key sử dụng</label>
          <div className="relative">
            <select
              value={selectedKeyId}
              onChange={(e) => setSelectedKeyId(e.target.value)}
              className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              title={selectedKey ? `${selectedKey.name} - ${selectedKey.maskedKey}` : "Chọn API key"}
            >
              {apiKeys.map((k) => (
                <option key={k.id} value={k.id} title={`${k.name} - ${k.maskedKey}`}>
                  {k.name} - {k.maskedKey}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Model đang chọn</label>
          <div className="relative">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              {allowedModels.map((m) => (
                <option key={m.publicName} value={m.publicName}>
                  {m.publicName}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "h-10 rounded-xl px-4 text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow"
                  : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
              )}
            >
              <span className="flex items-center gap-2 whitespace-nowrap">
                <Icon className="h-4 w-4" />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      <div>
        {activeTab === "quick" && (
          <div className="space-y-5">
            <h4 className="text-xl font-extrabold text-slate-950">Cấu hình nhanh</h4>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FieldRow label="BASE URL" value={getApiBaseUrl()} onCopy={() => handleCopy(getApiBaseUrl(), "Base URL")} />
              <FieldRow label="MODEL KHUYẾN NGHỊ" value={recommendedModel} onCopy={() => handleCopy(recommendedModel, "Model")} />
              <FieldRow
                className="lg:col-span-2"
                label={`API KEY (${selectedKey?.name})`}
                value={showFullKey ? API_KEY : selectedKey?.maskedKey || ""}
                onCopy={() => handleCopy(API_KEY, "API key")}
                onToggleMask={() => setShowFullKey(!showFullKey)}
                isMaskedField
                showMasked={showFullKey}
              />
              <FieldRow
                className="lg:col-span-2"
                label="AUTHORIZATION HEADER"
                value={`Bearer ${showFullKey ? API_KEY : selectedKey?.maskedKey || ""}`}
                onCopy={() => handleCopy(`Bearer ${API_KEY}`, "Authorization Header")}
              />
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Lưu ý bảo mật</p>
                  <p className="mt-1 text-sm leading-relaxed">
                    API key chỉ nên được sử dụng trong môi trường an toàn như IDE, extension hoặc server riêng của bạn.
                    Không chia sẻ key công khai để tránh phát sinh sử dụng ngoài ý muốn.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "continue" && (
          <CodeTab
            title="Cấu hình Continue"
            subtitle="$HOME/.continue/config.yaml"
            code={generateContinueConfig({ apiKey: API_KEY, models: allowedModelNames })}
            onCopy={() => handleCopy(generateContinueConfig({ apiKey: API_KEY, models: allowedModelNames }), "cấu hình Continue")}
          />
        )}

        {activeTab === "codex" && (
          <CodeTab
            title="Cấu hình Codex"
            subtitle="$HOME/.codex/config.toml"
            code={generateCodexConfig({ model: codexModel })}
            onCopy={() => handleCopy(generateCodexConfig({ model: codexModel }), "cấu hình Codex")}
          />
        )}

        {(activeTab === "cline" || activeTab === "roocode") && (
          <div className="space-y-4">
            <h4 className="text-xl font-extrabold text-slate-950">{activeTab === "cline" ? "Cấu hình Cline" : "Cấu hình Roo Code"}</h4>
            <div className="grid grid-cols-1 gap-4">
              <FieldRow label="PROVIDER" value="OpenAI Compatible" onCopy={() => handleCopy("OpenAI Compatible", "Provider")} />
              <FieldRow label="BASE URL" value={getApiBaseUrl()} onCopy={() => handleCopy(getApiBaseUrl(), "Base URL")} />
              <FieldRow
                label="API KEY"
                value={showFullKey ? API_KEY : selectedKey?.maskedKey || ""}
                onCopy={() => handleCopy(API_KEY, "API key")}
                onToggleMask={() => setShowFullKey(!showFullKey)}
                isMaskedField
                showMasked={showFullKey}
              />
              <FieldRow label="MODEL ID" value={recommendedModel} onCopy={() => handleCopy(recommendedModel, "Model ID")} />
            </div>
          </div>
        )}

        {activeTab === "api" && (
          <div className="space-y-4">
            <h4 className="text-xl font-extrabold text-slate-950">API mẫu</h4>
            <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              {["powershell", "curl", "javascript", "python"].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveLang(lang)}
                  className={cn(
                    "h-10 rounded-xl px-4 text-sm font-semibold uppercase transition-all duration-200",
                    activeLang === lang
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                      : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
              <div className="flex items-center justify-between border-b border-white/10 bg-slate-900 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">CONFIG</p>
                <button
                  type="button"
                  onClick={() => {
                    const code =
                      activeLang === "powershell"
                        ? generatePowerShellExample({ apiKey: API_KEY, model: recommendedModel })
                        : activeLang === "curl"
                          ? generateCurlExample({ apiKey: API_KEY, model: recommendedModel })
                          : activeLang === "javascript"
                            ? generateJsExample({ apiKey: API_KEY, model: recommendedModel })
                            : generatePythonExample({ apiKey: API_KEY, model: recommendedModel });
                    handleCopy(code, `đoạn code ${activeLang}`);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-700 active:scale-[0.98]"
                >
                  <Copy className="h-3.5 w-3.5" /> Sao chép cấu hình
                </button>
              </div>
              <pre className="max-h-[420px] overflow-auto p-4 font-mono text-sm leading-7 text-slate-100">
                {activeLang === "powershell" && generatePowerShellExample({ apiKey: API_KEY, model: recommendedModel })}
                {activeLang === "curl" && generateCurlExample({ apiKey: API_KEY, model: recommendedModel })}
                {activeLang === "javascript" && generateJsExample({ apiKey: API_KEY, model: recommendedModel })}
                {activeLang === "python" && generatePythonExample({ apiKey: API_KEY, model: recommendedModel })}
              </pre>
            </div>
          </div>
        )}
      </div>

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />}
    </div>
  );
}

function FieldRow({
  label,
  value,
  onCopy,
  className,
  onToggleMask,
  isMaskedField,
  showMasked,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  className?: string;
  onToggleMask?: () => void;
  isMaskedField?: boolean;
  showMasked?: boolean;
}) {
  return (
    <div className={cn(className)}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <div className="flex min-h-14 items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <code className="min-w-0 flex-1 break-all font-mono text-sm leading-relaxed text-slate-700">{value}</code>
        <div className="flex shrink-0 items-center gap-2">
          {isMaskedField && onToggleMask && (
            <button
              type="button"
              onClick={onToggleMask}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-[0.98]"
              aria-label={showMasked ? "Ẩn key" : "Hiện key"}
              title={showMasked ? "Ẩn key" : "Hiện key"}
            >
              {showMasked ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-[0.98]"
            aria-label="Sao chép"
            title="Sao chép"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CodeTab({
  title,
  subtitle,
  code,
  onCopy,
}: {
  title: string;
  subtitle: string;
  code: string;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-xl font-extrabold text-slate-950">{title}</h4>
          <p className="break-all font-mono text-sm text-slate-600">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-700 active:scale-[0.98]"
        >
          <Copy className="h-4 w-4" /> Sao chép cấu hình
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-900 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">CONFIG</p>
        </div>
        <pre className="max-h-[420px] overflow-auto p-4 font-mono text-sm leading-7 text-slate-100">{code}</pre>
      </div>
    </div>
  );
}
