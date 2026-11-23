"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type BusinessHour = { weekday: number; openMinute: number; closeMinute: number; enabled: boolean };
type BlockedDate = {
  id: string;
  date: string;
  reason: string;
  startMinute: number | null;
  endMinute: number | null;
};
const weekdays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

function defaultHours(): BusinessHour[] {
  return weekdays.map((_, weekday) => ({
    weekday,
    openMinute: 540,
    closeMinute: weekday === 6 ? 840 : 1080,
    enabled: weekday !== 0,
  }));
}

function toTime(minute: number) {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

function fromTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" })
    .format(new Date(`${date}T12:00:00.000Z`));
}

function formatMinute(minute: number) {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

export function HoursManager() {
  const router = useRouter();
  const [hours, setHours] = useState<BusinessHour[]>(defaultHours);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const [hoursResponse, blocksResponse] = await Promise.all([
      fetch("/api/admin/business-hours"),
      fetch("/api/admin/blocks"),
    ]);
    if (hoursResponse.status === 401 || blocksResponse.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (!hoursResponse.ok || !blocksResponse.ok) throw new Error("Não foi possível carregar horários e bloqueios.");
    const result = (await hoursResponse.json()) as { hours: BusinessHour[] };
    const blocks = (await blocksResponse.json()) as BlockedDate[];
    if (result.hours.length) setHours(result.hours);
    setBlockedDates(blocks);
  }

  useEffect(() => {
    async function initialize() {
      try {
        const [hoursResponse, blocksResponse] = await Promise.all([
          fetch("/api/admin/business-hours"),
          fetch("/api/admin/blocks"),
        ]);
        if (hoursResponse.status === 401 || blocksResponse.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (!hoursResponse.ok || !blocksResponse.ok) throw new Error("Não foi possível carregar horários e bloqueios.");
        const result = (await hoursResponse.json()) as { hours: BusinessHour[] };
        const blocks = (await blocksResponse.json()) as BlockedDate[];
        if (result.hours.length) setHours(result.hours);
        setBlockedDates(blocks);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Falha ao carregar horários.");
      } finally {
        setLoading(false);
      }
    }
    void initialize();
  }, [router]);

  function updateHour(weekday: number, patch: Partial<BusinessHour>) {
    setHours((current) => current.map((hour) => hour.weekday === weekday ? { ...hour, ...patch } : hour));
  }

  async function saveHours(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    try {
      const response = await fetch("/api/admin/business-hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hours),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível salvar o expediente.");
      setMessage("Expediente atualizado com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar o expediente.");
    }
  }

  async function addBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    try {
      const response = await fetch("/api/admin/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, reason }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível bloquear a data.");
      setDate("");
      setReason("");
      await load();
      setMessage("Data bloqueada com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível bloquear a data.");
    }
  }

  async function removeBlock(id: string) {
    setMessage("");
    try {
      const response = await fetch(`/api/admin/blocks/${id}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível remover o bloqueio.");
      await load();
      setMessage("Bloqueio removido.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível remover o bloqueio.");
    }
  }

  return (
    <>
      <span className="eyebrow">Organize sua disponibilidade</span>
      <h1>Horários e folgas</h1>
      <p className="muted">Defina seu expediente semanal e bloqueie datas especiais.</p>
      {message && <p className="notice" role="status">{message}</p>}
      <section className="panel">
        <h2>Expediente semanal</h2>
        {loading ? <p className="muted">Carregando expediente...</p> : (
          <form onSubmit={saveHours}>
            <div className="hours-grid">
              {hours.map((hour) => (
                <div className="hours-row" key={hour.weekday}>
                  <label><input checked={hour.enabled} onChange={(event) => updateHour(hour.weekday, { enabled: event.target.checked })} type="checkbox" />{weekdays[hour.weekday]}</label>
                  <input aria-label={`Abertura ${weekdays[hour.weekday]}`} disabled={!hour.enabled} onChange={(event) => updateHour(hour.weekday, { openMinute: fromTime(event.target.value) })} type="time" value={toTime(hour.openMinute)} />
                  <input aria-label={`Fechamento ${weekdays[hour.weekday]}`} disabled={!hour.enabled} onChange={(event) => updateHour(hour.weekday, { closeMinute: fromTime(event.target.value) })} type="time" value={toTime(hour.closeMinute)} />
                  <span className="muted" style={{ fontSize: 12 }}>até</span>
                </div>
              ))}
            </div>
            <button className="button" style={{ marginTop: 22 }} type="submit">Salvar expediente</button>
          </form>
        )}
      </section>
      <section className="panel">
        <h2>Folgas, feriados e bloqueios</h2>
        <form className="form-row" onSubmit={addBlock}>
          <div className="field"><label htmlFor="blocked-date">Data</label><input id="blocked-date" onChange={(event) => setDate(event.target.value)} required type="date" value={date} /></div>
          <div className="field"><label htmlFor="blocked-reason">Motivo (opcional)</label><input id="blocked-reason" maxLength={200} onChange={(event) => setReason(event.target.value)} value={reason} /></div>
          <div style={{ alignSelf: "end", marginBottom: 17 }}><button className="button" type="submit">Bloquear data</button></div>
        </form>
        {blockedDates.length === 0 ? <p className="muted">Nenhuma data bloqueada.</p> : (
          <div className="service-admin-list">
            {blockedDates.map((block) => (
              <article className="service-admin-item" key={block.id}>
                <div>
                  <strong>{formatDate(block.date)}</strong>
                  <p>{block.startMinute !== null && block.endMinute !== null
                    ? `${formatMinute(block.startMinute)}–${formatMinute(block.endMinute)} · `
                    : ""}{block.reason || "Dia sem atendimento"}</p>
                </div>
                <button className="small-button danger" onClick={() => { void removeBlock(block.id); }} type="button">Remover</button>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
