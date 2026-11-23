"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Service = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
};

type Slot = { minute: number; time: string };
type Step = 1 | 2 | 3;

type BookingFormProps = {
  initialServiceId?: string;
};

function todayInSaoPaulo() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(priceCents / 100);
}

export function BookingForm({ initialServiceId }: BookingFormProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [today, setToday] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [startMinute, setStartMinute] = useState<number | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availabilityRefresh, setAvailabilityRefresh] = useState(0);
  const [message, setMessage] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    async function loadServices() {
      try {
        const response = await fetch("/api/services");
        if (!response.ok) throw new Error("Não foi possível carregar os serviços.");
        const data = (await response.json()) as Service[];
        const currentDate = todayInSaoPaulo();
        setToday(currentDate);
        setDate(currentDate);
        setServices(data);
        setServiceId(
          data.find((service) => service.id === initialServiceId)?.id ?? data[0]?.id ?? "",
        );
      } catch {
        setMessage("Não foi possível carregar os serviços. Tente novamente em instantes.");
      } finally {
        setLoadingServices(false);
      }
    }
    void loadServices();
  }, [initialServiceId]);

  useEffect(() => {
    if (!serviceId || !date) return;
    let active = true;
    async function loadSlots() {
      setLoadingSlots(true);
      setSlots([]);
      setStartMinute(null);
      try {
        const params = new URLSearchParams({ date, serviceId });
        const response = await fetch(`/api/availability?${params}`);
        if (!response.ok) throw new Error("Não foi possível consultar os horários.");
        const data = (await response.json()) as Slot[];
        if (active) setSlots(data);
      } catch {
        if (active) setMessage("Não foi possível consultar os horários. Tente novamente.");
      } finally {
        if (active) setLoadingSlots(false);
      }
    }
    void loadSlots();
    return () => { active = false; };
  }, [availabilityRefresh, date, serviceId]);

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          clientName: formData.get("customerName"),
          clientPhone: formData.get("phone"),
          date,
          time: `${String(Math.floor((startMinute ?? 0) / 60)).padStart(2, "0")}:${String((startMinute ?? 0) % 60).padStart(2, "0")}`,
          email: formData.get("email"),
          notes: formData.get("notes"),
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        if (response.status === 409) {
          setStep(2);
          setAvailabilityRefresh((current) => current + 1);
        }
        throw new Error(result.error ?? "Não foi possível concluir o agendamento.");
      }
      setComplete(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível concluir o agendamento.");
    } finally {
      setSubmitting(false);
    }
  }

  if (complete) {
    return (
      <section className="booking-card" aria-live="polite">
        <span className="service-icon" aria-hidden="true">✓</span>
        <h2 className="page-title" style={{ fontSize: 32 }}>Pedido recebido com carinho!</h2>
        <p className="muted">
          Sua solicitação foi recebida e aguarda aprovação da Vanessa. Ela entrará em contato para confirmar os detalhes.
        </p>
        <Link className="button" href="/">Voltar ao início</Link>
      </section>
    );
  }

  return (
    <form className="booking-card" onSubmit={submitBooking}>
      <span className="step-label">Etapa {step} de 3</span>
      {message && <p className="notice" role="alert">{message}</p>}

      {step === 1 && (
        <section className="booking-step" key={step}>
          <h2>Qual cuidado você deseja?</h2>
          {loadingServices ? <p className="muted">Carregando serviços...</p> : services.length === 0 ? (
            <p className="notice">Nenhum serviço disponível para agendamento no momento.</p>
          ) : (
            <div className="service-choice">
              {services.map((service) => (
                <button
                  className={`choice-card${service.id === serviceId ? " selected" : ""}`}
                  key={service.id}
                  onClick={() => setServiceId(service.id)}
                  type="button"
                >
                  <strong>{service.name}</strong>
                  <span>{service.durationMinutes} min · {formatPrice(service.priceCents)}</span>
                </button>
              ))}
            </div>
          )}
          <div className="button-row" style={{ justifyContent: "flex-end" }}>
            <button className="button" disabled={!serviceId || loadingServices} onClick={() => { setMessage(""); setStep(2); }} type="button">
              Escolher horário →
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="booking-step" key={step}>
          <h2>Escolha uma data e horário</h2>
          <div className="field">
            <label htmlFor="booking-date">Data do atendimento</label>
            <input id="booking-date" min={today} onChange={(event) => { setDate(event.target.value); setMessage(""); }} required type="date" value={date} />
          </div>
          {loadingSlots ? <p className="muted">Buscando horários livres...</p> : slots.length === 0 ? (
            <p className="notice">Não há horários disponíveis nesta data. Escolha outro dia para continuar.</p>
          ) : (
            <div className="slot-grid" aria-label="Horários disponíveis">
              {slots.map((slot) => (
                <button
                  aria-pressed={startMinute === slot.minute}
                  className={`slot-button${startMinute === slot.minute ? " selected" : ""}`}
                  key={slot.minute}
                  onClick={() => setStartMinute(slot.minute)}
                  type="button"
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
          <div className="button-row">
            <button className="button secondary" onClick={() => { setMessage(""); setStep(1); }} type="button">← Voltar</button>
            <button className="button" disabled={startMinute === null || loadingSlots} onClick={() => { setMessage(""); setStep(3); }} type="button">Continuar →</button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="booking-step" key={step}>
          <h2>Seus dados para confirmação</h2>
          <div className="form-row">
            <div className="field"><label htmlFor="customerName">Nome completo</label><input autoComplete="name" id="customerName" maxLength={100} minLength={2} name="customerName" required /></div>
            <div className="field"><label htmlFor="phone">WhatsApp / telefone</label><input autoComplete="tel" id="phone" maxLength={30} minLength={8} name="phone" required /></div>
          </div>
          <div className="field"><label htmlFor="email">E-mail</label><input autoComplete="email" id="email" maxLength={254} name="email" required type="email" /></div>
          <div className="field"><label htmlFor="notes">Observações (opcional)</label><textarea id="notes" maxLength={500} name="notes" /></div>
          <p className="muted">Seu pedido será enviado para confirmação. Nenhum pagamento é cobrado agora.</p>
          <div className="button-row">
            <button className="button secondary" onClick={() => { setMessage(""); setStep(2); }} type="button">← Voltar</button>
            <button className="button" disabled={submitting} type="submit">{submitting ? "Enviando..." : "Solicitar agendamento"}</button>
          </div>
        </section>
      )}
    </form>
  );
}
