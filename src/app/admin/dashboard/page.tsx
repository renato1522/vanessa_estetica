import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";

export const instant = false;

export default async function DashboardPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  return <Dashboard />;
}
