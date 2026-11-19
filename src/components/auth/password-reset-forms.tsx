"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormMessage } from "@/components/forms/field";
import { forgotPasswordSchema, resetPasswordSchema } from "@/modules/auth/validation";
import { apiFetch, fieldErrorsOf } from "@/lib/api/client";

export function ForgotPasswordForm({ disabledReason }: { disabledReason?: string }) {
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof forgotPasswordSchema>, unknown, z.output<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  if (disabledReason) return <FormMessage kind="info">{disabledReason}</FormMessage>;
  if (done) {
    return (
      <FormMessage kind="success">
        Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (kể cả thư rác).
      </FormMessage>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const res = await apiFetch<{ accepted: true }>("/api/auth/forgot-password", { body: values });
    if (!res.ok) {
      setFormError(res.error.message);
      return;
    }
    setDone(true);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4">
      {formError ? <FormMessage kind="error">{formError}</FormMessage> : null}
      <Field label="Email đã đăng ký" error={errors.email?.message} required>
        {(p) => <Input {...p} type="email" autoComplete="email" {...register("email")} />}
      </Field>
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        Gửi hướng dẫn
      </Button>
      <Link href="/dang-nhap" className="text-center text-sm text-primary hover:underline">
        Quay lại đăng nhập
      </Link>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string | null }) {
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: token ?? "", newPassword: "", confirmPassword: "" },
  });

  if (!token) return <FormMessage kind="error">Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</FormMessage>;
  if (done) {
    return (
      <div className="grid grid-cols-1 gap-4">
        <FormMessage kind="success">Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.</FormMessage>
        <Button asChild>
          <Link href="/dang-nhap">Đăng nhập</Link>
        </Button>
      </div>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const res = await apiFetch<{ reset: true }>("/api/auth/reset-password", { body: values });
    if (!res.ok) {
      const fields = fieldErrorsOf(res.error);
      if (fields.newPassword) setError("newPassword", { message: fields.newPassword });
      setFormError(res.error.message);
      return;
    }
    setDone(true);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4">
      {formError ? <FormMessage kind="error">{formError}</FormMessage> : null}
      <input type="hidden" {...register("token")} />
      <Field label="Mật khẩu mới" error={errors.newPassword?.message} required>
        {(p) => <Input {...p} type="password" autoComplete="new-password" {...register("newPassword")} />}
      </Field>
      <Field label="Nhập lại mật khẩu mới" error={errors.confirmPassword?.message} required>
        {(p) => <Input {...p} type="password" autoComplete="new-password" {...register("confirmPassword")} />}
      </Field>
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        Đặt lại mật khẩu
      </Button>
    </form>
  );
}
