"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signOut } from "next-auth/react";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FormMessage } from "@/components/forms/field";
import { apiFetch, fieldErrorsOf } from "@/lib/api/client";
import { changePasswordSchema } from "@/modules/auth/validation";
import { updateProfileSchema } from "@/modules/users/validation";

type ProfileIn = z.input<typeof updateProfileSchema>;

export function ProfileForm({
  initial,
  disabled,
}: {
  initial: { displayName: string; grade: number | null; leaderboardVisibility: "PUBLIC" | "HIDDEN" };
  disabled?: boolean;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ProfileIn>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { displayName: initial.displayName, grade: initial.grade as 10 | 11 | 12 | null, leaderboardVisibility: initial.leaderboardVisibility },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const res = await apiFetch<{ displayName: string; grade: number | null; leaderboardVisibility: "PUBLIC" | "HIDDEN" }>("/api/me", {
      method: "PATCH",
      body: values,
    });
    if (!res.ok) {
      const f = fieldErrorsOf(res.error);
      if (f.displayName) setError("displayName", { message: f.displayName });
      setFormError(res.error.message);
      return;
    }
    reset({ displayName: res.data.displayName, grade: res.data.grade as 10 | 11 | 12 | null, leaderboardVisibility: res.data.leaderboardVisibility });
    toast.success("Đã lưu hồ sơ.");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4">
      {formError ? <FormMessage kind="error">{formError}</FormMessage> : null}
      <Field label="Biệt danh (hiển thị trên bảng xếp hạng)" error={errors.displayName?.message} required>
        {(p) => <Input {...p} disabled={disabled} {...register("displayName")} />}
      </Field>
      <Field label="Lớp" hint="Không bắt buộc.">
        {(p) => (
          <Controller
            control={control}
            name="grade"
            render={({ field }) => (
              <Select
                disabled={disabled}
                value={field.value ? String(field.value) : "none"}
                onValueChange={(v) => field.onChange(v === "none" ? null : (Number(v) as 10 | 11 | 12))}
              >
                <SelectTrigger id={p.id} aria-describedby={p["aria-describedby"]} className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không chọn</SelectItem>
                  <SelectItem value="10">Lớp 10</SelectItem>
                  <SelectItem value="11">Lớp 11</SelectItem>
                  <SelectItem value="12">Lớp 12</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        )}
      </Field>
      <Controller
        control={control}
        name="leaderboardVisibility"
        render={({ field }) => (
          <div className="flex items-start gap-2">
            <Checkbox
              id="leaderboardVisibility"
              disabled={disabled}
              checked={field.value === "PUBLIC"}
              onCheckedChange={(v) => field.onChange(v === true ? "PUBLIC" : "HIDDEN")}
              className="mt-0.5"
            />
            <label htmlFor="leaderboardVisibility" className="text-sm leading-snug">
              Hiển thị biệt danh của tôi trên bảng xếp hạng công khai
              <span className="block text-xs text-muted-foreground">
                Khi tắt, bạn vẫn thấy thứ hạng của mình nhưng người khác chỉ thấy “Học sinh ẩn danh”. Email không bao giờ được hiển thị.
              </span>
            </label>
          </div>
        )}
      />
      <div>
        <Button type="submit" disabled={disabled || isSubmitting || !isDirty}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Lưu thay đổi
        </Button>
      </div>
    </form>
  );
}

type PwIn = z.input<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PwIn>({ resolver: zodResolver(changePasswordSchema), defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" } });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const res = await apiFetch<{ changed: true }>("/api/auth/change-password", { body: values });
    if (!res.ok) {
      const f = fieldErrorsOf(res.error);
      for (const k of ["currentPassword", "newPassword", "confirmPassword"] as const) if (f[k]) setError(k, { message: f[k] });
      setFormError(res.error.message);
      return;
    }
    toast.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
    await signOut({ callbackUrl: "/dang-nhap?notice=password_changed" });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4">
      {formError ? <FormMessage kind="error">{formError}</FormMessage> : null}
      <Field label="Mật khẩu hiện tại" error={errors.currentPassword?.message} required>
        {(p) => <Input {...p} type="password" autoComplete="current-password" {...register("currentPassword")} />}
      </Field>
      <Field label="Mật khẩu mới" hint="Tối thiểu 10 ký tự, nên kết hợp chữ và số." error={errors.newPassword?.message} required>
        {(p) => <Input {...p} type="password" autoComplete="new-password" {...register("newPassword")} />}
      </Field>
      <Field label="Nhập lại mật khẩu mới" error={errors.confirmPassword?.message} required>
        {(p) => <Input {...p} type="password" autoComplete="new-password" {...register("confirmPassword")} />}
      </Field>
      <p className="text-xs text-muted-foreground">Sau khi đổi mật khẩu, mọi phiên đăng nhập khác sẽ bị đăng xuất.</p>
      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Đổi mật khẩu
        </Button>
      </div>
    </form>
  );
}

export function LogoutButton() {
  return (
    <Button variant="outline" onClick={() => void signOut({ callbackUrl: "/" })}>
      <LogOut className="size-4" aria-hidden="true" />
      Đăng xuất
    </Button>
  );
}
