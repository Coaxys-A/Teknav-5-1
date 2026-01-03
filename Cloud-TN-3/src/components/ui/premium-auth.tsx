'use client';

import * as React from "react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Shield,
  AlertTriangle,
  KeyRound,
  Phone,
  Loader2,
  CheckCircle2,
} from "lucide-react";

type AuthMode = "login" | "signup" | "reset";
type RegistrationStep = "details" | "verification" | "complete";

interface AuthFormProps {
  onSuccess?: (userData: { email: string; name?: string }) => void;
  onClose?: () => void;
  initialMode?: AuthMode;
  className?: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  agreeToTerms: boolean;
  rememberMe: boolean;
  verificationCode: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  agreeToTerms?: string;
   rememberMe?: string;
  general?: string;
  verificationCode?: string;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

const calculatePasswordStrength = (password: string): PasswordStrength => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;
  const feedback: string[] = [];

  if (!requirements.length) feedback.push("حداقل ۸ کاراکتر");
  if (!requirements.uppercase) feedback.push("حرف بزرگ انگلیسی");
  if (!requirements.lowercase) feedback.push("حرف کوچک انگلیسی");
  if (!requirements.number) feedback.push("یک عدد");
  if (!requirements.special) feedback.push("یک کاراکتر ویژه");

  return { score, feedback, requirements };
};

const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
  const strength = calculatePasswordStrength(password);

  const getStrengthColor = (score: number) => {
    if (score <= 1) return "text-destructive";
    if (score <= 2) return "text-orange-500";
    if (score <= 3) return "text-yellow-500";
    if (score <= 4) return "text-blue-500";
    return "text-primary";
  };

  const getStrengthText = (score: number) => {
    if (score <= 1) return "خیلی ضعیف";
    if (score <= 2) return "ضعیف";
    if (score <= 3) return "متوسط";
    if (score <= 4) return "خوب";
    return "قوی";
  };

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2 animate-in fade-in-50 slide-in-from-bottom-1">
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${getStrengthColor(strength.score)} bg-current rounded-full`}
            style={{ width: `${(strength.score / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground min-w-[60px]">{getStrengthText(strength.score)}</span>
      </div>
      {strength.feedback.length > 0 && (
        <div className="grid grid-cols-2 gap-1">
          {strength.feedback.map((item, index) => (
            <div key={index} className="flex items-center gap-1 text-xs text-amber-500 dark:text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function AuthForm({ onSuccess, onClose, initialMode = "login", className }: AuthFormProps) {
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>("details");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    agreeToTerms: false,
    rememberMe: false,
    verificationCode: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const savedEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;
    const rememberMe = typeof window !== "undefined" ? localStorage.getItem("rememberMe") === "true" : false;
    if (savedEmail && authMode === "login") {
      setFormData((prev) => ({ ...prev, email: savedEmail, rememberMe }));
    }
  }, [authMode]);

  const validateField = useCallback(
    (field: keyof FormData, value: string | boolean) => {
      let error = "";
      switch (field) {
        case "name":
          if (typeof value === "string" && authMode === "signup" && !value.trim()) error = "نام الزامی است";
          break;
        case "email":
          if (!value || (typeof value === "string" && !value.trim())) error = "ایمیل را وارد کنید";
          else if (typeof value === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
            error = "ایمیل معتبر نیست";
          break;
        case "password":
          if (!value) error = "رمز عبور الزامی است";
          else if (typeof value === "string") {
            if (value.length < 8) error = "حداقل ۸ کاراکتر";
            else if (authMode === "signup" && calculatePasswordStrength(value).score < 3) error = "رمز عبور ضعیف است";
          }
          break;
        case "confirmPassword":
          if (authMode === "signup" && value !== formData.password) error = "رمز عبور همخوانی ندارد";
          break;
        case "phone":
          if (typeof value === "string" && value && !/^\+?[\d\s\-()]+$/.test(value)) error = "شماره معتبر نیست";
          break;
        case "verificationCode":
          if (
            typeof value === "string" &&
            authMode === "signup" &&
            registrationStep === "verification" &&
            !/^\d{6}$/.test(value)
          )
            error = "کد باید ۶ رقم باشد";
          break;
        case "agreeToTerms":
          if (authMode === "signup" && !value) error = "پذیرش قوانین الزامی است";
          break;
      }
      return error;
    },
    [authMode, registrationStep, formData.password],
  );

  const handleInputChange = useCallback(
    (field: keyof FormData, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (fieldTouched[field]) {
        const error = validateField(field, value);
        setErrors((prev) => ({ ...prev, [field]: error || undefined }));
      }
    },
    [fieldTouched, validateField],
  );

  const handleFieldBlur = useCallback(
    (field: keyof FormData) => {
      setFieldTouched((prev) => ({ ...prev, [field]: true }));
      const value = formData[field];
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error || undefined }));
    },
    [formData, validateField],
  );

  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};
    const fields: (keyof FormData)[] = ["email", "password"];
    if (authMode === "signup") fields.push("name", "confirmPassword", "agreeToTerms");
    if (registrationStep === "verification") fields.push("verificationCode");
    fields.forEach((field) => {
      const err = validateField(field, formData[field]);
      if (err) newErrors[field] = err;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [authMode, registrationStep, formData, validateField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setErrors({});
    try {
      await new Promise((res) => setTimeout(res, 900));
      if (authMode === "login") {
        if (formData.rememberMe) {
          localStorage.setItem("userEmail", formData.email);
          localStorage.setItem("rememberMe", "true");
        }
        setSuccessMessage("ورود موفق بود");
        onSuccess?.({ email: formData.email });
      } else if (authMode === "signup") {
        if (registrationStep === "details") {
          setRegistrationStep("verification");
          setSuccessMessage("حساب ایجاد شد، کد تایید را وارد کنید");
        } else if (registrationStep === "verification") {
          setRegistrationStep("complete");
          setSuccessMessage("ایمیل تایید شد");
          onSuccess?.({ email: formData.email, name: formData.name });
        }
      } else if (authMode === "reset") {
        setSuccessMessage("لینک بازیابی ارسال شد");
        setTimeout(() => setAuthMode("login"), 1500);
      }
    } catch (error) {
      setErrors({ general: "خطا در احراز هویت. دوباره تلاش کنید." });
    } finally {
      setIsLoading(false);
    }
  };

  const renderAuthContent = () => {
    if (authMode === "reset") {
      return (
        <div className="space-y-4 animate-in fade-in-50 slide-in-from-right-5">
          <div className="text-center mb-6">
            <KeyRound className="h-12 w-12 text-primary mx-auto mb-3" />
            <h3 className="text-xl font-semibold mb-2">بازیابی رمز عبور</h3>
            <p className="text-muted-foreground text-sm">ایمیل خود را وارد کنید تا لینک بازیابی ارسال شود.</p>
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="email"
              placeholder="ایمیل"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              onBlur={() => handleFieldBlur("email")}
              className={cn(
                "w-full pl-10 pr-4 py-3 bg-muted/50 border rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
                errors.email ? "border-destructive" : "border-input",
              )}
            />
            {errors.email && (
              <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.email}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || !formData.email}
            className={cn(
              "w-full relative bg-primary text-primary-foreground font-medium py-3 px-6 rounded-xl transition-all",
              "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/20",
              "disabled:opacity-50",
            )}
          >
            <span className="flex items-center justify-center gap-2">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "ارسال لینک بازیابی"}
            </span>
          </button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              className="text-primary hover:text-primary/80 text-sm transition-colors"
            >
              بازگشت به ورود
            </button>
          </div>
        </div>
      );
    }

    if (authMode === "signup" && registrationStep === "verification") {
      return (
        <div className="space-y-4 animate-in fade-in-50 slide-in-from-right-5">
          <div className="text-center mb-6">
            <Mail className="h-12 w-12 text-primary mx-auto mb-3" />
            <h3 className="text-xl font-semibold mb-2">تایید ایمیل</h3>
            <p className="text-muted-foreground text-sm">
              کد ۶ رقمی به <span className="font-medium">{formData.email}</span> ارسال شد.
            </p>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="کد ۶ رقمی"
              value={formData.verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                handleInputChange("verificationCode", value);
              }}
              onBlur={() => handleFieldBlur("verificationCode")}
              className={cn(
                "w-full text-center py-3 px-4 bg-muted/50 border rounded-xl text-2xl font-mono tracking-widest placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
                errors.verificationCode ? "border-destructive" : "border-input",
              )}
              maxLength={6}
            />
            {errors.verificationCode && (
              <p className="text-destructive text-xs mt-1 flex items-center gap-1 justify-center">
                <AlertTriangle className="h-3 w-3" />
                {errors.verificationCode}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || formData.verificationCode.length !== 6}
            className={cn(
              "w-full relative bg-primary text-primary-foreground font-medium py-3 px-6 rounded-xl transition-all",
              "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/20",
              "disabled:opacity-50",
            )}
          >
            <span className="flex items-center justify-center gap-2">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "تایید ایمیل"}
            </span>
          </button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => setRegistrationStep("details")}
              className="text-primary hover:text-primary/80 text-sm transition-colors"
            >
              ویرایش اطلاعات
            </button>
          </div>
        </div>
      );
    }

    if (authMode === "signup" && registrationStep === "complete") {
      return (
        <div className="text-center space-y-6 animate-in fade-in-50 slide-in-from-right-5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-2">خوش آمدید!</h3>
            <p className="text-muted-foreground">حساب شما با موفقیت ساخته شد.</p>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "w-full bg-primary text-primary-foreground font-medium py-3 px-6 rounded-xl",
              "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/20",
            )}
          >
            شروع کنید
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4 animate-in fade-in-50 slide-in-from-right-5">
        {authMode === "signup" && (
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="نام و نام خانوادگی"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              onBlur={() => handleFieldBlur("name")}
              className={cn(
                "w-full pl-10 pr-4 py-3 bg-muted/50 border rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
                errors.name ? "border-destructive" : "border-input",
              )}
            />
            {errors.name && (
              <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.name}
              </p>
            )}
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="email"
            placeholder="ایمیل"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            onBlur={() => handleFieldBlur("email")}
            className={cn(
              "w-full pl-10 pr-4 py-3 bg-muted/50 border rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
              errors.email ? "border-destructive" : "border-input",
            )}
          />
          {errors.email && (
            <p className="text-destructive text-xs mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {errors.email}
            </p>
          )}
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="رمز عبور"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            onBlur={() => handleFieldBlur("password")}
            className={cn(
              "w-full pl-10 pr-12 py-3 bg-muted/50 border rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
              errors.password ? "border-destructive" : "border-input",
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
          {errors.password && (
            <p className="text-destructive text-xs mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {errors.password}
            </p>
          )}
          {authMode === "signup" && <PasswordStrengthIndicator password={formData.password} />}
        </div>

        {authMode === "signup" && (
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="تکرار رمز عبور"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              onBlur={() => handleFieldBlur("confirmPassword")}
              className={cn(
                "w-full pl-10 pr-12 py-3 bg-muted/50 border rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
                errors.confirmPassword ? "border-destructive" : "border-input",
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
            {errors.confirmPassword && (
              <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.confirmPassword}
              </p>
            )}
          </div>
        )}

        {authMode === "signup" && (
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="tel"
              placeholder="شماره تماس (اختیاری)"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              onBlur={() => handleFieldBlur("phone")}
              className={cn(
                "w-full pl-10 pr-4 py-3 bg-muted/50 border rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
                errors.phone ? "border-destructive" : "border-input",
              )}
            />
            {errors.phone && (
              <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.phone}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          {authMode === "login" ? (
            <>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange("rememberMe", e.target.checked)}
                  className="w-4 h-4 rounded border-input bg-muted text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span className="text-sm text-muted-foreground">مرا به خاطر بسپار</span>
              </label>
              <button
                type="button"
                onClick={() => setAuthMode("reset")}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                فراموشی رمز؟
              </button>
            </>
          ) : (
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={(e) => handleInputChange("agreeToTerms", e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-input bg-muted text-primary focus:ring-primary focus:ring-offset-0"
              />
              <span className="text-sm text-muted-foreground">
                با{" "}
                <a href="#" className="text-primary hover:underline transition-colors">
                  شرایط استفاده
                </a>{" "}
                و{" "}
                <a href="#" className="text-primary hover:underline transition-colors">
                  حریم خصوصی
                </a>{" "}
                موافقم
              </span>
            </label>
          )}
        </div>
        {errors.agreeToTerms && (
          <p className="text-destructive text-xs flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {errors.agreeToTerms}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "w-full relative bg-primary text-primary-foreground font-medium py-3 px-6 rounded-xl transition-all",
            "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/20",
            "disabled:opacity-50",
          )}
        >
          <span className="flex items-center justify-center gap-2">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : authMode === "login" ? "ورود" : "ساخت حساب"}
          </span>
        </button>
      </div>
    );
  };

  return (
    <div className={cn("p-6 space-y-6 rounded-2xl bg-background/70 backdrop-blur border border-border", className)}>
      {successMessage && (
        <div className="mb-2 p-3 bg-green-500/15 border border-green-500/30 rounded-xl flex items-center gap-2 animate-in fade-in-0 slide-in-from-top-5">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-green-700 dark:text-green-300 text-sm">{successMessage}</span>
        </div>
      )}
      {errors.general && (
        <div className="mb-2 p-3 bg-destructive/15 border border-destructive/30 rounded-xl flex items-center gap-2 animate-in fade-in-0 slide-in-from-top-5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-destructive text-sm">{errors.general}</span>
        </div>
      )}

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{authMode === "login" ? "ورود" : authMode === "reset" ? "بازیابی رمز" : "ساخت حساب"}</h2>
        <p className="text-muted-foreground text-sm">
          {authMode === "login"
            ? "به حساب خود وارد شوید"
            : authMode === "reset"
              ? "بازگردانی دسترسی به حساب"
              : "در کمتر از یک دقیقه ثبت نام کنید"}
        </p>
      </div>

      {authMode !== "reset" && (
        <div className="flex bg-muted rounded-xl p-1">
          <button
            onClick={() => setAuthMode("login")}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
              authMode === "login" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
            type="button"
          >
            ورود
          </button>
          <button
            onClick={() => {
              setAuthMode("signup");
              setRegistrationStep("details");
            }}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
              authMode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
            type="button"
          >
            ثبت‌نام
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>{renderAuthContent()}</form>

      {authMode !== "reset" && registrationStep === "details" && (
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            {authMode === "login" ? "حساب ندارید؟ " : "حساب دارید؟ "}
            <button
              type="button"
              onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              {authMode === "login" ? "ثبت‌نام" : "ورود"}
            </button>
          </p>
        </div>
      )}
    </div>
  );
}

export function AuthFormDemo() {
  return <AuthForm />;
}
