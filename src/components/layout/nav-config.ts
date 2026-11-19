import type { Role } from "@/modules/users/roles";

export type NavItem = { href: string; label: string; icon: NavIconName };

export type NavIconName =
  | "home"
  | "book"
  | "file"
  | "trophy"
  | "pencil"
  | "history"
  | "user"
  | "layout"
  | "list"
  | "check"
  | "users"
  | "folder"
  | "shield"
  | "scale";

export const PUBLIC_NAV: NavItem[] = [
  { href: "/mon-hoc", label: "Môn học", icon: "book" },
  { href: "/de-thi", label: "Đề thi", icon: "file" },
  { href: "/luyen-tap", label: "Luyện tập", icon: "pencil" },
  { href: "/bang-xep-hang", label: "Bảng xếp hạng", icon: "trophy" },
];

export const STUDENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Tổng quan", icon: "layout" },
  { href: "/luyen-tap", label: "Luyện tập", icon: "pencil" },
  { href: "/de-thi", label: "Thi thử", icon: "file" },
  { href: "/lich-su", label: "Lịch sử làm bài", icon: "history" },
  { href: "/bang-xep-hang", label: "Bảng xếp hạng", icon: "trophy" },
  { href: "/ho-so", label: "Hồ sơ", icon: "user" },
];

export const TEACHER_NAV: NavItem[] = [
  { href: "/giao-vien", label: "Tổng quan", icon: "layout" },
  { href: "/giao-vien/cau-hoi", label: "Ngân hàng câu hỏi", icon: "list" },
  { href: "/giao-vien/de-thi", label: "Đề thi của tôi", icon: "file" },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/quan-tri", label: "Tổng quan", icon: "layout" },
  { href: "/quan-tri/duyet-de", label: "Duyệt đề", icon: "check" },
  { href: "/quan-tri/nguoi-dung", label: "Người dùng", icon: "users" },
  { href: "/quan-tri/mon-hoc", label: "Môn & chủ đề", icon: "folder" },
  { href: "/quan-tri/quy-tac-diem", label: "Quy tắc tính điểm", icon: "scale" },
  { href: "/quan-tri/xep-hang", label: "Kỳ xếp hạng", icon: "trophy" },
  { href: "/quan-tri/nhat-ky", label: "Nhật ký hệ thống", icon: "shield" },
];

/** Links shown in the account menu for a role (staff can also study like students). */
export function areaLinksForRole(role: Role): NavItem[] {
  const links: NavItem[] = [{ href: "/dashboard", label: "Góc học tập", icon: "layout" }];
  if (role === "TEACHER" || role === "ADMIN") links.push({ href: "/giao-vien", label: "Khu vực giáo viên", icon: "list" });
  if (role === "ADMIN") links.push({ href: "/quan-tri", label: "Quản trị", icon: "shield" });
  links.push({ href: "/ho-so", label: "Hồ sơ", icon: "user" });
  return links;
}
