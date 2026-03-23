"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const token = searchParams.get("token");
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const signInAttempted = useRef(false);

  // Handle magic link token from URL (user clicked email link)
  useEffect(() => {
    if (token && !signInAttempted.current) {
      signInAttempted.current = true;
      setIsLoading(true);
      signIn("magic-link", {
        token,
        callbackUrl,
        redirect: true,
      }).catch((err) => {
        console.error("Auth error:", err);
        setAuthError("Invalid or expired link. Please request a new one.");
        setIsLoading(false);
      });
    }
  }, [token, callbackUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, callbackUrl }),
      });

      if (response.ok) {
        setIsSent(true);
      } else {
        const data = await response.json();
        setAuthError(data.error || "Failed to send magic link");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-forest-600">Essa Cafe</h1>
          <p className="text-gray-500 mt-1">Admin Login</p>
        </div>

        {(error || authError) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {authError || "Sign-in failed. The link may have expired — please request a new one."}
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
