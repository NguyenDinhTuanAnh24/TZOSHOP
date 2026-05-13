"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, ShieldCheck, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { toast, showToast, clearToast } = useToast(5000);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Không có token → hiện lỗi sớm
  const tokenMissing = !token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      showToast("Mật khẩu phải có ít nhất 8 ký tự.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Mật khẩu xác nhận không khớp.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message ?? "Đã có lỗi xảy ra.", "error");
      } else {
        setSuccess(true);
        showToast("Mật khẩu đã được cập nhật thành công!", "success");
        setTimeout(() => router.push("/login"), 2500);
      }
    } catch {
      showToast("Đã có lỗi xảy ra. Vui lòng thử lại.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-clip bg-[#f7f8f6] text-[#0b0f0d]">
      <section className="flex min-h-screen items-center justify-center overflow-x-clip p-4 md:p-6">
        <div className="grid min-h-[680px] w-full max-w-[calc(100vw-2rem)] overflow-hidden rounded-[24px] border border-[#dfe5e1] bg-white shadow-[0_24px_80px_rgba(11,15,13,0.12)] sm:max-w-7xl sm:rounded-[36px] lg:grid-cols-[1fr_1fr]">
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
                  Bảo mật tài khoản
                </p>
                <h1 className="mt-4 text-4xl font-semibold tracking-[-1.2px] md:text-[56px] md:leading-[1.08]">
                  Tạo mật khẩu mới cho tài khoản của bạn
                </h1>
                <p className="mt-5 text-base leading-7 text-white/82">
                  Chọn một mật khẩu mạnh, ít nhất 8 ký tự. Sau khi cập nhật,
                  hãy đăng nhập lại để bắt đầu sử dụng.
                </p>
              </div>

              <div className="mt-10 space-y-4">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">Mật khẩu mạnh</p>
                  <p className="mt-1 text-sm leading-6 text-white/78">
                    Sử dụng kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">Link chỉ dùng một lần</p>
                  <p className="mt-1 text-sm leading-6 text-white/78">
                    Sau khi đặt lại, link này sẽ hết hạn và không thể dùng lại.
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-10 text-sm text-white/75">
                Nhớ mật khẩu rồi?{" "}
                <Link
                  href="/login"
                  className="font-bold text-white underline underline-offset-4 transition hover:text-white/90"
                >
                  Quay lại đăng nhập
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
              {tokenMissing ? (
                /* Không có token */
                <div className="text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-rose-50 ring-1 ring-rose-100">
                    <LockKeyhole className="h-10 w-10 text-rose-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#0b0f0d]">Link không hợp lệ</h2>
                  <p className="mt-3 text-sm leading-6 text-[#66736d]">
                    Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
                    Vui lòng yêu cầu lại.
                  </p>
                  <Link
                    href="/forgot-password"
                    className="mt-8 inline-flex w-full items-center justify-center rounded-full !bg-[#0b7a63] px-6 py-4 text-sm font-bold !text-white transition hover:opacity-90"
                  >
                    Yêu cầu link mới
                  </Link>
                </div>
              ) : success ? (
                /* Thành công */
                <div className="text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-emerald-50 ring-1 ring-emerald-100">
                    <ShieldCheck className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight text-[#0b0f0d]">
                    Mật khẩu đã cập nhật!
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[#66736d]">
                    Mật khẩu của bạn đã được thay đổi thành công. Bạn sẽ được
                    chuyển sang trang đăng nhập.
                  </p>
                  <Link
                    href="/login"
                    className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full !bg-[#0b7a63] px-6 py-4 text-sm font-bold !text-white transition hover:opacity-90"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Đăng nhập ngay
                  </Link>
                </div>
              ) : (
                /* Form đặt lại mật khẩu */
                <>
                  <div className="mb-9 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#00a982]">
                      New password
                    </p>
                    <h2 className="mt-3 text-5xl font-semibold tracking-[-1px] text-[#0b0f0d]">
                      Đặt lại mật khẩu
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-[#66736d]">
                      Tạo mật khẩu mới cho tài khoản của bạn.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Mật khẩu mới */}
                    <div>
                      <label
                        htmlFor="password"
                        className="mb-2 block text-sm font-semibold text-[#0b0f0d]"
                      >
                        Mật khẩu mới
                      </label>
                      <div className="relative">
                        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a39c]" />
                        <input
                          id="password"
                          name="password"
                          type={showPw ? "text" : "password"}
                          required
                          minLength={8}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Tối thiểu 8 ký tự"
                          className="w-full rounded-full border border-[#dfe5e1] bg-[#f3f7f5] py-4 pl-11 pr-12 text-sm font-medium text-[#0b0f0d] outline-none transition placeholder:text-[#94a39c] focus:border-[#00d4a4] focus:bg-white focus:ring-4 focus:ring-[#00d4a4]/10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(!showPw)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a39c] hover:text-[#66736d]"
                        >
                          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Xác nhận mật khẩu */}
                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="mb-2 block text-sm font-semibold text-[#0b0f0d]"
                      >
                        Xác nhận mật khẩu
                      </label>
                      <div className="relative">
                        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a39c]" />
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirm ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu"
                          className="w-full rounded-full border border-[#dfe5e1] bg-[#f3f7f5] py-4 pl-11 pr-12 text-sm font-medium text-[#0b0f0d] outline-none transition placeholder:text-[#94a39c] focus:border-[#00d4a4] focus:bg-white focus:ring-4 focus:ring-[#00d4a4]/10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a39c] hover:text-[#66736d]"
                        >
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex w-full items-center justify-center rounded-full !bg-[#0b7a63] px-6 py-4 text-base font-bold !text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        "Cập nhật mật khẩu"
                      )}
                    </button>
                  </form>

                  <p className="mt-7 text-center text-sm text-[#66736d]">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1.5 font-bold text-[#057a60] transition hover:text-[#00a982]"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Quay lại đăng nhập
                    </Link>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {toast && (
        <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />
      )}
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
