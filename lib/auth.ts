import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { sendMagicLinkEmail } from "./email";

// Token store — uses globalThis to survive module re-instantiation across
// different Next.js route handlers (App Router creates separate module instances).
// In production, replace with Redis/Upstash: https://upstash.com/
const globalForTokens = globalThis as unknown as {
  tokenStore: Map<string, { email: string; expires: number }> | undefined;
};
if (!globalForTokens.tokenStore) {
  globalForTokens.tokenStore = new Map<string, { email: string; expires: number }>();
}
const tokenStore = globalForTokens.tokenStore;

export function generateMagicToken(email: string): string {
  const token = crypto.randomUUID();
  // Token expires in 15 minutes
  tokenStore.set(token, { email, expires: Date.now() + 15 * 60 * 1000 });
  return token;
}

export function verifyMagicToken(token: string): string | null {
  const data = tokenStore.get(token);
  if (!data) return null;
  if (Date.now() > data.expires) {
    tokenStore.delete(token);
    return null;
  }
  // One-time use - delete after verification
  tokenStore.delete(token);
  return data.email;
}

function getAdminEmails(): string[] {
  const extra = process.env.ADMIN_EMAILS ?? "";
  const base = process.env.ADMIN_EMAIL ?? "";
  const all = [base, ...extra.split(",")]
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(all)];
}

export async function sendMagicLink(email: string, callbackUrl: string, origin?: string) {
  // Only allow admin emails to request magic links
  if (!getAdminEmails().includes(email.toLowerCase())) {
    throw new Error("Unauthorized email address");
  }

  const token = generateMagicToken(email);
  // Use the provided origin (from request headers) or fall back to env vars
  // This allows the magic link to work with any host (ngrok, localhost, production)
  const baseUrl = origin || process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const url = new URL("/admin/login", baseUrl);
  url.searchParams.set("token", token);
  if (callbackUrl) {
    url.searchParams.set("callbackUrl", callbackUrl);
  }

  await sendMagicLinkEmail(email, url.toString());
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      id: "magic-link",
      name: "Magic Link",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.token) return null;

        const email = verifyMagicToken(credentials.token as string);
        if (!email) return null;

        // Only allow admin emails to sign in
        if (!getAdminEmails().includes(email.toLowerCase())) {
          return null;
        }

        return {
          id: email,
          email,
          name: "Admin",
        };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  callbacks: {
    async session({ session, token }) {
      // Include user email from JWT token in session
      if (token.email) {
        session.user.email = token.email as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      // Persist user email to the JWT token
      if (user?.email) {
        token.email = user.email;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs and preserves the host (works with ngrok)
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callbacks to the same origin
      if (url.startsWith(baseUrl)) return url;
      // Default: redirect to baseUrl
      return baseUrl;
    },
  },
});
