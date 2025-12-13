"use client";

import { useState } from "react";

interface RegisterFormProps {
  onRegister: (user: any) => void;
}

export default function RegisterForm({ onRegister }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<any>({});

  const validateForm = () => {
    const newErrors: any = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email))
      newErrors.email = "Invalid email";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      const newUser = {
        id: Date.now(),
        ...formData,
        balance: 0,
        transactions: [],
      };
      onRegister(newUser);
    } else {
      setErrors(newErrors);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center py-12 px-4">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-16 w-72 h-72 bg-blue-200/40 rounded-full blur-3xl transform rotate-12 animate-pulse-glow" />
        <div className="absolute -right-28 top-32 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl transform -rotate-12" />
      </div>

      <div className="relative w-full max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left: Illustration / marketing */}
          <div className="hidden md:flex flex-col gap-6 pl-6">
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/5 rounded-2xl p-6 shadow-md">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Welcome to TreasuAI
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                A lightweight vault for your transactions — secure, friendly and
                fast.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl p-6 shadow-xl">
              <div className="w-14 h-14 rounded-lg bg-white/20 flex items-center justify-center">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M3 3h18v4H3z" fill="white" opacity=".9" />
                  <path d="M3 11h18v10H3z" fill="white" opacity=".14" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold">Fast Vault</p>
                <p className="text-xs opacity-90">
                  Add transactions and see instant updates with delightful
                  animations.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Form Card */}
          <div className="animate-slide-up">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700 relative overflow-hidden">
              <div className="absolute -top-10 -right-16 w-40 h-40 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full opacity-20 blur-2xl" />
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    TreasuAI
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Create an account to start tracking your balance
                  </p>
                </div>
                <div className="text-right text-xs text-slate-400">v1.0</div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                    Full name
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 12a5 5 0 100-10 5 5 0 000 10zM4 22a8 8 0 0116 0"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                        errors.name
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                          : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:border-indigo-500"
                      }`}
                      placeholder="John Doe"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                    Email address
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3 8l9 6 9-6"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M21 8v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                        errors.email
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                          : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:border-indigo-500"
                      }`}
                      placeholder="you@company.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                    Password
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          x="3"
                          y="11"
                          width="18"
                          height="11"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="1.2"
                        />
                        <path
                          d="M7 11V8a5 5 0 0110 0v3"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                        errors.password
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                          : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:border-indigo-500"
                      }`}
                      placeholder="Strong password"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="opacity-90"
                    >
                      <path
                        d="M5 12h14"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 5v14"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Create account
                  </button>
                </div>
              </form>

              <p className="text-center text-slate-500 dark:text-slate-400 text-sm mt-6">
                Already have an account?{" "}
                <span className="font-semibold text-indigo-600">Sign in</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
