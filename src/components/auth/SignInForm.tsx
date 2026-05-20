import { useState } from "react";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { login } from "../../firebase/auth";
import { isFirebaseConfigured } from "../../firebase/firebase";

const DEMO_ACCOUNTS = [
  { role: "سوپر ادمین", email: "superadmin@ku.edu.af", password: "SuperAdmin@1" },
  { role: "ادمین", email: "admin@ku.edu.af", password: "Admin@1234" },
  { role: "د ګدام مدیر", email: "warehouse@ku.edu.af", password: "Warehouse@1" },
  { role: "تدارکات", email: "procurement@ku.edu.af", password: "Procurement@1" },
  { role: "غوښتنه کوونکی", email: "requester@ku.edu.af", password: "Requester@1" },
];

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(isFirebaseConfigured ? "" : "superadmin@ku.edu.af");
  const [password, setPassword] = useState(isFirebaseConfigured ? "" : "SuperAdmin@1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [foundAccount, setFoundAccount] = useState<typeof DEMO_ACCOUNTS[0] | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      window.location.replace("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      setError("برېښنالیک یا پټنوم ناسم دی / ایمیل یا رمز اشتباه است");
      setLoading(false);
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setFoundAccount(null);
    if (!forgotEmail.trim()) {
      setForgotMsg("مهرباني وکړئ خپل ایمیل ولیکئ.");
      return;
    }
    const found = DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === forgotEmail.trim().toLowerCase());
    if (found) {
      setFoundAccount(found);
      setForgotMsg("");
    } else {
      setForgotMsg("دا ایمیل پته د سیستم کې نه موندل کېږي. مهرباني وکړئ د سیستم مدیر سره اړیکه ونیسئ.");
    }
  };

  return (
    <div className="flex flex-col flex-1" dir="rtl">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-6 text-center">
            <h1 className="mb-3 font-bold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              د کندهار پوهنتون د عمومي ګدام او تدارکاتو مدیریت سیستم
            </h1>
            <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
              د موجودۍ، غوښتنو، تدارکاتو او ګدام مدیریت ډیجیټلي سیستم
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          {!showForgot ? (
            <>
              <form onSubmit={handleSubmit}>
                <div className="space-y-5">
                  <div>
                    <Label>
                      برېښنالیک / ایمیل <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      placeholder="admin@kandahar.edu.af"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label>
                        پټنوم / رمز <span className="text-error-500">*</span>
                      </Label>
                      <button
                        type="button"
                        onClick={() => { setShowForgot(true); setForgotEmail(email); setForgotMsg(""); }}
                        className="text-xs text-brand-500 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium"
                      >
                        پټنوم هیر کړئ؟
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="پټنوم ولیکئ"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute z-30 -translate-y-1/2 cursor-pointer left-4 top-1/2"
                      >
                        {showPassword ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        )}
                      </span>
                    </div>
                  </div>

                  <Button className="w-full" size="sm" type="submit" disabled={loading}>
                    {loading ? "مهرباني وکړئ انتظار وکړئ..." : "سیستم ته ننوتل"}
                  </Button>
                </div>
              </form>

              <div className="mt-5 rounded-lg bg-gray-50 p-3 text-center text-xs text-gray-500 dark:bg-white/[0.04] dark:text-gray-400">
                د نوي حساب جوړول او صلاحیت ورکول یوازې د عمومي صلاحیت لرونکي له لارې کېږي.
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-brand-50 border border-brand-200 p-4 dark:bg-brand-900/20 dark:border-brand-800">
                <p className="text-sm font-semibold text-brand-700 dark:text-brand-300 mb-1">
                  🔑 د پټنوم بیا رغونه
                </p>
                <p className="text-xs text-brand-600 dark:text-brand-400">
                  خپل ایمیل ولیکئ — سیستم به ستاسې د اکاونټ معلومات وښیي.
                </p>
              </div>

              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <Label>برېښنالیک / ایمیل</Label>
                  <Input
                    type="email"
                    placeholder="admin@kandahar.edu.af"
                    value={forgotEmail}
                    onChange={(e) => { setForgotEmail(e.target.value); setForgotMsg(""); }}
                  />
                </div>

                {forgotMsg && (
                  <div className="rounded-lg p-3 text-sm font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
                    {forgotMsg}
                  </div>
                )}

                {foundAccount && (
                  <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 overflow-hidden">
                    <div className="px-4 py-3 border-b border-green-200 dark:border-green-800">
                      <p className="text-xs font-semibold text-green-700 dark:text-green-300">✅ اکاونټ وموندل شو</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">{foundAccount.role} — {foundAccount.email}</p>
                    </div>
                    <div className="px-4 py-3 flex items-center justify-between gap-3">
                      <span className="font-mono text-sm font-bold text-green-800 dark:text-green-200 tracking-wider">{foundAccount.password}</span>
                      <button
                        type="button"
                        onClick={() => { setEmail(foundAccount.email); setPassword(foundAccount.password); setShowForgot(false); setFoundAccount(null); }}
                        className="shrink-0 rounded-lg bg-green-600 hover:bg-green-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                      >
                        ننوتل
                      </button>
                    </div>
                  </div>
                )}

                {!foundAccount && (
                  <Button className="w-full" size="sm" type="submit">
                    پټنوم لټول
                  </Button>
                )}
              </form>

              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium py-1"
              >
                ← شاته ورستنیدل
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
