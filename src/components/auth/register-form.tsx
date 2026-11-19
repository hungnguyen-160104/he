"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FormMessage } from "@/components/forms/field";
import { registerSchema } from "@/modules/auth/validation";
import { apiFetch, fieldErrorsOf } from "@/lib/api/client";

type FormIn = z.input<typeof registerSchema>;
type FormOut = z.output<typeof registerSchema>;

export function RegisterForm({ disabledReason }: { disabledReason?: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "", acceptTerms: false as unknown as true },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const res = await apiFetch<{ requiresEmailVerification: boolean }>("/api/auth/register", { body: values });
    if (!res.ok) {
      const fields = fieldErrorsOf(res.error);
      for (const [k, msg] of Object.entries(fields)) setError(k as keyof FormIn, { message: msg });
      setFormError(Object.keys(fields).length ? "Vui lòng kiểm tra lại thông tin." : res.error.message);
      return;
    }
    if (res.data.requiresEmailVerification) {
      router.replace("/dang-nhap?notice=verify");
      return;
    }
    const login = await signIn("credentials", { identifier: values.username, password: values.password, redirect: false });
    router.replace(login?.ok ? "/sau-dang-nhap" : "/dang-nhap?notice=registered");
    router.refresh();
  });

  if (disabledReason) return <FormMessage kind="info">{disabledReason}</FormMessage>;

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4">
      {formError ? <FormMessage kind="error">{formError}</FormMessage> : null}
      <Field label="Tên đăng nhập" hint="3–30 ký tự: chữ thường không dấu, số, dấu _ hoặc ." error={errors.username?.message} required>
        {(p) => <Input {...p} autoComplete="username" autoCapitalize="none" spellCheck={false} {...register("username")} />}
      </Field>
      <Field label="Email" error={errors.email?.message} required>
        {(p) => <Input {...p} type="email" autoComplete="email" autoCapitalize="none" {...register("email")} />}
      </Field>
      <Field label="Mật khẩu" hint="Tối thiểu 10 ký tự, nên kết hợp chữ và số." error={errors.password?.message} required>
        {(p) => <Input {...p} type="password" autoComplete="new-password" {...register("password")} />}
      </Field>
      <Field label="Nhập lại mật khẩu" error={errors.confirmPassword?.message} required>
        {(p) => <Input {...p} type="password" autoComplete="new-password" {...register("confirmPassword")} />}
      </Field>
      <div className="grid grid-cols-1 gap-1.5">
        <div className="flex items-start gap-2">
          <Controller
            control={control}
            name="acceptTerms"
            render={({ field }) => (
              <Checkbox
                id="acceptTerms"
                checked={field.value === true}
                onCheckedChange={(v) => field.onChange(v === true)}
                aria-invalid={errors.acceptTerms ? true : undefined}
                aria-describedby={errors.acceptTerms ? "acceptTerms-error" : undefined}
                className="mt-0.5"
              />
            )}
          />
          <label htmlFor="acceptTerms" className="text-sm leading-snug">
            Tôi đồng ý với{" "}
            <Link href="/dieu-khoan" target="_blank" className="text-primary hover:underline">
              Điều khoản sử dụng
            </Link>{" "}
            và{" "}
            <Link href="/chinh-sach-rieng-tu" target="_blank" className="text-primary hover:underline">
              Chính sách quyền riêng tư
            </Link>
            .
          </label>
        </div>
        {errors.acceptTerms ? (
          <p id="acceptTerms-error" role="alert" className="text-sm text-destructive">
            {errors.acceptTerms.message}
          </p>
        ) : null}
      </div>
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        Tạo tài khoản
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link href="/dang-nhap" className="font-medium text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
