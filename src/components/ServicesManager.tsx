"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Service = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  active: boolean;
};

type ServiceForm = Omit<Service, "id">;
const emptyForm: ServiceForm = { name: "", description: "", durationMinutes: 60, priceCents: 0, active: true };

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);
}

export function ServicesManager() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const response = await fetch("/api/admin/services");
    if (response.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (!response.ok) throw new Error("Não foi possível carregar os serviços.");
    setServices((await response.json()) as Service[]);
  }

  useEffect(() => {
    async function initialize() {
      try {
        const response = await fetch("/api/admin/services");
        if (response.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (!response.ok) throw new Error("Não foi possível carregar os serviços.");
        setServices((await response.json()) as Service[]);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Falha ao carregar os serviços.");
      } finally {
        setLoading(false);
      }
    }
    void initialize();
  }, [router]);

  function startEdit(service: Service) {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description,
      durationMinutes: service.durationMinutes,
      priceCents: service.priceCents,
      active: service.active,
    });
    setMessage("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    try {
      const response = await fetch(editingId ? `/api/admin/services/${editingId}` : "/api/admin/services", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível salvar o serviço.");
      setForm(emptyForm);
      setEditingId(null);
      await load();
      setMessage("Serviço salvo com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar o serviço.");
    }
  }

  function update<K extends keyof ServiceForm>(key: K, value: ServiceForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function removeService(id: string) {
    setMessage("");
    try {
      const response = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível excluir o serviço.");
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      await load();
      setMessage("Serviço excluído.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível excluir o serviço.");
    }
  }

  return (
    <>
      <span className="eyebrow">Seu menu de cuidados</span>
      <h1>Serviços</h1>
      <p className="muted">Atualize tratamentos, duração e valores oferecidos.</p>
      {message && <p className="notice" role="status">{message}</p>}
      <section className="panel">
        <h2>{editingId ? "Editar serviço" : "Cadastrar serviço"}</h2>
        <form onSubmit={save}>
          <div className="form-row">
            <div className="field"><label htmlFor="service-name">Nome</label><input id="service-name" maxLength={100} minLength={2} onChange={(event) => update("name", event.target.value)} required value={form.name} /></div>
            <div className="field"><label htmlFor="service-duration">Duração (minutos)</label><input id="service-duration" max={480} min={15} onChange={(event) => update("durationMinutes", Number(event.target.value))} required type="number" value={form.durationMinutes} /></div>
          </div>
          <div className="form-row">
            <div className="field"><label htmlFor="service-price">Preço (R$)</label><input id="service-price" min="0" onChange={(event) => update("priceCents", Math.round(Number(event.target.value) * 100))} required step="0.01" type="number" value={(form.priceCents / 100).toFixed(2)} /></div>
            <div className="field"><label htmlFor="service-active">Disponibilidade</label><select id="service-active" onChange={(event) => update("active", event.target.value === "true")} value={String(form.active)}><option value="true">Ativo para agendamento</option><option value="false">Inativo</option></select></div>
          </div>
          <div className="field"><label htmlFor="service-description">Descrição</label><textarea id="service-description" maxLength={500} onChange={(event) => update("description", event.target.value)} value={form.description} /></div>
          <div className="button-row" style={{ justifyContent: "flex-start" }}>
            <button className="button" type="submit">{editingId ? "Salvar alterações" : "Adicionar serviço"}</button>
            {editingId && <button className="button secondary" onClick={() => { setEditingId(null); setForm(emptyForm); }} type="button">Cancelar edição</button>}
          </div>
        </form>
      </section>
      <section className="panel">
        <h2>Serviços cadastrados</h2>
        {loading ? <p className="muted">Carregando serviços...</p> : services.length === 0 ? <p className="muted">Nenhum serviço cadastrado.</p> : (
          <div className="service-admin-list">
            {services.map((service) => (
              <article className="service-admin-item" key={service.id}>
                <div><strong>{service.name}</strong> {!service.active && <span className="status">Inativo</span>}<p>{service.durationMinutes} min · {currency(service.priceCents)}{service.description && ` · ${service.description}`}</p></div>
                <div className="booking-actions">
                  <button className="small-button" onClick={() => startEdit(service)} type="button">Editar</button>
                  <button className="small-button danger" onClick={() => { void removeService(service.id); }} type="button">Excluir</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
