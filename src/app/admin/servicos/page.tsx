import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ServicesManager } from "@/components/ServicesManager";

export const instant = false;

export default async function ServicesPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  return <ServicesManager />;
}
