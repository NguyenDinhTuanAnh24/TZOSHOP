"use client";

import { useState } from "react";
import { ChevronDown, AlertCircle, Info } from "lucide-react";

interface ErrorItem {
  code: string;
  title: string;
  description: string;
  solution: string;
}

const ERRORS: ErrorItem[] = [
  {
    code: "401",
    title: "Unauthorized",
    description: "API key sai, thiếu Authorization header hoặc key đã bị thu hồi.",
    solution: "Kiểm tra lại API key và header Authorization: Bearer YOUR_API_KEY."
  },
  {
    code: "403",
    title: "Forbidden",
    description: "Model không nằm trong gói, gói hết hạn hoặc tài khoản không đủ quyền.",
    solution: "Kiểm tra My Plans và chọn model được phép."
  },
  {
    code: "402",
    title: "Payment Required hoặc hết credits",
    description: "Gói credits không còn đủ để xử lý request.",
    solution: "Mua thêm credits hoặc kiểm tra Usage."
  },
  {
    code: "400",
    title: "Bad Request",
    description: "Body sai định dạng, thiếu model/messages hoặc bật stream.",
    solution: "Kiểm tra JSON request và tắt stream."
  },
  {
    code: "429",
    title: "Too Many Requests",
    description: "Gửi quá nhiều request trong thời gian ngắn.",
    solution: "Giảm tần suất request và thử lại."
  },
  {
    code: "500/503",
    title: "Server Error",
    description: "Hệ thống tạm thời lỗi.",
    solution: "Thử lại sau hoặc gửi hỗ trợ nếu lỗi kéo dài."
  }
];

export function DocsErrorAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {ERRORS.map((err, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={err.code} className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 font-black text-xs shrink-0">
                    {err.code}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">{err.title}</h3>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isOpen && (
                <div className="p-6 pt-2 border-t border-slate-50 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mô tả</h4>
                      <p className="text-sm font-bold text-slate-600 leading-relaxed">{err.description}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Cách xử lý</h4>
                      <p className="text-sm font-bold text-slate-900 leading-relaxed">{err.solution}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
