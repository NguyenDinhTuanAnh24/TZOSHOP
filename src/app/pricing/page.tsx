import { redirect } from "next/navigation";

type PricingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const params = await searchParams;
  const line = Array.isArray(params.line) ? params.line[0] : params.line;

  if (line) {
    redirect(`/plans?line=${encodeURIComponent(line)}`);
  }

  redirect("/plans");
}
