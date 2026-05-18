export function formatVnd(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export const OLD_INTERNAL_CREDITS_PER_NEW_CREDIT = 500000;

export function formatCredits(value: bigint | number) {
  const numberValue = typeof value === "bigint" ? Number(value) : value;
  
  if (numberValue === 0) return "0 credits";

  if (Number.isInteger(numberValue)) {
    return `${new Intl.NumberFormat("en-US").format(numberValue)} credits`;
  }

  const formatted = numberValue.toFixed(6).replace(/\.?0+$/, "");
  return `${formatted} credits`;
}

export function formatDuration(days: number | null) {
  if (!days || days <= 0) {
    return "Dùng đến khi hết credits";
  }

  if (days >= 365) {
    return "1 năm";
  }

  if (days >= 180) {
    return "6 tháng";
  }

  if (days >= 90) {
    return "3 tháng";
  }

  if (days >= 60) {
    return "2 tháng";
  }

  if (days >= 30) {
    return "1 tháng";
  }

  return `${days} ngày`;
}

export function translateStatus(status: string) {
  const statusMap: Record<string, string> = {
    SUCCESS: "Thành công",
    FAILED: "Thất bại",
    PAID: "Đã thanh toán",
    PENDING: "Chờ thanh toán",
    CANCELLED: "Đã hủy",
    EXPIRED: "Hết hạn",
    OPEN: "Đang mở",
    IN_PROGRESS: "Đang xử lý",
    RESOLVED: "Đã giải quyết",
    CLOSED: "Đã đóng",
    URGENT: "Khẩn cấp",
    HIGH: "Cao",
    NORMAL: "Bình thường",
    MEDIUM: "Trung bình",
    LOW: "Thấp",
    CREATE: "Tạo mới",
    UPDATE: "Cập nhật",
    DELETE: "Xóa",
    DISABLE: "Vô hiệu hóa",
    ENABLE: "Kích hoạt",
    LOGIN: "Đăng nhập",
    LOGOUT: "Đăng xuất",
    VIEW: "Xem",
  };
  return statusMap[status.toUpperCase()] || status;
}

export function formatTokenCount(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "0";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Number(value));
}
