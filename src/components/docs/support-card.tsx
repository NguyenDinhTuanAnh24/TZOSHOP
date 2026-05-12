"use client";

import Link from "next/link";
import { LifeBuoy } from "lucide-react";

export function DocsSupportCard() {
  return (
    <div className="bg-slate-900 p-8 sm:p-10 rounded-[40px] shadow-2xl relative overflow-hidden group">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-emerald-500/20 transition-all duration-500" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -ml-32 -mb-32 group-hover:bg-emerald-500/10 transition-all duration-500" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="h-16 w-16 rounded-[24px] bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/30">
            <LifeBuoy className="h-8 w-8" />
          </div>
          <div className="max-w-md">
            <h3 className="text-2xl font-black text-white tracking-tight mb-2">Bạn cần hỗ trợ kết nối?</h3>
            <p className="text-slate-400 font-bold text-sm leading-relaxed">
              Nếu gặp lỗi khi cấu hình API key hoặc model, hãy gửi yêu cầu hỗ trợ kèm ảnh lỗi hoặc nội dung response.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto shrink-0">
          <Link href="/support" className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-sm font-black text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
            Gửi hỗ trợ
          </Link>
          <Link href="/usage" className="flex items-center gap-2 rounded-2xl bg-slate-800 border border-slate-700 px-8 py-4 text-sm font-black text-white hover:bg-slate-700 transition-all active:scale-95">
            Xem Usage
          </Link>
        </div>
      </div>
    </div>
  );
}
