"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PublicFooter as SharedPublicFooter } from "@/components/layout/landing-public-chrome";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { CosmicButton } from "@/components/ui/cosmic-button";
import { TextFadeInUp } from "@/components/ui/text-fade-in-up";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  Lock,
  Mail,
  Menu,
  Star,
  User,
  Wallet,
  X,
} from "lucide-react";

const navItems = [
  { label: "SẢN PHẨM", href: "/plans" },
  { label: "THNG TIN", href: "/#providers" },
  { label: "CHNH SCH", href: "/terms" },
  { label: "NH GI", href: "/#testimonials" },
];

const providers = [
  {
    name: "CodexAI",
    icon: "/logos/codexai.svg",
    desc: "Ph hợp cho coding, agent workflow v cng cụ pht triển.",
  },
  {
    name: "Claude",
    icon: "/logos/claude.svg",
    desc: "Tối ưu cho phn tch, viết nội dung di v xử l ngữ cảnh.",
  },
  {
    name: "Gemini",
    icon: "/logos/gemini.svg",
    desc: "Linh hoạt cho tc vụ đa dạng, tốc độ nhanh v chi ph hợp l.",
  },
  {
    name: "DeepSeek",
    icon: "/logos/deepseek.svg",
    desc: "Ph hợp cho nhu cầu tiết kiệm, coding v xử l tc vụ thưng ngy.",
  },
];

const workflowFeatures = [
  {
    title: "Chn gi credits ph hợp",
    desc: "Dễ dng chn gi theo nhu cầu sử dụng, từ trải nghiệm thử đến workflow thưng xuyn hoặc nhu cầu cao hơn.",
    bullets: ["So snh gi r rng", "Linh hoạt theo từng dng AI", "Ph hợp c nhn v team nh"],
    icon: CreditCard,
    previewType: "plans",
  },
  {
    title: "Kch hoạt v sử dụng nhanh",
    desc: "Sau khi c gi, bạn c thể bắt đầu sử dụng ngay với cc cng cụ AI quen thuộc m khng cần thao tc phức tạp.",
    bullets: ["Bắt đầu trong vi pht", "Dng với extension, IDE hoặc app hỗ trợ", "Trải nghiệm thống nhất trong một ti khoản"],
    icon: KeyRound,
    previewType: "quickstart",
  },
  {
    title: "Theo di usage minh bạch",
    desc: "Nắm được lượng credits đ dng, request pht sinh v xu hướng sử dụng để kiểm sot ngn sch tốt hơn.",
    bullets: ["Theo di credits cn lại", "Xem lịch sử sử dụng", "Hạn chế pht sinh ngoi dự kiến"],
    icon: LayoutDashboard,
    previewType: "usage",
  },
  {
    title: "Quản l đơn hng v hỗ trợ dễ dng",
    desc: "Kiểm tra đơn hng, trạng thi thanh ton, m giảm gi v gửi yu cầu hỗ trợ khi cần.",
    bullets: ["ơn hng r trạng thi", "Hỗ trợ qua nhiu knh", "Thng tin ti khoản dễ quản l"],
    icon: Wallet,
    previewType: "orders",
  },
];

const steps = [
  {
    title: "Tạo ti khoản",
    desc: "ăng k nhanh để bắt đầu quản l credits v API key trong một nơi.",
  },
  {
    title: "Chn dng AI v gi credits",
    desc: "Lựa chn gi theo nhu cầu sử dụng thực tế v loại tc vụ bạn thưng chạy.",
  },
  {
    title: "Tạo API key",
    desc: "Khởi tạo key ring cho gi đ chn để kiểm sot v theo di thuận tiện.",
  },
  {
    title: "Tch hợp vo cng cụ bạn dng",
    desc: "Dng API key trong extension, IDE hoặc ứng dụng để triển khai cng việc hằng ngy.",
  },
];

const reasons = [
  {
    title: "Tiết kiệm thi gian thiết lập",
    description:
      "Chn gi ph hợp, kch hoạt nhanh v bắt đầu sử dụng với cc cng cụ AI quen thuộc m khng cần thao tc phức tạp.",
  },
  {
    title: "Dễ kiểm sot chi ph",
    description: "Theo di credits, lịch sử sử dụng v trạng thi gi để trnh pht sinh ngoi dự kiến.",
  },
  {
    title: "Linh hoạt theo nhu cầu",
    description: "Từ c nhn, ngưi dng thưng xuyn đến team nh, TzoShop c nhiu lựa chn gi credits ph hợp.",
  },
  {
    title: "Quản l tập trung",
    description: "Gi credits, đơn hng, API key v usage được gom v một nơi để bạn dễ theo di v vận hnh.",
  },
];

const testimonials = [
  {
    name: "Minh Anh",
    role: "Developer c nhn",
    quote: "TzoShop gip mnh bắt đầu nhanh hơn rất nhiu. Chn gi xong l c thể dng ngay với cng cụ quen thuộc.",
    rating: 5,
    badge: "Ngưi dng Plus",
  },
  {
    name: "Quang Huy",
    role: "Freelancer",
    quote: "Phần theo di usage kh r rng, dễ kiểm sot chi ph hơn so với trước.",
    rating: 5,
    badge: "Ngưi dng thưng xuyn",
  },
  {
    name: "H Linh",
    role: "Content team",
    quote: "Mnh thch cch TzoShop gom mi thứ v một nơi, từ gi credits đến đơn hng v lịch sử sử dụng.",
    rating: 5,
    badge: "Team nh",
  },
  {
    name: "Tuấn Minh",
    role: "Ngưi dng Plus",
    quote: "Giao diện dễ dng, mua gi nhanh v khng bị rối khi cần kiểm tra lại thng tin.",
    rating: 4,
    badge: "Ngưi dng Plus",
  },
  {
    name: "Khnh Duy",
    role: "Team nh",
    quote: "Ph hợp với nhm của mnh v vừa dễ quản l vừa c nhiu lựa chn theo nhu cầu.",
    rating: 5,
    badge: "Team nh",
  },
  {
    name: "Ngc Mai",
    role: "Designer",
    quote: "Tốc độ bắt đầu kh nhanh, mnh khng mất nhiu thi gian để lm quen.",
    rating: 5,
    badge: "Ngưi dng thưng xuyn",
  },
  {
    name: "ức Long",
    role: "Power user",
    quote: "Phần hỗ trợ nhiu dạng AI v cch quản l tập trung l điểm mạnh đnh gi cao nhất.",
    rating: 5,
    badge: "Power user",
  },
  {
    name: "Thảo Vy",
    role: "Ngưi dng Mini",
    quote: "Mnh thấy dễ tiếp cận, đặc biệt l khi mới bắt đầu dng cc gi credits.",
    rating: 4,
    badge: "Ngưi dng Mini",
  },
];

const pricingPreview = [
  {
    name: "Trial",
    badge: "Tiết kiệm",
    subtitle: "Cho trải nghiệm nhanh",
    desc: "Dng thử workflow cơ bản, ph hợp để lm quen v kiểm tra nhu cầu thực tế.",
    credits: "Credits theo từng dng AI",
    validity: "Thi hạn ngắn để bắt đầu nhanh",
    bullets: ["Kch hoạt nhanh", "Ph hợp ngưi mới", "Thiết lập đơn giản"],
  },
  {
    name: "Mini",
    badge: "Tiết kiệm",
    subtitle: "Cho c nhn",
    desc: "Bắt đầu nhanh với mức chi ph thấp v khả năng mở rộng khi cần.",
    credits: "Credits theo từng dng AI",
    validity: "Thi hạn linh hoạt theo gi",
    bullets: ["Bắt đầu nhanh", "Ph hợp c nhn", "Theo di usage cơ bản"],
  },
  {
    name: "Plus",
    badge: "Phổ biến",
    subtitle: "Cho sử dụng thưng xuyn",
    desc: "Cn bằng tốt giữa chi ph v hiệu quả để duy tr cng việc hằng ngy.",
    credits: "Credits tối ưu cho workflow hằng ngy",
    validity: "Chu kỳ ổn định cho cng việc lin tục",
    bullets: ["Cn bằng chi ph", "Ưu tin ổn định", "Quản l key linh hoạt"],
  },
  {
    name: "Pro",
    badge: "Cho team",
    subtitle: "Cho workflow nặng hơn",
    desc: "Nhiu credits hơn để chạy tc vụ chuyn su v yu cầu vận hnh ổn định.",
    credits: "Credits theo từng dng AI",
    validity: "Dnh cho cưng độ sử dụng cao",
    bullets: ["Dung lượng lớn hơn", "Ph hợp ngưi dng chuyn su", "Mở rộng linh hoạt"],
  },
  {
    name: "Max",
    badge: "Cho team",
    subtitle: "Cho nhm nh",
    desc: "Dung lượng cao hơn cho nhm cộng tc v theo di usage chi tiết.",
    credits: "Credits theo từng dng AI",
    validity: "Chu kỳ di hơn theo gi",
    bullets: ["Ph hợp nhm nh", "Theo di su hơn", "Ưu tin độ ổn định"],
  },
  {
    name: "Ultra",
    subtitle: "Cho nhu cầu rất cao",
    desc: "Tối ưu cho workload lớn, ưu tin hiệu năng v khả năng mở rộng lin tục.",
    credits: "Credits theo từng dng AI",
    validity: "Dnh cho vận hnh cưng độ lớn",
    bullets: ["Khối lượng xử l lớn", "Ưu tin hiệu năng", "ġp ứng workload cao"],
  },
  {
    name: "Enterprise",
    badge: "Lin hệ",
    subtitle: "Cho team/doanh nghiệp",
    desc: "Gi ty chỉnh theo quy m tổ chức với nhu cầu tư vấn v hỗ trợ ring.",
    credits: "Credits theo từng dng AI",
    validity: "Thiết kế theo nhu cầu doanh nghiệp",
    bullets: ["Tư vấn chuyn biệt", "Hỗ trợ ring", "Ty chỉnh theo quy m"],
  },
];

const benefits = [
  "BẮT ẦU SỬ DỤNG TRONG VI PHT",
  "DNG LINH HOẠT VI CNG CỤ QUEN THUỘC",
  "THEO DI CREDITS R RNG",
  "KIỂM SOT CHI PH DỄ DNG",
  "HỖ TRỢ NHIỀU DNG AI PHỔ BIẾN",
  "PH HỢP C NHN V TEAM NH",
  "QUẢN L GI TẬP TRUNG",
  "MUA GI NHANH, SỬ DỤNG NGAY",
];

const cardClass =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_-2px_rgba(79,70,229,0.10)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_25px_-5px_rgba(79,70,229,0.15),0_8px_10px_-6px_rgba(79,70,229,0.10)]";

const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold !text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.30)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_0_rgba(79,70,229,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

type AuthMode = "login" | "register" | "forgot-password";
const DRAWER_ANIMATION_MS = 320;
const OAUTH_IN_PROGRESS_KEY = "tzoshop_oauth_in_progress";

function PublicNavbar({ onOpenAuth }: { onOpenAuth: (mode: AuthMode) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <Image src="/logo.png" alt="TzoShop logo" width={28} height={28} className="h-7 w-7 object-contain" priority />
          <span className="text-lg font-bold text-slate-900">TzoShop</span>
        </Link>

        <nav className="hidden items-center gap-10 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-md px-2 py-1 text-sm font-medium tracking-normal text-slate-600 transition-colors duration-200 hover:!text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <button type="button" className={secondaryButtonClass} onClick={() => onOpenAuth("login")}>ăng nhập</button>
          <button type="button" className={primaryButtonClass} onClick={() => onOpenAuth("register")}>Bắt đầu</button>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Mở menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isOpen ? (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <nav className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
            {navItems.map((item) => (
              <Link
                key={`mobile-${item.label}`}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors duration-200 hover:!text-indigo-600"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button type="button" className={secondaryButtonClass} onClick={() => { setIsOpen(false); onOpenAuth("login"); }}>
                ăng nhập
              </button>
              <button type="button" className={primaryButtonClass} onClick={() => { setIsOpen(false); onOpenAuth("register"); }}>
                Bắt đầu
              </button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function HeroSection({ onOpenAuth }: { onOpenAuth: (mode: AuthMode) => void }) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 py-16 sm:py-20 lg:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 top-10 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-300 to-violet-300 opacity-20 blur-3xl tz-animate-soft-pulse"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-200 to-violet-300 opacity-20 blur-3xl tz-animate-soft-pulse tz-delay-200"
      />

      <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <div>
          <p className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-indigo-700 tz-animate-fade-up sm:text-sm">
            GIẢI PHP AI CREDITS LINH HOẠT
          </p>
          <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-950 tz-animate-fade-up tz-delay-100 sm:text-5xl lg:text-6xl">
            Mua credits AI dễ dng,{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              dng ngay cho cng việc mỗi ngy
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 tz-animate-fade-up tz-delay-200 sm:text-lg">
            TzoShop gip bạn chn gi ph hợp, kch hoạt nhanh v sử dụng linh hoạt với cc cng cụ AI quen thuộc - r rng, tiện lợi v dễ kiểm sot chi ph.
          </p>

          <div className="mt-8 flex flex-col gap-3 tz-animate-fade-up tz-delay-300 sm:flex-row">
            <CosmicButton type="button" onClick={() => onOpenAuth("register")} className="group">
              Bắt đầu ngay
              <ArrowRight className="ml-2 h-4 w-4 text-white transition-transform duration-200 group-hover:translate-x-1" />
            </CosmicButton>
            <CosmicButton href="/plans" variant="secondary" className="group hover:shadow-[0_8px_24px_0_rgba(79,70,229,0.16)]">
              Xem gi credits
              <ArrowRight className="ml-2 h-4 w-4 text-slate-700 transition-transform duration-200 group-hover:translate-x-1" />
            </CosmicButton>
          </div>
        </div>

        <div className="relative tz-animate-fade-up tz-delay-300 lg:tz-animate-float">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(79,70,229,0.35)] perspective-[2000px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-24px_rgba(79,70,229,0.45)] hover:rotate-x-[2deg] hover:rotate-y-[-8deg] lg:rotate-x-[5deg] lg:rotate-y-[-12deg]">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 tz-animate-fade-up tz-delay-100">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-950">Bắt đầu với TzoShop</h3>
                <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">Nhanh gn</span>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  {
                    title: "Chn gi ph hợp",
                    desc: "Lựa chn theo nhu cầu c nhn hoặc team nh.",
                  },
                  {
                    title: "Kch hoạt ti khoản",
                    desc: "Thng tin sử dụng được sắp xếp r rng trong ti khoản.",
                  },
                  {
                    title: "Dng với cng cụ quen thuộc",
                    desc: "Bắt đầu lm việc với extension, IDE hoặc ứng dụng hỗ trợ.",
                  },
                ].map((step, idx) => (
                  <article key={step.title} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-xs font-bold text-white">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                        <p className="mt-1 text-xs leading-6 text-slate-600">{step.desc}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/80 p-3">
                  <p className="text-xs font-semibold text-indigo-700">Sẵn sng trong vi pht</p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-3">
                  <p className="text-xs font-semibold text-emerald-700">Khng cần thao tc phức tạp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProviderSection() {
  return (
    <section id="providers" className="py-16 sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
          AI Providers
        </p>
        <h2 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">Linh hoạt chn dng AI theo nhu cầu</h2>
        <p className="mt-3 max-w-3xl text-slate-600">Tận dụng nhiu lựa chn model phổ biến trong cng một nn tảng quản l tập trung.</p>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {providers.map((provider) => (
            <article key={`provider-${provider.name}`} className={`${cardClass} p-6`}>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 p-2">
                <Image
                  src={provider.icon}
                  alt={`${provider.name} logo`}
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain"
                />
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900">{provider.name}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{provider.desc}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-violet-600">Hỗ trợ nhiu model phổ biến</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitsMarqueeBar() {
  const marqueeItems = [...benefits, ...benefits, ...benefits, ...benefits];

  return (
    <section className="border-y border-indigo-400/30 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 py-3 shadow-sm">
      <div className="tz-benefits-marquee-wrap overflow-hidden">
        <div className="tz-benefits-marquee px-4 sm:px-6 lg:px-8">
          {marqueeItems.map((item, idx) => (
            <div key={`benefit-${idx}-${item}`} className="inline-flex items-center gap-4">
              <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-white sm:text-sm">{item}</span>
              <span aria-hidden className="text-sm text-white/80 sm:text-base">•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AuthDrawer({
  isOpen,
  mode,
  onClose,
  onSwitchMode,
}: {
  isOpen: boolean;
  mode: AuthMode;
  onClose: () => void;
  onSwitchMode: (nextMode: AuthMode) => void;
}) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  const resetForgotState = () => {
    setForgotEmail("");
    setForgotPasswordSent(false);
  };

  const closeDrawerAndReset = useCallback(() => {
    setForgotEmail("");
    setForgotPasswordSent(false);
    setErrorMessage("");
    setSuccessMessage("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      let enterFrame = 0;
      const frame = window.requestAnimationFrame(() => {
        setShouldRender(true);
        enterFrame = window.requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      return () => {
        window.cancelAnimationFrame(frame);
        if (enterFrame) window.cancelAnimationFrame(enterFrame);
      };
    }

    const leaveFrame = window.requestAnimationFrame(() => {
      setIsVisible(false);
    });
    const timer = window.setTimeout(() => {
      setShouldRender(false);
    }, DRAWER_ANIMATION_MS);

    return () => {
      window.cancelAnimationFrame(leaveFrame);
      window.clearTimeout(timer);
    };
  }, [isOpen]);

  const handleGoogleAuth = () => {
    window.sessionStorage.setItem(OAUTH_IN_PROGRESS_KEY, "1");
    void signIn("google", { callbackUrl: "/auth/redirect" });
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawerAndReset();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeDrawerAndReset]);
  const handleSwitchMode = (nextMode: AuthMode) => {
    if (mode === "forgot-password" && nextMode !== "forgot-password") {
      resetForgotState();
      setErrorMessage("");
      setSuccessMessage("");
    }
    onSwitchMode(nextMode);
  };
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (!loginData.email || !loginData.password) {
      setErrorMessage("Vui lng nhập đầy đủ email v mật khẩu.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: loginData.email,
        password: loginData.password,
      });
      if (result?.error) {
        setErrorMessage(result.error);
        return;
      }
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();
      const role = sessionData?.user?.role;
      window.location.href = role === "ADMIN" ? "/admin" : "/dashboard";
    } catch {
      setErrorMessage("ģ c lỗi xảy ra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (!registerData.name || !registerData.email || !registerData.password || !registerData.confirmPassword) {
      setErrorMessage("Vui lng đin đầy đủ thng tin.");
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      setErrorMessage("Mật khẩu xc nhận khng khớp.");
      return;
    }
    if (registerData.password.length < 8) {
      setErrorMessage("Mật khẩu phải từ 8 k tự trở ln.");
      return;
    }
    if (!registerData.agree) {
      setErrorMessage("Bạn cần đồng  với điu khoản sử dụng.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerData.name,
          email: registerData.email,
          password: registerData.password,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setErrorMessage(result.error?.message || "ăng k thất bại.");
        return;
      }
      handleSwitchMode("login");
      setErrorMessage("");
      setSuccessMessage("ăng k thnh cng. Vui lng đăng nhập để tiếp tục.");
    } catch {
      setErrorMessage("ģ c lỗi xảy ra.");
    } finally {
      setIsSubmitting(false);
    }
  };

    const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = forgotEmail.trim().toLowerCase();
    setErrorMessage("");
    setSuccessMessage("");
    if (!email) {
      setErrorMessage("Vui lng nhp email hp l.");
      return;
    }

    setIsSendingResetEmail(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErrorMessage(data?.error ?? "Khng th gi email t li mt khu. Vui lng th li.");
        return;
      }
      setForgotPasswordSent(true);
      setSuccessMessage(data?.message ?? "Nu email tn ti, chng ti  gi lin kt t li mt khu.");
    } catch {
      setErrorMessage("Khng th gi email t li mt khu. Vui lng th li.");
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-[90]" aria-modal role="dialog">
      <div
        className={`absolute inset-0 bg-slate-950/45 backdrop-blur-sm transition-opacity duration-300 ease-out ${isVisible ? "opacity-100" : "opacity-0"}`}
        onClick={closeDrawerAndReset}
      />
      <div
        className={`absolute inset-y-0 right-0 w-full max-w-[520px] border-l border-slate-200 bg-white shadow-[0_24px_80px_-28px_rgba(79,70,229,0.45)] transition-transform duration-300 ease-out will-change-transform ${isVisible ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex h-full flex-col overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="inline-flex items-center gap-2">
              <Image src="/logo.png" alt="TzoShop logo" width={24} height={24} className="h-6 w-6" />
              <span className="text-sm font-bold text-slate-900">TzoShop</span>
            </div>
            <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700" onClick={closeDrawerAndReset}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 pt-4">
            {mode !== "forgot-password" ? (
              <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button type="button" onClick={() => handleSwitchMode("login")} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>ăng nhập</button>
                <button type="button" onClick={() => handleSwitchMode("register")} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>ăng k</button>
              </div>
            ) : null}
          </div>

          <div className="flex-1 px-5 py-5">
            {mode === "login" ? (
              <>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">ăng nhập</h2>
                <p className="mt-3 text-base leading-8 text-slate-600">Tiếp tục quản l gi credits v đơn hng của bạn.</p>
                <form onSubmit={handleLoginSubmit} className="mt-6 space-y-5">
                  <div>
                    <label htmlFor="drawer-login-email" className="mb-2 block text-base font-semibold text-slate-700">Email</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input id="drawer-login-email" type="email" required value={loginData.email} onChange={(e) => setLoginData((prev) => ({ ...prev, email: e.target.value }))} placeholder="Nhập email của bạn" className="h-14 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-base text-slate-950 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="drawer-login-password" className="mb-2 block text-base font-semibold text-slate-700">Mật khẩu</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input id="drawer-login-password" type={showLoginPassword ? "text" : "password"} required value={loginData.password} onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))} placeholder="Nhập mật khẩu" className="h-14 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-11 text-base text-slate-950 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                      <button type="button" onClick={() => setShowLoginPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 text-base text-slate-600">
                      <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-indigo-600" />
                      Ghi nhớ đăng nhập
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage("");
                        setSuccessMessage("");
                        resetForgotState();
                        handleSwitchMode("forgot-password");
                      }}
                      className="text-base font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Qun mật khẩu
                    </button>
                  </div>
                  {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
                  <CosmicButton type="submit" disabled={isSubmitting} className="w-full" size="lg">
                    ăng nhập
                  </CosmicButton>
                </form>
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Hoặc</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                <button type="button" onClick={handleGoogleAuth} className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-base font-semibold text-slate-800 transition-all duration-200 hover:border-indigo-200 hover:bg-slate-50">
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  ăng nhập với Google
                </button>
                <p className="mt-5 text-center text-base text-slate-600">
                  Chưa c ti khoản?{" "}
                  <button type="button" onClick={() => handleSwitchMode("register")} className="font-semibold text-indigo-600 hover:text-indigo-700">ăng k ngay</button>
                </p>
              </>
            ) : mode === "register" ? (
              <>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Tạo ti khoản</h2>
                <p className="mt-3 text-base leading-8 text-slate-600">Bắt đầu chn gi credits v sử dụng AI linh hoạt cho cng việc hằng ngy.</p>
                <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-5">
                  <div>
                    <label htmlFor="drawer-register-name" className="mb-2 block text-base font-semibold text-slate-700">H tn</label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input id="drawer-register-name" type="text" required value={registerData.name} onChange={(e) => setRegisterData((prev) => ({ ...prev, name: e.target.value }))} placeholder="Nhập h tn" className="h-14 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-base text-slate-950 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="drawer-register-email" className="mb-2 block text-base font-semibold text-slate-700">Email</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input id="drawer-register-email" type="email" required value={registerData.email} onChange={(e) => setRegisterData((prev) => ({ ...prev, email: e.target.value }))} placeholder="Nhập email của bạn" className="h-14 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-base text-slate-950 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="drawer-register-password" className="mb-2 block text-base font-semibold text-slate-700">Mật khẩu</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input id="drawer-register-password" type={showRegisterPassword ? "text" : "password"} required value={registerData.password} onChange={(e) => setRegisterData((prev) => ({ ...prev, password: e.target.value }))} placeholder="Tạo mật khẩu" className="h-14 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-11 text-base text-slate-950 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                      <button type="button" onClick={() => setShowRegisterPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="drawer-register-confirm-password" className="mb-2 block text-base font-semibold text-slate-700">Xc nhận mật khẩu</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input id="drawer-register-confirm-password" type={showRegisterConfirmPassword ? "text" : "password"} required value={registerData.confirmPassword} onChange={(e) => setRegisterData((prev) => ({ ...prev, confirmPassword: e.target.value }))} placeholder="Nhập lại mật khẩu" className="h-14 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-11 text-base text-slate-950 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                      <button type="button" onClick={() => setShowRegisterConfirmPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showRegisterConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <label className="inline-flex items-start gap-2 text-base text-slate-600">
                    <input type="checkbox" checked={registerData.agree} onChange={(e) => setRegisterData((prev) => ({ ...prev, agree: e.target.checked }))} className="mt-1 h-4 w-4 rounded border-slate-300 accent-indigo-600" />
                    <span>
                      Ti đồng  với{" "}
                      <Link href="/terms" className="font-semibold text-slate-900 hover:text-black">điu khoản sử dụng</Link> v{" "}
                      <Link href="/privacy" className="font-semibold text-slate-900 hover:text-black">chnh sch bảo mật</Link>.
                    </span>
                  </label>
                  {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
                  <CosmicButton type="submit" disabled={isSubmitting} className="w-full" size="lg">
                    Tạo ti khoản
                  </CosmicButton>
                </form>
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Hoặc</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                <button type="button" onClick={handleGoogleAuth} className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-base font-semibold text-slate-800 transition-all duration-200 hover:border-indigo-200 hover:bg-slate-50">
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  ăng k với Google
                </button>
                <p className="mt-5 text-center text-base text-slate-600">
                  ģ c ti khoản?{" "}
                  <button type="button" onClick={() => handleSwitchMode("login")} className="font-semibold text-indigo-600 hover:text-indigo-700">ăng nhập</button>
                </p>
              </>
            ) : (
              <>
                <div className="flex min-h-full flex-col">
                  <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Qun mật khẩu?</h2>
                    <p className="mt-3 text-base leading-8 text-slate-600">
                      Nhập email ti khoản của bạn, TzoShop sẽ gửi lin kết đặt lại mật khẩu nếu email tồn tại trong hệ thống.
                    </p>
                    <form onSubmit={handleForgotSubmit} className="mt-6 space-y-5">
                      <div>
                        <label htmlFor="drawer-forgot-email" className="mb-2 block text-base font-semibold text-slate-700">Email</label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            id="drawer-forgot-email"
                            type="email"
                            required
                            value={forgotEmail}
                            onChange={(e) => { setForgotEmail(e.target.value); setForgotPasswordSent(false); }}
                            placeholder="Nhập email đ đăng k"
                            className="h-14 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-base text-slate-950 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      </div>
                      {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
                      {mode === "forgot-password" && forgotPasswordSent ? (<div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">{successMessage || "Nu email tn ti, chng ti  gi lin kt t li mt khu."}</div>) : null}
                      <CosmicButton type="submit" disabled={isSendingResetEmail} className="w-full" size="lg">
                        {isSendingResetEmail ? "ang gi..." : "Gi hng dn"}
                      </CosmicButton>
                    </form>
                    <p className="mt-4 text-sm leading-6 text-slate-500">Nếu khng thấy email, hy kiểm tra mục spam hoặc thử lại sau vi pht.</p>
                  </div>

                  <div className="mt-auto pt-6">
                    <p className="text-center text-base text-slate-600">
                      ģ nhớ mật khẩu?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage("");
                          setSuccessMessage("");
                          resetForgotState();
                          handleSwitchMode("login");
                        }}
                        className="font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        ăng nhập
                      </button>
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function FeatureSection() {
  const renderPreview = (previewType: string) => {
    if (previewType === "plans") {
      return (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gợi  nhanh</p>
              <p className="mt-1 text-base font-bold text-slate-950">Chn theo nhu cầu</p>
            </div>
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Dễ hiểu</span>
          </div>
          <div className="mt-4 space-y-3">
            {[
              {
                title: "Trải nghiệm thử",
                desc: "Bắt đầu nhanh, ph hợp nhu cầu nh.",
              },
              {
                title: "Dng thưng xuyn",
                desc: "Cn bằng giữa chi ph v hiệu quả sử dụng.",
              },
              {
                title: "Nhu cầu cao",
                desc: "Ph hợp workflow chuyn su v cưng độ lớn hơn.",
              },
            ].map((item, idx) => (
              <div key={item.title} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-xs font-bold text-white">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs leading-6 text-slate-600">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/80 p-3">
              <p className="text-xs font-semibold text-indigo-700">Dễ so snh trước khi chn</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-3">
              <p className="text-xs font-semibold text-emerald-700">C thể bắt đầu từ gi nh trước</p>
            </div>
          </div>
        </>
      );
    }

    if (previewType === "quickstart") {
      return (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Hoạt động
            </span>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">1. Chn gi ph hợp</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">2. Kch hoạt nhanh</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">3. Bắt đầu sử dụng</p>
            </div>
          </div>
        </>
      );
    }

    if (previewType === "usage") {
      return (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Usage dashboard</p>
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">Tuần ny</span>
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Credits đ dng</p>
            <p className="mt-1 text-xl font-bold text-slate-900">67%</p>
            <div className="mt-2 h-2 rounded-full bg-slate-200">
              <div className="h-2 w-2/3 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600" />
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Requests</p>
              <p className="mt-1 font-semibold text-slate-900">12.480</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Credits cn lại</p>
              <p className="mt-1 font-semibold text-slate-900">410.000</p>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ơn hng & hỗ trợ</p>
          <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">Theo di</span>
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-sm text-slate-700">#TZO-2190</p>
            <p className="text-sm font-medium text-emerald-700">ģ thanh ton</p>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-sm text-slate-700">#TZO-2187</p>
            <p className="text-sm font-medium text-amber-700">Ch xử l</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Knh hỗ trợ</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700">Email</span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700">Zalo</span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700">Telegram</span>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <section id="features" className="relative overflow-hidden border-y border-slate-200 bg-gradient-to-b from-white to-slate-50 py-16 sm:py-20 lg:py-24">
      <div aria-hidden className="pointer-events-none absolute -left-20 top-24 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-300 to-violet-300 opacity-20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-16 bottom-20 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-300 to-violet-300 opacity-20 blur-3xl" />
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="inline-flex rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-700">
          Tnh năng nổi bật
        </p>
        <h2 className="mt-4 text-3xl font-extrabold text-slate-950 sm:text-4xl">
          Xy workflow AI{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">r rng v dễ quản l</span>
        </h2>
        <p className="mt-3 max-w-3xl text-slate-600 leading-7">
          Từ chn gi, tạo key, theo di usage đến kiểm sot chi ph - mi bước được sắp xếp gn gng để bạn dng AI dễ hơn mỗi ngy.
        </p>

        <div className="mt-12 space-y-8 sm:space-y-10 lg:space-y-12">
          {workflowFeatures.map((feature, index) => {
            const Icon = feature.icon;
            const isEvenBlock = index % 2 === 1;
            return (
              <article
                key={`workflow-feature-${feature.title}`}
                className="grid items-center gap-6 rounded-2xl border border-slate-200/80 bg-white/80 p-5 tz-animate-fade-up sm:p-6 lg:grid-cols-2 lg:gap-12"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`${isEvenBlock ? "lg:order-2" : ""}`}>
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-slate-950">{feature.title}</h3>
                  <p className="mt-3 text-base leading-7 text-slate-600">{feature.desc}</p>
                  <ul className="mt-4 space-y-2">
                    {feature.bullets.map((item) => (
                      <li key={`${feature.title}-${item}`} className="flex items-start gap-2 text-sm text-slate-700 sm:text-base">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`${isEvenBlock ? "lg:order-1" : ""}`}>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_60px_-24px_rgba(79,70,229,0.35)] transition-all duration-300 hover:-translate-y-1 sm:p-5">
                    {renderPreview(feature.previewType)}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
          Quy trnh sử dụng
        </p>
        <h2 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">Bắt đầu chỉ với 4 bước</h2>

        <div className="relative mt-8 grid grid-cols-1 gap-5 lg:grid-cols-4">
          <div aria-hidden className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-indigo-100 via-violet-200 to-indigo-100 lg:block" />
          {steps.map((step, index) => (
            <article key={`step-${step.title}`} className={`${cardClass} relative p-6`}>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-bold text-white shadow-[0_0_20px_rgba(79,70,229,0.35)]">
                {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{step.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingPreviewSection() {
  return (
    <section id="pricing" className="border-y border-slate-200 bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="inline-flex rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-700">
          Gi credits
        </p>
        <h2 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">Preview cc lựa chn phổ biến</h2>
        <p className="mt-3 text-slate-600">Chn gi ph hợp trước, sau đ xem chi tiết đầy đủ trong trang bảng gi.</p>

        <div className="mt-14 min-h-[520px] pb-24">
          <Swiper
            effect="coverflow"
            centeredSlides={true}
            slidesPerView="auto"
            initialSlide={2}
            loop
            spaceBetween={0}
            grabCursor
            navigation
            pagination={{ clickable: true }}
            modules={[EffectCoverflow, Navigation, Pagination, Autoplay]}
            coverflowEffect={{
              rotate: 0,
              stretch: 36,
              depth: 180,
              modifier: 1.4,
              slideShadows: false,
            }}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            className="pricing-coverflow !overflow-visible pb-20"
          >
            {pricingPreview.map((plan) => (
              <SwiperSlide key={`plan-${plan.name}`} className="!w-[300px] sm:!w-[340px] lg:!w-[380px] xl:!w-[400px]">
                <article className="min-h-[390px] rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_-18px_rgba(79,70,229,0.25)] transition-all duration-300 hover:-translate-y-1 sm:p-7">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                    {plan.badge ? (
                      <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-sm font-semibold text-indigo-700">
                        {plan.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-base font-medium text-violet-600">{plan.subtitle}</p>
                  <p className="mt-3 text-base leading-7 text-slate-600">{plan.desc}</p>
                  <p className="mt-4 text-base text-slate-600">{plan.credits}</p>
                  <p className="mt-1 text-base text-slate-500">{plan.validity}</p>
                  <ul className="mt-4 space-y-2">
                    {plan.bullets.map((item) => (
                      <li key={`${plan.name}-${item}`} className="flex items-start gap-2 text-base text-slate-600">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/pricing"
                    className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 text-base font-semibold text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.30)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_0_rgba(79,70,229,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    Xem gi
                  </Link>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className="mt-12 text-center">
          <Link href="/pricing" className={`${secondaryButtonClass} group`}>
            Xem tất cả gi credits
            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function WhyChooseSection() {
  return (
    <section className="bg-gradient-to-b from-white to-slate-50 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center tz-animate-fade-up">
          <TextFadeInUp as="h2" className="text-3xl font-extrabold text-slate-950 sm:text-4xl lg:text-5xl">Tại sao chn TzoShop?</TextFadeInUp>
          <p className="mt-4 text-slate-600 leading-7">
            Mi thứ được thiết kế để bạn mua credits, bắt đầu nhanh v kiểm sot chi ph AI r rng hơn.
          </p>
        </div>

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-6 tz-animate-fade-up tz-delay-100">
            {reasons.map((item) => (
              <article key={`reason-${item.title}`} className="rounded-2xl border border-slate-200 bg-white/80 p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <Check className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-950 sm:text-lg">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">{item.description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="tz-animate-fade-up tz-delay-200 lg:tz-animate-float">
            <div className="mx-auto max-w-xl rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.55)] transition-all duration-300 hover:-translate-y-1 lg:rotate-2 lg:hover:rotate-0 sm:p-7">
              <div className="rounded-2xl bg-white/12 p-4 backdrop-blur ring-1 ring-white/15">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">TzoShop Overview</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-300/20 px-2 py-1 text-xs font-medium text-emerald-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-300" />
                    Active
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/12 p-3">
                    <p className="text-xs text-white/75">Gi đang dng</p>
                    <p className="mt-1 text-xl font-bold text-white">Plus</p>
                    <p className="mt-1 text-xs text-white/70">Chu kỳ cn 24 ngy</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/12 p-3">
                    <p className="text-xs text-white/75">Credits cn lại</p>
                    <p className="mt-1 text-xl font-bold text-white">1.250.000</p>
                    <p className="mt-1 text-xs text-white/70">67% ngn sch tuần ny</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/12 p-3">
                  <div className="h-2 rounded-full bg-white/20">
                    <div className="h-2 w-2/3 rounded-full bg-gradient-to-r from-white/90 to-emerald-300/85" />
                  </div>
                  <p className="mt-2 text-xs text-white/75">Mức sử dụng ổn định</p>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/12 p-3">
                  <p className="text-xs text-white/75">AI Providers</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {providers.map((provider) => (
                      <span key={`why-provider-${provider.name}`} className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs text-white/90">
                        {provider.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/12 p-3">
                    <p className="text-xs text-white/70">API keys</p>
                    <p className="mt-1 text-sm font-semibold text-white">4 API keys</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/12 p-3">
                    <p className="text-xs text-white/70">ơn hng</p>
                    <p className="mt-1 text-sm font-semibold text-white">12 đơn hng</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/12 p-3">
                    <p className="text-xs text-white/70">Uptime</p>
                    <p className="mt-1 text-sm font-semibold text-white">99.9% ổn định</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsMarqueeSection() {
  const rowOne = [...testimonials, ...testimonials];

  return (
    <section id="testimonials" className="bg-gradient-to-b from-slate-50 to-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <TextFadeInUp as="h2" className="text-3xl font-extrabold text-slate-950 sm:text-4xl lg:text-5xl">Ngưi dng ni g v TzoShop?</TextFadeInUp>
          <p className="mt-4 text-slate-600 leading-7">
            Phản hồi từ ngưi dng đang sử dụng TzoShop cho cng việc hằng ngy, từ c nhn đến team nh.
          </p>
        </div>
      </div>

      <div className="tz-marquee-pause relative mt-12 overflow-hidden px-4 sm:px-6 lg:px-8">
        <div className="tz-marquee-track">
          {rowOne.map((item, index) => (
            <article
              key={`${item.name}-${index}`}
              className="w-[320px] shrink-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_-12px_rgba(79,70,229,0.18)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_-16px_rgba(79,70,229,0.22)] sm:w-[360px] lg:w-[440px]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white">
                    {item.name
                      .split(" ")
                      .slice(-2)
                      .map((part) => part[0])
                      .join("")}
                  </span>
                  <div>
                    <p className="font-bold text-slate-950">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.role}</p>
                  </div>
                </div>
                <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                  {item.badge}
                </span>
              </div>
              <p className="mt-4 text-slate-700 leading-7">{item.quote}</p>
              <div className="mt-4 flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <Star key={`${item.name}-star-${starIndex}`} className={`h-4 w-4 ${starIndex < item.rating ? "fill-current" : "text-slate-300"}`} />
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReadyCTASection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 px-6 py-16 text-white shadow-[0_24px_80px_-28px_rgba(79,70,229,0.55)] sm:px-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-16 top-8 h-48 w-48 rounded-full bg-white/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 bottom-4 h-56 w-56 rounded-full bg-indigo-200/20 blur-3xl"
          />
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Sẵn sng dng AI linh hoạt hơn cng TzoShop?
            </h2>
            <p className="mt-5 text-base leading-8 text-indigo-100 sm:text-lg">
              Chn gi credits ph hợp, bắt đầu nhanh v kiểm sot chi ph r rng trong một khng gian duy nhất.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <CosmicButton href="/plans" className="rounded-full group" variant="primary">
                Xem gi credits
              </CosmicButton>
              <CosmicButton href="/?auth=register" variant="secondary" className="rounded-full">
                Bắt đầu sử dụng
              </CosmicButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PublicFooter() {
  return <SharedPublicFooter />;
}

export default function HomePage() {
  const router = useRouter();
  const { status } = useSession();
  const [isAuthDrawerOpen, setIsAuthDrawerOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const auth = new URLSearchParams(window.location.search).get("auth");
    if (auth !== "login" && auth !== "register" && auth !== "forgot-password") return;

    const oauthInProgress = window.sessionStorage.getItem(OAUTH_IN_PROGRESS_KEY) === "1";
    if (oauthInProgress && auth === "login" && status === "unauthenticated") {
      window.sessionStorage.removeItem(OAUTH_IN_PROGRESS_KEY);
      router.replace("/", { scroll: false });
      return;
    }

    if (status === "authenticated") {
      window.sessionStorage.removeItem(OAUTH_IN_PROGRESS_KEY);
    }

    const frame = window.requestAnimationFrame(() => {
      setAuthMode(auth as AuthMode);
      setIsAuthDrawerOpen(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [router, status]);

  const openAuthDrawer = (mode: AuthMode) => {
    setAuthMode(mode);
    setIsAuthDrawerOpen(true);
    router.replace(`/?auth=${mode}`, { scroll: false });
  };

  const closeAuthDrawer = () => {
    setIsAuthDrawerOpen(false);
    setAuthMode("login");
    router.replace("/", { scroll: false });
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-slate-50 text-slate-900">
      <PublicNavbar onOpenAuth={openAuthDrawer} />
      <main>
        <HeroSection onOpenAuth={openAuthDrawer} />
        <BenefitsMarqueeBar />
        <ProviderSection />
        <FeatureSection />
        <HowItWorksSection />
        <WhyChooseSection />
        <PricingPreviewSection />
        <TestimonialsMarqueeSection />
        <ReadyCTASection />
      </main>
      <PublicFooter />
      <AuthDrawer
        isOpen={isAuthDrawerOpen}
        mode={authMode}
        onClose={closeAuthDrawer}
        onSwitchMode={(nextMode) => {
          setAuthMode(nextMode);
          router.replace(`/?auth=${nextMode}`, { scroll: false });
        }}
      />
    </div>
  );
}













