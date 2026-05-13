"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, ArrowLeft, ShieldCheck, Sparkles, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast, showToast, clearToast } = useToast(6000);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      showToast("Vui lòng nhập email hợp lệ.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message ?? "Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.", "error");
      } else {
        setSent(true);
        showToast(data.message ?? "Đã gửi hướng dẫn đặt lại mật khẩu.", "success");
      }
    } catch {
      showToast("Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-grid-pattern relative min-h-screen w-full overflow-x-hidden bg-[#FFFDF5] text-black">
      <section className="relative min-h-screen px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="pointer-events-none absolute -left-10 top-20 hidden h-20 w-20 rotate-12 border-4 border-black bg-[#FFD93D] md:block" />
        <div className="pointer-events-none absolute right-10 top-24 hidden h-16 w-16 -rotate-12 border-4 border-black bg-[#C4B5FD] md:block" />
        <div className="pointer-events-none absolute bottom-10 left-8 hidden h-14 w-14 rotate-6 border-4 border-black bg-[#FF6B6B] shadow-[4px_4px_0px_0px_#000] animate-brutal-wiggle sm:block" />
        <div className="pointer-events-none absolute bottom-16 right-12 hidden h-10 w-10 -rotate-12 border-4 border-black bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000] animate-pulse sm:block" />
        <span className="pointer-events-none absolute left-6 top-8 hidden h-12 w-12 rotate-6 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000] animate-spin-slow sm:inline-flex">
          <Star className="h-6 w-6 fill-black text-black" />
        </span>
        <span className="pointer-events-none absolute right-6 top-8 hidden h-10 w-10 -rotate-6 items-center justify-center border-4 border-black bg-[#C4B5FD] shadow-[4px_4px_0px_0px_#000] animate-brutal-wiggle sm:inline-flex">
          <Star className="h-5 w-5 fill-black text-black" />
        </span>
        <Star className="pointer-events-none absolute bottom-24 left-1/3 hidden h-8 w-8 text-black animate-spin-slow sm:block" />
        <Sparkles className="pointer-events-none absolute bottom-14 right-1/4 hidden h-8 w-8 text-black animate-brutal-wiggle sm:block" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="grid w-full max-w-6xl overflow-hidden border-4 border-black bg-white shadow-[12px_12px_0px_0px_#000] animate-auth-pop-in lg:grid-cols-[0.95fr_1.05fr]">
            <aside className="border-b-4 border-black bg-[#FFD93D] p-6 lg:border-b-0 lg:border-r-4 lg:p-10">
              <div className="mb-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/"
                  className="inline-flex -rotate-2 shrink-0 items-center gap-2 border-4 border-black bg-[#FFD93D] px-3 py-2 font-black uppercase text-black shadow-[6px_6px_0px_0px_#000] transition-all duration-200 ease-out hover:-translate-y-1 hover:rotate-0"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden sm:h-7 sm:w-7">
                    <Image
                      src="/logo.png"
                      alt="TzoShop logo"
                      width={28}
                      height={28}
                      className="h-6 w-6 object-contain sm:h-7 sm:w-7"
                      priority
                    />
                  </span>
                  <span className="text-sm sm:text-base">TZOSHOP</span>
                </Link>

                <span className="inline-flex border-4 border-black bg-black px-3 py-2 text-xs font-black uppercase tracking-widest text-white shadow-[4px_4px_0px_0px_#000] animate-brutal-wiggle">
                  RESET PASSWORD
                </span>
              </div>

              <h1 className="mt-4 text-4xl font-black uppercase leading-[1.08] tracking-tight text-black [text-shadow:3px_3px_0px_#fff] sm:text-5xl lg:text-6xl">
                QUÊN MẬT KHẨU?
                <br />
                LẤY LẠI TRUY CẬP
              </h1>

              <p className="mt-5 max-w-md font-bold leading-7 text-black">
                Nhập email đã đăng ký, TzoShop sẽ gửi hướng dẫn đặt lại mật khẩu để bạn tiếp tục quản lý credits và API key.
              </p>

              <div className="mt-8 space-y-4">
                <article className="-rotate-1 border-4 border-black bg-[#FFFDF5] p-4 shadow-[8px_8px_0px_0px_#000] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#000]">
                  <p className="text-sm font-black uppercase">KIỂM TRA ĐÚNG EMAIL</p>
                  <p className="mt-1 text-sm font-medium leading-6">Hãy dùng email bạn đã đăng ký tài khoản TzoShop trước đó.</p>
                </article>
                <article className="rotate-1 border-4 border-black bg-[#C4B5FD] p-4 shadow-[8px_8px_0px_0px_#000] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#000]">
                  <p className="text-sm font-black uppercase">BẢO MẬT TÀI KHOẢN</p>
                  <p className="mt-1 text-sm font-medium leading-6">Sau khi đặt lại mật khẩu, bạn nên kiểm tra API key và lịch sử sử dụng nếu cần.</p>
                </article>
              </div>
            </aside>

            <div className="flex items-center bg-[#FFFDF5] p-6 sm:p-8 lg:p-10">
              <div className="mx-auto w-full max-w-lg">
                {sent ? (
                  <div className="mx-auto w-full max-w-[460px] text-center animate-auth-pop-in">
                    <p className="inline-flex border-4 border-black bg-[#FFFDF5] px-4 py-2 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-0.5">
                      RESET
                    </p>
                    <div className="mx-auto mt-4 flex h-[76px] w-[76px] items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[6px_6px_0px_0px_#000] animate-brutal-wiggle transition-all duration-150 ease-out hover:-translate-y-1 hover:rotate-2">
                      <ShieldCheck className="h-10 w-10 text-black" />
                    </div>
                    <h2 className="mt-5 text-3xl font-black uppercase leading-[1.08] tracking-tight sm:text-4xl">
                      Kiểm tra hộp thư của bạn.
                    </h2>
                    <div className="mt-5 border-4 border-black bg-white px-5 py-4 text-left shadow-[5px_5px_0px_0px_#000]">
                      <div className="mb-3 h-2 w-20 border-2 border-black bg-[#FF6B6B]" />
                      <p className="text-sm font-bold leading-relaxed text-black">
                        Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu sẽ được gửi tới hộp thư của bạn.
                      </p>
                    </div>
                    <div className="mt-6 space-y-3">
                      <Link
                        href="/login"
                        className="inline-flex h-12 w-full items-center justify-center gap-2 border-4 border-black bg-[#FF6B6B] px-6 text-sm font-black uppercase text-black shadow-[6px_6px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        QUAY LẠI ĐĂNG NHẬP
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="inline-flex border-4 border-black bg-white px-3 py-1 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#000]">
                      RESET
                    </p>
                    <h2 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-5xl">QUÊN MẬT KHẨU</h2>
                    <p className="mt-2 font-medium">
                      Nhập email tài khoản của bạn, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                      <div>
                        <label htmlFor="email" className="mb-2 block text-sm font-black uppercase">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />
                          <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Nhập email đã đăng ký"
                            className="h-12 w-full border-4 border-black bg-white pl-12 pr-4 font-bold placeholder:text-black/50 focus-visible:bg-[#FFD93D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex h-12 w-full items-center justify-center border-4 border-black bg-[#FF6B6B] px-6 text-sm font-black uppercase text-black shadow-[6px_6px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isLoading ? "ĐANG GỬI..." : "GỬI HƯỚNG DẪN"}
                      </button>
                    </form>

                    <div className="mt-6 border-4 border-black bg-white px-4 py-3 shadow-[4px_4px_0px_0px_#000]">
                      <p className="text-sm font-black uppercase">LƯU Ý</p>
                      <p className="mt-1 text-sm font-medium leading-6">
                        Nếu không thấy email, hãy kiểm tra mục spam hoặc thử lại sau vài phút.
                      </p>
                    </div>

                    <p className="mt-6 text-center text-sm font-bold">
                      ĐÃ NHỚ MẬT KHẨU?{" "}
                      <Link
                        href="/login"
                        className="font-black uppercase underline underline-offset-4 transition-all duration-100 ease-linear hover:bg-[#FFD93D]"
                      >
                        ĐĂNG NHẬP
                      </Link>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />}
    </main>
  );
}
