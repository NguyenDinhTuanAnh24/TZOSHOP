import type { LucideIcon } from "lucide-react";

type AdminStatCardProps = {
  label: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  iconBgClass: string;
  mini?: boolean;
  className?: string;
};

export default function AdminStatCard({
  label,
  value,
  description,
  icon: Icon,
  iconBgClass,
  mini = false,
  className = "",
}: AdminStatCardProps) {
  if (mini) {
    return (
      <article
        className={`min-w-0 border-4 border-black bg-[#FFFDF5] p-4 shadow-[6px_6px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_#000] ${className}`}
      >
        <div className="flex min-h-[110px] items-center gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center border-4 border-black shadow-[3px_3px_0px_0px_#000] ${iconBgClass}`}>
            <Icon className="h-5 w-5 text-black" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.08em] leading-tight text-black/70">{label}</p>
            <p className="mt-3 text-2xl font-black leading-none text-black">{value}</p>
            {description ? <p className="mt-3 break-words text-sm font-bold leading-snug text-black/70">{description}</p> : null}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`min-w-0 border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_#000] ${className}`}
    >
      <div className="flex min-h-[150px] flex-col justify-between">
        <div className={`flex h-12 w-12 items-center justify-center border-4 border-black shadow-[3px_3px_0px_0px_#000] ${iconBgClass}`}>
          <Icon className="h-6 w-6 text-black" />
        </div>
        <div className="mt-5 min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.08em] leading-tight text-black/70">{label}</p>
          <p className="mt-3 break-words text-3xl font-black leading-none text-black md:text-4xl">{value}</p>
          {description ? <p className="mt-3 break-words text-sm font-bold leading-snug text-black/70">{description}</p> : null}
        </div>
      </div>
    </article>
  );
}
