import { useState } from "react";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { login } from "../../firebase/auth";
import { isFirebaseConfigured } from "../../firebase/firebase";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(isFirebaseConfigured ? "" : "superadmin@ku.edu.af");
  const [password, setPassword] = useState(isFirebaseConfigured ? "" : "SuperAdmin@1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
                <Label>
                  پټنوم / رمز <span className="text-error-500">*</span>
                </Label>
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
        </div>
      </div>
    </div>
  );
}
