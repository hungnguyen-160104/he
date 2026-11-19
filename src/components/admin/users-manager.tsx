"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Loader2, MoreHorizontal, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FormMessage } from "@/components/forms/field";
import { EmptyState } from "@/components/common/states";
import { ErrorState } from "@/components/common/error-state";
import { apiFetch, fieldErrorsOf } from "@/lib/api/client";
import { formatDateTimeVN } from "@/lib/utils/format";
import { ROLE_LABELS, ROLES, type Role, type UserStatus } from "@/modules/users/roles";
import { createTeacherSchema } from "@/modules/users/validation";
import type { AdminUserRowDto } from "@/modules/users/dto";

type Meta = { page: number; totalPages: number; total: number };
type PendingAction =
  | { kind: "status"; user: AdminUserRowDto; status: UserStatus }
  | { kind: "role"; user: AdminUserRowDto; role: Role }
  | { kind: "reset"; user: AdminUserRowDto };

export function UsersManager({ currentUserId }: { currentUserId: string }) {
  const [role, setRole] = useState<Role | "ALL">("ALL");
  const [status, setStatus] = useState<UserStatus | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminUserRowDto[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState<{ title: string; username: string; password: string } | null>(null);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    const ctrl = new AbortController();
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (role !== "ALL") params.set("role", role);
    if (status !== "ALL") params.set("status", status);
    if (query) params.set("q", query);
    apiFetch<AdminUserRowDto[]>(`/api/admin/users?${params}`, { signal: ctrl.signal })
      .then((res) => {
        if (res.ok) {
          setRows(res.data);
          setMeta(res.meta as Meta);
          setError(null);
        } else setError(res.error.message);
      })
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [role, status, query, page, reloadKey]);

  async function runPending() {
    if (!pending) return;
    setBusy(true);
    const u = pending.user;
    const res =
      pending.kind === "status"
        ? await apiFetch(`/api/admin/users/${u.id}/status`, { method: "PATCH", body: { status: pending.status } })
        : pending.kind === "role"
          ? await apiFetch(`/api/admin/users/${u.id}/role`, { method: "PATCH", body: { role: pending.role } })
          : await apiFetch<{ temporaryPassword: string }>(`/api/admin/users/${u.id}/reset-password`, { method: "POST", body: {} });
    setBusy(false);
    setPending(null);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    if (pending.kind === "reset") {
      setSecret({ title: "Mật khẩu tạm thời mới", username: u.username, password: (res.data as { temporaryPassword: string }).temporaryPassword });
    } else toast.success("Đã cập nhật.");
    reload();
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setQuery(q.trim());
          }}
        >
          <Input aria-label="Tìm theo tên đăng nhập, email, biệt danh" placeholder="Tìm tên đăng nhập, email…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button type="submit" variant="outline" aria-label="Tìm kiếm">
            <Search className="size-4" />
          </Button>
        </form>
        <div className="grid grid-cols-2 gap-2 sm:contents">
        <Select value={role} onValueChange={(v) => { setPage(1); setRole(v as Role | "ALL"); }}>
          <SelectTrigger aria-label="Lọc theo vai trò" className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Mọi vai trò</SelectItem>
            {ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setPage(1); setStatus(v as UserStatus | "ALL"); }}>
          <SelectTrigger aria-label="Lọc theo trạng thái" className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Mọi trạng thái</SelectItem>
            <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
            <SelectItem value="SUSPENDED">Đã khóa</SelectItem>
          </SelectContent>
        </Select>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden="true" /> Tạo giáo viên
        </Button>
      </div>

      {error ? (
        <ErrorState description={error} onRetry={reload} />
      ) : rows === null ? (
        <div className="grid grid-cols-1 gap-2" aria-busy="true" aria-label="Đang tải">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState title="Không có người dùng phù hợp" description="Thử đổi bộ lọc hoặc từ khóa tìm kiếm." />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người dùng</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden sm:table-cell">Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="hidden lg:table-cell">Đăng nhập gần nhất</TableHead>
                <TableHead className="w-12"><span className="sr-only">Thao tác</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.displayName}</div>
                    <div className="text-xs text-muted-foreground">@{u.username}<span className="sm:hidden"> · {ROLE_LABELS[u.role]}</span></div>
                  </TableCell>
                  <TableCell className="hidden max-w-56 truncate md:table-cell">{u.email}</TableCell>
                  <TableCell className="hidden sm:table-cell">{ROLE_LABELS[u.role]}</TableCell>
                  <TableCell>
                    {u.status === "ACTIVE" ? <Badge variant="secondary">Hoạt động</Badge> : <Badge variant="destructive">Đã khóa</Badge>}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{formatDateTimeVN(u.lastLoginAt)}</TableCell>
                  <TableCell>
                    {u.id === currentUserId ? (
                      <span className="text-xs text-muted-foreground">Bạn</span>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Thao tác với ${u.username}`}>
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setPending({ kind: "status", user: u, status: u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" })}>
                            {u.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setPending({ kind: "reset", user: u })}>Cấp mật khẩu tạm thời</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground">Đổi vai trò</DropdownMenuLabel>
                          {ROLES.filter((r) => r !== u.role).map((r) => (
                            <DropdownMenuItem key={r} onSelect={() => setPending({ kind: "role", user: u, role: r })}>
                              Thành {ROLE_LABELS[r]}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {meta && meta.totalPages > 1 ? (
        <nav aria-label="Phân trang" className="flex items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">Trang {meta.page}/{meta.totalPages} · {meta.total} người dùng</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trước</Button>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Sau</Button>
          </div>
        </nav>
      ) : null}

      <CreateTeacherDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(username, password) => {
          setCreateOpen(false);
          setSecret({ title: "Đã tạo tài khoản giáo viên", username, password });
          reload();
        }}
      />

      <AlertDialog open={pending !== null} onOpenChange={(o) => !o && !busy && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận thao tác</AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.kind === "status" &&
                (pending.status === "SUSPENDED"
                  ? `Khóa tài khoản @${pending.user.username}? Người dùng sẽ bị đăng xuất ngay.`
                  : `Mở khóa tài khoản @${pending.user.username}?`)}
              {pending?.kind === "role" && `Đổi vai trò của @${pending.user.username} thành ${ROLE_LABELS[pending.role]}? Thao tác được ghi nhật ký.`}
              {pending?.kind === "reset" && `Cấp mật khẩu tạm thời mới cho @${pending.user.username}? Mật khẩu cũ sẽ ngừng hoạt động.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void runPending();
              }}
            >
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={secret !== null} onOpenChange={(o) => !o && setSecret(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{secret?.title}</DialogTitle>
            <DialogDescription>
              Gửi mật khẩu này cho người dùng qua kênh an toàn. Mật khẩu chỉ hiển thị <strong>một lần</strong> và phải được đổi ở lần đăng nhập đầu tiên.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 rounded-md border bg-muted p-3 text-sm">
            <div>Tên đăng nhập: <span className="font-mono font-medium">{secret?.username}</span></div>
            <div className="flex items-center gap-2">
              Mật khẩu tạm: <span className="font-mono font-medium" data-testid="temp-password">{secret?.password}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Sao chép mật khẩu"
                onClick={() => secret && navigator.clipboard?.writeText(secret.password).then(() => toast.success("Đã sao chép."))}
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setSecret(null)}>Đã lưu mật khẩu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type TeacherIn = z.input<typeof createTeacherSchema>;

function CreateTeacherDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (username: string, password: string) => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TeacherIn>({ resolver: zodResolver(createTeacherSchema), defaultValues: { username: "", email: "", displayName: "" } });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const res = await apiFetch<{ user: AdminUserRowDto; temporaryPassword: string }>("/api/admin/teachers", { body: values });
    if (!res.ok) {
      const f = fieldErrorsOf(res.error);
      for (const k of ["username", "email", "displayName"] as const) if (f[k]) setError(k, { message: f[k] });
      setFormError(res.error.message);
      return;
    }
    reset();
    onCreated(res.data.user.username, res.data.temporaryPassword);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo tài khoản giáo viên</DialogTitle>
          <DialogDescription>Hệ thống sinh mật khẩu tạm thời; giáo viên phải đổi mật khẩu ở lần đăng nhập đầu.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4">
          {formError ? <FormMessage kind="error">{formError}</FormMessage> : null}
          <Field label="Tên đăng nhập" error={errors.username?.message} required>
            {(p) => <Input {...p} autoCapitalize="none" {...register("username")} />}
          </Field>
          <Field label="Email" error={errors.email?.message} required>
            {(p) => <Input {...p} type="email" {...register("email")} />}
          </Field>
          <Field label="Tên hiển thị" error={errors.displayName?.message} required>
            {(p) => <Input {...p} {...register("displayName")} />}
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Tạo tài khoản
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
