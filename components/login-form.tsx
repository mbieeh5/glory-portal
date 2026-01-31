"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import Turnstile from "react-turnstile";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0); // Key buat force re-render
  const router = useRouter();

  const handleCaptchaExpire = () => {
    setCaptchaToken(null);
  }

  const resetCaptcha = () => {
    setCaptchaToken(null);
    setTurnstileKey(prev => prev + 1); // Force re-render Turnstile
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: username,
        password,
        options: {
          captchaToken: captchaToken || undefined,
        }
      });
      if (error) throw error;
      router.push("/fl/dashboard");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
      // Reset captcha setelah error
      resetCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = isLoading || !captchaToken;

  return (
   <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="bg-gray-900/80 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10 transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">FL Portal</h1>
          <p className="text-gray-400 text-sm">Enter the forbidden realm</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Enter your identity"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <Turnstile
            key={turnstileKey}
            sitekey={process.env.NEXT_PUBLIC_SITE_KEY_CAPTCHA!}
            onVerify={(token) => {
              setCaptchaToken(token);
            }}
            onExpire={handleCaptchaExpire}
          />

          <button
            type="submit"
            disabled={isButtonDisabled}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-300 ${
              isLoading
                ? "bg-indigo-700 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-indigo-500/20"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Authenticating...
              </span>
            ) : (
              "Access Realm"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs">
            © 2026 rrafproject-sec V1.0. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}