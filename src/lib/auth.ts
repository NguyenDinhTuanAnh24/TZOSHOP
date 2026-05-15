import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Vui lòng nhập đầy đủ email và mật khẩu.");
        }

        const email = String(credentials.email).toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.passwordHash) {
          throw new Error("Email hoặc mật khẩu không chính xác.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Email hoặc mật khẩu không chính xác.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl ?? undefined,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;

      const googleEmail = user.email?.toLowerCase().trim();
      const providerAccountId = account.providerAccountId;

      // Chỉ chấp nhận email đã verified
      const emailVerified = (profile as Record<string, unknown>)?.email_verified;
      if (!googleEmail || emailVerified === false) {
        return "/login?error=GoogleEmailNotVerified";
      }

      // Kiểm tra xem có session hiện tại không (đang đăng nhập bằng email/password và muốn link Google)
      const session = await getServerSession(authOptions);

      if (session?.user?.id) {
        // --- FLOW LIÊN KẾT (LINKING) ---
        const currentUserId = session.user.id;
        const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } });

        if (!currentUser) return "/login?error=UserNotFound";

        // Bảo mật: email Google phải trùng email tài khoản hiện tại
        if (googleEmail !== currentUser.email.toLowerCase().trim()) {
          return "/settings?googleLinked=email_mismatch";
        }

        // Tạo hoặc cập nhật OAuthAccount
        await prisma.oAuthAccount.upsert({
          where: { userId_provider: { userId: currentUserId, provider: "google" } },
          update: { providerAccountId, email: googleEmail },
          create: {
            userId: currentUserId,
            provider: "google",
            providerAccountId,
            email: googleEmail,
          },
        });

        return "/settings?googleLinked=success";
      }

      // --- FLOW ĐĂNG NHẬP (LOGIN) ---
      // 1. Tìm OAuthAccount theo provider + providerAccountId
      const existingOAuth = await prisma.oAuthAccount.findUnique({
        where: { provider_providerAccountId: { provider: "google", providerAccountId } },
        include: { user: true },
      });

      if (existingOAuth) {
        // Đã liên kết -> cho phép đăng nhập
        user.id = existingOAuth.userId;
        user.email = existingOAuth.user.email;
        user.name = existingOAuth.user.name ?? undefined;
        return true;
      }

      // 2. Chưa có OAuthAccount -> tìm user theo email
      const existingUser = await prisma.user.findUnique({ where: { email: googleEmail } });

      if (!existingUser) {
        // Tạo user mới hoàn toàn + OAuthAccount
        const newUser = await prisma.user.create({
          data: {
            name: user.name ?? googleEmail.split("@")[0],
            email: googleEmail,
            role: "USER",
            oauthAccounts: {
              create: {
                provider: "google",
                providerAccountId,
                email: googleEmail,
              },
            },
          },
        });
        user.id = newUser.id;
        return true;
      }

      // 3. User đã tồn tại (email/password) nhưng chưa link Google
      return `/login?error=GoogleEmailExists`;
    },

    async jwt({ token, user, account }) {
      // Khi login (lần đầu tạo token)
      if (user && account) {
        if (account.provider === "google") {
          // Chỉ set id nếu có OAuthAccount tương ứng
          const oauth = await prisma.oAuthAccount.findUnique({
            where: {
              provider_providerAccountId: {
                provider: "google",
                providerAccountId: account.providerAccountId,
              },
            },
          });

          if (oauth) {
            token.id = oauth.userId;
            token.googleLoginBlocked = false;
          } else {
            // Không tìm thấy liên kết Google
            token.id = "";
            token.googleLoginBlocked = true;
          }
        } else {
          // Credentials flow
          token.id = user.id;
          token.googleLoginBlocked = false;
        }
      }

      // Luôn lấy data mới nhất từ DB để đảm bảo session đồng bộ
      if (token.id && !token.googleLoginBlocked && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: (token.email as string).toLowerCase() },
          select: { id: true, role: true, name: true, email: true, avatarUrl: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.picture = dbUser.avatarUrl ?? null;
        }
      }
      
      return token;
    },

    async session({ session, token }) {
      // Nếu bị blocked hoặc không có ID hợp lệ -> trả về null/invalid session
      if (!token.id || token.googleLoginBlocked) {
        return {
          ...session,
          user: undefined,
          expires: session.expires,
        };
      }

      if (session.user) {
        session.user.id = String(token.id);
        session.user.role = String(token.role ?? "USER");
        session.user.name = String(token.name ?? "");
        session.user.email = String(token.email ?? "");
        session.user.image = token.picture ? String(token.picture) : null;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
};
