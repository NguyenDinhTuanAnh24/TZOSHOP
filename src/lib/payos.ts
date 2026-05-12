import { PayOS } from "@payos/node";
import { prisma } from "./prisma";
import { decryptText } from "./crypto";

const payosClientId = process.env.PAYOS_CLIENT_ID;
const payosApiKey = process.env.PAYOS_API_KEY;
const payosChecksumKey = process.env.PAYOS_CHECKSUM_KEY;

if (!payosClientId || !payosApiKey || !payosChecksumKey) {
  console.warn("PayOS credentials are not fully configured in environment variables.");
}

export const payos = new PayOS({
  clientId: payosClientId || "",
  apiKey: payosApiKey || "",
  checksumKey: payosChecksumKey || ""
});

export async function getPayOSInstance() {
  try {
    const setting = await prisma.paymentProviderSetting.findUnique({
      where: { provider: "PAYOS" },
    });

    if (setting && setting.isActive && setting.clientId && setting.encryptedApiKey && setting.encryptedChecksumKey) {
      return new PayOS({
        clientId: setting.clientId,
        apiKey: decryptText(setting.encryptedApiKey),
        checksumKey: decryptText(setting.encryptedChecksumKey),
      });
    }
  } catch (error) {
    console.error("Failed to load PayOS settings from DB:", error);
  }

  return payos;
}

export async function isPayOSActive() {
  try {
    const setting = await prisma.paymentProviderSetting.findUnique({
      where: { provider: "PAYOS" },
    });
    
    if (setting) return setting.isActive;
  } catch {}
  
  return !!(payosClientId && payosApiKey && payosChecksumKey);
}

