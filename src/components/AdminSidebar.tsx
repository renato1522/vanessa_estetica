"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminSidebar() {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function logout() {
    setMessage("");
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) throw new Error("Não foi possível encerrar a sessão.");
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <aside className="admin-sidebar">
      <Link className="brand" href="/admin/dashboard">Vanessa Carla<small>Painel administrativo</small></Link>
      <nav className="admin-nav" aria-label="Administração">
        <Link href="/admin/dashboard">Agenda</Link>
        <Link href="/admin/servicos">Serviços</Link>
        <Link href="/admin/horarios">Horários e folgas</Link>
        <button onClick={() => { void logout().catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Não foi possível encerrar a sessão.")); }} type="button">Sair</button>
      </nav>
      {message && <p className="notice" role="alert">{message}</p>}
    </aside>
  );
}
