"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  AlertTriangle
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
  isAlert?: boolean; // true = realtime admin alert, not in DB
};

export function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasMarkedRef = useRef(false); // Track if we already marked read for this open
  const router = useRouter();

  // Fetch notifications (GET only — no mark read)
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const result = await res.json();
      let allNotifications: Notification[] = (result.notifications || []).map((n: Notification) => ({
        ...n,
        isAlert: false,
      }));
      const dbUnread: number = result.unreadCount || 0;

      // Admin: fetch realtime alerts (separate from DB notifications)
      const user = session?.user as { role?: string } | undefined;
      if (user?.role === "ADMIN") {
        try {
          const alertRes = await fetch("/api/admin/alerts");
          const alertData = await alertRes.json();
          if (alertData.success && alertData.alerts?.length > 0) {
            const mappedAlerts: Notification[] = alertData.alerts.slice(0, 10).map((a: Notification) => ({
              ...a,
              isRead: false,
              isAlert: true, // Mark as realtime alert — not in DB, no mark-read
            }));
            allNotifications = [...mappedAlerts, ...allNotifications];
          }
        } catch (e) {
          console.error("Failed to fetch admin alerts:", e);
        }
      }

      // Sort by createdAt descending
      allNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setNotifications(allNotifications);
      // Only DB notifications count toward unreadCount badge
      setUnreadCount(dbUnread);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [session]);

  // Initial fetch + polling
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

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        hasMarkedRef.current = false; // Reset for next open
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark all DB notifications as read when dropdown opens
  const markAllRead = useCallback(async () => {
    if (isMarkingRead || hasMarkedRef.current) return;
    if (unreadCount <= 0) return;

    setIsMarkingRead(true);
    hasMarkedRef.current = true;

    try {
      const res = await fetch("/api/notifications/mark-read", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        // Update local state: mark all DB notifications as read
        setNotifications(prev =>
          prev.map(n => n.isAlert ? n : { ...n, isRead: true })
        );
        setUnreadCount(0);
      } else {
        hasMarkedRef.current = false; // Allow retry
      }
    } catch (error) {
      console.error("Failed to mark all read:", error);
      hasMarkedRef.current = false; // Allow retry
    } finally {
      setIsMarkingRead(false);
    }
  }, [isMarkingRead, unreadCount]);

  // Toggle dropdown
  const handleToggle = () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);

    if (willOpen) {
      // Refresh data when opening
      fetchNotifications();
      // Mark read after a short delay to let data load
      if (unreadCount > 0) {
        setTimeout(() => markAllRead(), 300);
      }
    } else {
      hasMarkedRef.current = false;
    }
  };

  // Click on a notification
  const handleClickNotification = (notif: Notification) => {
    if (notif.href) {
      setIsOpen(false);
      hasMarkedRef.current = false;
      router.push(notif.href);
    }
  };

  const getIcon = (notif: Notification) => {
    // Admin alerts use severity-based icons
    if (notif.severity) {
      if (notif.severity === "DANGER") return <AlertCircle className="h-4 w-4 text-rose-500" />;
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }

    switch (notif.type) {
      case "PAYMENT_SUCCESS": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "ORDER_CREATED": return <ShoppingCart className="h-4 w-4 text-blue-500" />;
      case "ORDER_CANCELLED": return <XCircle className="h-4 w-4 text-rose-500" />;
      case "API_KEY_CREATED": return <KeyRound className="h-4 w-4 text-indigo-500" />;
      case "SUPPORT_UPDATED": return <LifeBuoy className="h-4 w-4 text-amber-500" />;
      case "SYSTEM": return <Info className="h-4 w-4 text-slate-500" />;
      case "ORDER_PAID": return <CreditCard className="h-4 w-4 text-emerald-500" />;
      case "SUPPORT_CREATED": return <LifeBuoy className="h-4 w-4 text-amber-500" />;
      case "USER_REGISTERED": return <UserPlus className="h-4 w-4 text-indigo-500" />;
      case "OUT_OF_CREDITS":
      case "HIGH_FAILED_REQUESTS":
        return <AlertCircle className="h-4 w-4 text-rose-500" />;
      case "LOW_CREDITS":
      case "EXPIRING_BUCKET":
      case "EXPIRING_PLAN":
      case "STALE_PENDING_ORDER":
      case "MODEL_FAILED_SPIKE":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default: return <Bell className="h-4 w-4 text-slate-400" />;
    }
  };

  const getBgColor = (notif: Notification) => {
    if (notif.isRead) return "bg-white";
    
    // Check type for unread background colors
    if (notif.severity === "DANGER" || notif.type === "OUT_OF_CREDITS") {
      return "bg-rose-50/50";
    }
    
    if (notif.severity === "WARNING" || notif.type === "LOW_CREDITS" || notif.type === "EXPIRING_PLAN" || notif.type === "EXPIRING_BUCKET") {
      return "bg-amber-50/50";
    }

    return "bg-emerald-50/30"; // Default unread color
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button 
        onClick={handleToggle}
        className={`relative flex h-11 w-11 items-center justify-center rounded-2xl border transition-all active:scale-95 ${
          isOpen ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200" : "bg-white border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 shadow-sm"
        }`}
      >
        <Bell className={`h-5 w-5 ${unreadCount > 0 && !isOpen ? 'animate-[bell-swing_2s_infinite_ease-in-out]' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white ring-4 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-4 w-[360px] origin-top-right rounded-[32px] border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-[1000] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 p-6">
            <div>
               <h3 className="text-lg font-black text-slate-900">Thông báo</h3>
               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Bạn đã đọc hết thông báo"}
               </p>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                 <div className="h-16 w-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4">
                    <Bell className="h-8 w-8 text-slate-200" />
                 </div>
                 <p className="text-sm font-black text-slate-900 mb-2">Chưa có thông báo mới</p>
                 <p className="text-xs font-bold text-slate-400 italic">
                    Các cập nhật về đơn hàng, API key và hỗ trợ sẽ hiển thị tại đây.
                 </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleClickNotification(notif)}
                    className={`w-full flex gap-4 p-5 text-left transition-all hover:bg-slate-50/80 ${getBgColor(notif)}`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-slate-100 shadow-sm ${
                      !notif.isRead ? "bg-white" : "bg-slate-50"
                    }`}>
                      {getIcon(notif)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={`text-sm tracking-tight truncate ${notif.isRead ? "font-bold text-slate-700" : "font-black text-slate-900"}`}>
                          {notif.title}
                        </h4>
                        {!notif.isRead && (
                           <div className={`h-2 w-2 rounded-full mt-1.5 shadow-sm shrink-0 ${
                             notif.type === "OUT_OF_CREDITS" || notif.severity === "DANGER" ? "bg-rose-500 shadow-rose-200" :
                             notif.type === "LOW_CREDITS" || notif.type === "EXPIRING_PLAN" || notif.severity === "WARNING" ? "bg-amber-500 shadow-amber-200" :
                             "bg-emerald-500 shadow-emerald-200"
                           }`} />
                        )}
                      </div>
                      <p className={`text-xs leading-relaxed mb-2 line-clamp-2 ${notif.isRead ? "text-slate-400 font-medium" : "text-slate-500 font-bold"}`}>
                        {notif.message}
                      </p>
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                         </span>
                         {notif.href && (
                            <ChevronRight className="h-3 w-3 text-slate-300" />
                         )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 p-4 bg-slate-50/50 text-center">
             <button 
                onClick={() => { setIsOpen(false); hasMarkedRef.current = false; }}
                className="py-2 px-6 rounded-2xl text-[10px] font-black text-slate-400 hover:text-slate-900 transition-all uppercase tracking-widest"
             >
                Đóng cửa sổ
             </button>
          </div>
        </div>
      )}

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
      `}</style>
    </div>
  );
}
