"use client";

import { useState, useMemo, useEffect } from "react";
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
  Cpu
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { cn } from "@/lib/utils";
import { ToastMessage } from "@/components/ui/toast-message";
import { useToast } from "@/hooks/use-toast";
import {
  getApiBaseUrl,
  generateContinueConfig,
  generateCodexConfig,
  generatePowerShellExample,
  generateCurlExample,
  generateJsExample,
  generatePythonExample
} from "@/lib/integration-config";

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

export function PlanSetupInstructions({
  bucketId,
  productName,
  allowedModels,
  apiKeys,
  isOpen,
  onClose
}: PlanSetupInstructionsProps) {
  const [activeTab, setActiveTab] = useState("quick");
  const [activeLang, setActiveLang] = useState("powershell");
  const [selectedKeyId, setSelectedKeyId] = useState(apiKeys[0]?.id || "");
  const [showFullKey, setShowFullKey] = useState(false);
  
  const allowedModelNames = useMemo(() => allowedModels.map(m => m.publicName), [allowedModels]);
  const [selectedModel, setSelectedModel] = useState<string>(allowedModelNames[0] || "");
  
  const { toast, showToast, clearToast } = useToast(3000);

  // Sync selected model if list changes or selected model becomes invalid
  useEffect(() => {
    if (allowedModelNames.length > 0 && !allowedModelNames.includes(selectedModel)) {
      const timer = window.setTimeout(() => {
        setSelectedModel(allowedModelNames[0]);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [allowedModelNames, selectedModel]);

  const selectedKey = useMemo(() =>
    apiKeys.find(k => k.id === selectedKeyId) || apiKeys[0],
    [apiKeys, selectedKeyId]);

  const recommendedModel = useMemo(() => {
    if (allowedModelNames.length === 0) return "";
    return selectedModel || allowedModelNames[0];
  }, [allowedModelNames, selectedModel]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Đã copy ${label}`, "success");
  };

  if (!isOpen) return null;

  if (apiKeys.length === 0) {
    return (
      <div className="mt-8 p-10 rounded-[32px] bg-slate-50/50 border border-dashed border-slate-200 text-center animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 mb-6 shadow-sm">
          <Key className="h-7 w-7" />
        </div>
        <h4 className="text-xl font-black text-slate-950 mb-2">Chưa có API Key</h4>
        <p className="text-base font-bold text-slate-500 mb-8 max-w-sm mx-auto">Bạn cần tạo ít nhất một API key cho gói này để bắt đầu tích hợp vào các công cụ AI.</p>
        <AppButton
          variant="accent"
          size="lg"
          className="h-12 px-8 rounded-2xl text-base font-black"
          onClick={() => window.location.href = `/api-keys?bucketId=${bucketId}`}
        >
          Tạo API key ngay
        </AppButton>
      </div>
    );
  }

  if (allowedModels.length === 0) {
    return (
      <div className="mt-8 p-10 rounded-[32px] bg-slate-50/50 border border-dashed border-slate-200 text-center animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 mb-6 shadow-sm">
          <Cpu className="h-7 w-7" />
        </div>
        <h4 className="text-xl font-black text-slate-950 mb-2">Chưa có Model khả dụng</h4>
        <p className="text-base font-bold text-slate-500 mb-4 max-w-md mx-auto">
          Gói này hiện chưa có model khả dụng. Vui lòng liên hệ hỗ trợ hoặc chọn gói khác.
        </p>
      </div>
    );
  }

  const tabs = [
    { id: "quick", label: "Cấu hình nhanh", icon: Zap },
    { id: "continue", label: "Continue", icon: FileCode },
    { id: "codex", label: "Codex", icon: Cpu },
    { id: "cline", label: "Cline", icon: Code2 },
    { id: "roocode", label: "Roo Code", icon: LayoutGrid },
    { id: "api", label: "API mẫu", icon: Terminal },
  ];

  const API_KEY = selectedKey?.key || selectedKey?.maskedKey || "YOUR_API_KEY";

  return (
    <div className="mt-8 p-6 sm:p-10 rounded-[40px] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="h-10 w-10 rounded-2xl bg-slate-950 flex items-center justify-center text-white shadow-md">
              <Settings className="h-5 w-5" />
            </div>
            <h3 className="text-2xl font-black text-slate-950 tracking-tight">Hướng dẫn tích hợp</h3>
          </div>
          <p className="text-base font-bold text-slate-600 ml-14 leading-6">
            Cấu hình API key của gói <span className="text-slate-950">{productName}</span> trong extension hoặc IDE.
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-950 transition-colors">
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
          {/* Key Selector */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
               <Key className="h-3 w-3" /> API KEY SỬ DỤNG
            </label>
            <div className="relative">
              <select 
                value={selectedKeyId}
                onChange={(e) => setSelectedKeyId(e.target.value)}
                className="w-full h-14 rounded-2xl border border-slate-200 bg-slate-50/50 pl-6 pr-12 text-base font-black text-slate-900 outline-none focus:border-emerald-500 hover:border-slate-300 transition-all cursor-pointer appearance-none"
                title={selectedKey ? `${selectedKey.name} — ${selectedKey.maskedKey}` : "Chọn API key"}
              >
                {apiKeys.map(k => (
                  <option key={k.id} value={k.id} title={`${k.name} — ${k.maskedKey}`}>
                    {k.name} — {k.maskedKey}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Model Selector */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
               <Cpu className="h-3 w-3" /> MODEL ĐANG CHỌN
            </label>
            <div className="relative">
              <select 
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full h-14 rounded-2xl border border-slate-200 bg-slate-50/50 pl-6 pr-12 text-base font-black text-emerald-600 outline-none focus:border-emerald-500 hover:border-slate-300 transition-all cursor-pointer appearance-none"
              >
                {allowedModels.map(m => (
                  <option key={m.publicName} value={m.publicName}>
                    {m.publicName}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
          <div className="flex gap-2 p-2 bg-slate-100/50 rounded-[24px] border border-slate-200/50">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-3 h-12 px-5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300",
                    isActive
                      ? "bg-slate-950 text-white shadow-lg shadow-slate-400/20"
                      : "text-slate-600 hover:bg-white hover:text-slate-950"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive ? "text-[#00d4a4]" : "text-slate-400")} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[320px]">
          {activeTab === "quick" && (
            <div className="space-y-8">
              <div className="flex items-center mb-2">
                <h4 className="text-xl font-black text-slate-950">Cấu hình nhanh</h4>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">Base URL</p>
                  <div className="flex items-center justify-between gap-4 bg-slate-50 border border-slate-200 h-16 px-6 rounded-[20px] group transition-all hover:border-slate-300">
                    <code className="text-base font-mono font-black text-slate-800 truncate">{getApiBaseUrl()}</code>
                    <button onClick={() => handleCopy(getApiBaseUrl(), "Base URL")} className="text-slate-400 hover:text-emerald-500 transition-colors shrink-0 p-2 hover:bg-white rounded-lg">
                      <Copy className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">Model khuyến nghị</p>
                  <div className="flex items-center justify-between gap-4 bg-emerald-50/30 border border-emerald-100 h-16 px-6 rounded-[20px] group transition-all hover:border-emerald-200">
                    <code className="text-base font-mono font-black text-emerald-600 truncate">{recommendedModel}</code>
                    <button onClick={() => handleCopy(recommendedModel, "Model ID")} className="text-emerald-400 hover:text-emerald-600 transition-colors shrink-0 p-2 hover:bg-white rounded-lg">
                      <Copy className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-3">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">API Key ({selectedKey?.name})</p>
                  <div className="flex items-center justify-between gap-4 bg-slate-50 border border-slate-200 h-16 px-6 rounded-[20px] group transition-all hover:border-slate-300">
                    <code className="text-base font-mono font-black text-slate-800 truncate">
                      {showFullKey ? API_KEY : selectedKey?.maskedKey}
                    </code>
                    <div className="flex items-center gap-4 shrink-0">
                      <button onClick={() => setShowFullKey(!showFullKey)} className="text-slate-400 hover:text-slate-950 transition-colors p-2 hover:bg-white rounded-lg">
                        {showFullKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                      <div className="w-px h-8 bg-slate-200 mx-1" />
                      <button onClick={() => handleCopy(API_KEY, "API Key")} className="text-slate-400 hover:text-emerald-500 transition-colors p-2 hover:bg-white rounded-lg">
                        <Copy className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-3">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">Authorization Header</p>
                  <div className="flex items-center justify-between gap-4 bg-slate-50 border border-slate-200 h-16 px-6 rounded-[20px] group transition-all hover:border-slate-300">
                    <code className="text-base font-mono font-black text-slate-800 truncate">Bearer {showFullKey ? API_KEY : selectedKey?.maskedKey}</code>
                    <button onClick={() => handleCopy(`Bearer ${API_KEY}`, "Authorization Header")} className="text-slate-400 hover:text-emerald-500 transition-colors shrink-0 p-2 hover:bg-white rounded-lg">
                      <Copy className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-5 p-6 rounded-[32px] bg-amber-50/50 border border-amber-100">
                <div className="h-12 w-12 rounded-2xl bg-white border border-amber-200 flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
                  <Info className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-amber-700 leading-relaxed mt-0.5">
                  <span className="font-black text-amber-800">Lưu ý bảo mật:</span> API key của gói <span className="font-black underline">{productName}</span> chỉ nên được sử dụng ở phía Client (IDE, Extension) hoặc Server an toàn. Không chia sẻ Key cho người khác để tránh hết credits ngoài ý muốn.
                </p>
              </div>
            </div>
          )}

          {activeTab === "continue" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-black text-slate-950">Cấu hình Continue</p>
                  <div className="flex flex-col gap-1 mt-1">
                    <p className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                      File cấu hình: <code className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">$HOME/.continue/config.yaml</code>
                    </p>
                    <p className="text-xs font-black text-amber-600 uppercase italic">* Lưu ý: Continue dùng file YAML. Không trộn JSON vào config.yaml.</p>
                  </div>
                </div>
                <AppButton
                  size="sm"
                  variant="secondary"
                  onClick={() => handleCopy(generateContinueConfig({ apiKey: API_KEY, models: allowedModelNames }), "Cấu hình Continue")}
                  className="h-11 px-5 rounded-2xl border-slate-200 text-sm font-bold shadow-sm"
                >
                  <Copy className="h-5 w-5 mr-2" /> Copy toàn bộ cấu hình
                </AppButton>
              </div>
              <div className="relative group">
                <pre className="bg-slate-950 text-emerald-400/90 p-6 rounded-[32px] text-[13px] leading-6 font-mono overflow-x-auto max-h-[460px] scrollbar-thin border border-white/5 shadow-2xl">
                  {generateContinueConfig({ apiKey: API_KEY, models: allowedModelNames })}
                </pre>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100">
                  <div className="mb-4 flex items-center justify-between gap-3 text-base font-black text-slate-950">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-slate-950 text-white flex items-center justify-center text-sm font-black shadow-md">1</div>
                      <span className="text-base font-black">Bước 1: Mở cấu hình</span>
                    </div>
                    <button onClick={() => handleCopy("code $env:USERPROFILE\\.continue\\config.yaml", "lệnh mở config")} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-950 transition-colors">
                      <Copy className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-slate-600 leading-6 mb-4">
                    Mở file config.yaml của Continue. Bạn có thể dùng lệnh bên cạnh để mở nhanh trong VS Code.
                  </p>
                  <code className="block p-3 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-600">code $env:USERPROFILE\.continue\config.yaml</code>
                </div>
                <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100">
                  <div className="mb-4 flex items-center gap-3 text-base font-black text-slate-950">
                    <div className="h-8 w-8 rounded-xl bg-slate-950 text-white flex items-center justify-center text-sm font-black shadow-md">2</div>
                    <span className="text-base font-black">Bước 2: Cập nhật cấu hình</span>
                  </div>
                  <p className="text-sm font-bold text-slate-600 leading-6">
                    Dán nội dung YAML ở trên vào file. Lưu file, Reload VS Code và chọn model trong panel Continue để bắt đầu.
                  </p>
                </div>
              </div>
              <div className="p-5 rounded-[24px] bg-emerald-50 border border-emerald-100/50">
                <p className="text-sm font-bold text-emerald-800 leading-relaxed">
                  <span className="font-black">Mẹo:</span> Continue cần dùng Chat Completions qua TzoShop, vì vậy hãy giữ <code className="bg-white/50 px-1.5 py-0.5 rounded text-emerald-950">useResponsesApi: false</code>.
                </p>
              </div>
            </div>
          )}

          {activeTab === "codex" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-black text-slate-950">Cấu hình Codex</p>
                  <p className="text-sm font-semibold text-slate-500 mt-1">File cấu hình: <code className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">$HOME/.codex/config.toml</code></p>
                </div>
                <AppButton
                  size="sm"
                  variant="secondary"
                  onClick={() => handleCopy(generateCodexConfig({ model: recommendedModel }), "Cấu hình Codex")}
                  className="h-11 px-5 rounded-2xl border-slate-200 text-sm font-bold shadow-sm"
                >
                  <Copy className="h-5 w-5 mr-2" /> Copy cấu hình Codex
                </AppButton>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100">
                  <div className="mb-4 flex items-center justify-between gap-3 text-base font-black text-slate-950">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-slate-950 text-white flex items-center justify-center text-sm font-black shadow-md">1</div>
                      <span className="text-base font-black">Bước 1: Tạo file cấu hình</span>
                    </div>
                    <button onClick={() => handleCopy("mkdir $env:USERPROFILE\\.codex -Force; code $env:USERPROFILE\\.codex\\config.toml", "lệnh tạo config")} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-950 transition-colors">
                      <Copy className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-slate-600 leading-6 mb-3">Chạy lệnh sau trong PowerShell để tạo thư mục và mở file config.toml:</p>
                  <code className="block p-3 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-600 leading-relaxed">
                    mkdir $env:USERPROFILE\.codex -Force<br />
                    code $env:USERPROFILE\.codex\config.toml
                  </code>
                </div>
                <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100">
                  <div className="mb-4 flex items-center justify-between gap-3 text-base font-black text-slate-950">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-slate-950 text-white flex items-center justify-center text-sm font-black shadow-md">2</div>
                      <span className="text-base font-black">Bước 2: Set API Key</span>
                    </div>
                    <button onClick={() => handleCopy(`$env:TZOSHOP_API_KEY="${API_KEY}"`, "lệnh set API key")} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-950 transition-colors">
                      <Copy className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-slate-600 leading-6 mb-3">Dùng biến môi trường để bảo mật API key:</p>
                  <code className="block p-3 bg-white border border-slate-200 rounded-xl text-sm font-mono text-emerald-600 font-bold">$env:TZOSHOP_API_KEY=&quot;{API_KEY}&quot;</code>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute top-4 left-6 z-10">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">config.toml</p>
                </div>
                <pre className="bg-slate-950 text-emerald-400/90 p-6 pt-14 rounded-[32px] text-sm leading-6 font-mono overflow-x-auto max-h-[460px] scrollbar-thin border border-white/5 shadow-2xl">
                  {generateCodexConfig({ model: recommendedModel })}
                </pre>
              </div>

              <div className="mt-2 p-6 rounded-3xl bg-slate-50 border border-slate-100">
                <p className="text-sm font-bold text-slate-600 leading-6">
                  <span className="text-slate-950 font-black">Bước 3:</span> Dán nội dung TOML ở trên vào file và lưu lại. Sau đó khởi động lại Terminal/IDE để Codex nhận cấu hình mới.
                </p>
              </div>
            </div>
          )}

          {(activeTab === "cline" || activeTab === "roocode") && (
            <div className="space-y-8 max-w-3xl mx-auto">
              <div className="flex items-center mb-2">
                <h4 className="text-xl font-black text-slate-950">Cấu hình {activeTab === "cline" ? "Cline" : "Roo Code"}</h4>
              </div>
              <div className="grid gap-6">
                {[
                  { label: "Provider", val: "OpenAI Compatible", icon: Settings, msg: "Provider" },
                  { label: "Base URL", val: getApiBaseUrl(), icon: LayoutGrid, msg: "Base URL" },
                  { label: "API Key", val: API_KEY, isKey: true, icon: Key, msg: "API key" },
                  { label: "Model ID", val: recommendedModel, icon: Code2, msg: "Model ID" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-10">
                    <div className="sm:w-36 shrink-0 flex items-center gap-3">
                      <item.icon className="h-5 w-5 text-slate-400" />
                      <p className="text-xs font-black text-slate-500 uppercase tracking-wide">{item.label}</p>
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-5 bg-slate-50 border border-slate-200 h-14 px-6 rounded-[20px] group transition-all hover:border-slate-300">
                      <code className={cn("text-base font-mono font-black truncate", item.isKey ? "text-slate-800" : "text-emerald-600")}>
                        {item.isKey && !showFullKey ? selectedKey?.maskedKey : item.val}
                      </code>
                      <button onClick={() => handleCopy(item.val, item.msg)} className="text-slate-400 hover:text-emerald-500 transition-colors shrink-0 p-2 hover:bg-white rounded-lg">
                        <Copy className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10 text-center bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                <p className="text-sm font-bold text-slate-500 leading-6 italic">
                  Lưu ý: Nếu {activeTab === "cline" ? "Cline" : "Roo Code"} không tự load model, hãy copy và nhập trực tiếp Model ID ở trên vào mục Custom Model.
                </p>
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div className="space-y-8">
              <div className="flex items-center mb-2">
                <h4 className="text-xl font-black text-slate-950">API mẫu</h4>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-100/50 rounded-2xl border border-slate-200/50 max-w-md mx-auto">
                {["powershell", "curl", "javascript", "python"].map(lang => (
                  <button
                    key={lang}
                    onClick={() => setActiveLang(lang)}
                    className={cn(
                      "flex-1 h-10 rounded-xl text-xs font-black uppercase transition-all duration-300",
                      activeLang === lang ? "bg-white text-slate-950 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-950"
                    )}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              <div className="relative group">
                <pre className="bg-slate-950 text-emerald-400/90 p-6 rounded-[32px] text-[13px] leading-6 font-mono overflow-x-auto max-h-[460px] scrollbar-thin border border-white/5 shadow-2xl">
                  {activeLang === "powershell" && generatePowerShellExample({ apiKey: API_KEY, model: recommendedModel })}
                  {activeLang === "curl" && generateCurlExample({ apiKey: API_KEY, model: recommendedModel })}
                  {activeLang === "javascript" && generateJsExample({ apiKey: API_KEY, model: recommendedModel })}
                  {activeLang === "python" && generatePythonExample({ apiKey: API_KEY, model: recommendedModel })}
                </pre>
                <button
                  onClick={() => {
                    const code = activeLang === "powershell" ? generatePowerShellExample({ apiKey: API_KEY, model: recommendedModel }) :
                      activeLang === "curl" ? generateCurlExample({ apiKey: API_KEY, model: recommendedModel }) :
                        activeLang === "javascript" ? generateJsExample({ apiKey: API_KEY, model: recommendedModel }) :
                          generatePythonExample({ apiKey: API_KEY, model: recommendedModel });
                    handleCopy(code, `đoạn code ${activeLang}`);
                  }}
                  className="absolute top-6 right-6 h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md border border-white/10"
                >
                  <Copy className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={clearToast}
        />
      )}
    </div>
  );
}
