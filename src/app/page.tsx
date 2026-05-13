"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, MessageCircle, Send, Sparkles, Star } from "lucide-react";
import { ScrollToTopOnLoad } from "@/components/scroll-to-top-on-load";
import Image from "next/image";

const modelStickers = [
  { name: "CodexAI", tone: "bg-[#FFD93D]" },
  { name: "Claude", tone: "bg-[#FF6B6B]" },
  { name: "Gemini", tone: "bg-[#C4B5FD]" },
  { name: "DeepSeek", tone: "bg-white" },
];

const features = [
  {
    title: "QUẢN LÝ CREDITS",
    desc: "Theo dõi credits còn lại, credits đã dùng và thời hạn từng gói trong một nơi.",
  },
  {
    title: "API KEY THEO GÓI",
    desc: "Tạo key riêng cho từng gói, giới hạn theo dòng AI và thu hồi khi cần.",
  },
  {
    title: "USAGE LOGS",
    desc: "Xem model đã gọi, số tokens, credits tiêu thụ, endpoint và trạng thái request.",
  },
  {
    title: "TÀI LIỆU TÍCH HỢP",
    desc: "Có sẵn hướng dẫn cấu hình cho Continue, Cline/Roo Code và API clients.",
  },
  {
    title: "MÃ GIẢM GIÁ & ĐƠN HÀNG",
    desc: "Áp coupon, theo dõi đơn hàng, trạng thái thanh toán và lịch sử mua gói.",
  },
  {
    title: "HỖ TRỢ NHIỀU DÒNG AI",
    desc: "Sử dụng CodexAI, Claude, Gemini và DeepSeek theo từng nhu cầu khác nhau.",
  },
  {
    title: "DASHBOARD QUẢN LÝ",
    desc: "Tổng quan gói đang hoạt động, API keys, usage gần đây và đơn hàng mới nhất.",
  },
  {
    title: "BẢO TRÌ DỄ DÀNG",
    desc: "Hỗ trợ chế độ bảo trì để tạm dừng truy cập web khi cần cập nhật hệ thống.",
  },
];

const families = [
  {
    title: "CodexAI",
    icon: "/logos/codexai.svg",
    desc: "Dành cho coding, review code, refactor và tác vụ lập trình trong IDE.",
  },
  {
    title: "Claude",
    icon: "/logos/claude.svg",
    desc: "Phù hợp phân tích, viết nội dung, hỗ trợ coding và xử lý yêu cầu dài.",
  },
  {
    title: "Gemini",
    icon: "/logos/gemini.svg",
    desc: "Linh hoạt cho tác vụ nhanh, đa nhiệm, tích hợp API và xử lý nội dung.",
  },
  {
    title: "DeepSeek",
    icon: "/logos/deepseek.svg",
    desc: "Tối ưu chi phí cho coding, sinh nội dung kỹ thuật và tác vụ thường ngày.",
  },
];

const workflow = [
  {
    step: "01",
    title: "CHỌN GÓI CREDITS",
    desc: "Chọn dòng AI và dung lượng credits phù hợp với nhu cầu sử dụng của bạn.",
  },
  {
    step: "02",
    title: "TẠO API KEY",
    desc: "Tạo key riêng cho gói đã mua, sao chép và quản lý trạng thái dễ dàng.",
  },
  {
    step: "03",
    title: "KẾT NỐI CÔNG CỤ",
    desc: "Dán API base và API key vào extension, IDE hoặc API client để bắt đầu sử dụng.",
  },
];

const faqs = [
  {
    q: "TÔI CÓ PHẢI CẤU HÌNH PHỨC TẠP KHÔNG?",
    a: "Không. Bạn chỉ cần tạo API key, sao chép thông tin cần dùng và dán vào công cụ đang sử dụng. TzoShop hướng tới việc giúp bạn bắt đầu nhanh, không phải mất thời gian mò từng bước cấu hình.",
  },
  {
    q: "LÀM SAO BIẾT MÌNH CÒN BAO NHIÊU CREDITS?",
    a: "Bạn có thể xem credits còn lại, thời hạn gói và lịch sử sử dụng ngay trong tài khoản. Nhờ vậy bạn biết khi nào cần mua thêm, tránh tình trạng đang làm việc thì bị gián đoạn bất ngờ.",
  },
  {
    q: "TÔI SỢ MUA NHẦM GÓI THÌ SAO?",
    a: "Các gói được chia theo từng nhu cầu sử dụng để bạn dễ chọn hơn. Nếu bạn chưa chắc nên bắt đầu từ gói nhỏ trước, theo dõi mức dùng thực tế rồi nâng lên khi cần.",
  },
  {
    q: "API KEY BỊ LỘ THÌ CÓ XỬ LÝ ĐƯỢC KHÔNG?",
    a: "Có. Bạn có thể thu hồi key không còn an toàn và tạo key mới trong tài khoản. Điều này giúp bạn chủ động kiểm soát quyền sử dụng mà không phải đổi toàn bộ thiết lập công việc.",
  },
  {
    q: "TÔI DÙNG NHIỀU CÔNG CỤ KHÁC NHAU CÓ BỊ RỐI KHÔNG?",
    a: "Không. Bạn có thể tạo key theo từng mục đích sử dụng, ví dụ một key cho IDE, một key cho công cụ thử nghiệm hoặc một key cho dự án riêng. Cách này giúp việc quản lý rõ ràng hơn.",
  },
  {
    q: "THANH TOÁN XONG BAO LÂU THÌ DÙNG ĐƯỢC?",
    a: "Sau khi đơn hàng được xác nhận thành công, gói credits sẽ được cập nhật vào tài khoản để bạn tiếp tục sử dụng. Bạn cũng có thể theo dõi trạng thái đơn hàng trong phần thanh toán.",
  },
];

const cardBg = ["bg-white", "bg-[#FFD93D]", "bg-[#C4B5FD]", "bg-[#FF6B6B]"];
const testimonials = [
  {
    quote:
      "TzoShop giúp mình gom nhiều dòng AI vào cùng một chỗ nên đỡ phải cấu hình rời rạc. Mua credits và tạo API key rất nhanh.",
    name: "Nguyễn Minh Anh",
    role: "Lập trình viên Full-stack",
  },
  {
    quote:
      "Mình dùng TzoShop để cấu hình cho extension trong IDE. Phần usage và theo dõi credits khá rõ ràng, dễ kiểm soát.",
    name: "Trần Quốc Bảo",
    role: "Backend Developer",
  },
  {
    quote:
      "Điểm mình thích nhất là có thể chọn từng dòng AI theo nhu cầu thay vì phải dùng một gói quá chung chung.",
    name: "Lê Hoàng Nam",
    role: "Software Engineer",
  },
  {
    quote:
      "Tài liệu dễ hiểu, cấu hình nhanh, không bị quá rối. Phù hợp với người cần dùng AI API hằng ngày cho công việc.",
    name: "Phạm Gia Hân",
    role: "Frontend Developer",
  },
  {
    quote:
      "Giao diện quản lý API key và lịch sử sử dụng khá trực quan. Mình dễ theo dõi số credits đã dùng hơn.",
    name: "Võ Thành Đạt",
    role: "DevOps Engineer",
  },
  {
    quote:
      "Mình cần dùng nhiều model cho nhiều tác vụ khác nhau và TzoShop giúp việc đó gọn hơn rất nhiều.",
    name: "Nguyễn Khánh Linh",
    role: "AI Product Builder",
  },
  {
    quote:
      "Thanh toán, tạo key và dùng API khá liền mạch. Trải nghiệm tổng thể phù hợp cho developer.",
    name: "Đặng Minh Tuấn",
    role: "Mobile Developer",
  },
  {
    quote:
      "TzoShop phù hợp cho người muốn dùng AI trong IDE và công cụ lập trình mà không cần cấu hình quá phức tạp.",
    name: "Bùi Thu Trang",
    role: "Technical Writer",
  },
];
const footerGroups = [
  {
    title: "SẢN PHẨM",
    links: [
      { label: "TRANG CHỦ", href: "/" },
      { label: "BẢNG GIÁ", href: "/pricing" },
      { label: "HƯỚNG DẪN", href: "/docs" },
      { label: "TÀI LIỆU API", href: "/docs/api" },
    ],
  },
  {
    title: "TÀI KHOẢN",
    links: [
      { label: "API KEYS", href: "/api-keys" },
      { label: "GÓI CỦA TÔI", href: "/my-plans" },
      { label: "THANH TOÁN", href: "/billing" },
      { label: "MÃ GIẢM GIÁ", href: "/coupons" },
    ],
  },
  {
    title: "HỖ TRỢ",
    links: [
      { label: "LIÊN HỆ", href: "/support" },
      { label: "ZALO", href: "https://zalo.me/0866555468", external: true },
      { label: "TELEGRAM", href: "https://t.me/tzora24", external: true },
      { label: "EMAIL", href: "mailto:tzoshop.io.vn@gmail.com", external: true },
    ],
  },
  {
    title: "PHÁP LÝ",
    links: [
      { label: "ĐIỀU KHOẢN SỬ DỤNG", href: "/policies" },
      { label: "CHÍNH SÁCH BẢO MẬT", href: "/policies" },
    ],
  },
];
const topMarqueeItems = [
  "TZOSHOP",
  "MUA CREDITS NHANH",
  "TẠO API KEY TRONG VÀI PHÚT",
  "DÙNG ĐƯỢC VỚI EXTENSION VÀ IDE",
  "THEO DÕI CREDITS RÕ RÀNG",
  "QUẢN LÝ KEY AN TOÀN",
  "DỄ CẤU HÌNH",
  "PHÙ HỢP CHO DEVELOPER",
  "MỘT NƠI CHO NHIỀU NHU CẦU AI",
];
const navMotion =
  "inline-flex items-center border-2 border-transparent px-2 py-1 transition-all duration-100 ease-linear hover:-translate-y-0.5 hover:border-black hover:bg-[#FFD93D] hover:shadow-[4px_4px_0px_0px_#000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black";
const buttonMotion =
  "transition-all duration-100 ease-linear hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black";
const cardMotion =
  "transition-all duration-200 ease-out hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_#000]";

export default function HomePage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const router = useRouter();

  return (
    <div className="min-h-screen overflow-x-clip bg-[#FFFDF5] text-black">
      <ScrollToTopOnLoad />
      <div className="w-full overflow-hidden border-y-4 border-black bg-[#FF6B6B]">
        <div className="animate-marquee-left flex w-max whitespace-nowrap py-3 [animation-duration:28s]">
          {[0, 1].map((loop) => (
            <div key={loop} className="flex items-center gap-4 px-4 text-sm font-black uppercase tracking-widest sm:text-base">
              {topMarqueeItems.map((item) => (
                <div key={`${loop}-${item}`} className="flex items-center gap-4">
                  <span>{item}</span>
                  <Star className="h-4 w-4 fill-black stroke-[3px] text-black" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b-4 border-black bg-[#FFFDF5]">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className={`inline-flex -rotate-2 transform-gpu [backface-visibility:hidden] items-center gap-2 border-4 border-black bg-[#FFD93D] px-3 py-2 font-black uppercase shadow-[6px_6px_0px_0px_#000] ${buttonMotion}`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden sm:h-7 sm:w-7">
                <Image
                  src="/logo.png"
                  alt="TzoShop logo"
                  width={28}
                  height={28}
                  className="pointer-events-none block h-6 w-6 select-none object-contain transform-none sm:h-7 sm:w-7"
                  priority
                />
              </span>
              <span className="truncate text-sm sm:text-base">TzoShop</span>
            </Link>
          </div>

          <nav className="hidden items-center gap-5 text-sm font-bold uppercase md:flex">
            <Link href="/" className={navMotion}>Trang chủ</Link>
            <Link href="/pricing" className={navMotion}>Bảng giá</Link>
            <Link href="/docs" className={navMotion}>Hướng dẫn</Link>
            <Link href="/docs/api" className={navMotion}>Tài liệu API</Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className={`inline-flex items-center border-4 border-black bg-white px-3 py-2 text-xs font-black uppercase shadow-[4px_4px_0px_0px_#000] sm:text-sm ${buttonMotion}`}
            >
              Đăng nhập
            </Link>
            <Link
              href="/pricing"
              className={`inline-flex items-center border-4 border-black bg-[#FF6B6B] px-3 py-2 text-xs font-black uppercase shadow-[6px_6px_0px_0px_#000] sm:text-sm ${buttonMotion}`}
            >
              Bắt đầu
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b-4 border-black bg-[#FFFDF5]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          />
          <div className="absolute -left-16 top-16 h-40 w-40 rotate-12 border-4 border-black bg-[#FFD93D]" />
          <div className="absolute -right-16 top-28 h-56 w-56 -rotate-12 border-4 border-black bg-[#C4B5FD]" />
          <Star className="animate-spin-slow absolute left-8 top-24 hidden h-10 w-10 text-black md:block" />
          <Sparkles className="animate-bounce absolute right-20 top-20 hidden h-9 w-9 text-black md:block" />
          <div className="animate-pulse absolute bottom-10 left-10 hidden h-8 w-8 rotate-12 border-4 border-black bg-[#FF6B6B] md:block" />
          <div className="animate-bounce absolute bottom-14 right-10 hidden h-8 w-8 -rotate-12 border-4 border-black bg-[#34D399] md:block" />

          <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
            <div className="min-w-0">
              <p className="animate-brutal-wiggle inline-flex -rotate-1 cursor-pointer border-4 border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#000] transition-all duration-200 ease-out hover:-translate-y-1 hover:rotate-2 hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:text-sm">
                API CREDITS PLATFORM
              </p>
              <h1 className="mt-6 text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-7xl">
                <span className="inline-block -rotate-2 overflow-visible border-4 border-black bg-[#FFD93D] px-3 py-2 leading-[1.08] transition-transform duration-200 ease-out hover:-rotate-3 motion-reduce:transform-none">
                  MỘT API KEY
                </span>
                <br />
                <span className="mt-3 inline-block rotate-1 border-4 border-black bg-[#FF6B6B] px-2 py-1 text-white transition-transform duration-200 ease-out hover:rotate-3 motion-reduce:transform-none">
                  CHO NHIỀU DÒNG AI
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-base font-medium leading-7 sm:text-lg">
                Mua credits, tạo API key và sử dụng CodexAI, Claude, Gemini, DeepSeek trong extension,
                IDE hoặc ứng dụng của bạn qua endpoint tương thích OpenAI.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/pricing"
                  className={`group inline-flex w-full items-center justify-center border-4 border-black bg-[#FF6B6B] px-5 py-3 text-sm font-black uppercase shadow-[6px_6px_0px_0px_#000] sm:w-auto ${buttonMotion}`}
                >
                  BẮT ĐẦU SỬ DỤNG
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-100 ease-linear group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/pricing"
                  className={`group inline-flex w-full items-center justify-center border-4 border-black bg-[#FFD93D] px-5 py-3 text-sm font-black uppercase shadow-[6px_6px_0px_0px_#000] sm:w-auto ${buttonMotion}`}
                >
                  XEM BẢNG GIÁ
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-100 ease-linear group-hover:translate-x-1" />
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {modelStickers.map((model, idx) => (
                  <span
                    key={model.name}
                    className={`${model.tone} ${idx % 2 === 0 ? "rotate-1" : "-rotate-2"} ${idx === 0 ? "animate-pulse" : ""} inline-flex items-center border-4 border-black px-4 py-2 text-sm font-black shadow-[4px_4px_0px_0px_#000] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] hover:rotate-3 motion-reduce:transform-none`}
                  >
                    {model.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="min-w-0">
              <div className="relative w-full max-w-full border-4 border-black bg-white shadow-[12px_12px_0px_0px_#000] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[14px_14px_0px_0px_#000]">
                <span className="animate-pulse absolute -top-5 right-3 rotate-2 border-4 border-black bg-[#34D399] px-2 py-1 text-xs font-black uppercase transition-transform duration-200 ease-out hover:rotate-3 motion-reduce:transform-none">
                  Live API
                </span>

                <div className="border-b-4 border-black bg-[#C4B5FD] px-4 py-3 text-sm font-black uppercase">
                  API Preview
                </div>

                <div className="border-b-4 border-black px-4 py-3 text-sm font-bold">
                  <p className="truncate">https://tzoshop.io.vn/api/v1/chat/completions</p>
                </div>

                <div className="flex flex-wrap gap-2 border-b-4 border-black px-4 py-3">
                  {[
                    "tz_live_xxxxx",
                    "claude-opus-4.7",
                    "credits: 1M",
                    "active",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="min-w-0 max-w-full truncate border-4 border-black bg-[#FFFDF5] px-2 py-1 text-xs font-black transition-transform duration-200 ease-out hover:-rotate-3 motion-reduce:transform-none"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <pre className="overflow-x-auto bg-black p-4 text-xs leading-6 text-[#FFD93D] sm:text-sm">
                  {`POST /v1/chat/completions
Authorization: Bearer tz_live_xxxxx

{
  "model": "claude/claude-opus-4.7",
  "messages": [
    {
      "role": "user",
      "content": "Review đoạn code này giúp tôi."
    }
  ]
}`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="animate-brutal-wiggle mb-5 inline-flex -rotate-1 cursor-pointer border-4 border-black bg-white px-3 py-1 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#000] transition-all duration-200 ease-out hover:-translate-y-1 hover:-rotate-2 hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
            CAPABILITIES
          </p>
          <h2 className="text-4xl font-black uppercase tracking-tight leading-[1.08] sm:text-5xl sm:leading-[1.08] lg:text-6xl lg:leading-[1.05]">
            TÍNH NĂNG NỔI BẬT
          </h2>
          <p className="mt-4 max-w-4xl font-medium leading-7">
            Những công cụ cần thiết để mua credits, tạo API key, theo dõi usage và quản lý quá trình sử dụng
            AI API.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature, idx) => (
              <article
                key={feature.title}
                className={`${cardBg[idx % cardBg.length]} ${cardMotion} ${idx % 2 === 0 ? "hover:rotate-1" : "hover:-rotate-1"} min-w-0 border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]`}
              >
                <h3 className="text-lg font-black uppercase">{feature.title}</h3>
                <p className="mt-3 font-medium leading-7">{feature.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y-4 border-black bg-[#FFF8CC]">
          <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-black uppercase tracking-tight sm:text-5xl">
              CHỌN DÒNG AI THEO NHU CẦU
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              {families.map((family, idx) => (
                <article
                  key={family.title}
                  className={`${idx % 2 === 0 ? "bg-white" : "bg-[#C4B5FD]"} ${cardMotion} ${idx % 2 === 0 ? "hover:rotate-1" : "hover:-rotate-1"} min-w-0 border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]`}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-white p-1 shadow-[3px_3px_0px_0px_#000]">
                      <Image
                        src={family.icon}
                        alt={family.title}
                        width={32}
                        height={32}
                        className="h-full w-full object-contain"
                      />
                    </span>
                    <h3 className="min-w-0 text-2xl font-black uppercase">{family.title}</h3>
                  </div>
                  <p className="mt-3 font-medium leading-7">{family.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="animate-brutal-wiggle mb-5 inline-flex -rotate-1 cursor-pointer border-4 border-black bg-[#C4B5FD] px-3 py-1 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#000] transition-all duration-200 ease-out hover:-translate-y-1 hover:rotate-2 hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
            PROCESS
          </p>
          <h2 className="text-3xl font-black uppercase tracking-tight sm:text-5xl">CÁCH TZOSHOP HOẠT ĐỘNG</h2>
          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {workflow.map((item, idx) => (
              <article
                key={item.step}
                className={`${idx % 2 === 0 ? "bg-white" : "bg-[#FFD93D]"} ${cardMotion} min-w-0 border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]`}
              >
                <p className="animate-bounce inline-block border-4 border-black bg-[#FF6B6B] px-3 py-1 text-3xl font-black text-white transition-transform duration-200 ease-out hover:rotate-3 motion-reduce:transform-none">
                  {item.step}
                </p>
                <h3 className="mt-4 text-xl font-black uppercase">{item.title}</h3>
                <p className="mt-3 font-medium leading-7">{item.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y-4 border-black">
          <div className="grid grid-cols-1 lg:grid-cols-[0.48fr_0.52fr]">
            <div
              className="border-b-4 border-black bg-[#FF7B7B] p-6 sm:p-8 lg:border-b-0 lg:border-r-4 lg:p-10"
              style={{
                backgroundImage: "radial-gradient(#00000026 1.2px, transparent 1.2px)",
                backgroundSize: "14px 14px",
              }}
            >
              <h2 className="text-5xl font-black uppercase tracking-tight leading-[1.08] text-white [text-shadow:3px_3px_0px_#000] sm:text-6xl sm:leading-[1.06] lg:text-7xl lg:leading-[1.05]">
                <span className="block">TẠI SAO</span>
                <span className="block">DEVELOPER</span>
                <span className="block">CHỌN TZOSHOP?</span>
              </h2>

              <div className="mt-7 -rotate-1 border-4 border-black bg-white p-5 shadow-[8px_8px_0px_0px_#000] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#000]">
                <p className="font-bold leading-7">
                  Mọi thứ bạn cần để mua credits, tạo API key và sử dụng AI API trong một nền tảng.
                </p>
              </div>

              <Link
                href="/pricing"
                className={`group mt-7 inline-flex w-full items-center justify-center border-4 border-black bg-[#FFD93D] px-5 py-3 text-sm font-black uppercase shadow-[8px_8px_0px_0px_#000] sm:w-auto ${buttonMotion}`}
              >
                KHÁM PHÁ LỢI ÍCH
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-100 ease-linear group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="bg-[#F7F4EC] p-6 sm:p-8 lg:p-10">
              <div className="space-y-8">
                {[
                  {
                    title: "CREDITS RÕ RÀNG",
                    desc: "Mua credits theo từng dòng AI, dễ kiểm soát số dư, thời hạn và nhu cầu sử dụng.",
                  },
                  {
                    title: "MỘT API KEY DỄ CẤU HÌNH",
                    desc: "Tạo key nhanh để dùng trong extension, IDE hoặc các API client tương thích OpenAI-style.",
                  },
                  {
                    title: "THEO DÕI USAGE DỄ HIỂU",
                    desc: "Xem model đã dùng, số tokens, credits tiêu thụ và trạng thái request ngay trong dashboard.",
                  },
                  {
                    title: "QUẢN LÝ GÓI ĐƠN GIẢN",
                    desc: "Theo dõi gói đang hoạt động, lịch sử mua, đơn hàng và thời hạn sử dụng tại một nơi.",
                  },
                ].map((item) => (
                  <article
                    key={item.title}
                    className="flex gap-4 transition-all duration-200 ease-out hover:translate-x-1"
                  >
                    <span className="mt-1 inline-block h-5 w-5 shrink-0 border-2 border-black bg-black" />
                    <div>
                      <h3 className="text-2xl font-black uppercase leading-tight">{item.title}</h3>
                      <p className="mt-2 font-medium leading-7 text-black/85">{item.desc}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-y-4 border-black bg-[#F6D63B]">
          <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-20 lg:px-8 lg:pb-14 lg:pt-24">
            <div className="relative inline-block">
              <div className="absolute left-3 top-3 h-full w-full border-4 border-black bg-white" />
              <div className="-rotate-[1.4deg] relative border-4 border-black bg-black px-4 py-3 shadow-[10px_10px_0px_0px_#000] sm:px-7">
                <h2 className="text-2xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-6xl">
                  ĐƯỢC NHIỀU DEVELOPER TIN DÙNG
                </h2>
              </div>
            </div>
          </div>

          <div className="w-full overflow-hidden pb-16 sm:pb-20 lg:pb-24">
            <div className="animate-marquee-left flex w-max gap-6 px-4 motion-reduce:animate-none motion-reduce:w-full motion-reduce:flex-wrap sm:px-6 lg:px-8">
              {[...testimonials, ...testimonials].map((item, idx) => (
                <article
                  key={`${item.name}-${idx}`}
                  tabIndex={0}
                  className={`${idx % 2 === 0 ? "rotate-[0.2deg]" : "-rotate-[0.3deg]"} min-h-[290px] w-[290px] shrink-0 cursor-pointer rounded-none border-4 border-black shadow-[10px_10px_0px_0px_#000] transition-all duration-200 ease-out hover:-translate-y-2 hover:shadow-[14px_14px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:w-[330px] lg:w-[360px]`}
                >
                  <div className="relative h-[72%] border-b-4 border-black bg-[#F3F0ED] p-5">
                    <p className="text-lg font-black tracking-wide text-[#FF6B6B]">★★★★★</p>
                    <span className="absolute right-4 top-4 bg-black px-2 py-1 text-[10px] font-black uppercase text-white">
                      ĐÃ XÁC THỰC
                    </span>
                    <p className="mt-4 text-sm font-bold leading-6">“{item.quote}”</p>
                  </div>

                  <div className="flex h-[28%] items-center gap-3 bg-[#D9D2F3] p-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center border-4 border-black bg-[#FFD93D] text-sm font-black uppercase">
                      {item.name
                        .split(" ")
                        .filter(Boolean)
                        .slice(-2)
                        .map((part) => part[0])
                        .join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black uppercase">{item.name}</p>
                      <p className="truncate text-xs font-bold">{item.role}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t-4 border-b-4 border-black bg-[#C4B5FD]">
          <div className="mx-auto w-full max-w-4xl px-4 pb-8 pt-14 sm:px-6 sm:pb-10 sm:pt-14 lg:pb-12 lg:pt-16">
            <h2 className="text-3xl font-black uppercase tracking-tight sm:text-5xl">CÂU HỎI THƯỜNG GẶP</h2>
            <div className="mt-8 space-y-4">
              {faqs.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <article
                    key={item.q}
                    className="rounded-none border-4 border-black bg-[#FFFDF5] shadow-[6px_6px_0px_0px_#000] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                      className="flex w-full cursor-pointer items-center justify-between gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:p-5"
                    >
                      <span className="text-sm font-black uppercase leading-6 text-black sm:text-base">{item.q}</span>
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center border-4 border-black bg-[#FFD93D] text-xl font-black leading-none transition-all duration-200 ease-out hover:rotate-3 active:translate-x-[1px] active:translate-y-[1px]">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>

                    <div
                      className={`grid transition-all duration-200 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                      <div className="overflow-hidden">
                        <p className="border-t-4 border-black px-4 py-4 font-medium leading-7 sm:px-5">{item.a}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-black">
          <div className="relative px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8 lg:pb-20 lg:pt-12">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
              <span className="cta-pulse-ring h-[340px] w-[340px] sm:h-[460px] sm:w-[460px]" />
              <span className="cta-pulse-ring cta-pulse-ring-delay h-[340px] w-[340px] sm:h-[460px] sm:w-[460px]" />
            </div>

            <div className="relative mx-auto w-full max-w-[760px]">
              <div className="absolute left-3 top-3 h-full w-full border-4 border-black bg-white" />
              <article className="relative -rotate-1 border-4 border-black bg-[#FF6B6B] p-5 shadow-[10px_10px_0px_0px_#000] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_#000] sm:p-8">
                <h2 className="text-4xl font-black uppercase leading-[1.05] tracking-tight text-white [text-shadow:3px_3px_0px_#000] sm:text-6xl lg:text-7xl">
                  SẴN SÀNG BẮT ĐẦU?
                </h2>
                <p className="mt-5 inline-flex border-4 border-black bg-white px-4 py-2 text-sm font-bold text-black sm:text-base">
                  Tạo API key, nạp credits và dùng AI dễ hơn mỗi ngày.
                </p>

                <form
                  className="mt-6 flex flex-col gap-3 sm:flex-row"
                  onSubmit={(e) => {
                    e.preventDefault();
                    router.push("/register");
                  }}
                >
                  <input
                    type="email"
                    placeholder="Nhập email của bạn"
                    className="w-full border-4 border-black bg-[#FFFDF5] px-4 py-3 font-bold text-black placeholder:text-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD93D] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  />
                  <button
                    type="submit"
                    className="inline-flex shrink-0 items-center justify-center border-4 border-black bg-black px-6 py-3 text-sm font-black uppercase text-white shadow-[6px_6px_0px_0px_#fff] transition-all duration-100 ease-linear hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  >
                    BẮT ĐẦU NGAY
                  </button>
                </form>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t-4 border-black bg-[#FFD93D] text-black">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.7fr_0.6fr] lg:items-start lg:gap-10 lg:px-8 lg:py-10">
          <div className="min-w-0">
            <p className="inline-flex -rotate-2 transform-gpu [backface-visibility:hidden] items-center gap-2 border-4 border-black bg-black px-4 py-2 text-xl font-black uppercase text-white shadow-[6px_6px_0px_0px_#000] transition-all duration-200 ease-out hover:translate-y-[-4px] hover:rotate-0">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden sm:h-7 sm:w-7">
                <Image
                  src="/logo.png"
                  alt="TzoShop logo"
                  width={28}
                  height={28}
                  className="pointer-events-none block h-6 w-6 select-none object-contain transform-none sm:h-7 sm:w-7"
                />
              </span>
              <span>TzoShop</span>
            </p>
            <p className="mt-5 text-xs font-black uppercase leading-6">
              © 2026 TzoShop
              <br />
              All rights reserved.
            </p>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-3 inline-flex border-4 border-black bg-black px-2 py-1 text-xs font-black uppercase text-white">
                  {group.title}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.links.map((item) => (
                    <Link
                      key={`${group.title}-${item.label}`}
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      className="inline-flex border-4 border-black bg-[#FFFDF5] px-3 py-2 text-xs font-black uppercase shadow-[4px_4px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-1 hover:bg-white hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 lg:justify-end">
            <Link
              href="https://zalo.me/0866555468"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Zalo"
              className="inline-flex h-12 w-12 items-center justify-center border-4 border-black bg-[#FFFDF5] shadow-[4px_4px_0px_0px_#000] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              <MessageCircle className="h-5 w-5" />
            </Link>
            <Link
              href="https://t.me/tzora24"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
              className="inline-flex h-12 w-12 items-center justify-center border-4 border-black bg-[#FFFDF5] shadow-[4px_4px_0px_0px_#000] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              <Send className="h-5 w-5" />
            </Link>
            <Link
              href="mailto:tzoshop.io.vn@gmail.com"
              aria-label="Email"
              className="inline-flex h-12 w-12 items-center justify-center border-4 border-black bg-[#FFFDF5] shadow-[4px_4px_0px_0px_#000] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              <Mail className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}



