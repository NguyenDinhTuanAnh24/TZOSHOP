"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { ToastMessage } from "@/components/ui/toast-message";
import { useToast } from "@/hooks/use-toast";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const tokenMissing = !token;

  const { toast, showToast, clearToast } = useToast(4000);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (password.length < 8) {
      showToast("Mật khẩu phải có ít nhất 8 ký tự", "error");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Mật khẩu xác nhận không khớp", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Liên kết không hợp lệ hoặc đã hết hạn");
      }

      setSuccess(true);
      showToast("Đã đặt lại mật khẩu", "success");
      window.setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error) {
      console.error("[RESET_PASSWORD_CLIENT_ERROR]", error);
      showToast(error instanceof Error ? error.message : "Không thể đặt lại mật khẩu", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-10 top-20 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-10 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.35)] backdrop-blur-xl sm:p-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image src="/logo.png" alt="TzoShop" width={36} height={36} className="h-9 w-9 object-contain" />
            <div>
              <p className="text-lg font-extrabold text-slate-950">TzoShop</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600">AI Credits</p>
            </div>
          </Link>

          {tokenMissing ? (
            <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
              Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại email đặt lại mật khẩu.
            </div>
          ) : success ? (
            <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
              Mật khẩu đã được cập nhật thành công. Đang chuyển đến trang đăng nhập...
            </div>
          ) : (
            <>
              <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-950">Đặt lại mật khẩu</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">Nhập mật khẩu mới cho tài khoản của bạn.</p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">Mật khẩu mới</label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      minLength={8}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tối thiểu 8 ký tự"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-11 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 hover:bg-slate-50"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-700">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-11 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 hover:bg-slate-50"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-bold text-white shadow-[0_12px_30px_-14px_rgba(79,70,229,0.65)] transition hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                </button>
              </form>
            </>
          )}

          <Link href="/login" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-indigo-700">
            <ArrowLeft className="h-4 w-4" />
            Quay lại đăng nhập
          </Link>
        </div>
      </div>

      {toast ? <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} /> : null}
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
