"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import OtpInput from "@/components/OtpInput";
import { sendOtp, verifyOtp } from "@/service/auth.service";
import { emailSchema } from "@/helper/schema/auth.schema";
import type { EmailForm } from "@/helper/schema/auth.schema";
import { getApiError, getErrorMessage } from "@/helper/apiError";
import { clearAuth, saveAuth } from "@/helper/authStorage";
import { OTP_LENGTH, RESEND_SECONDS, ROLE_LABELS } from "@/helper/constants";
import type { Role } from "@/types/auth.types";

type Step = "email" | "role" | "otp";

const FEATURES: { icon: string; text: string }[] = [
  { icon: "pi-building", text: "Manage market complexes and stalls in one place" },
  { icon: "pi-file-edit", text: "Digital agreements with rent and late fine rules" },
  { icon: "pi-key", text: "Track key handovers for every stall" },
];

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined);
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const requestOtp = async (emailValue: string, role?: Role) => {
    setError("");
    setLoading(true);
    try {
      const res = await sendOtp({ email: emailValue, role });

      if (res.requireRole && res.roles && res.roles.length > 0) {
        setRoles(res.roles);
        setStep("role");
        return;
      }

      setSelectedRole(res.role ?? role);
      setOtp("");
      setCooldown(RESEND_SECONDS);
      setStep("otp");
    } catch (err) {
      const data = getApiError(err);
      setError(getErrorMessage(err));
      // আগের OTP এখনও চালু থাকলে সরাসরি OTP step-এ নিয়ে যাও
      if (data?.retryAfter) {
        setCooldown(data.retryAfter);
        setStep("otp");
      }
    } finally {
      setLoading(false);
    }
  };

  const onEmailSubmit = async (data: EmailForm) => {
    setEmail(data.email);
    setSelectedRole(undefined);
    await requestOtp(data.email);
  };

  const chooseRole = async (role: Role) => {
    setSelectedRole(role);
    await requestOtp(email, role);
  };

  const submitOtp = async (code: string) => {
    if (code.length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH} digit OTP`);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await verifyOtp({ email, role: selectedRole, otp: code });

      if (res.user.role === "TENANT") {
        clearAuth();
        setError("Tenant portal is not available yet. Please contact your property owner.");
        return;
      }

      saveAuth(res.token);
      router.replace("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const backToEmail = () => {
    setStep("email");
    setOtp("");
    setError("");
    setRoles([]);
    setSelectedRole(undefined);
  };

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      {/* Left brand panel */}
      <section className="relative hidden overflow-hidden bg-slate-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 text-white">
            <i className="pi pi-file-edit text-xl" />
          </div>
          <span className="text-lg font-bold text-white">Agreement Management</span>
        </div>

        <div className="relative space-y-8">
          <h2 className="text-4xl font-bold leading-tight text-white">
            Stalls, tenants and agreements,
            <span className="block text-teal-300">all in one dashboard.</span>
          </h2>
          <ul className="space-y-4">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-slate-300">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-teal-300">
                  <i className={`pi ${f.icon}`} />
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">© 2026 AMP Technology</p>
      </section>

      {/* Right form panel */}
      <section className="flex items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 text-white">
              <i className="pi pi-file-edit" />
            </div>
            <span className="font-bold text-slate-800">Agreement Management</span>
          </div>

          {step === "email" && (
            <>
              <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
              <p className="mt-1 text-sm text-slate-500">
                Enter your registered email. We will send a one-time password.
              </p>
            </>
          )}
          {step === "role" && (
            <>
              <h1 className="text-2xl font-bold text-slate-900">Choose account</h1>
              <p className="mt-1 text-sm text-slate-500">
                <b className="text-slate-700">{email}</b> has more than one account. Sign in as:
              </p>
            </>
          )}
          {step === "otp" && (
            <>
              <h1 className="text-2xl font-bold text-slate-900">Verify OTP</h1>
              <p className="mt-1 text-sm text-slate-500">
                Enter the {OTP_LENGTH} digit code sent to{" "}
                <b className="text-slate-700">{email}</b>
              </p>
            </>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
              <i className="pi pi-exclamation-circle mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: email */}
          {step === "email" && (
            <form onSubmit={handleSubmit(onEmailSubmit)} className="mt-6 space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Email address
                </label>
                <div className="relative">
                  <i className="pi pi-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...register("email")}
                    className={`h-12 w-full rounded-xl border-2 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100 ${
                      errors.email ? "border-red-400" : "border-slate-200"
                    }`}
                  />
                </div>
                {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-sm font-bold text-white shadow-lg shadow-teal-500/30 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <i className="pi pi-spin pi-spinner" /> Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP <i className="pi pi-arrow-right text-xs" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: role */}
          {step === "role" && (
            <div className="mt-6 space-y-3">
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={loading}
                  onClick={() => chooseRole(r)}
                  className="flex h-12 w-full items-center justify-between rounded-xl border-2 border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-teal-400 hover:bg-teal-50 disabled:opacity-60"
                >
                  {ROLE_LABELS[r]}
                  <i className={`pi ${loading && selectedRole === r ? "pi-spin pi-spinner" : "pi-arrow-right"} text-xs text-teal-500`} />
                </button>
              ))}
              <button type="button" onClick={backToEmail} className="w-full pt-2 text-sm font-semibold text-slate-500 hover:text-teal-600">
                Use a different email
              </button>
            </div>
          )}

          {/* STEP 3: otp */}
          {step === "otp" && (
            <div className="mt-6 space-y-5">
              {selectedRole && (
                <span className="inline-block rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                  Signing in as {ROLE_LABELS[selectedRole]}
                </span>
              )}

              <OtpInput
                value={otp}
                onChange={setOtp}
                onComplete={submitOtp}
                disabled={loading}
                hasError={!!error}
              />

              <button
                type="button"
                onClick={() => submitOtp(otp)}
                disabled={loading || otp.length !== OTP_LENGTH}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-sm font-bold text-white shadow-lg shadow-teal-500/30 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <i className="pi pi-spin pi-spinner" /> Verifying...
                  </>
                ) : (
                  "Verify & Sign in"
                )}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={backToEmail} className="font-semibold text-slate-500 hover:text-teal-600">
                  Change email
                </button>
                <button
                  type="button"
                  disabled={cooldown > 0 || loading}
                  onClick={() => requestOtp(email, selectedRole)}
                  className="font-semibold text-teal-600 hover:text-teal-700 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}