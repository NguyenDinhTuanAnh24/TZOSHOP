"use client";

import { useEffect, useState } from "react";
import { 
  Key, 
  Search, 
  Filter, 
  User, 
  Clock, 
  CheckCircle2, 
  XCircle,
  MoreVertical,
  Activity,
  ChevronRight,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ui } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

type ApiKeyItem = {
  id: string;
  name: string;
  apiFamily: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
};

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchKeys = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/api-keys");
      const result = await res.json();
      if (result.success) setKeys(result.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const filteredKeys = keys.filter(k => 
    k.name.toLowerCase().includes(search.toLowerCase()) || 
    k.user.name.toLowerCase().includes(search.toLowerCase()) ||
    k.user.email.toLowerCase().includes(search.toLowerCase()) ||
    k.keyPrefix.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Quản lý API Keys" 
        description="Theo dõi và quản lý các khóa API được cấp cho người dùng."
        icon={<Key className="h-8 w-8" />}
        actions={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <AppButton 
              onClick={fetchKeys}
              disabled={isLoading}
              variant="secondary"
              size="sm"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} /> 
              Làm mới
            </AppButton>
            <AppButton 
              variant="secondary"
              size="sm"
            >
              <Filter className="h-4 w-4 mr-2" /> 
              Lọc Key
            </AppButton>
          </div>
        }
      />

      <AppCard className="p-4 bg-[#fbfbf8]/50">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a9690]" />
          <input
            type="text"
            placeholder="Tìm theo tên key, email người dùng hoặc prefix..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(ui.input, "pl-12 bg-white")}
          />
        </div>
      </AppCard>

      <AppCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#fbfbf8] border-b border-[#edf1ee]">
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690]">Tên Key / Chủ sở hữu</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-center">API Family</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690]">Prefix</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-center">Trạng thái</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-right">Hoạt động cuối</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#00d4a4] border-t-transparent" />
                      <p className={cn(ui.label, "animate-pulse")}>Đang tải danh sách key...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredKeys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center text-slate-400 font-bold italic">
                    Không có API keys nào được tìm thấy.
                  </td>
                </tr>
              ) : (
                filteredKeys.map((k) => (
                  <tr key={k.id} className="group hover:bg-[#fbfbf8]/50 transition-colors">
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#8a9690] group-hover:text-[#00d4a4] transition-all shadow-sm ring-1 ring-[#edf1ee]">
                             <Key className="h-5 w-5" />
                          </div>
                          <div>
                             <p className="text-sm font-black text-[#0b0f0d] group-hover:text-[#00d4a4] transition-colors">{k.name}</p>
                             <div className="flex items-center gap-1.5 mt-0.5">
                                <User className="h-3 w-3 text-[#8a9690]" />
                                <p className={cn(ui.pMuted, "text-[11px]")}>{k.user.name} ({k.user.email})</p>
                             </div>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <span className="inline-flex rounded-lg bg-[#fbfbf8] px-2.5 py-1 text-[10px] font-black text-[#8a9690] tracking-widest uppercase border border-[#edf1ee] shadow-sm">
                          {k.apiFamily}
                        </span>
                    </td>
                    <td className="px-8 py-6">
                       <code className="text-[11px] font-mono font-black text-[#00d4a4] bg-[#e7fff7] px-2.5 py-1 rounded-xl border border-[#00d4a4]/20">
                          {k.keyPrefix}...
                       </code>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <div className="flex justify-center">
                          <StatusBadge 
                            status={k.isActive ? "Active" : "Revoked"}
                            variant={k.isActive ? "success" : "danger"}
                          />
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       {k.lastUsedAt ? (
                          <div className="flex items-center justify-end gap-2.5 text-[#0b0f0d]">
                             <Activity className="h-3.5 w-3.5 text-[#00d4a4]" />
                             <span className="text-[12px] font-black">{format(new Date(k.lastUsedAt), "HH:mm", { locale: vi })}</span>
                             <span className={cn(ui.pMuted, "text-[10px]")}>{format(new Date(k.lastUsedAt), "dd/MM", { locale: vi })}</span>
                          </div>
                       ) : (
                          <span className="text-[10px] font-black text-[#8a9690]/40 uppercase tracking-widest italic">Chưa sử dụng</span>
                       )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AppCard>
    </div>
  );
}
