import type { Role } from "@/modules/users/roles";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: Role; name: string; sv: number };
  }
  interface User {
    id: string;
    role: Role;
    name: string;
    sv: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: Role;
    sv?: number;
  }
}
