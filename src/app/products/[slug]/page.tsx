import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { LandingPublicFooter, LandingPublicNavbar } from "@/components/layout/landing-public-chrome";
import { CosmicButton } from "@/components/ui/cosmic-button";
import { creditPageBySlug, creditProductPages } from "@/lib/credit-product-pages";

type ProductPageParams = { slug: string };

const packageTypes = [
  { title: "Trial 7 ngày", desc: "Dùng thử nhanh trước khi mua dài hạn." },
  { title: "1 tháng", desc: "Phù hợp cho nhu cầu sử dụng thường xuyên." },
  { title: "3 tháng", desc: "Tiết kiệm hơn cho người dùng ổn định." },
  { title: "1 năm", desc: "Tối ưu chi phí cho nhu cầu lâu dài." },
];

function getLineFromSlug(slug: string) {
  if (slug.includes("all-models") || slug.includes("all_models")) return "all_models";
  if (slug.includes("codex")) return "codex";
  if (slug.includes("claude")) return "claude";
  if (slug.includes("gemini")) return "gemini";
  if (slug.includes("deepseek")) return "deepseek";
  return "all_models";
}

export function generateStaticParams() {
  return creditProductPages.map((item) => ({ slug: item.slug }));
}

export default async function ProductPage({ params }: { params: Promise<ProductPageParams> }) {
  const { slug } = await params;
  const product = creditPageBySlug[slug];
  if (!product) notFound();

  const line = getLineFromSlug(slug);
  const pricingHref = `/pricing?line=${line}`;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <LandingPublicNavbar />

      <section className="border-b border-slate-200 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
            {product.badge}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">{product.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{product.description}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <CosmicButton href={pricingHref}>Xem bảng giá</CosmicButton>
            <CosmicButton href="/docs/api" variant="secondary">Tài liệu API</CosmicButton>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-slate-950 sm:text-4xl">Ai phù hợp dùng dòng này?</h2>
          <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">{product.audienceDescription}</p>
          <ul className="mt-7 grid gap-3 md:grid-cols-2">
            {product.bestFor.map((item) => (
              <li key={`${slug}-${item}`} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                <span className="text-sm text-slate-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-slate-950 sm:text-4xl">Các loại gói</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-4">
            {packageTypes.map((item) => (
              <article key={item.title} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <h3 className="text-lg font-bold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-slate-950 sm:text-4xl">Model tiêu biểu</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {product.useCases.map((item) => (
              <article key={`${slug}-model-${item}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">{item}</p>
              </article>
            ))}
          </div>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href={pricingHref} className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              Xem bảng giá
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
            <Link href="/docs/api" className="inline-flex items-center text-sm font-semibold text-slate-700 hover:text-indigo-700">
              Xem tài liệu API
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <LandingPublicFooter />
    </main>
  );
}
