import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureAvatarBucket } from "@/lib/supabase-admin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

function sanitizeFilename(fileName: string) {
  return fileName
    .normalize("NFKD")
    .replace(/[^\w.-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Bạn cần đăng nhập để cập nhật ảnh đại diện" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      console.error("[AVATAR_UPLOAD_ERROR] Missing NEXT_PUBLIC_SUPABASE_URL");
    }

    if (!serviceRoleKey) {
      console.error("[AVATAR_UPLOAD_ERROR] Missing SUPABASE_SERVICE_ROLE_KEY");
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Thiếu cấu hình Supabase Storage" }, { status: 500 });
    }

    const formData = await request.formData();
    const avatar = formData.get("avatar");

    if (!(avatar instanceof File)) {
      return NextResponse.json({ error: "Không tìm thấy file ảnh đại diện" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(avatar.type)) {
      return NextResponse.json({ error: "Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP" }, { status: 400 });
    }

    if (avatar.size > MAX_AVATAR_SIZE) {
      return NextResponse.json({ error: "Ảnh đại diện tối đa 2MB" }, { status: 400 });
    }

    await ensureAvatarBucket();

    const safeName = sanitizeFilename(avatar.name || "avatar");
    const ext = safeName.includes(".") ? safeName.split(".").pop() : "webp";
    const objectPath = `${session.user.id}/${Date.now()}.${ext}`;

    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/avatars/${encodeURI(objectPath)}`,
      {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": avatar.type || "application/octet-stream",
        },
        body: avatar,
      },
    );

    if (!uploadRes.ok) {
      const uploadErrorBody = await uploadRes.text().catch(() => "");
      const uploadError = {
        status: uploadRes.status,
        message: uploadErrorBody || "Upload failed",
      };

      console.error("[SUPABASE_UPLOAD_ERROR]", uploadError);

      return NextResponse.json(
        {
          error: "Không thể upload ảnh đại diện",
          detail: uploadError.message,
        },
        { status: 500 },
      );
    }

    const avatarUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${objectPath}`;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl },
    });

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    console.error("[AVATAR_UPLOAD_ERROR]", error);

    return NextResponse.json(
      {
        error: "Không thể cập nhật ảnh đại diện",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
