"use client";

import { useEffect, useState, useCallback, ElementType } from "react";
import { 
  Activity, 
  Database, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Mail, 
  RefreshCw, 
  Layers, 
  Zap, 
  Cpu,
  Globe,
  CreditCard
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ui } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import { Modal } from "@/components/ui/modal";

type StatusInfo = {
  status: "CONFIGURED" | "WARNING" | "MISSING" | "ERROR";
  label: string;
  message: string;
};

type SystemData = {
  config: {
    database: boolean;
    payos: boolean;
    resend: boolean;
    googleOAuth: boolean;
    encryptionSecret: boolean;
  };
  details?: Record<string, StatusInfo | undefined>;
  dbConnected: boolean;
  stats: {
    activeProviders: number;
    activeModels: number;
  };
  recentOrders: {
    id: string;
    amountVnd: number;
    updatedAt: string;
    user: { email: string };
    product: { name: string };
  }[];
  recentUsage: {
    id: string;
    model: string;
    status: string;
    createdAt: string;
    user: { email: string };
  }[];
};

type ConfigCardProps = {
  title: string;
  status: boolean;
  icon: ElementType;
  description: string;
  detailKey: string;
  details?: Record<string, StatusInfo | undefined>;
  onSelect: (info: StatusInfo) => void;
};

function ConfigCard({
  title,
  status,
  icon: Icon,
  description,
  detailKey,
  details,
  onSelect,
}: ConfigCardProps) {
  const detail = details?.[detailKey] ?? null;
  const currentStatus = detail?.status || (status ? "CONFIGURED" : "MISSING");

  return (
    <AppCard
      onClick={() => detail && onSelect(detail)}
      className={cn(
        "p-6 flex items-start gap-4 transition-all hover:border-[#00d4a4]/30 hover:shadow-lg cursor-pointer group",
        !detail && "opacity-80"
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-110",
          currentStatus === "CONFIGURED"
            ? "bg-[#e7fff7] text-[#00d4a4]"
            : currentStatus === "WARNING"
            ? "bg-amber-50 text-amber-600"
            : currentStatus === "ERROR"
            ? "bg-rose-50 text-rose-600"
            : "bg-amber-50 text-amber-600"
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-black text-[#0b0f0d] truncate">{title}</h3>
          {currentStatus === "CONFIGURED" ? (
            <CheckCircle2 className="h-4 w-4 text-[#00d4a4]" />
          ) : currentStatus === "WARNING" || currentStatus === "MISSING" ? (
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          ) : (
            <XCircle className="h-4 w-4 text-rose-500" />
          )}
        </div>
        <p className={cn(ui.pMuted, "text-[11px] mb-2")}>{description}</p>
        <div className="flex items-center justify-between">
          <StatusBadge
            status={
              currentStatus === "CONFIGURED"
                ? "Đã cấu hình"
                : currentStatus === "WARNING"
                ? "Cần bổ sung"
                : currentStatus === "ERROR"
                ? "Lỗi kết nối"
                : "Thiếu cấu hình"
            }
            variant={
              currentStatus === "CONFIGURED"
                ? "success"
                : currentStatus === "ERROR"
                ? "danger"
                : "warning"
            }
          />
          <span className="text-[9px] font-bold text-slate-400 group-hover:text-emerald-500 transition-colors uppercase tracking-tighter">
            Chi tiết
          </span>
        </div>
      </div>
    </AppCard>
  );
}

export default function AdminSystemPage() {
  const [data, setData] = useState<SystemData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<StatusInfo | null>(null);
  const { toast, showToast, clearToast } = useToast();

  const fetchSystemStatus = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      
      const [resSystem, resStatus] = await Promise.all([
        fetch("/api/admin/system"),
        fetch("/api/admin/system-status")
      ]);
      
      const [resultSystem, resultStatus] = await Promise.all([
        resSystem.json(),
        resStatus.json()
      ]);

      if (resultSystem.success) {
        const combinedData = { ...resultSystem.data };
        if (resultStatus.success) {
          combinedData.details = resultStatus.data;
        }
        setData(combinedData);
      } else {
        showToast(resultSystem.message || "Lỗi khi tải trạng thái", "error");
      }
    } catch (error) {
      console.error("fetchSystemStatus failed:", error);
      showToast("Lỗi hệ thống", "error");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [showToast]);

  const fetchDetailedStatus = useCallback(async () => {
    try {
      setIsChecking(true);
      const res = await fetch("/api/admin/system-status");
      const result = await res.json();
      if (result.success) {
        setData(prev => prev ? ({ ...prev, details: result.data }) : null);
        showToast("Đã cập nhật trạng thái hệ thống mới nhất", "success");
      } else {
        showToast(result.message || "Lỗi khi kiểm tra", "error");
      }
    } catch (error) {
      console.error("fetchDetailedStatus failed:", error);
      showToast("Lỗi khi kết nối API kiểm tra", "error");
    } finally {
      setIsChecking(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchSystemStatus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchSystemStatus]);

  return (
    <div className="space-y-8 pb-12">
      <PageHeader 
        title="Trạng thái hệ thống" 
        description="Kiểm tra cấu hình môi trường và sức khỏe của ứng dụng."
        icon={<Activity className="h-8 w-8" />}
        actions={
          <div className="flex gap-3">
            <AppButton 
              onClick={fetchDetailedStatus}
              disabled={isChecking || isLoading}
              variant="primary"
              size="sm"
            >
              <ShieldCheck className={cn("h-4 w-4 mr-2", isChecking && "animate-pulse")} />
              {isChecking ? "Đang kiểm tra..." : "Kiểm tra hệ thống"}
            </AppButton>
            <AppButton 
              onClick={() => fetchSystemStatus(true)}
              disabled={isLoading}
              variant="secondary"
              size="sm"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Làm mới
            </AppButton>
          </div>
        }
      />

      {isLoading && !data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-32 rounded-[32px] bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : data && (
        <>
          {/* Main Config Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <ConfigCard 
              title="Cơ sở dữ liệu" 
              status={data.dbConnected} 
              icon={Database} 
              description="Kết nối cơ sở dữ liệu chính."
              detailKey="database"
              details={data.details}
              onSelect={setSelectedConfig}
            />
            <ConfigCard 
              title="Cổng thanh toán PayOS" 
              status={data.config.payos} 
              icon={CreditCard} 
              description="Thanh toán trực tuyến."
              detailKey="payos"
              details={data.details}
              onSelect={setSelectedConfig}
            />
            <ConfigCard 
              title="Dịch vụ Email" 
              status={data.config.resend} 
              icon={Mail} 
              description="Dịch vụ gửi thông báo (Resend)."
              detailKey="resend"
              details={data.details}
              onSelect={setSelectedConfig}
            />
            <ConfigCard 
              title="Đăng nhập Google" 
              status={data.config.googleOAuth} 
              icon={Globe} 
              description="Google OAuth Login."
              detailKey="googleAuth"
              details={data.details}
              onSelect={setSelectedConfig}
            />
            <ConfigCard 
              title="Mã hóa API Key" 
              status={data.config.encryptionSecret} 
              icon={ShieldCheck} 
              description="Bảo mật dữ liệu nhạy cảm."
              detailKey="keyEncryption"
              details={data.details}
              onSelect={setSelectedConfig}
            />
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#0b0f0d] rounded-[40px] p-8 text-white shadow-2xl flex items-center justify-between overflow-hidden relative group">
               <div className="relative z-10">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">NHÀ CUNG CẤP ĐANG HOẠT ĐỘNG</p>
                  <p className="text-5xl font-black text-[#00d4a4]">{data.stats.activeProviders}</p>
                  <div className="mt-6 flex items-center gap-2 text-[#00d4a4] font-bold text-xs">
                     <div className="h-2 w-2 rounded-full bg-[#00d4a4] animate-pulse shadow-[0_0_8px_#00d4a4]" />
                     Sẵn sàng xử lý request
                  </div>
               </div>
               <Cpu className="absolute -right-6 -bottom-6 h-32 w-32 text-white/5 rotate-12 transition-transform group-hover:scale-110 duration-500" />
            </div>

            <div className="bg-[#00d4a4] rounded-[40px] p-8 text-[#0b0f0d] shadow-2xl flex items-center justify-between overflow-hidden relative group">
               <div className="relative z-10">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0b0f0d]/40 mb-2">MODELS ĐANG HOẠT ĐỘNG</p>
                  <p className="text-5xl font-black">{data.stats.activeModels}</p>
                  <div className="mt-6 flex items-center gap-2 text-[#0b0f0d] font-bold text-xs">
                     <CheckCircle2 className="h-4 w-4" />
                     Hỗ trợ qua Gateway
                  </div>
               </div>
               <Zap className="absolute -right-6 -bottom-6 h-32 w-32 text-[#0b0f0d]/5 -rotate-12 transition-transform group-hover:scale-110 duration-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Orders (Webhook indicators) */}
            <AppCard className="overflow-hidden flex flex-col p-0">
               <div className="p-8 border-b border-[#edf1ee] flex items-center justify-between bg-[#fbfbf8]">
                  <div className="flex items-center gap-3">
                     <div className="h-11 w-11 rounded-2xl bg-white flex items-center justify-center text-[#0b0f0d] shadow-sm border border-[#edf1ee]">
                        <CreditCard className="h-5 w-5" />
                     </div>
                     <div>
                        <h3 className={ui.h3}>Thanh toán gần đây</h3>
                        <p className={cn(ui.pMuted, "text-xs mt-0.5")}>Các giao dịch thanh toán đã được xác nhận gần đây.</p>
                     </div>
                  </div>
               </div>
               <div className="flex-1 divide-y divide-[#edf1ee]">
                  {data.recentOrders.length === 0 ? (
                    <div className="p-12 text-center text-[#8a9690] font-bold italic">Chưa có giao dịch gần đây.</div>
                  ) : data.recentOrders.map((order) => (
                    <div key={order.id} className="p-6 flex items-center justify-between hover:bg-[#fbfbf8]/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-[#e7fff7] flex items-center justify-center text-[#00d4a4]">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-[#0b0f0d]">{order.user.email || 'User'}</p>
                          <p className={ui.label}>{order.product.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-[#0b0f0d]">+{order.amountVnd.toLocaleString('vi-VN')}đ</p>
                        <p className={cn(ui.pMuted, "text-[10px]")}>
                          {format(new Date(order.updatedAt), "HH:mm dd/MM", { locale: vi })}
                        </p>
                      </div>
                    </div>
                  ))}
               </div>
            </AppCard>

            {/* Recent API Usage */}
            <AppCard className="overflow-hidden flex flex-col p-0">
               <div className="p-8 border-b border-[#edf1ee] flex items-center justify-between bg-[#fbfbf8]">
                  <div className="flex items-center gap-3">
                     <div className="h-11 w-11 rounded-2xl bg-white flex items-center justify-center text-[#0b0f0d] shadow-sm border border-[#edf1ee]">
                        <Layers className="h-5 w-5" />
                     </div>
                     <div>
                        <h3 className={ui.h3}>Sử dụng API gần nhất</h3>
                        <p className={cn(ui.pMuted, "text-xs mt-0.5")}>Các lượt gọi API gần đây qua hệ thống TzoShop.</p>
                     </div>
                  </div>
               </div>
               <div className="flex-1 divide-y divide-[#edf1ee]">
                  {data.recentUsage.length === 0 ? (
                    <div className="p-12 text-center text-[#8a9690] font-bold italic">Chưa có lượt sử dụng nào.</div>
                  ) : data.recentUsage.map((log) => (
                    <div key={log.id} className="p-6 flex items-center justify-between hover:bg-[#fbfbf8]/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-[#0b0f0d] flex items-center justify-center text-white">
                          <Zap className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-[#0b0f0d]">{log.model}</p>
                          <p className={cn(ui.pMuted, "text-[10px]")}>{log.user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <StatusBadge 
                          status={log.status === "SUCCESS" ? "Thành công" : "Thất bại"}
                          variant={log.status === "SUCCESS" ? "success" : "danger"}
                          className="mb-1"
                        />
                        <p className={cn(ui.pMuted, "text-[10px]")}>
                          {format(new Date(log.createdAt), "HH:mm:ss", { locale: vi })}
                        </p>
                      </div>
                    </div>
                  ))}
               </div>
            </AppCard>
          </div>
        </>
      )}

      {selectedConfig && (
        <Modal
          open={!!selectedConfig}
          onClose={() => setSelectedConfig(null)}
          title={selectedConfig.label}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
              <span className="text-sm font-bold text-slate-500">Trạng thái hiện tại</span>
              <StatusBadge 
                status={
                  selectedConfig.status === "CONFIGURED" ? "Đã cấu hình" : 
                  selectedConfig.status === "WARNING" ? "Cần bổ sung" :
                  selectedConfig.status === "ERROR" ? "Lỗi kết nối" : "Thiếu cấu hình"
                }
                variant={selectedConfig.status === "CONFIGURED" ? "success" : selectedConfig.status === "ERROR" ? "danger" : "warning"}
              />
            </div>

            <div className="p-5 rounded-2xl border border-slate-100 space-y-4">
              <p className="text-sm font-medium text-slate-800 leading-relaxed">
                {selectedConfig.message}
              </p>
              
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Biến môi trường kiểm tra</p>
                <div className="space-y-2">
                  {selectedConfig.label === "Cơ sở dữ liệu" && (
                    <>
                      <EnvStatus label="DATABASE_URL" exists={true} />
                      <EnvStatus label="Prisma Client" exists={selectedConfig.status === "CONFIGURED"} />
                    </>
                  )}
                  {selectedConfig.label === "Cổng thanh toán PayOS" && (
                    <>
                      <EnvStatus label="PAYOS_CLIENT_ID" exists={selectedConfig.status === "CONFIGURED"} />
                      <EnvStatus label="PAYOS_API_KEY" exists={selectedConfig.status === "CONFIGURED"} />
                      <EnvStatus label="PAYOS_CHECKSUM_KEY" exists={selectedConfig.status === "CONFIGURED"} />
                    </>
                  )}
                  {selectedConfig.label === "Dịch vụ Email" && (
                    <>
                      <EnvStatus label="RESEND_API_KEY" exists={selectedConfig.status === "CONFIGURED" || selectedConfig.status === "WARNING"} />
                      <EnvStatus label="RESET_PASSWORD_FROM_EMAIL" exists={selectedConfig.status === "CONFIGURED"} />
                    </>
                  )}
                  {selectedConfig.label === "Đăng nhập Google" && (
                    <>
                      <EnvStatus label="GOOGLE_CLIENT_ID" exists={selectedConfig.status === "CONFIGURED"} />
                      <EnvStatus label="GOOGLE_CLIENT_SECRET" exists={selectedConfig.status === "CONFIGURED"} />
                    </>
                  )}
                  {selectedConfig.label === "Mã hóa API Key" && (
                    <>
                      <EnvStatus label="API_KEY_ENCRYPTION_SECRET" exists={selectedConfig.status === "CONFIGURED"} />
                    </>
                  )}
                </div>
              </div>
            </div>

            <AppButton 
              onClick={() => setSelectedConfig(null)}
              className="w-full"
            >
              Đóng
            </AppButton>
          </div>
        </Modal>
      )}

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

function EnvStatus({ label, exists }: { label: string; exists: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs font-mono text-slate-600">{label}</span>
      {exists ? (
        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">ĐÃ CẤU HÌNH</span>
      ) : (
        <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">THIẾU</span>
      )}
    </div>
  );
}
