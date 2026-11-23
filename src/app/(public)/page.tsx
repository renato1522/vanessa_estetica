import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/Reveal";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { WhatsAppLink } from "@/components/WhatsAppLink";

export const instant = false;

const weekdays = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

function formatMinute(minute: number) {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceCents / 100);
}

export default async function Home() {
  await connection();
  const [services, businessHours] = await Promise.all([
    prisma.service.findMany({
      where: { active: true },
      orderBy: [{ name: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        durationMinutes: true,
        priceCents: true,
      },
    }),
    prisma.businessHour.findMany({ orderBy: { weekday: "asc" } }),
  ]);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="hero-copy-column">
            <Reveal>
              <span className="eyebrow">Vanessa Carla · Estética & cuidado</span>
              <h1>
                Realce sua <em>beleza natural.</em>
              </h1>
              <p className="hero-copy">
                Cílios e sobrancelhas com cuidado, delicadeza e resultados que
                valorizam quem você é.
              </p>
              <div className="hero-actions">
                <Link className="button" href="/agendar">
                  Agendar Horário <span aria-hidden="true">&nbsp;→</span>
                </Link>
                <WhatsAppLink />
              </div>
            </Reveal>
          </div>
          <div className="hero-art" aria-hidden="true">
            <span className="art-flower">✿</span>
            <span className="hero-art-caption">Beleza com naturalidade</span>
          </div>
        </section>

        <section className="section" id="servicos">
          <Reveal className="section-heading">
            <span className="eyebrow">Cuidado em cada detalhe</span>
            <h2>Um cuidado só seu</h2>
            <p>
              Conheça os serviços e reserve seu momento com praticidade. Cada
              atendimento é feito com atenção à sua beleza natural.
            </p>
          </Reveal>
          {services.length ? (
            <div className="service-grid">
              {services.map((service, index) => (
                <Reveal className="service-reveal" delay={index * 75} key={service.id}>
                  <article className="service-card">
                    <span className="service-icon" aria-hidden="true">✧</span>
                    <h3>{service.name}</h3>
                    <p>{service.description}</p>
                    <div className="service-meta">
                      <span>{service.durationMinutes} min</span>
                      <strong>{service.priceCents > 0 ? formatPrice(service.priceCents) : "Sob consulta"}</strong>
                    </div>
                    <Link
                      className="service-book-button"
                      href={`/agendar?serviceId=${encodeURIComponent(service.id)}`}
                    >
                      Agendar
                    </Link>
                  </article>
                </Reveal>
              ))}
            </div>
          ) : (
            <p className="notice services-empty">
              Os serviços estarão disponíveis para agendamento em breve.
            </p>
          )}
        </section>

        <section className="section schedule-section" id="horarios">
          <Reveal className="section-heading">
            <span className="eyebrow">Planeje seu momento</span>
            <h2>Horários de atendimento</h2>
            <p>Consulte o expediente atualizado e escolha o melhor horário para você.</p>
          </Reveal>
          {businessHours.length ? (
            <div className="business-hours-list">
              {businessHours.map((hours) => (
                <div className="business-hours-item" key={hours.weekday}>
                  <span>{weekdays[hours.weekday] ?? "Dia da semana"}</span>
                  <strong className={hours.enabled ? "" : "hours-closed"}>
                    {hours.enabled
                      ? `${formatMinute(hours.openMinute)} – ${formatMinute(hours.closeMinute)}`
                      : "Fechado"}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="notice services-empty">
              Os horários de atendimento serão divulgados em breve.
            </p>
          )}
        </section>

        <section className="section about-section" id="sobre">
          <Reveal className="section-heading">
            <span className="eyebrow">Prazer, Vanessa</span>
            <h2>Beleza que respeita sua essência</h2>
            <p>
              Especialista em cílios, Lash Lifting e Brow Lamination. Um
              atendimento cuidadoso, pensado para valorizar seus traços com
              leveza e naturalidade.
            </p>
          </Reveal>
        </section>

        <section className="section contact-section" id="contato">
          <Reveal className="contact-content">
            <span className="eyebrow">Vamos conversar?</span>
            <h2>Seu próximo momento de cuidado começa aqui.</h2>
            <p>
              Consulte os serviços e solicite seu horário. A Vanessa entrará em
              contato para confirmar o atendimento.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/agendar">Agendar atendimento</Link>
              <WhatsAppLink />
            </div>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
      <WhatsAppLink floating />
    </>
  );
}
