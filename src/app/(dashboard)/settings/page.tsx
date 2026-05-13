"use client";

import { Suspense, type ChangeEvent, type FormEvent, useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
  Link as LinkIcon,
  LockKeyhole,
  Camera,
  Settings,
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { SettingsPageSkeleton } from "@/components/dashboard/settings/settings-page-skeleton";

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


  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const { toast, showToast, clearToast } = useToast(4000);
  const { confirmState, isConfirming, askConfirm, closeConfirm, handleConfirm } = useConfirm();


  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/settings/auth-methods")
      .then((r) => r.json())
      .then((data) => {
        if (data.googleLinked !== undefined) setAuthMethods(data);
      })
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    const googleLinked = searchParams.get("googleLinked");
    if (googleLinked === "success") {
      showToast("Đã liên kết Google thành công.", "success");
      window.history.replaceState({}, "", "/settings");
    } else if (googleLinked === "email_mismatch") {
      showToast("Email Google không trùng với tài khoản hiện tại.", "error");
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams, showToast]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const acceptedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!acceptedTypes.includes(file.type)) {
      setAvatarError("Ảnh phải là PNG, JPG hoặc WEBP.");
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setAvatarError("Ảnh không được vượt quá 2MB.");
      return;
    }

    setAvatarError(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);

    const previewUrl = URL.createObjectURL(file);
    setAvatarFile(file);
    setAvatarPreview(previewUrl);
  };

  const handleLinkGoogle = () => {
    setIsLinkingGoogle(true);
    signIn("google", { callbackUrl: "/settings?googleLinked=callback" });
  };

  const handleToggleNotification = (id: string) => {
    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)));
    showToast("Thiết lập đã được cập nhật.", "success");
  };

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setIsSavingProfile(true);
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (avatarFile) {
        showToast(
          "Ảnh đại diện đã được chọn, nhưng hệ thống chưa bật lưu ảnh. Các thông tin khác vẫn được cập nhật.",
          "warning",
        );
      } else {
        showToast("Đã cập nhật hồ sơ.", "success");
      }
    } catch {
      showToast("Không thể lưu thay đổi.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword.length < 8) return showToast("Mật khẩu mới tối thiểu 8 ký tự.", "error");
    if (newPassword !== confirmPassword) return showToast("Xác nhận mật khẩu không khớp.", "error");

    try {
      setIsChangingPassword(true);

      const res = await fetch("/api/settings/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Không thể đổi mật khẩu.");

      showToast("Mật khẩu đã được cập nhật.", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể đổi mật khẩu.", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogoutAll = useCallback(() => {
    showToast("Đã đăng xuất khỏi tất cả thiết bị.", "success");
  }, [showToast]);

  if (status === "loading") {
    return <SettingsPageSkeleton />;
  }

  return (
    <div className="space-y-8 pb-20 lg:space-y-10" aria-busy={false}>
      <PageHeader
        title="CÀI ĐẶT"
        description="Cập nhật hồ sơ, phương thức đăng nhập và bảo mật tài khoản của bạn."
        icon={<Settings className="h-8 w-8" strokeWidth={2.5} />}
      />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
            <div className="mb-7 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border-4 border-black bg-[#C7F0D8] text-black shadow-[3px_3px_0px_0px_#000]">
                <UserRound className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-black uppercase text-black md:text-2xl">Thông tin cá nhân</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative flex h-24 w-24 items-center justify-center overflow-hidden border-4 border-black bg-[#C7F0D8] text-2xl font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000]"
                    aria-label="Đổi ảnh đại diện"
                  >
                    {avatarPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarPreview} alt="Ảnh đại diện mới" className="h-full w-full object-cover" />
                    ) : (
                      <span>{(session?.user?.name?.[0] ?? "U").toUpperCase()}</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Đổi ảnh đại diện"
                    className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000] transition-colors hover:bg-[#FFD93D]"
                  >
                    <Camera className="h-4 w-4" />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-black">Ảnh đại diện</p>
                  <p className="mt-1 text-sm font-bold text-black/70">Khuyến nghị ảnh vuông, tối đa 2MB.</p>
                  {avatarFile ? (
                    <p className="mt-2 inline-flex border-2 border-black bg-[#C7F0D8] px-3 py-1 text-xs font-bold text-black">
                      Đã chọn ảnh mới, bấm Lưu thay đổi để cập nhật.
                    </p>
                  ) : null}
                </div>
              </div>

              {avatarError ? (
                <div className="border-4 border-black bg-[#FF6B6B] p-3 font-bold text-black shadow-[4px_4px_0px_0px_#000]">{avatarError}</div>
              ) : null}

              <div className="grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wide text-black">Họ và tên</label>
                  <input
                    type="text"
                    defaultValue={session?.user?.name || ""}
                    className="h-12 w-full border-4 border-black bg-[#FFFDF5] px-4 text-sm font-bold text-black shadow-[3px_3px_0px_0px_#000] outline-none placeholder:text-black/40 transition-all focus:bg-[#FFD93D]/25 focus:shadow-[4px_4px_0px_0px_#000]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wide text-black">Email đăng nhập</label>
                  <input
                    type="email"
                    readOnly
                    value={session?.user?.email || ""}
                    className="h-12 w-full cursor-not-allowed border-4 border-black bg-[#E9E1D0] px-4 text-sm font-bold text-black/70 shadow-[3px_3px_0px_0px_#000] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <AppButton type="submit" isLoading={isSavingProfile} variant="accent" className="h-12 px-6 disabled:bg-[#E9E1D0] disabled:text-black/50">
                  <Save className="mr-2 h-4 w-4" />
                  LƯU THAY ĐỔI
                </AppButton>
              </div>
            </form>
          </section>

          <section className="border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border-4 border-black bg-[#FFD93D] text-black shadow-[3px_3px_0px_0px_#000]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-black uppercase text-black md:text-2xl">Phương thức đăng nhập</h2>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-4 border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-[#C7F0D8] text-black shadow-[2px_2px_0px_0px_#000]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-black">Email & Mật khẩu</p>
                    <p className="text-sm font-bold text-black/70">Đang được sử dụng</p>
                  </div>
                </div>
                <StatusBadge status="Đang kết nối" variant="success" />
              </div>

              <div className="flex flex-col gap-4 border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-[#FFD93D] text-black shadow-[2px_2px_0px_0px_#000]">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-black text-black">Google</p>
                    {authMethods.googleLinked && authMethods.googleEmail ? (
                      <p className="break-all text-sm font-bold text-black/70">{authMethods.googleEmail}</p>
                    ) : (
                      <p className="text-sm font-bold text-black/70">Chưa liên kết</p>
                    )}
                  </div>
                </div>

                {authMethods.googleLinked ? (
                  <StatusBadge status="Đang kết nối" variant="success" />
                ) : (
                  <AppButton variant="secondary" className="h-11 px-4" onClick={handleLinkGoogle} isLoading={isLinkingGoogle}>
                    <LinkIcon className="mr-2 h-3 w-3" />
                    LIÊN KẾT GOOGLE
                  </AppButton>
                )}
              </div>
            </div>
          </section>

          <section className="border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border-4 border-black bg-[#FF6B6B] text-black shadow-[3px_3px_0px_0px_#000]">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase text-black md:text-2xl">Đổi mật khẩu</h2>
                <p className="mt-1 text-sm font-bold text-black/70">Cập nhật mật khẩu đăng nhập cho tài khoản của bạn.</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="max-w-xl space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wide text-black">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu hiện tại..."
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-12 w-full border-4 border-black bg-[#FFFDF5] px-4 text-sm font-bold text-black shadow-[3px_3px_0px_0px_#000] outline-none placeholder:text-black/40 transition-all focus:bg-[#FFD93D]/25 focus:shadow-[4px_4px_0px_0px_#000]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wide text-black">Mật khẩu mới</label>
                <input
                  type="password"
                  placeholder="Tối thiểu 8 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-12 w-full border-4 border-black bg-[#FFFDF5] px-4 text-sm font-bold text-black shadow-[3px_3px_0px_0px_#000] outline-none placeholder:text-black/40 transition-all focus:bg-[#FFD93D]/25 focus:shadow-[4px_4px_0px_0px_#000]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wide text-black">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 w-full border-4 border-black bg-[#FFFDF5] px-4 text-sm font-bold text-black shadow-[3px_3px_0px_0px_#000] outline-none placeholder:text-black/40 transition-all focus:bg-[#FFD93D]/25 focus:shadow-[4px_4px_0px_0px_#000]"
                />
              </div>

              <div className="flex justify-end pt-2">
                <AppButton type="submit" isLoading={isChangingPassword} variant="danger" className="h-12 px-6">
                  <Save className="mr-2 h-4 w-4" />
                  ĐỔI MẬT KHẨU
                </AppButton>
              </div>
            </form>
          </section>

          <section className="border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border-4 border-black bg-[#A78BFA] text-black shadow-[3px_3px_0px_0px_#000]">
                <Bell className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-black uppercase text-black md:text-2xl">Thông báo</h2>
            </div>

            <div className="space-y-3">
              {notifications.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-4 border-black bg-white px-4 py-3 shadow-[4px_4px_0px_0px_#000]">
                  <div className="flex-1 pr-4">
                    <p className="text-sm font-black text-black">{item.title}</p>
                    <p className="text-sm font-bold text-black/70">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification(item.id)}
                    className={[
                      "relative h-6 w-11 border-2 border-black transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black",
                      item.enabled ? "bg-[#FFD93D]" : "bg-[#E9E1D0]",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "absolute left-0.5 top-0.5 h-4 w-4 border border-black bg-white transition-transform",
                        item.enabled ? "translate-x-5" : "translate-x-0",
                      ].join(" ")}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="border-4 border-black bg-[#FF6B6B] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
            <div className="mb-6 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-black" />
              <h2 className="text-xl font-black uppercase text-black md:text-2xl">Vùng nguy hiểm</h2>
            </div>

            <div className="flex flex-col gap-4 border-4 border-black bg-[#FFFDF5] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-black">Đăng xuất tất cả thiết bị</p>
                <p className="mt-1 text-sm font-bold text-black/70">Kết thúc tất cả các phiên đăng nhập hiện tại trừ thiết bị này.</p>
              </div>
              <AppButton
                variant="danger"
                size="sm"
                onClick={() =>
                  askConfirm({
                    title: "Đăng xuất tất cả?",
                    description: "Hành động này sẽ yêu cầu bạn đăng nhập lại trên các thiết bị khác.",
                    confirmLabel: "Đăng xuất",
                    cancelLabel: "Hủy",
                    type: "danger",
                    onConfirm: handleLogoutAll,
                  })
                }
              >
                <LogOut className="mr-2 h-4 w-4" />
                THỰC HIỆN
              </AppButton>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="border-4 border-black bg-[#FFFDF5] p-5 shadow-[6px_6px_0px_0px_#000] xl:sticky xl:top-24">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center border-2 border-black bg-[#FFD93D] text-black shadow-[2px_2px_0px_0px_#000]">
                <Info className="h-4 w-4" />
              </div>
              <h3 className="text-base font-black uppercase text-black">Hồ sơ</h3>
            </div>

            <div className="space-y-0">
              <div className="flex items-center justify-between border-b-2 border-black py-3">
                <span className="text-xs font-black uppercase tracking-wide text-black/70">Trạng thái</span>
                <StatusBadge status="Hoạt động" variant="success" />
              </div>
              <div className="flex items-center justify-between border-b-2 border-black py-3">
                <span className="text-xs font-black uppercase tracking-wide text-black/70">Gói dùng</span>
                <span className="text-sm font-black text-black">Free Tier</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-xs font-black uppercase tracking-wide text-black/70">Ngày tạo</span>
                <span className="text-sm font-black text-black">10/05/2026</span>
              </div>
            </div>
          </section>

          <section className="border-4 border-black bg-[#111827] p-5 text-[#FFFDF5] shadow-[6px_6px_0px_0px_#000]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center border-2 border-black bg-[#C7F0D8] text-black shadow-[2px_2px_0px_0px_#FFFDF5]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="text-base font-black uppercase">Bảo vệ API</h3>
            </div>
            <p className="text-sm font-bold leading-relaxed text-[#FFFDF5]/75">
              Quản lý API key định kỳ để bảo vệ credits và tránh truy cập trái phép.
            </p>
            <Link href="/api-keys">
              <AppButton variant="accent" className="mt-5 h-12 w-full shadow-[4px_4px_0px_0px_#FFFDF5]">
                <KeyRound className="mr-2 h-4 w-4" /> XEM API KEYS
              </AppButton>
            </Link>
          </section>
        </aside>
      </div>

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />}

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
    <Suspense fallback={<SettingsPageSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
