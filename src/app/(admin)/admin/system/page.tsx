"use client";

import { useEffect, useState, useCallback, ElementType } from "react";
import {
  Activity,
  Database,
  ShieldCheck,
  Mail,
  RefreshCw,
  Layers,
  Zap,
  Cpu,
  Globe,
  CreditCard,
  HeartPulse,
  Receipt,
  LockKeyhole,
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

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

function statusLabel(status: StatusInfo["status"]) {
  if (status === "CONFIGURED") return "ĐÃ CẤU HÌNH";
  if (status === "WARNING") return "THIẾU CẤU HÌNH";
  if (status === "ERROR") return "LỖI";
  return "CHƯA KIỂM TRA";
}

function statusClass(status: StatusInfo["status"]) {
  if (status === "CONFIGURED") return "bg-[#C7F0D8]";
  if (status === "WARNING") return "bg-[#FFD93D]";
  if (status === "ERROR") return "bg-[#FF6B6B]";
  return "bg-[#E9E1D0]";
}

function statusIconBg(status: StatusInfo["status"]) {
  if (status === "CONFIGURED") return "bg-[#C7F0D8]";
  if (status === "WARNING") return "bg-[#FFD93D]";
  if (status === "ERROR") return "bg-[#FF6B6B]";
  return "bg-[#E9E1D0]";
}

function ConfigCard({ title, status, icon: Icon, description, detailKey, details, onSelect }: ConfigCardProps) {
  const detail = details?.[detailKey] ?? null;
  const currentStatus: StatusInfo["status"] = detail?.status || (status ? "CONFIGURED" : "MISSING");

  return (
    <article className="flex min-h-[170px] flex-col justify-between border-4 border-black bg-[#FFFDF5] p-5 shadow-[6px_6px_0px_0px_#000] transition-all duration-100 hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_#000]">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center border-4 border-black shadow-[3px_3px_0px_0px_#000] ${statusIconBg(currentStatus)}`}>
          <Icon className="h-6 w-6 text-black" />
        </div>
        <span className={`inline-flex border-2 border-black px-2 py-1 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] ${statusClass(currentStatus)}`}>
          {statusLabel(currentStatus)}
        </span>
      </div>
      <div className="mt-4">
        <h3 className="line-clamp-2 text-base font-black text-black">{title}</h3>
        <p className="mt-2 line-clamp-2 text-sm font-bold text-black/65">{description}</p>
      </div>
      <div className="mt-4">
        <button
          onClick={() => detail && onSelect(detail)}
          disabled={!detail}
          className="h-8 border-2 border-black bg-white px-3 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] hover:bg-[#FFD93D] disabled:cursor-not-allowed disabled:opacity-50"
        >
          CHI TIẾT
        </button>
      </div>
    </article>
  );
}

function SystemSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      <section className="border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="h-8 w-72 animate-pulse bg-[#E9E1D0]" />
        <div className="mt-3 h-4 w-full max-w-[560px] animate-pulse bg-[#E9E1D0]" />
      </section>
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="min-h-[170px] border-4 border-black bg-[#FFFDF5] p-5 shadow-[6px_6px_0px_0px_#000]">
            <div className="h-12 w-12 border-4 border-black bg-[#E9E1D0] animate-pulse" />
            <div className="mt-4 h-4 w-40 bg-[#E9E1D0] animate-pulse" />
            <div className="mt-3 h-3 w-48 bg-[#E9E1D0] animate-pulse" />
          </div>
        ))}
      </section>
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="min-h-[170px] border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000]">
            <div className="h-5 w-56 animate-pulse bg-[#E9E1D0]" />
            <div className="mt-5 h-16 w-24 animate-pulse bg-[#E9E1D0]" />
          </div>
        ))}
      </section>
    </div>
  );
}

export default function AdminSystemPage() {
  const [data, setData] = useState<SystemData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<StatusInfo | null>(null);
  const { toast, showToast, clearToast } = useToast();

  const fetchSystemStatus = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setIsLoading(true);

        const [resSystem, resStatus] = await Promise.all([fetch("/api/admin/system"), fetch("/api/admin/system-status")]);

        const [resultSystem, resultStatus] = await Promise.all([resSystem.json(), resStatus.json()]);

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
    },
    [showToast],
  );

  const fetchDetailedStatus = useCallback(async () => {
    try {
      setIsChecking(true);
      const res = await fetch("/api/admin/system-status");
      const result = await res.json();
      if (result.success) {
        setData((prev) => (prev ? { ...prev, details: result.data } : null));
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

  if (isLoading && !data) return <SystemSkeleton />;

  return (
    <div className="space-y-8 pb-12">
      <section className="relative overflow-visible border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="pointer-events-none absolute -right-3 -top-3 h-10 w-10 border-4 border-black bg-[#A78BFA]" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[5px_5px_0px_0px_#000]">
                <HeartPulse className="h-7 w-7 text-black" />
              </div>
              <span className="inline-flex border-2 border-black bg-[#C7F0D8] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-black">
                SYSTEM HEALTH
              </span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black md:text-4xl">TRẠNG THÁI HỆ THỐNG</h1>
            <p className="text-sm font-bold text-black/70 md:text-base">
              Kiểm tra cấu hình môi trường, dịch vụ và sức khỏe ứng dụng.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <AppButton
              onClick={fetchDetailedStatus}
              disabled={isChecking || isLoading}
              className="h-12 border-4 border-black bg-[#FF6B6B] px-5 font-black uppercase text-black shadow-[5px_5px_0px_0px_#000] hover:-translate-y-0.5 hover:bg-[#FFD93D] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <ShieldCheck className={cn("mr-2 h-4 w-4", isChecking && "animate-pulse")} />
              {isChecking ? "ĐANG KIỂM TRA..." : "KIỂM TRA HỆ THỐNG"}
            </AppButton>
            <AppButton
              onClick={() => void fetchSystemStatus(true)}
              disabled={isLoading}
              className="h-12 border-4 border-black bg-white px-5 font-black uppercase text-black shadow-[5px_5px_0px_0px_#000] hover:bg-[#FFD93D]"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
              LÀM MỚI
            </AppButton>
          </div>
        </div>
      </section>

      {data ? (
        <>
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
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
              description="Gửi email hệ thống qua Resend."
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
              icon={LockKeyhole}
              description="Bảo mật dữ liệu nhạy cảm."
              detailKey="keyEncryption"
              details={data.details}
              onSelect={setSelectedConfig}
            />
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <article className="relative min-h-[170px] overflow-hidden border-4 border-black bg-[#06130F] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-white/65">NHÀ CUNG CẤP ĐANG HOẠT ĐỘNG</p>
              <p className="mt-4 text-5xl font-black leading-none text-[#C7F0D8]">{data.stats.activeProviders}</p>
              <p className="mt-4 text-sm font-bold text-white/80">Sẵn sàng xử lý request</p>
              <Cpu className="absolute -bottom-3 -right-3 h-24 w-24 text-white/10" />
            </article>

            <article className="relative min-h-[170px] overflow-hidden border-4 border-black bg-[#C7F0D8] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-black/65">MODELS ĐANG HOẠT ĐỘNG</p>
              <p className="mt-4 text-5xl font-black leading-none text-black">{data.stats.activeModels}</p>
              <p className="mt-4 text-sm font-bold text-black/80">Hỗ trợ qua Gateway</p>
              <Zap className="absolute -bottom-3 -right-3 h-24 w-24 text-black/10" />
            </article>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <article className="min-h-[250px] border-4 border-black bg-[#FFFDF5] p-5 shadow-[7px_7px_0px_0px_#000] md:p-6">
              <header className="mb-5 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[3px_3px_0px_0px_#000]">
                  <Receipt className="h-4 w-4 text-black" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-black">THANH TOÁN GẦN ĐÂY</h3>
                  <p className="text-sm font-bold text-black/65">Các giao dịch thanh toán đã được xác nhận gần đây.</p>
                </div>
              </header>

              {data.recentOrders.length === 0 ? (
                <div className="flex min-h-[150px] flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[3px_3px_0px_0px_#000]">
                    <Receipt className="h-5 w-5 text-black" />
                  </div>
                  <p className="text-base font-black text-black">CHƯA CÓ THANH TOÁN GẦN ĐÂY</p>
                  <p className="mt-1 text-sm font-bold text-black/60">Các giao dịch PAID mới nhất sẽ xuất hiện tại đây.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between gap-3 border-2 border-black bg-white p-3 shadow-[2px_2px_0px_0px_#000]">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-black">{order.user.email || "User"}</p>
                        <p className="truncate text-xs font-bold text-black/65">{order.product.name}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-black text-black">{order.amountVnd.toLocaleString("vi-VN")}đ</p>
                        <p className="text-[11px] font-bold text-black/60">{format(new Date(order.updatedAt), "HH:mm dd/MM", { locale: vi })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="min-h-[250px] border-4 border-black bg-[#FFFDF5] p-5 shadow-[7px_7px_0px_0px_#000] md:p-6">
              <header className="mb-5 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[3px_3px_0px_0px_#000]">
                  <Layers className="h-4 w-4 text-black" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-black">SỬ DỤNG API GẦN NHẤT</h3>
                  <p className="text-sm font-bold text-black/65">Các lượt gọi API gần đây qua hệ thống TzoShop.</p>
                </div>
              </header>

              {data.recentUsage.length === 0 ? (
                <div className="flex min-h-[150px] flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[3px_3px_0px_0px_#000]">
                    <Activity className="h-5 w-5 text-black" />
                  </div>
                  <p className="text-base font-black text-black">CHƯA CÓ LƯỢT SỬ DỤNG NÀO</p>
                  <p className="mt-1 text-sm font-bold text-black/60">Khi người dùng gọi API, thông tin sử dụng sẽ xuất hiện tại đây.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.recentUsage.map((log) => (
                    <div key={log.id} className="flex items-center justify-between gap-3 border-2 border-black bg-white p-3 shadow-[2px_2px_0px_0px_#000]">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-black">{log.model}</p>
                        <p className="truncate text-xs font-bold text-black/65">{log.user.email}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className={`inline-flex border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] ${log.status === "SUCCESS" ? "bg-[#C7F0D8]" : "bg-[#FF6B6B]"}`}>
                          {log.status === "SUCCESS" ? "THÀNH CÔNG" : "THẤT BẠI"}
                        </span>
                        <p className="mt-1 text-[11px] font-bold text-black/60">{format(new Date(log.createdAt), "HH:mm:ss", { locale: vi })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>
        </>
      ) : null}

      {selectedConfig && (
        <Modal open={!!selectedConfig} onClose={() => setSelectedConfig(null)} title="CHI TIẾT DỊCH VỤ" maxWidthClassName="max-w-2xl">
          <div className="space-y-4 bg-[#FFFDF5] p-1">
            <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000]">
              <p className="text-xs font-black uppercase tracking-[0.1em] text-black/60">Trạng thái</p>
              <span className={`mt-2 inline-flex border-2 border-black px-3 py-1 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] ${statusClass(selectedConfig.status)}`}>
                {statusLabel(selectedConfig.status)}
              </span>
              <p className="mt-3 text-sm font-bold text-black/75">{selectedConfig.message}</p>
            </div>

            <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000]">
              <p className="text-xs font-black uppercase tracking-[0.1em] text-black/60">Biến môi trường kiểm tra</p>
              <div className="mt-3 space-y-2">
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

            <AppButton onClick={() => setSelectedConfig(null)} className="h-11 border-4 border-black bg-white px-4 font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]">
              ĐÓNG
            </AppButton>
          </div>
        </Modal>
      )}

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />}
    </div>
  );
}

function EnvStatus({ label, exists }: { label: string; exists: boolean }) {
  return (
    <div className="flex items-center justify-between border-2 border-black bg-[#FFFDF5] px-3 py-2">
      <span className="max-w-[65%] truncate font-mono text-xs font-bold text-black" title={label}>
        {label}
      </span>
      <span
        className={cn(
          "inline-flex border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]",
          exists ? "bg-[#C7F0D8]" : "bg-[#FF6B6B]",
        )}
      >
        {exists ? "ĐÃ CẤU HÌNH" : "THIẾU CẤU HÌNH"}
      </span>
    </div>
  );
}
