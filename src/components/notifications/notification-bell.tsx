"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  ShoppingCart,
  CreditCard,
  LifeBuoy,
  UserPlus,
  Info,
  ChevronRight,
  CheckCircle2,
  XCircle,
  KeyRound,
  AlertCircle,
  AlertTriangle,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  href?: string | null;
  isRead: boolean;
  createdAt: string;
  severity?: "WARNING" | "DANGER";
  isAlert?: boolean;
};

async function readJsonSafe(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return res.json();
  }

  const text = await res.text();
  console.error("Notification API returned non-JSON:", text.slice(0, 500));
  throw new Error("API thông báo không trả về JSON");
}

export function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hasMarkedRef = useRef(false);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const result = await readJsonSafe(res);
      if (!res.ok) {
        throw new Error(result?.error || "Không thể tải thông báo");
      }

      let allNotifications: Notification[] = (result.notifications || []).map((n: Notification) => ({
        ...n,
        isAlert: false,
      }));
      const dbUnread: number = result.unreadCount || 0;

      const user = session?.user as { role?: string } | undefined;
      if (user?.role === "ADMIN") {
        try {
          const alertRes = await fetch("/api/admin/alerts");
          const alertData = await readJsonSafe(alertRes);
          if (!alertRes.ok) {
            throw new Error(alertData?.error || "Không thể tải cảnh báo quản trị");
          }
          if (alertData.success && alertData.alerts?.length > 0) {
            const mappedAlerts: Notification[] = alertData.alerts.slice(0, 10).map((a: Notification) => ({
              ...a,
              isRead: false,
              isAlert: true,
            }));
            allNotifications = [...mappedAlerts, ...allNotifications];
          }
        } catch (error) {
          console.error("Failed to fetch admin alerts:", error);
        }
      }

      allNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(allNotifications);
      setUnreadCount(dbUnread);
      setErrorMessage(null);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotifications([]);
      setErrorMessage("Không thể tải thông báo");
    }
  }, [session]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchNotifications();
    }, 0);
    const interval = setInterval(() => {
      void fetchNotifications();
    }, 30000);

    return () => {
      window.clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setIsOpen(false);
      hasMarkedRef.current = false;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      hasMarkedRef.current = false;
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const markAllRead = useCallback(async () => {
    if (isMarkingRead || hasMarkedRef.current || unreadCount <= 0) return;

    setIsMarkingRead(true);
    hasMarkedRef.current = true;

    try {
      const res = await fetch("/api/notifications/mark-read", { method: "POST" });
      const data = await readJsonSafe(res);
      if (!res.ok) {
        throw new Error(data?.error || "Không thể cập nhật trạng thái thông báo");
      }
      if (data.success) {
        setNotifications((prev) => prev.map((n) => (n.isAlert ? n : { ...n, isRead: true })));
        setUnreadCount(0);
      } else {
        hasMarkedRef.current = false;
      }
    } catch (error) {
      console.error("Failed to mark all read:", error);
      hasMarkedRef.current = false;
    } finally {
      setIsMarkingRead(false);
    }
  }, [isMarkingRead, unreadCount]);

  const handleToggle = () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);

    if (willOpen) {
      void fetchNotifications();
      if (unreadCount > 0) {
        window.setTimeout(() => {
          void markAllRead();
        }, 300);
      }
      return;
    }

    hasMarkedRef.current = false;
  };

  const handleClickNotification = (notif: Notification) => {
    if (!notif.href) return;
    setIsOpen(false);
    hasMarkedRef.current = false;
    router.push(notif.href);
  };

  const getIcon = (notif: Notification) => {
    if (notif.severity) {
      if (notif.severity === "DANGER") return <AlertCircle className="h-4 w-4" />;
      return <AlertTriangle className="h-4 w-4" />;
    }

    switch (notif.type) {
      case "PAYMENT_SUCCESS":
        return <CheckCircle2 className="h-4 w-4" />;
      case "ORDER_CREATED":
        return <ShoppingCart className="h-4 w-4" />;
      case "ORDER_CANCELLED":
        return <XCircle className="h-4 w-4" />;
      case "API_KEY_CREATED":
        return <KeyRound className="h-4 w-4" />;
      case "SUPPORT_UPDATED":
      case "SUPPORT_CREATED":
        return <LifeBuoy className="h-4 w-4" />;
      case "SYSTEM":
        return <Info className="h-4 w-4" />;
      case "ORDER_PAID":
        return <CreditCard className="h-4 w-4" />;
      case "USER_REGISTERED":
        return <UserPlus className="h-4 w-4" />;
      case "OUT_OF_CREDITS":
      case "HIGH_FAILED_REQUESTS":
        return <AlertCircle className="h-4 w-4" />;
      case "LOW_CREDITS":
      case "EXPIRING_BUCKET":
      case "EXPIRING_PLAN":
      case "STALE_PENDING_ORDER":
      case "MODEL_FAILED_SPIKE":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getIconBg = (notif: Notification) => {
    if (notif.severity === "DANGER" || notif.type === "OUT_OF_CREDITS") return "bg-rose-50 text-rose-600";
    if (
      notif.severity === "WARNING" ||
      notif.type === "LOW_CREDITS" ||
      notif.type === "EXPIRING_PLAN" ||
      notif.type === "EXPIRING_BUCKET"
    ) {
      return "bg-amber-50 text-amber-600";
    }
    if (notif.type === "API_KEY_CREATED") return "bg-violet-50 text-violet-600";
    if (notif.type === "PAYMENT_SUCCESS" || notif.type === "ORDER_PAID") return "bg-emerald-50 text-emerald-600";
    if (notif.type === "ORDER_CREATED" || notif.type === "ORDER_CANCELLED") return "bg-amber-50 text-amber-600";
    if (notif.type.includes("SUPPORT") || notif.type === "SYSTEM") return "bg-indigo-50 text-indigo-600";
    return "bg-slate-100 text-slate-600";
  };

  const getUnreadDot = (notif: Notification) => {
    if (notif.type === "OUT_OF_CREDITS" || notif.severity === "DANGER") return "bg-rose-400";
    if (notif.type === "LOW_CREDITS" || notif.type === "EXPIRING_PLAN" || notif.severity === "WARNING") return "bg-amber-400";
    return "bg-indigo-400";
  };

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={handleToggle}
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-700 ${
          isOpen ? "border-indigo-200 bg-indigo-50 text-indigo-700" : ""
        }`}
        aria-label="Mở thông báo"
      >
        <Bell className={`h-5 w-5 ${unreadCount > 0 && !isOpen ? "animate-[bell-swing_2s_infinite_ease-in-out]" : ""}`} />
        {unreadCount > 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full border border-white bg-rose-500 px-1 text-[10px] font-bold text-white animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {typeof window !== "undefined" && isOpen
        ? createPortal(
            <div
              ref={panelRef}
              className="fixed left-4 right-4 top-20 z-[120] max-h-[calc(100dvh-6rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.35)] sm:left-auto sm:right-6 sm:w-[360px]"
            >
              <div className="border-b border-slate-200 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                      <Bell className="h-5 w-5" />
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-950">Thông báo</h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      hasMarkedRef.current = false;
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                    aria-label="Đóng thông báo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  {unreadCount > 0 ? `Bạn có ${unreadCount} thông báo mới` : "Bạn đã đọc hết thông báo"}
                </p>
              </div>

              <div className="tz-notification-scroll mt-4 max-h-[340px] space-y-3 overflow-y-auto pr-1">
                {errorMessage ? (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</div>
                ) : notifications.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                    <p className="text-base font-bold text-slate-900">Chưa có thông báo mới</p>
                    <p className="mx-auto mt-2 max-w-[270px] text-sm leading-6 text-slate-600">
                      Các cập nhật về đơn hàng, credits và API key sẽ hiển thị tại đây.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => handleClickNotification(notif)}
                      className={`group w-full rounded-2xl border p-4 text-left transition-all duration-300 ${
                        notif.isRead
                          ? "border-slate-200 bg-slate-50/70 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:shadow-[0_14px_35px_-20px_rgba(79,70,229,0.35)]"
                          : "border-indigo-200 bg-indigo-50/40 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:shadow-[0_14px_35px_-20px_rgba(79,70,229,0.35)]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${getIconBg(notif)}`}>
                          {getIcon(notif)}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-start justify-between gap-2">
                            <p className="truncate text-sm font-bold text-slate-950">{notif.title}</p>
                            {!notif.isRead && <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${getUnreadDot(notif)}`} />}
                          </div>

                          <p className="line-clamp-2 text-sm leading-6 text-slate-600">{notif.message}</p>

                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                            </span>
                            {notif.href && (
                              <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="mt-4 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    hasMarkedRef.current = false;
                  }}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-700 active:scale-[0.98]"
                >
                  Đóng thông báo
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}

      <style jsx global>{`
        @keyframes bell-swing {
          0% { transform: rotate(0); }
          5% { transform: rotate(10deg); }
          10% { transform: rotate(-10deg); }
          15% { transform: rotate(8deg); }
          20% { transform: rotate(-8deg); }
          25% { transform: rotate(0); }
          100% { transform: rotate(0); }
        }
        .tz-notification-scroll {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
        .tz-notification-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .tz-notification-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .tz-notification-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 999px;
        }
      `}</style>
    </>
  );
}
