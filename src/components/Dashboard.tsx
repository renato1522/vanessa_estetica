"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Booking = {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  notes: string;
  date: string;
  startMinute: number;
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELED" | "CANCELLED";
  service: { name: string; durationMinutes: number; priceCents: number };
};

const statusNames: Record<Booking["status"], string> = {
  PENDING: "Aguardando confirmação",
  CONFIRMED: "Confirmado",
  REJECTED: "Recusado",
  CANCELED: "Cancelado",
  CANCELLED: "Cancelado",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" })
    .format(new Date(`${date}T12:00:00.000Z`));
}

function todayInSaoPaulo() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function Dashboard() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const today = todayInSaoPaulo();

  async function loadBookings() {
    const response = await fetch("/api/admin/appointments");
    if (response.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (!response.ok) throw new Error("Não foi possível carregar a agenda.");
    setBookings((await response.json()) as Booking[]);
  }

  useEffect(() => {
    async function initialize() {
      try {
        const response = await fetch("/api/admin/appointments");
        if (response.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (!response.ok) throw new Error("Não foi possível carregar a agenda.");
        setBookings((await response.json()) as Booking[]);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Erro ao carregar a agenda.");
      } finally {
        setLoading(false);
      }
    }
    void initialize();
  }, [router]);

  const pendingCount = useMemo(() => bookings.filter((booking) => booking.status === "PENDING").length, [bookings]);
  const todayBookings = useMemo(
    () => bookings.filter((booking) => booking.date === today && booking.status !== "CANCELED" && booking.status !== "CANCELLED" && booking.status !== "REJECTED"),
    [bookings, today],
  );
  const visibleBookings = useMemo(
    () => bookings.filter((booking) => booking.date >= today),
    [bookings, today],
  );

  async function updateStatus(id: string, status: "CONFIRMED" | "REJECTED" | "CANCELLED") {
    setMessage("");
    try {
      const response = await fetch(`/api/admin/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível atualizar o agendamento.");
      await loadBookings();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível atualizar o agendamento.");
    }
  }

  return (
    <>
      <span className="eyebrow">Seu espaço de cuidado</span>
      <h1>Agenda</h1>
      <p className="muted">Acompanhe os pedidos e organize seus atendimentos.</p>
      {message && <p className="notice" role="alert">{message}</p>}
      <div className="service-grid" style={{ marginTop: 24 }}>
        <section className="panel"><span className="eyebrow">Hoje</span><h2 style={{ fontSize: 30, margin: "8px 0 0" }}>{todayBookings.length}</h2><p className="muted">atendimentos na agenda</p></section>
        <section className="panel"><span className="eyebrow">Pedidos</span><h2 style={{ fontSize: 30, margin: "8px 0 0" }}>{pendingCount}</h2><p className="muted">aguardando confirmação</p></section>
      </div>
      <section className="panel">
        <h2>Próximos agendamentos</h2>
        {loading ? <p className="muted">Carregando agenda...</p> : visibleBookings.length === 0 ? <p className="muted">Ainda não há agendamentos futuros.</p> : (
          <div className="booking-list">
            {visibleBookings.map((booking) => (
              <article className="booking-item" key={booking.id}>
                <div>
                  <strong>{booking.customerName}</strong> <span className={`status ${booking.status}`}>{statusNames[booking.status]}</span>
                  <p>{booking.service.name} · {formatDate(booking.date)} às {`${String(Math.floor(booking.startMinute / 60)).padStart(2, "0")}:${String(booking.startMinute % 60).padStart(2, "0")}`}<br />
                    {booking.phone} · {booking.email}{booking.notes && <><br />Observação: {booking.notes}</>}</p>
                </div>
                <div className="booking-actions">
                  {booking.status === "PENDING" && <>
                    <button className="small-button" onClick={() => { void updateStatus(booking.id, "CONFIRMED"); }} type="button">Confirmar</button>
                    <button className="small-button danger" onClick={() => { void updateStatus(booking.id, "REJECTED"); }} type="button">Recusar</button>
                  </>}
                  {booking.status === "CONFIRMED" && <button className="small-button danger" onClick={() => { void updateStatus(booking.id, "CANCELLED"); }} type="button">Cancelar</button>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
