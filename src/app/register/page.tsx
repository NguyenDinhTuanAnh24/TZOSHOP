"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Sparkles, Star } from "lucide-react";
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
    <main className="auth-grid-pattern relative min-h-screen w-full overflow-x-clip bg-[#FFFDF5] text-black">
      <section className="relative min-h-screen overflow-x-clip px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="pointer-events-none absolute -left-10 top-20 hidden h-20 w-20 rotate-12 border-4 border-black bg-[#FFD93D] md:block" />
        <div className="pointer-events-none absolute right-10 top-24 hidden h-16 w-16 -rotate-12 border-4 border-black bg-[#FF6B6B] md:block" />
        <div className="pointer-events-none absolute bottom-12 left-10 hidden h-14 w-14 -rotate-6 border-4 border-black bg-[#C4B5FD] shadow-[4px_4px_0px_0px_#000] animate-brutal-wiggle sm:block" />
        <div className="pointer-events-none absolute bottom-20 right-16 hidden h-10 w-10 rotate-12 border-4 border-black bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000] animate-pulse sm:block" />
        <span className="pointer-events-none absolute left-6 top-6 hidden h-12 w-12 rotate-6 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000] animate-spin-slow sm:inline-flex">
          <Star className="h-6 w-6 fill-black text-black" />
        </span>
        <span className="pointer-events-none absolute right-6 top-8 hidden h-10 w-10 -rotate-6 items-center justify-center border-4 border-black bg-[#C4B5FD] shadow-[4px_4px_0px_0px_#000] animate-brutal-wiggle sm:inline-flex">
          <Star className="h-5 w-5 fill-black text-black" />
        </span>
        <span className="pointer-events-none absolute bottom-8 left-6 hidden h-12 w-12 -rotate-12 items-center justify-center border-4 border-black bg-[#FF6B6B] shadow-[4px_4px_0px_0px_#000] animate-pulse sm:inline-flex">
          <Star className="h-6 w-6 fill-black text-black" />
        </span>
        <span className="pointer-events-none absolute bottom-8 right-8 hidden h-10 w-10 rotate-12 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000] animate-spin-slow md:inline-flex">
          <Star className="h-5 w-5 fill-black text-black" />
        </span>
        <Star className="pointer-events-none absolute bottom-24 left-1/3 hidden h-8 w-8 text-black animate-spin-slow sm:block" />
        <Sparkles className="pointer-events-none absolute bottom-14 right-1/4 hidden h-8 w-8 text-black animate-brutal-wiggle sm:block" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="grid w-full max-w-[calc(100vw-2rem)] overflow-hidden border-4 border-black bg-white shadow-[12px_12px_0px_0px_#000] animate-auth-pop-in sm:max-w-6xl lg:grid-cols-[0.95fr_1.05fr]">
            <aside className="border-b-4 border-black bg-[#C4B5FD] p-6 lg:border-b-0 lg:border-r-4 lg:p-10">
              <div className="mb-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/"
                  className="inline-flex -rotate-2 shrink-0 items-center gap-2 border-4 border-black bg-[#FFD93D] px-3 py-2 font-black uppercase text-black shadow-[6px_6px_0px_0px_#000] transition-all duration-200 ease-out hover:-translate-y-1 hover:rotate-0"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden sm:h-7 sm:w-7">
                    <Image src="/logo.png" alt="TzoShop logo" width={28} height={28} className="h-6 w-6 object-contain sm:h-7 sm:w-7" priority />
                  </span>
                  <span className="text-sm sm:text-base">TZOSHOP</span>
                </Link>
                <span className="inline-flex border-4 border-black bg-black px-3 py-2 text-xs font-black uppercase tracking-widest text-white shadow-[4px_4px_0px_0px_#000] animate-brutal-wiggle">
                  CREATE ACCOUNT
                </span>
              </div>
              <h1 className="mt-4 text-4xl font-black uppercase leading-[1.08] tracking-tight text-black [text-shadow:3px_3px_0px_#fff] sm:text-5xl lg:text-6xl">
                BẮT ĐẦU
                <br />
                VỚI
                <br />
                TZOSHOP
              </h1>
              <p className="mt-5 max-w-md font-bold leading-7 text-black">
                Tạo tài khoản để mua credits, tạo API key và sử dụng AI trong công cụ làm việc của bạn.
              </p>

              <div className="mt-21 space-y-4">
                <article className="-rotate-1 border-4 border-black bg-white p-4 shadow-[8px_8px_0px_0px_#000] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#000]">
                  <p className="text-sm font-black uppercase">BẮT ĐẦU LINH HOẠT</p>
                  <p className="mt-1 text-sm font-medium leading-6">Có thể chọn gói nhỏ trước để kiểm tra mức sử dụng thực tế.</p>
                </article>
                <article className="rotate-1 border-4 border-black bg-[#FFD93D] p-4 shadow-[8px_8px_0px_0px_#000] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#000]">
                  <p className="text-sm font-black uppercase">QUẢN LÝ TẬP TRUNG</p>
                  <p className="mt-1 text-sm font-medium leading-6">Theo dõi credits, thời hạn gói và API key trong cùng một tài khoản.</p>
                </article>
              </div>

            </aside>

            <div className="bg-[#FFFDF5] p-6 sm:p-8 lg:p-10">
              <div className="mx-auto w-full max-w-lg">
                <p className="inline-flex border-4 border-black bg-white px-3 py-1 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#000]">REGISTER</p>
                <h2 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-5xl">ĐĂNG KÝ</h2>
                <p className="mt-2 font-medium">Tạo tài khoản để bắt đầu sử dụng và quản lý credits của bạn.</p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-black uppercase">Họ và tên</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="Nhập họ và tên"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-12 w-full border-4 border-black bg-white px-4 font-bold placeholder:text-black/50 focus-visible:bg-[#FFD93D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-black uppercase">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="Nhập email của bạn"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12 w-full border-4 border-black bg-white px-4 font-bold placeholder:text-black/50 focus-visible:bg-[#FFD93D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="mb-2 block text-sm font-black uppercase">Mật khẩu</label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      placeholder="Tạo mật khẩu"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-12 w-full border-4 border-black bg-white px-4 font-bold placeholder:text-black/50 focus-visible:bg-[#FFD93D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="mb-2 block text-sm font-black uppercase">Xác nhận mật khẩu</label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      placeholder="Nhập lại mật khẩu"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="h-12 w-full border-4 border-black bg-white px-4 font-bold placeholder:text-black/50 focus-visible:bg-[#FFD93D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    />
                  </div>

                  <label className="flex items-start gap-3 text-sm font-bold leading-6">
                    <input
                      type="checkbox"
                      checked={formData.agree}
                      onChange={(e) => setFormData({ ...formData, agree: e.target.checked })}
                      className="mt-1 h-4 w-4 border-2 border-black accent-[#FF6B6B]"
                    />
                    <span>Tôi đồng ý với điều khoản sử dụng và chính sách của TzoShop.</span>
                  </label>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex h-12 w-full items-center justify-center border-4 border-black bg-[#FF6B6B] px-6 text-sm font-black uppercase text-black shadow-[6px_6px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" /> : "TẠO TÀI KHOẢN"}
                  </button>
                </form>

                <div className="my-6 flex items-center gap-3">
                  <div className="h-1 flex-1 border-y-2 border-black bg-white" />
                  <span className="text-xs font-black uppercase">HOẶC</span>
                  <div className="h-1 flex-1 border-y-2 border-black bg-white" />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    signIn("google", { callbackUrl: "/auth/redirect" });
                  }}
                  className="inline-flex h-12 w-full items-center justify-center gap-3 border-4 border-black bg-white px-6 text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  ĐĂNG KÝ BẰNG GOOGLE
                </button>

                <p className="mt-6 border-4 border-black bg-[#FFD93D] px-3 py-2 text-center text-xs font-bold">
                  Bằng việc tạo tài khoản, bạn đồng ý sử dụng dịch vụ theo chính sách và điều khoản của TzoShop.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />}
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
