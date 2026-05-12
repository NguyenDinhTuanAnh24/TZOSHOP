"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast, showToast, clearToast } = useToast(4000);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      showToast("Vui lòng điền đầy đủ thông tin.", "error");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showToast("Mật khẩu xác nhận không khớp.", "error");
      return;
    }

    if (formData.password.length < 8) {
      showToast("Mật khẩu phải từ 8 ký tự trở lên.", "error");
      return;
    }

    if (!formData.agree) {
      showToast("Bạn cần đồng ý với điều khoản sử dụng.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        showToast(result.error?.message || "Đăng ký thất bại.", "error");
      } else {
        showToast("Đăng ký thành công! Hãy đăng nhập để tiếp tục.", "success");
        const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      }
    } catch {
      showToast("Đã có lỗi xảy ra.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8f6] text-[#0b0f0d]">
      <section className="flex min-h-screen items-center justify-center p-4 md:p-6">
        <div className="grid min-h-[780px] w-full max-w-7xl overflow-hidden rounded-[36px] border border-[#dfe5e1] bg-white shadow-[0_24px_80px_rgba(11,15,13,0.12)] lg:grid-cols-[1fr_1fr]">
          {/* Bên trái */}
          <div className="relative overflow-hidden bg-[linear-gradient(145deg,#064c3f_0%,#0b7a63_45%,#00b894_100%)] px-8 py-10 text-white md:px-14 md:py-14">
            <div className="relative z-10 flex h-full flex-col">
              <Link href="/" className="inline-flex w-fit items-center">
                <Image
                  src="/logo.png"
                  alt="TzoShop"
                  width={180}
                  height={48}
                  priority
                  className="h-12 w-auto rounded-xl bg-white/90 px-3 py-2"
                />
              </Link>

              <div className="mt-20 max-w-md">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
                  Bắt đầu với TzoShop
                </p>

                <h1 className="mt-4 text-4xl font-semibold tracking-[-1.2px] md:text-[56px] md:leading-[1.08]">
                  Tạo tài khoản để quản lý credits dễ dàng hơn
                </h1>

                <p className="mt-5 text-base leading-7 text-white/82">
                  Đăng ký tài khoản để mua gói credits, tạo API key, theo dõi
                  số dư và sử dụng cùng các extension hoặc công cụ hỗ trợ phù
                  hợp.
                </p>
              </div>

              <div className="mt-10 space-y-4">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">
                    Bắt đầu linh hoạt
                  </p>
                  <p className="mt-1 text-sm leading-6 text-white/78">
                    Có thể chọn gói nhỏ trước để kiểm tra mức sử dụng thực tế.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">
                    Quản lý tập trung
                  </p>
                  <p className="mt-1 text-sm leading-6 text-white/78">
                    Theo dõi credits, thời hạn gói và API key trong cùng một
                    tài khoản.
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-10 text-sm text-white/75">
                Đã có tài khoản?{" "}
                <Link
                  href="/login"
                  className="font-bold text-white underline underline-offset-4 transition hover:text-white/90"
                >
                  Đăng nhập
                </Link>
              </div>
            </div>

            <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/15 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-28 -right-28 h-96 w-96 rounded-full bg-[#00382f]/35 blur-2xl" />
            <div className="pointer-events-none absolute bottom-20 right-10 h-32 w-32 rounded-full border border-white/15" />
          </div>

          {/* Bên phải */}
          <div className="flex items-center bg-white px-6 py-10 md:px-14 md:py-14">
            <div className="mx-auto w-full max-w-lg">
              <div className="mb-9 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#00a982]">
                  Create account
                </p>

                <h2 className="mt-3 text-5xl font-semibold tracking-[-1px] text-[#0b0f0d]">
                  Đăng ký
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#66736d]">
                  Tạo tài khoản để bắt đầu sử dụng và quản lý credits của bạn.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-[#0b0f0d]"
                  >
                    Họ và tên
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Nhập họ và tên"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-full border border-[#dfe5e1] bg-[#f3f7f5] px-5 py-4 text-sm font-medium text-[#0b0f0d] outline-none transition placeholder:text-[#94a39c] focus:border-[#00d4a4] focus:bg-white focus:ring-4 focus:ring-[#00d4a4]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-[#0b0f0d]"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="Nhập email của bạn"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-full border border-[#dfe5e1] bg-[#f3f7f5] px-5 py-4 text-sm font-medium text-[#0b0f0d] outline-none transition placeholder:text-[#94a39c] focus:border-[#00d4a4] focus:bg-white focus:ring-4 focus:ring-[#00d4a4]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-[#0b0f0d]"
                  >
                    Mật khẩu
                  </label>

                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="Tạo mật khẩu"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-full border border-[#dfe5e1] bg-[#f3f7f5] px-5 py-4 text-sm font-medium text-[#0b0f0d] outline-none transition placeholder:text-[#94a39c] focus:border-[#00d4a4] focus:bg-white focus:ring-4 focus:ring-[#00d4a4]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-[#0b0f0d]"
                  >
                    Xác nhận mật khẩu
                  </label>

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    placeholder="Nhập lại mật khẩu"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full rounded-full border border-[#dfe5e1] bg-[#f3f7f5] px-5 py-4 text-sm font-medium text-[#0b0f0d] outline-none transition placeholder:text-[#94a39c] focus:border-[#00d4a4] focus:bg-white focus:ring-4 focus:ring-[#00d4a4]/10"
                  />
                </div>

                <label className="flex items-start gap-3 text-sm leading-6 text-[#66736d]">
                  <input
                    type="checkbox"
                    checked={formData.agree}
                    onChange={(e) => setFormData({ ...formData, agree: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-[#cfd8d3] accent-[#00a982]"
                  />
                  <span>
                    Tôi đồng ý với điều khoản sử dụng và chính sách của
                    TzoShop.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex w-full items-center justify-center rounded-full !bg-[#0b7a63] px-6 py-4 text-base font-bold !text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    "Tạo tài khoản"
                  )}
                </button>
              </form>

              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-[#edf1ee]" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9aa6a0]">
                  hoặc
                </span>
                <div className="h-px flex-1 bg-[#edf1ee]" />
              </div>

              <button
                type="button"
                onClick={() => {
                  signIn("google", { callbackUrl: "/auth/redirect" });
                }}
                className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-[#dfe5e1] !bg-white px-6 py-4 text-base font-bold !text-[#0b0f0d] transition hover:bg-[#f7f8f6] active:scale-[0.98]"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Đăng ký bằng Google
              </button>

              <p className="mt-7 text-center text-sm text-[#66736d]">
                Đã có tài khoản?{" "}
                <Link
                  href={`/login${searchParams.get("callbackUrl") ? `?callbackUrl=${encodeURIComponent(searchParams.get("callbackUrl")!)}` : ""}`}
                  className="font-bold text-[#057a60] transition hover:text-[#00a982]"
                >
                  Đăng nhập
                </Link>
              </p>

              <p className="mt-8 text-center text-xs leading-5 text-[#9aa6a0]">
                Bằng việc tạo tài khoản, bạn đồng ý sử dụng dịch vụ theo chính
                sách và điều khoản của TzoShop.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Toast */}
      {toast && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={clearToast}
        />
      )}
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
