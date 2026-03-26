import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { sendMagicLinkEmail } from "./email";
import { prisma } from "./db";

export async function generateMagicToken(email: string): Promise<string> {
  const token = crypto.randomUUID().replace(/-/g, ""); // 32-char hex string
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await prisma.verificationToken.create({
    data: {
      identifier: email.toLowerCase(),
      token,
      expires,
    },
  });

  return token;
}

export async function verifyMagicToken(token: string): Promise<string | null> {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record) return null;

  // Delete immediately (one-time use)
  await prisma.verificationToken.delete({
    where: { token },
  });

  // Check expiration after retrieval
  if (record.expires < new Date()) {
    return null;
  }

  return record.identifier;
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

  const token = await generateMagicToken(email);
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

        const email = await verifyMagicToken(credentials.token as string);
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
