import { prisma } from "@/lib/prisma";
import { Prisma, ApiFamily } from "@prisma/client";

/**
 * Tính toán số credits tiêu thụ dựa trên số lượng token và đơn giá (rate)
 * Rate mặc định là tính trên 1.000 tokens.
 */
export function calculateCreditsUsed(params: {
  promptTokens: number;
  completionTokens: number;
  inputRate: number;
  outputRate: number;
}) {
  const creditPerBag = Number(process.env.CREDIT_PER_BAG) || 4500;

  const inputBags = (params.promptTokens / 1_000_000) * params.inputRate;
  const outputBags = (params.completionTokens / 1_000_000) * params.outputRate;
  
  const totalBags = inputBags + outputBags;
  const chargedCreditsOld = Math.max(1, Math.ceil(totalBags * creditPerBag));

  // Quy đổi sang credit mới bằng cách chia cho 500,000 (OLD_INTERNAL_CREDITS_PER_NEW_CREDIT)
  return chargedCreditsOld / 500000;
}

type ConsumeCreditsParams = {
  userId: string;
  apiKeyId: string;
  creditBucketId: string;
  creditsUsed: number;
  usageData: {
    model: string;
    apiFamily: ApiFamily;
    endpoint: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    httpStatus?: number;
  };
};

/**
 * Thực hiện trừ credits trong transaction, ghi UsageLog và CreditLedger.
 * Đảm bảo số dư không bị âm.
 */
export async function consumeCredits(params: ConsumeCreditsParams) {
  const { userId, apiKeyId, creditBucketId, creditsUsed, usageData } = params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const dbCreditsUsed = BigInt(Math.ceil(creditsUsed));

      // 1. Kiểm tra và cập nhật số dư (Atomic update với điều kiện gte)
      const updatedBucket = await tx.creditBucket.update({
        where: { 
          id: creditBucketId,
          creditsRemaining: { gte: dbCreditsUsed }
        },
        data: { 
          creditsRemaining: { decrement: dbCreditsUsed } 
        },
      });

      // 2. Ghi Usage Log (SUCCESS)
      const usageLog = await tx.usageLog.create({
        data: {
          userId,
          apiKeyId,
          creditBucketId,
          apiFamily: usageData.apiFamily,
          model: usageData.model,
          endpoint: usageData.endpoint,
          inputTokens: usageData.inputTokens,
          outputTokens: usageData.outputTokens,
          totalTokens: usageData.totalTokens,
          creditsCharged: dbCreditsUsed,
          creditsUsed: Math.ceil(creditsUsed),
          status: "SUCCESS",
          httpStatus: usageData.httpStatus || 200,
        },
      });

      // 3. Ghi Credit Ledger
      await tx.creditLedger.create({
        data: {
          userId,
          creditBucketId,
          apiFamily: usageData.apiFamily,
          type: "USAGE",
          amount: -dbCreditsUsed,
          balanceAfter: updatedBucket.creditsRemaining,
          reason: `API Usage: ${usageData.model}`,
          referenceId: usageLog.id,
        },
      });

      // 4. Cập nhật lastUsedAt cho API Key
      await tx.apiKey.update({
        where: { id: apiKeyId },
        data: { lastUsedAt: new Date() },
      });

      // 5. Kiểm tra cảnh báo số dư thấp (Dưới 10% tổng credits)
      let shouldAlertLowCredits = false;
      if (!updatedBucket.lowCreditsAlertSent && updatedBucket.creditsRemaining > BigInt(0)) {
        const threshold = updatedBucket.creditsTotal / BigInt(10); // 10%
        if (updatedBucket.creditsRemaining <= threshold) {
          shouldAlertLowCredits = true;
          // Đánh dấu đã gửi cảnh báo để không gửi lại
          await tx.creditBucket.update({
            where: { id: updatedBucket.id },
            data: { lowCreditsAlertSent: true },
          });
        }
      }

      return { 
        success: true, 
        remaining: updatedBucket.creditsRemaining,
        shouldAlertLowCredits,
        bucketId: updatedBucket.id
      };
    });

    // 6. Gửi email cảnh báo số dư thấp (ngoài transaction)
    if (result.shouldAlertLowCredits) {
      (async () => {
        try {
          const bucket = await prisma.creditBucket.findUnique({
            where: { id: result.bucketId },
            include: { 
              user: true,
              product: true 
            }
          });
          
          if (bucket?.user?.email) {
            const { sendEmail } = await import("@/lib/server/email");
            const {
              createLowCreditsEmail,
              createLowCreditsEmailText,
            } = await import("@/lib/server/email-templates/low-credits-email");
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://tzoshop.io.vn";

            await sendEmail({
              to: bucket.user.email,
              subject: "Số dư credits thấp - TzoShop",
              html: createLowCreditsEmail({
                name: bucket.user.name,
                productName: bucket.product?.name || "Gói dịch vụ AI",
                creditsRemaining: new Intl.NumberFormat("vi-VN").format(Number(bucket.creditsRemaining)),
                rechargeUrl: `${appUrl}/billing`
              }),
              text: createLowCreditsEmailText({
                name: bucket.user.name,
                productName: bucket.product?.name || "Gói dịch vụ AI",
                creditsRemaining: new Intl.NumberFormat("vi-VN").format(Number(bucket.creditsRemaining)),
                rechargeUrl: `${appUrl}/billing`
              }),
            });
          }
        } catch (err) {
          console.error("[Credits] Failed to send low credits alert:", err);
        }
      })();
    }

    return result;
  } catch (error) {
    // Nếu lỗi do RecordNotFound (không thỏa mãn where gte), nghĩa là không đủ tiền
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new Error("INSUFFICIENT_CREDITS");
    }
    throw error;
  }
}

