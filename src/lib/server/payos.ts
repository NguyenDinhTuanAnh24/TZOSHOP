import { PayOS } from "@payos/node";

/**
 * Helper để lấy client PayOS.
 * Dùng SDK bản mới hỗ trợ structure: payos.paymentRequests
 */
export function getPayOSClient() {
  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

  if (!clientId || !apiKey || !checksumKey) {
    throw new Error("PAYOS_NOT_CONFIGURED");
  }

  // Khởi tạo với object chứa credentials theo SDK mới
  return new PayOS({
    clientId,
    apiKey,
    checksumKey,
  });
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3004";
}

/**
 * Hàm kiểm tra cấu hình PayOS đã đầy đủ chưa
 */
export function assertPayOSConfigured() {
  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

  if (!clientId || !apiKey || !checksumKey) {
    throw new Error("Cổng thanh toán chưa được cấu hình.");
  }
}

// Singleton để dùng chung (optional, nhưng export ANY để tránh lỗi type)
export const payos = new Proxy({} as PayOS, {
  get: () => {
    throw new Error("Vui lòng dùng getPayOSClient() để khởi tạo instance.");
  }
});
