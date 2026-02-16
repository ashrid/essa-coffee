"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn("resend", {
        email,
        callbackUrl: "/admin",
        redirect: false,
      });
      setIsSent(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-forest-600">ShopSeeds</h1>
          <p className="text-gray-500 mt-1">Admin Login</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            This email is not authorized to access the admin panel.
          </div>
        )}

        {isSent ? (
          <div className="text-center p-4 bg-forest-50 border border-forest-100 rounded">
            <p className="text-forest-700 font-medium">Check your email</p>
            <p className="text-forest-600 text-sm mt-1">
              A magic link has been sent to{" "}
              <span className="font-semibold">{email}</span>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-forest-600 hover:bg-forest-700 text-cream-50 font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending..." : "Send Magic Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream-50 flex items-center justify-center">
          <div className="text-forest-600">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
