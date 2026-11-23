"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), password: data.get("password") }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível entrar.");
      router.replace("/admin/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível entrar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <Link className="brand" href="/">Vanessa Carla<small>Estética & cuidado</small></Link>
        <h1 className="page-title" style={{ fontSize: 32, marginTop: 32 }}>Bem-vinda de volta</h1>
        <p className="muted">Entre para gerenciar sua agenda.</p>
        {message && <p className="notice" role="alert">{message}</p>}
        <div className="field"><label htmlFor="email">E-mail</label><input autoComplete="username" id="email" name="email" required type="email" /></div>
        <div className="field"><label htmlFor="password">Senha</label><input autoComplete="current-password" id="password" name="password" required type="password" /></div>
        <button className="button" disabled={submitting} style={{ marginTop: 12, width: "100%" }} type="submit">{submitting ? "Entrando..." : "Entrar"}</button>
      </form>
    </main>
  );
}
