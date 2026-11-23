"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const isLoginPage = usePathname() === "/admin/login";
  if (isLoginPage) return <>{children}</>;
  return <div className="admin-layout"><AdminSidebar /><main className="admin-main">{children}</main></div>;
}
