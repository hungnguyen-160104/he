import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/states";

export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
      <EmptyState
        icon={<SearchX className="size-10" aria-hidden="true" />}
        title="Không tìm thấy trang"
        description="Trang bạn tìm không tồn tại hoặc đã bị gỡ."
        action={
          <Button asChild>
            <Link href="/">Về trang chủ</Link>
          </Button>
        }
      />
    </main>
  );
}
