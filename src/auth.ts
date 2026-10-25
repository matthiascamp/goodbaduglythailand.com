/**
 * Auth.js v5 configuration.
 * Imported as `@/auth` everywhere session/auth is needed server-side.
 * Client components still use next-auth/react (signIn, useSession, SessionProvider).
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { clearLoginFailures, isLoginBlocked, recordLoginFailure } from "@/lib/login-throttle";

export const { auth, handlers, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },

  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },

  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier = typeof credentials?.email === "string"
          ? credentials.email.toLowerCase().trim()
          : null;
        const email = identifier;
        const password = typeof credentials?.password === "string"
          ? credentials.password
          : null;

        if (!email || !password) return null;
        if (await isLoginBlocked(email)) return null;

        const user = await db.user.findUnique({ where: { email } });

        if (!user || !user.passwordHash) {
          await recordLoginFailure(email);
          return null;
        }
        if (user.role === "ADMIN" && email !== process.env.ADMIN_EMAIL?.trim().toLowerCase()) {
          await recordLoginFailure(email);
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          await recordLoginFailure(email);
          return null;
        }
        await clearLoginFailures(email);

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          role: user.role,
          authVersion: user.authVersion,
          membershipStatus: user.membershipStatus,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // On first sign-in, copy custom fields from the authorize return value
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "USER";
        token.authVersion = (user as { authVersion?: number }).authVersion;
        token.membershipStatus =
          (user as { membershipStatus?: string }).membershipStatus ?? "NONE";
      }

      // Refresh membership status and role from DB on every token validation
      // so that webhook-granted memberships take effect without a re-login.
      if (token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, email: true, membershipStatus: true, authVersion: true },
        });
        if (dbUser) {
          if (token.authVersion !== dbUser.authVersion) return null;
          if (dbUser.role === "ADMIN" && dbUser.email !== process.env.ADMIN_EMAIL?.trim().toLowerCase()) return null;
          token.role = dbUser.role;
          token.membershipStatus = dbUser.membershipStatus;
        } else {
          // A deleted account must lose its existing JWT session immediately.
          return null;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.membershipStatus = token.membershipStatus as string;
      }
      return session;
    },
  },
});

// ── Type augmentation ─────────────────────────────────────────────────────────

declare module "next-auth" {
  interface User {
    role: string;
    authVersion: number;
    membershipStatus: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: string;
      membershipStatus: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    authVersion?: number;
    membershipStatus?: string;
  }
}
