"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  Inbox,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import { formatVnd } from "@/lib/format";
import AdminStatCard from "@/components/admin/admin-stat-card";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";

type OrderItem = {
  id: string;
  orderCode: string;
  amountVnd: number;
  status: string;
  createdAt: string;
  paidAt?: string;
  isCreditsGranted: boolean;
  creditBucketId?: string;
  user: {
    name: string;
    email: string;
  };
  product: {
    name: string;
    apiFamily: string;
  };
  couponCode?: string;
  discountAmount?: number;
};

function statusLabel(status: string) {
  if (status === "PENDING") return "CHỜ THANH TOÁN";
  if (status === "PAID") return "ĐÃ THANH TOÁN";
  if (status === "CANCELLED") return "ĐÃ HỦY";
  if (status === "EXPIRED") return "HẾT HẠN";
  return status;
}

function statusBg(status: string) {
  if (status === "PENDING") return "bg-[#FFD93D]";
  if (status === "PAID") return "bg-[#C7F0D8]";
  if (status === "CANCELLED") return "bg-[#FF6B6B]";
  return "bg-[#E9E1D0]";
}

function familyBg(family: string) {
  if (family === "CODEXAI") return "bg-[#C7F0D8]";
  if (family === "CLAUDE") return "bg-[#FFD93D]";
  if (family === "GEMINI") return "bg-[#A78BFA]";
  if (family === "DEEPSEEK") return "bg-[#FF6B6B]";
  return "bg-[#93C5FD]";
}

function OrdersSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="h-36 border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000]">
        <div className="h-8 w-64 animate-pulse bg-[#E9E1D0]" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 border-4 border-black bg-[#FFFDF5] p-4 shadow-[5px_5px_0px_0px_#000]">
            <div className="h-full w-full animate-pulse bg-[#E9E1D0]" />
          </div>
        ))}
      </div>
      <div className="h-36 border-4 border-black bg-white p-4 shadow-[7px_7px_0px_0px_#000]">
        <div className="h-full w-full animate-pulse bg-[#E9E1D0]" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 border-4 border-black bg-[#FFFDF5] p-4 shadow-[6px_6px_0px_0px_#000]">
            <div className="h-full w-full animate-pulse bg-[#E9E1D0]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [search, setSearch] = useState("");

  const { toast, showToast, clearToast } = useToast();

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== "ALL") params.append("status", filterStatus);
      if (filterEmail) params.append("email", filterEmail);
      if (filterStartDate) params.append("startDate", filterStartDate);
      if (filterEndDate) params.append("endDate", filterEndDate);
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const result = await res.json();
      if (result.success) setOrders(result.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, filterEmail, filterStartDate, filterEndDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchOrders();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const confirmMsg =
      newStatus === "CANCELLED" ? "Bạn có chắc muốn HỦY đơn hàng này?" : `Xác nhận đổi trạng thái đơn hàng sang ${newStatus}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        showToast("Đã cập nhật trạng thái đơn hàng.", "success");
        void fetchOrders();
      }
    } catch {
      showToast("Không thể cập nhật trạng thái.", "error");
    }
  };

  const handleVerifyPayment = async (orderId: string) => {
    try {
      showToast("Đang kiểm tra với PayOS...", "info");
      const res = await fetch(`/api/admin/orders/${orderId}/verify`, {
        method: "POST",
      });
      const result = await res.json();
      if (result.success) {
        showToast(result.message, result.status === "PAID" ? "success" : "info");
        if (result.status === "PAID") void fetchOrders();
      } else {
        showToast(result.message, "error");
      }
    } catch {
      showToast("Lỗi khi gọi API kiểm tra.", "error");
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!search) return true;
    return o.orderCode.toLowerCase().includes(search.toLowerCase()) || o.user.email.toLowerCase().includes(search.toLowerCase());
  });

  const totalRevenue = useMemo(() => orders.reduce((acc, o) => (o.status === "PAID" ? acc + o.amountVnd : acc), 0), [orders]);
  const totalOrders = orders.length;
  const paidOrders = orders.filter((o) => o.status === "PAID").length;
  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;
  const cancelledExpired = orders.filter((o) => o.status === "CANCELLED" || o.status === "EXPIRED").length;

  if (isLoading && orders.length === 0) return <OrdersSkeleton />;

  return (
    <div className="space-y-8 overflow-x-hidden">
      <section className="relative overflow-visible border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="pointer-events-none absolute -right-3 -top-3 h-10 w-10 border-4 border-black bg-[#A78BFA]" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[5px_5px_0px_0px_#000]">
                <ShoppingCart className="h-7 w-7 text-black" />
              </div>
              <span className="inline-flex border-2 border-black bg-[#C7F0D8] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-black">ORDERS</span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black md:text-4xl">ĐƠN HÀNG</h1>
            <p className="text-sm font-bold text-black/70 md:text-base">Theo dõi đơn mua credits, thanh toán và trạng thái kích hoạt gói.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="border-4 border-black bg-[#C7F0D8] px-4 py-3 shadow-[4px_4px_0px_0px_#000]">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Tổng doanh thu</p>
              <p className="text-2xl font-black text-black">{formatVnd(totalRevenue)}</p>
            </div>
            <button
              onClick={fetchOrders}
              className="inline-flex h-11 w-11 items-center justify-center border-4 border-black bg-white text-black shadow-[4px_4px_0px_0px_#000] hover:bg-[#FFD93D]"
              title="Làm mới"
              aria-label="Làm mới"
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Tổng đơn hàng", value: totalOrders, sub: "Tất cả đơn mua credits", bg: "bg-[#DBEAFE]", icon: ReceiptText },
          { label: "Đã thanh toán", value: paidOrders, sub: "Đơn hàng đã thanh toán", bg: "bg-[#C7F0D8]", icon: CheckCircle2 },
          { label: "Chờ thanh toán", value: pendingOrders, sub: "Đơn hàng đang chờ thanh toán", bg: "bg-[#FFD93D]", icon: CreditCard },
          { label: "Đã hủy / Hết hạn", value: cancelledExpired, sub: "Đơn hàng đã hủy hoặc hết hạn", bg: "bg-[#FF6B6B]", icon: XCircle },
        ].map((card) => (
          <AdminStatCard
            key={card.label}
            label={card.label}
            value={card.value.toLocaleString("vi-VN")}
            description={card.sub}
            icon={card.icon}
            iconBgClass={card.bg}
            mini
          />
        ))}
      </section>

      <section className="space-y-4 border-4 border-black bg-white p-4 shadow-[7px_7px_0px_0px_#000] md:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Tìm mã đơn</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/45" />
              <input
                type="text"
                placeholder="Nhập mã đơn..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 w-full border-4 border-black bg-white pl-10 pr-4 text-sm font-bold text-black placeholder:text-black/45 shadow-[3px_3px_0px_0px_#000] outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Email khách hàng</label>
            <input
              type="text"
              placeholder="Nhập email khách..."
              value={filterEmail}
              onChange={(e) => setFilterEmail(e.target.value)}
              className="h-12 w-full border-4 border-black bg-white px-4 text-sm font-bold text-black placeholder:text-black/45 shadow-[3px_3px_0px_0px_#000] outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Trạng thái</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-12 w-full border-4 border-black bg-white px-4 text-sm font-bold text-black shadow-[3px_3px_0px_0px_#000] outline-none">
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ thanh toán</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="CANCELLED">Đã hủy</option>
              <option value="EXPIRED">Hết hạn</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Từ ngày</label>
            <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="h-12 w-full border-4 border-black bg-white px-4 text-sm font-bold text-black shadow-[3px_3px_0px_0px_#000] outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Đến ngày</label>
            <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="h-12 w-full border-4 border-black bg-white px-4 text-sm font-bold text-black shadow-[3px_3px_0px_0px_#000] outline-none" />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-black/60">Đang hiển thị <span className="text-black">{filteredOrders.length}</span> đơn hàng</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSearch("");
                setFilterEmail("");
                setFilterStatus("ALL");
                setFilterStartDate("");
                setFilterEndDate("");
              }}
              className="h-11 border-4 border-black bg-white px-4 text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]"
            >
              Xóa lọc
            </button>
            <button onClick={fetchOrders} className="h-11 border-4 border-black bg-[#C7F0D8] px-4 text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]">
              Làm mới
            </button>
          </div>
        </div>
      </section>

      {filteredOrders.length === 0 ? (
        <section className="min-h-[300px] border-4 border-black bg-[#FFFDF5] p-8 shadow-[8px_8px_0px_0px_#000]">
          <div className="flex h-full min-h-[230px] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000]">
              <Inbox className="h-7 w-7 text-black" />
            </div>
            <p className="text-xl font-black text-black">{orders.length === 0 ? "CHƯA CÓ ĐƠN HÀNG NÀO" : "KHÔNG TÌM THẤY ĐƠN HÀNG"}</p>
            <p className="mt-2 text-sm font-bold text-black/60">
              {orders.length === 0
                ? "Các đơn mua credits sẽ xuất hiện tại đây sau khi khách hàng chọn gói."
                : "Thử đổi bộ lọc, khoảng ngày hoặc làm mới danh sách."}
            </p>
            {orders.length > 0 && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterEmail("");
                  setFilterStatus("ALL");
                  setFilterStartDate("");
                  setFilterEndDate("");
                }}
                className="mt-5 h-11 border-4 border-black bg-[#FFD93D] px-5 text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]"
              >
                XÓA BỘ LỌC
              </button>
            )}
          </div>
        </section>
      ) : (
        <>
          <section className="hidden overflow-hidden border-4 border-black bg-white shadow-[8px_8px_0px_0px_#000] lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] border-collapse text-left">
                <thead>
                  <tr className="border-b-4 border-black bg-[#FFFDF5]">
                    <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Mã đơn</th>
                    <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Khách hàng</th>
                    <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Gói mua</th>
                    <th className="px-4 py-4 text-center text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Số tiền</th>
                    <th className="px-4 py-4 text-center text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Trạng thái</th>
                    <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Thời gian</th>
                    <th className="px-4 py-4 text-right text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b-2 border-black/10 align-middle transition-colors hover:bg-[#FFF8D6]">
                      <td className="px-4 py-4">
                        <div className="inline-flex items-center gap-2 border-2 border-black bg-[#FFFDF5] px-2 py-1 shadow-[2px_2px_0px_0px_#000]">
                          <FileText className="h-3.5 w-3.5 text-black" />
                          <span className="text-xs font-black text-black">#{order.orderCode}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center border-4 border-black bg-[#C7F0D8] text-sm font-black uppercase text-black shadow-[3px_3px_0px_0px_#000]">
                            {(order.user.name?.[0] || order.user.email?.[0] || "K").toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-[210px] truncate text-sm font-black text-black">{order.user.name || "Khách vãng lai"}</p>
                            <p className="max-w-[260px] truncate text-sm font-bold text-black/60">{order.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-black">{order.product?.name || "Không xác định"}</p>
                        <span className={`mt-1 inline-flex border-2 border-black px-2 py-0.5 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] ${familyBg(order.product?.apiFamily)}`}>
                          {order.product?.apiFamily || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <p className="text-lg font-black text-black">{formatVnd(order.amountVnd || 0)}</p>
                        {order.couponCode ? <p className="mt-1 text-xs font-black text-black/60">-{formatVnd(order.discountAmount || 0)}</p> : null}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex h-8 items-center border-2 border-black px-3 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] ${statusBg(order.status)}`}>
                          {statusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-black">{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}</p>
                        {order.paidAt ? <p className="text-xs font-bold text-black/60">Thanh toán: {format(new Date(order.paidAt), "dd/MM/yyyy HH:mm")}</p> : null}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {order.status === "PENDING" && (
                            <>
                              <button onClick={() => void handleUpdateStatus(order.id, "CANCELLED")} className="h-10 border-2 border-black bg-white px-3 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] hover:bg-[#FFD93D]">
                                Hủy
                              </button>
                              <button onClick={() => void handleVerifyPayment(order.id)} className="h-10 border-2 border-black bg-white px-3 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] hover:bg-[#FFD93D]">
                                Check
                              </button>
                              <button onClick={() => void handleUpdateStatus(order.id, "PAID")} className="h-10 border-2 border-black bg-[#C7F0D8] px-3 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]">
                                Duyệt
                              </button>
                            </>
                          )}
                          <Link href={`/admin/orders/${order.id}`} className="inline-flex h-10 w-10 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000] hover:bg-[#FFD93D]">
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 lg:hidden">
            {filteredOrders.map((order) => (
              <article key={order.id} className="space-y-4 border-4 border-black bg-[#FFFDF5] p-4 shadow-[6px_6px_0px_0px_#000]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex border-2 border-black bg-white px-2 py-1 text-xs font-black text-black shadow-[2px_2px_0px_0px_#000]">#{order.orderCode}</div>
                    <p className="mt-2 text-sm font-black text-black">{order.user.name || "Khách vãng lai"}</p>
                    <p className="break-all text-sm font-bold text-black/60">{order.user.email}</p>
                  </div>
                  <span className={`inline-flex h-8 items-center border-2 border-black px-3 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] ${statusBg(order.status)}`}>
                    {statusLabel(order.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border-2 border-black bg-white p-2">
                    <p className="text-xs font-black uppercase text-black/60">Gói mua</p>
                    <p className="text-sm font-bold text-black">{order.product?.name || "Không xác định"}</p>
                  </div>
                  <div className="border-2 border-black bg-white p-2">
                    <p className="text-xs font-black uppercase text-black/60">Số tiền</p>
                    <p className="text-sm font-black text-black">{formatVnd(order.amountVnd || 0)}</p>
                  </div>
                  <div className="col-span-2 border-2 border-black bg-white p-2">
                    <p className="text-xs font-black uppercase text-black/60">Thời gian</p>
                    <p className="text-sm font-bold text-black">{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {order.status === "PENDING" && (
                    <>
                      <button onClick={() => void handleUpdateStatus(order.id, "CANCELLED")} className="h-10 border-2 border-black bg-white px-3 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]">
                        Hủy
                      </button>
                      <button onClick={() => void handleVerifyPayment(order.id)} className="h-10 border-2 border-black bg-white px-3 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]">
                        Check PayOS
                      </button>
                      <button onClick={() => void handleUpdateStatus(order.id, "PAID")} className="h-10 border-2 border-black bg-[#C7F0D8] px-3 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]">
                        Duyệt
                      </button>
                    </>
                  )}
                  <Link href={`/admin/orders/${order.id}`} className="inline-flex h-10 items-center border-2 border-black bg-[#FFD93D] px-3 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]">
                    Chi tiết
                  </Link>
                </div>
              </article>
            ))}
          </section>
        </>
      )}

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />}
    </div>
  );
}
