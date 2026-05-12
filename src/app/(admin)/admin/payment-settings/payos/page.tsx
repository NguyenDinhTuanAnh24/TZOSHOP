"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  CreditCard, 
  ShieldCheck, 
  KeyRound, 
  Save, 
  Activity,
  Info,
  Shield,
  Zap
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { ui } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";

export default function PayOSSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState({
    clientId: "",
    apiKey: "",
    checksumKey: "",
    apiKeyMasked: "",
    checksumKeyMasked: "",
    environment: "production",
    isActive: false,
  });

  const { toast, showToast, clearToast } = useToast();

  const fetchConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/payment-settings/payos");
      const result = await res.json();
      if (result.success) {
        setConfig({
          ...result.data,
          apiKey: "", // Không giữ key thật ở client state
          checksumKey: "",
        });
      }
    } catch {
      showToast("Không thể tải cấu hình.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchConfig();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchConfig]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/admin/payment-settings/payos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: config.clientId,
          apiKey: config.apiKey || undefined,
          checksumKey: config.checksumKey || undefined,
          environment: config.environment,
          isActive: config.isActive,
        }),
      });

      const result = await res.json();
      if (result.success) {
        showToast("Đã lưu cấu hình thành công.", "success");
        fetchConfig(); // Tải lại để cập nhật masked keys
      } else {
        throw new Error(result.error?.message || "Lỗi lưu cấu hình.");
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Lỗi lưu cấu hình", "error");
    } finally {
      setIsSaving(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#00d4a4] border-t-transparent" />
        <p className={cn(ui.label, "animate-pulse")}>Đang tải cấu hình...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <PageHeader 
        title="Cấu hình PayOS" 
        description="Quản lý các tham số kết nối tới cổng thanh toán PayOS."
        icon={<CreditCard className="h-8 w-8" />}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_300px] items-start">
        <div className="space-y-6">
          {/* Main Config Card */}
          <AppCard className="p-6 sm:p-8">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7fff7] text-[#00d4a4]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className={ui.h3}>Thông tin API</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-1">
                <label className={ui.label}>Client ID</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center text-[#8a9690] group-focus-within:text-[#00d4a4] transition-colors">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Nhập Client ID từ PayOS Dashboard"
                    className={cn(ui.input, "pl-12")}
                    value={config.clientId}
                    onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className={ui.label}>API Key</label>
                  <input
                    type="password"
                    placeholder={config.apiKeyMasked || "Nhập API Key"}
                    className={ui.input}
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  />
                  {config.apiKeyMasked && (
                    <p className={cn(ui.pMuted, "text-[10px] mt-1.5 italic ml-1")}>Đã cấu hình: {config.apiKeyMasked}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className={ui.label}>Checksum Key</label>
                  <input
                    type="password"
                    placeholder={config.checksumKeyMasked || "Nhập Checksum Key"}
                    className={ui.input}
                    value={config.checksumKey}
                    onChange={(e) => setConfig({ ...config, checksumKey: e.target.value })}
                  />
                  {config.checksumKeyMasked && (
                    <p className={cn(ui.pMuted, "text-[10px] mt-1.5 italic ml-1")}>Đã cấu hình: {config.checksumKeyMasked}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className={ui.label}>Môi trường (Environment)</label>
                <div className="grid grid-cols-2 gap-4">
                   <AppButton
                    onClick={() => setConfig({ ...config, environment: "sandbox" })}
                    variant={config.environment === "sandbox" ? "accent" : "secondary"}
                    className="h-12"
                  >
                    <div className={cn("h-2 w-2 rounded-full mr-2", config.environment === "sandbox" ? "bg-white animate-pulse" : "bg-[#8a9690]")} />
                    Sandbox (Test)
                  </AppButton>
                  <AppButton
                    onClick={() => setConfig({ ...config, environment: "production" })}
                    variant={config.environment === "production" ? "primary" : "secondary"}
                    className="h-12"
                  >
                    <div className={cn("h-2 w-2 rounded-full mr-2", config.environment === "production" ? "bg-[#00d4a4] animate-pulse" : "bg-[#8a9690]")} />
                    Production (Thật)
                  </AppButton>
                </div>
              </div>
            </div>
          </AppCard>

          {/* Activation Card */}
          <AppCard className="p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-colors", config.isActive ? "bg-[#e7fff7] text-[#00d4a4]" : "bg-[#fbfbf8] text-[#8a9690]")}>
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className={ui.h3}>Trạng thái cổng thanh toán</h3>
                  <p className={cn(ui.pMuted, "text-xs mt-0.5")}>Kích hoạt để cho phép khách hàng thanh toán qua PayOS.</p>
                </div>
              </div>
              <button
                onClick={() => setConfig({ ...config, isActive: !config.isActive })}
                className={cn(
                  "relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ring-offset-2 focus:ring-2 focus:ring-[#00d4a4]",
                  config.isActive ? "bg-[#00d4a4]" : "bg-[#edf1ee]"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm",
                    config.isActive ? "translate-x-7" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </AppCard>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <AppButton
              onClick={handleSave}
              disabled={isSaving}
              variant="primary"
              className="w-full sm:w-auto px-10 h-[56px]"
            >
              {isSaving ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Lưu cấu hình
                </>
              )}
            </AppButton>
            
            <AppButton
              variant="secondary"
              className="w-full sm:w-auto px-8 h-[56px]"
            >
              <Activity className="h-4 w-4 mr-2" />
              Kiểm tra kết nối
            </AppButton>
          </div>
        </div>

        {/* Sidebar Help */}
        <aside className="space-y-6">
          <div className="rounded-3xl border border-[#00d4a4]/20 bg-[#e7fff7]/30 p-6 ring-1 ring-[#00d4a4]/10 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-[#00d4a4]">
              <Info className="h-5 w-5" />
              <h3 className={ui.h3}>Hướng dẫn</h3>
            </div>
            <div className="space-y-4 text-xs font-bold text-[#8a9690] leading-6">
              <p>1. Đăng nhập vào <a href="https://dashboard.payos.vn" target="_blank" className="text-[#00d4a4] underline decoration-dotted underline-offset-4">PayOS Dashboard</a>.</p>
              <p>2. Copy <b>Client ID</b>, <b>API Key</b> và <b>Checksum Key</b> dán vào form bên cạnh.</p>
              <p>3. Chọn môi trường tương ứng (Sandbox để test, Production để chạy thật).</p>
              <p>4. Bật <b>Kích hoạt</b> và nhấn <b>Lưu cấu hình</b>.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-[#edf1ee] bg-[#fbfbf8] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-[#8a9690]">
              <Shield className="h-5 w-5" />
              <h3 className={ui.h3}>Bảo mật</h3>
            </div>
            <p className={cn(ui.pMuted, "text-xs leading-relaxed")}>
              Tất cả các API Key đều được mã hóa bằng thuật toán <b>AES-256-GCM</b> trước khi lưu vào cơ sở dữ liệu. Chỉ hệ thống backend mới có quyền giải mã các thông tin này.
            </p>
          </div>
        </aside>
      </div>

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
