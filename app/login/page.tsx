"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import "primeicons/primeicons.css";
import OtpInput from "@/components/OtpInput";
import { sendOtp, verifyOtp } from "@/service/auth.service";
import { emailSchema } from "@/helper/schema/auth.schema";
import type { EmailForm } from "@/helper/schema/auth.schema";
import { getApiError, getErrorMessage } from "@/helper/apiError";
import { saveAuth } from "@/helper/authStorage";
import { getHomePath } from "@/helper/navigation";
import { OTP_LENGTH, RESEND_SECONDS, ROLE_LABELS } from "@/helper/constants";
import type { Role } from "@/types/auth.types";

type Step = "email" | "role" | "otp";

const STEP_INDEX: Record<Step, number> = { email: 0, role: 1, otp: 2 };

const cx = (...c: Array<string | false | undefined>) => c.filter(Boolean).join(" ");

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
      // Ager OTP ekhono chalu thakle sorasori OTP step-e nao
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

      saveAuth(res.token);
      router.replace(getHomePath(res.user.role));
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
    <main className="lg">
      <div className="lg-card">
        {/* <div className="lg-logo">
          <span className="lg-logo__mark">AMP</span>
          <div>
            <p className="lg-logo__title">Agreement</p>
            <p className="lg-logo__sub">Management</p>
          </div>
        </div> */}

        {/* Step indicator */}
        <div className="lg-steps" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className={cx(i <= STEP_INDEX[step] && "is-on")} />
          ))}
        </div>

        {step === "email" && (
          <>
            <h1 className="lg-title">Welcome back in Our Application</h1>
            <p className="lg-desc">
              Enter your registered email. We will send a one-time password.
            </p>
          </>
        )}
        {step === "role" && (
          <>
            <h1 className="lg-title">Choose account</h1>
            <p className="lg-desc">
              <b>{email}</b> has more than one account. Sign in as:
            </p>
          </>
        )}
        {step === "otp" && (
          <>
            <h1 className="lg-title">Verify OTP</h1>
            <p className="lg-desc">
              Enter the {OTP_LENGTH} digit code sent to <b>{email}</b>
            </p>
          </>
        )}

        {error && (
          <div className="lg-alert" role="alert">
            <i className="pi pi-exclamation-circle" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: email */}
        {step === "email" && (
          <form onSubmit={handleSubmit(onEmailSubmit)} className="lg-form" noValidate>
            <div className="lg-field">
              <label htmlFor="email" className="lg-label">
                Email address
              </label>
              <div className="lg-inputwrap">
                <i className="pi pi-envelope" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  className={cx("lg-input", !!errors.email && "is-invalid")}
                />
              </div>
              {errors.email && <p className="lg-error">{errors.email.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="lg-btn">
              {loading ? (
                <>
                  <i className="pi pi-spin pi-spinner" /> Sending OTP...
                </>
              ) : (
                <>
                  Send OTP <i className="pi pi-arrow-right" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: role */}
        {step === "role" && (
          <div className="lg-roles">
            {roles.map((r) => (
              <button
                key={r}
                type="button"
                disabled={loading}
                onClick={() => chooseRole(r)}
                className="lg-role"
              >
                <span className="lg-role__icon">
                  <i className="pi pi-user" />
                </span>
                <span className="lg-role__text">{ROLE_LABELS[r]}</span>
                <i
                  className={`pi ${
                    loading && selectedRole === r ? "pi-spin pi-spinner" : "pi-arrow-right"
                  } lg-role__arrow`}
                />
              </button>
            ))}
            <button type="button" onClick={backToEmail} className="lg-link lg-link--center">
              Use a different email
            </button>
          </div>
        )}

        {/* STEP 3: otp */}
        {step === "otp" && (
          <div className="lg-otp">
            {selectedRole && (
              <div>
                <span className="lg-chip">
                  <i className="pi pi-user" style={{ fontSize: 11 }} />
                  Signing in as {ROLE_LABELS[selectedRole]}
                </span>
              </div>
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
              className="lg-btn"
            >
              {loading ? (
                <>
                  <i className="pi pi-spin pi-spinner" /> Verifying...
                </>
              ) : (
                "Verify & Sign in"
              )}
            </button>

            <div className="lg-row">
              <button type="button" onClick={backToEmail} className="lg-link">
                <i className="pi pi-arrow-left" style={{ fontSize: 11, marginRight: 6 }} />
                Change email
              </button>
              <button
                type="button"
                disabled={cooldown > 0 || loading}
                onClick={() => requestOtp(email, selectedRole)}
                className="lg-link lg-link--primary"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
              </button>
            </div>
          </div>
        )}

        <p className="lg-foot">Protected by one-time password verification</p>
      </div>
    </main>
  );
}
