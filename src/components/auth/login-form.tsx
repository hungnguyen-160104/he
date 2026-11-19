"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormMessage } from "@/components/forms/field";
import { loginSchema, type LoginInput } from "@/modules/auth/validation";

/** Messages for error codes thrown by the Credentials `authorize` callback. */
const LOGIN_ERRORS: Record<string, string> = {
  CredentialsSignin: "Tên đăng nhập/email hoặc mật khẩu không đúng.",
  ACCOUNT_SUSPENDED: "Tài khoản đang bị khóa. Vui lòng liên hệ quản trị viên.",
  EMAIL_NOT_VERIFIED: "Email chưa được xác minh. Vui lòng kiểm tra hộp thư để xác minh tài khoản.",
  RATE_LIMITED: "Bạn đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ít phút.",
  CONFIG_MISSING: "Hệ thống chưa được cấu hình cơ sở dữ liệu. Vui lòng liên hệ quản trị viên.",
  DB_UNAVAILABLE: "Không kết nối được máy chủ dữ liệu. Vui lòng thử lại sau.",
};

export function LoginForm({ callbackUrl, notice }: { callbackUrl: string; notice?: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { identifier: "", password: "" } });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const res = await signIn("credentials", { ...values, redirect: false });
      if (!res || res.error) {
        setFormError(LOGIN_ERRORS[res?.error ?? ""] ?? "Tên đăng nhập/email hoặc mật khẩu không đúng.");
        return;
      }
      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setFormError("Lỗi mạng. Vui lòng thử lại.");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4">
      {notice ? <FormMessage kind="success">{notice}</FormMessage> : null}
      {formError ? <FormMessage kind="error">{formError}</FormMessage> : null}
      <Field label="Tên đăng nhập hoặc email" error={errors.identifier?.message} required>
        {(p) => <Input {...p} autoComplete="username" autoCapitalize="none" spellCheck={false} {...register("identifier")} />}
      </Field>
      <Field label="Mật khẩu" error={errors.password?.message} required>
        {(p) => <Input {...p} type="password" autoComplete="current-password" {...register("password")} />}
      </Field>
      <div className="flex justify-end text-sm">
        <Link href="/quen-mat-khau" className="text-primary hover:underline">
          Quên mật khẩu?
        </Link>
      </div>
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        Đăng nhập
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link href="/dang-ky" className="font-medium text-primary hover:underline">
          Đăng ký học sinh
        </Link>
      </p>
    </form>
  );
}
