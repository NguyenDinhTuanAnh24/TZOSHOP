"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Mail } from "lucide-react";
import { ToastMessage } from "@/components/ui/toast-message";
import { useToast } from "@/hooks/use-toast";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ForgotPasswordPage() {
  const { toast, showToast, clearToast } = useToast(4000);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      showToast("Email không hợp lệ", "error");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Không thể gửi email");
      }

      setSent(true);
      showToast("Đã gửi liên kết", "success");
    } catch (error) {
      console.error("[FORGOT_PASSWORD_CLIENT_ERROR]", error);
      showToast("Không thể gửi email. Vui lòng thử lại sau.", "error");
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

          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-950">Quên mật khẩu?</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Nhập email tài khoản, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="forgot-email" className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {sent ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư và thư rác.
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-bold text-white shadow-[0_12px_30px_-14px_rgba(79,70,229,0.65)] transition hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Đang gửi..." : "Gửi liên kết"}
            </button>
          </form>

          <Link
            href="/login"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại đăng nhập
          </Link>
        </div>
      </div>

      {toast ? <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} /> : null}
    </main>
  );
}
