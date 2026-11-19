import { redirect } from "next/navigation";
import { requirePageActor } from "@/lib/auth/session";
import { homePathForRole } from "@/modules/users/roles";

export const dynamic = "force-dynamic";

/** Post-login router: sends each role to its home (or to change a temporary password). */
export default async function AfterLoginPage() {
  const actor = await requirePageActor(undefined, { allowMustChangePassword: true });
  redirect(actor.mustChangePassword ? "/ho-so?doi-mat-khau=1" : homePathForRole(actor.role));
}
