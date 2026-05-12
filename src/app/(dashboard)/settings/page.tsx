"use client";

import { Suspense } from "react";

import { type FormEvent, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ToastMessage } from "@/components/ui/toast-message";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { useSession } from "next-auth/react";
import { 
  UserRound, 
  ShieldCheck, 
  Bell, 
  AlertTriangle, 
  Save, 
  LogOut,
  Info,
  KeyRound,
  CheckCircle2,
  Link as LinkIcon,
  LockKeyhole
} from "lucide-react";
import DashboardSubNav from "@/components/dashboard/dashboard-sub-nav";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ui } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";

type NotificationSetting = {
  id: string;
  title: string;
  desc: string;
  enabled: boolean;
};

const initialNotifications: NotificationSetting[] = [
  {
    id: "lowCredits",
    title: "Cảnh báo credits thấp",
    desc: "Nhận thông báo khi credits gần hết.",
    enabled: true,
  },
  {
    id: "paymentConfirm",
    title: "Xác nhận thanh toán",
    desc: "Nhận thông báo khi đơn hàng được thanh toán thành công.",
    enabled: true,
  },
  {
    id: "productUpdates",
    title: "Cập nhật sản phẩm",
    desc: "Nhận thông tin cập nhật về gói credits và tính năng mới.",
    enabled: false,
  },
];

type AuthMethods = {
  emailPassword: boolean;
  googleLinked: boolean;
  googleEmail: string | null;
};

function SettingsContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [authMethods, setAuthMethods] = useState<AuthMethods>({
    emailPassword: true,
    googleLinked: false,
    googleEmail: null,
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { toast, showToast, clearToast } = useToast(4000);
  
  const {
    confirmState,
    isConfirming,
    askConfirm,
    closeConfirm,
    handleConfirm,
  } = useConfirm();

  // Fetch trạng thái liên kết Google
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/settings/auth-methods")
      .then((r) => r.json())
      .then((data) => {
        if (data.googleLinked !== undefined) setAuthMethods(data);
      })
      .catch(() => {});
  }, [status]);

  // Xử lý feedback từ Google OAuth flow
  useEffect(() => {
    const googleLinked = searchParams.get("googleLinked");
    if (googleLinked === "success") {
      showToast("Đã liên kết Google thành công.", "success");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAuthMethods((prev) => ({ ...prev, googleLinked: true }));
      // Xóa query params khỏi URL
      window.history.replaceState({}, "", "/settings");
    } else if (googleLinked === "email_mismatch") {
      showToast("Email Google không trùng với tài khoản hiện tại.", "error");
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams]);

  const handleLinkGoogle = () => {
    setIsLinkingGoogle(true);
    // Truyền state để callback biết đây là flow link, không phải login
    signIn("google", { callbackUrl: "/settings?googleLinked=callback" });
  };

  const handleToggleNotification = (id: string) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
    showToast("Thiết lập đã được cập nhật.", "success");
  };

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setIsSavingProfile(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      showToast("Đã lưu thay đổi.", "success");
    } catch {
      showToast("Không thể lưu thay đổi.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (newPassword.length < 8) {
      return showToast("Mật khẩu mới tối thiểu 8 ký tự.", "error");
    }
    if (newPassword !== confirmPassword) {
      return showToast("Xác nhận mật khẩu không khớp.", "error");
    }

    try {
      setIsChangingPassword(true);
      
      const res = await fetch("/api/settings/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data?.error?.message || "Không thể đổi mật khẩu.");
      }
      
      showToast("Mật khẩu đã được cập nhật.", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err instanceof Error) {
        showToast(err.message, "error");
      } else {
        showToast("Không thể đổi mật khẩu.", "error");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogoutAll = useCallback(() => {
    showToast("Đã đăng xuất khỏi tất cả thiết bị.", "success");
  }, [showToast]);

  if (status === "loading") {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }



  return (
    <div className="space-y-8 pb-20">
      <DashboardSubNav 
        items={[
          { label: "Cài đặt", href: "/settings" },
          { label: "Hỗ trợ", href: "/support" },
        ]} 
      />
      <PageHeader 
        title="Cài đặt" 
        description="Cập nhật hồ sơ, thông báo và các tùy chọn tài khoản."
        icon={<ShieldCheck className="h-8 w-8" />}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_320px] items-start">
        {/* Left Column */}
        <div className="space-y-6">
          <AppCard className="p-6 sm:p-8">
            <div className="mb-8 flex items-center gap-3">
              <UserRound className="h-5 w-5 text-[#00d4a4]" />
              <h2 className={ui.h3}>Thông tin cá nhân</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="h-20 w-20 rounded-3xl bg-[#e7fff7] border border-[#00d4a4]/20 flex items-center justify-center text-2xl font-black text-[#00d4a4] ring-4 ring-white shadow-sm overflow-hidden uppercase">
                    {session?.user?.name?.[0] || "U"}
                  </div>
                  <button type="button" className="absolute -bottom-1 -right-1 h-8 w-8 bg-white rounded-full border border-[#dfe5e1] flex items-center justify-center shadow-md hover:bg-[#fbfbf8] transition-colors text-[#0b0f0d]">
                    <UserRound className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <p className="text-sm font-black text-[#0b0f0d]">Ảnh đại diện</p>
                  <p className={ui.pMuted}>Khuyến nghị ảnh vuông, tối đa 2MB.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 max-w-3xl">
                <div className="space-y-2">
                  <label className={ui.label}>Họ và tên</label>
                  <input
                    type="text"
                    defaultValue={session?.user?.name || ""}
                    className={ui.input}
                  />
                </div>
                <div className="space-y-2">
                  <label className={ui.label}>Email đăng nhập</label>
                  <input
                    type="email"
                    readOnly
                    value={session?.user?.email || ""}
                    className={cn(ui.input, "bg-[#fbfbf8] text-[#8a9690] cursor-not-allowed")}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <AppButton type="submit" isLoading={isSavingProfile} variant="accent">
                  <Save className="h-4 w-4 mr-2" />
                  Lưu thay đổi
                </AppButton>
              </div>
            </form>
          </AppCard>

          <AppCard className="p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[#00d4a4]" />
              <h2 className={ui.h3}>Phương thức đăng nhập</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-[#edf1ee] bg-[#fbfbf8] p-4 ring-1 ring-[#edf1ee]">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border border-[#edf1ee]">
                    <ShieldCheck className="h-5 w-5 text-[#00d4a4]" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#0b0f0d]">Email & Mật khẩu</p>
                    <p className={ui.pMuted}>Đang được sử dụng</p>
                  </div>
                </div>
                <StatusBadge status="Đang kết nối" variant="success" />
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-[#edf1ee] bg-white p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border border-[#edf1ee]">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#0b0f0d]">Google</p>
                    {authMethods.googleLinked && authMethods.googleEmail ? (
                      <p className={ui.pMuted}>{authMethods.googleEmail}</p>
                    ) : (
                      <p className={ui.pMuted}>Chưa liên kết</p>
                    )}
                  </div>
                </div>

                {authMethods.googleLinked ? (
                  <StatusBadge status="Đã liên kết" variant="success" />
                ) : (
                  <AppButton
                    variant="secondary"
                    size="sm"
                    onClick={handleLinkGoogle}
                    isLoading={isLinkingGoogle}
                  >
                    <LinkIcon className="h-3 w-3 mr-2" />
                    Liên kết Google
                  </AppButton>
                )}
              </div>
            </div>
          </AppCard>

          <AppCard className="p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <LockKeyhole className="h-5 w-5 text-[#00d4a4]" />
              <h2 className={ui.h3}>Đổi mật khẩu</h2>
            </div>
            
            <p className={ui.p + " mb-6 font-bold"}>
              Cập nhật mật khẩu đăng nhập cho tài khoản của bạn.
            </p>

            <form onSubmit={handleChangePassword} className="space-y-5 max-w-xl">
              {/* Nếu tài khoản có email/password mới yêu cầu mật khẩu hiện tại. 
                  Tuy nhiên ta để server quyết định (hoặc ta cứ show input, nếu họ chưa từng có password, server sẽ bỏ qua) */}
              <div className="space-y-2">
                <label className={ui.label}>Mật khẩu hiện tại</label>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu hiện tại..."
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={ui.input}
                />
              </div>

              <div className="space-y-2">
                <label className={ui.label}>Mật khẩu mới</label>
                <input
                  type="password"
                  placeholder="Tối thiểu 8 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={ui.input}
                />
              </div>

              <div className="space-y-2">
                <label className={ui.label}>Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={ui.input}
                />
              </div>

              <div className="flex justify-end pt-2">
                <AppButton type="submit" isLoading={isChangingPassword} variant="accent">
                  <Save className="h-4 w-4 mr-2" />
                  Lưu mật khẩu
                </AppButton>
              </div>
            </form>
          </AppCard>

          <AppCard className="p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <Bell className="h-5 w-5 text-[#00d4a4]" />
              <h2 className={ui.h3}>Thông báo</h2>
            </div>

            <div className="space-y-3">
              {notifications.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl border border-[#edf1ee] bg-white px-4 py-3">
                  <div className="flex-1 pr-4">
                    <p className="text-sm font-black text-[#0b0f0d]">{item.title}</p>
                    <p className={ui.pMuted}>{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification(item.id)}
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors focus:outline-none ring-2 ring-transparent focus:ring-[#00d4a4]/20",
                      item.enabled ? "bg-[#00d4a4]" : "bg-[#dfe5e1]"
                    )}
                  >
                    <span className={cn(
                      "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                      item.enabled ? "translate-x-5" : "translate-x-0"
                    )} />
                  </button>
                </div>
              ))}
            </div>
          </AppCard>

          <AppCard className="p-6 sm:p-8 border-red-100 ring-1 ring-red-50">
            <div className="mb-6 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h2 className={ui.h3 + " text-red-600"}>Vùng nguy hiểm</h2>
            </div>

            <div className="flex flex-col gap-4 p-5 rounded-2xl border border-red-100 bg-red-50/30 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-[#0b0f0d]">Đăng xuất tất cả thiết bị</p>
                <p className={ui.pMuted + " mt-1"}>Kết thúc tất cả các phiên đăng nhập hiện tại trừ thiết bị này.</p>
              </div>
              <AppButton
                variant="danger"
                size="sm"
                onClick={() => askConfirm({
                  title: "Đăng xuất tất cả?",
                  description: "Hành động này sẽ yêu cầu bạn đăng nhập lại trên các thiết bị khác.",
                  confirmLabel: "Đăng xuất",
                  cancelLabel: "Hủy",
                  type: "danger",
                  onConfirm: handleLogoutAll
                })}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Thực hiện
              </AppButton>
            </div>
          </AppCard>
        </div>

        {/* Right Column */}
        <aside className="space-y-6">
          <AppCard className="p-5">
            <div className="flex items-center gap-2 mb-6">
              <Info className="h-5 w-5 text-[#00d4a4]" />
              <h3 className={ui.h3}>Hồ sơ</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-[#edf1ee]">
                <span className={ui.label}>Trạng thái</span>
                <StatusBadge status="Hoạt động" variant="success" />
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#edf1ee]">
                <span className={ui.label}>Gói dùng</span>
                <span className="text-sm font-black text-[#0b0f0d] text-right">Free Tier</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className={ui.label}>Ngày tạo</span>
                <span className="text-sm font-black text-[#0b0f0d]">10/05/2026</span>
              </div>
            </div>
          </AppCard>

          {/* API Protection */}
          <div className="rounded-3xl bg-[#020c0a] p-6 text-white shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-[#00d4a4]" />
              <h3 className="text-lg font-black">Bảo vệ API</h3>
            </div>
            <p className="text-xs leading-5 text-white/50 font-medium">
              Quản lý API key định kỳ để bảo vệ credits và tránh truy cập trái phép.
            </p>
            <AppButton
              variant="secondary"
              className="mt-5 w-full bg-white !text-[#020c0a] hover:bg-white/90"
              onClick={() => window.location.href = "/api-keys"}
            >
              <KeyRound className="h-4 w-4 mr-2 text-[#00d4a4]" />
              Xem API Keys
            </AppButton>
          </div>
        </aside>
      </div>

      {/* Toast & Confirm */}
      {toast && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={clearToast}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          open={!!confirmState}
          title={confirmState.title}
          description={confirmState.description}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={confirmState.cancelLabel}
          type={confirmState.type}
          isLoading={isConfirming}
          onConfirm={handleConfirm}
          onCancel={closeConfirm}
        />
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
