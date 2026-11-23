import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HoursManager } from "@/components/HoursManager";

export const instant = false;

export default async function HoursPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  return <HoursManager />;
}
