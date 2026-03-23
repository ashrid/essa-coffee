import NextAuth from "next-auth";

// Edge-compatible auth config for middleware
// Uses JWT strategy (no database adapter) since Edge Runtime cannot use Prisma directly
// The session token is encoded in the cookie itself
export const { auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  callbacks: {
    async session({ session }) {
      return session;
    },
  },
});
