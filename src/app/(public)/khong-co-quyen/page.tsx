import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/states";

export const metadata: Metadata = { title: "Không có quyền truy cập" };

export default function ForbiddenPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <EmptyState
        icon={<ShieldAlert className="size-10" aria-hidden="true" />}
        title="Bạn không có quyền truy cập trang này"
        description="Trang này dành cho vai trò khác. Nếu bạn cho rằng đây là nhầm lẫn, hãy liên hệ quản trị viên."
        action={
          <Button asChild>
            <Link href="/sau-dang-nhap">Về trang của tôi</Link>
          </Button>
        }
      />
    </div>
  );
}
