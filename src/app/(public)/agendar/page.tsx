import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { BookingForm } from "@/components/BookingForm";
import { WhatsAppLink } from "@/components/WhatsAppLink";

export const instant = false;

type BookingPageProps = {
  searchParams: Promise<{ serviceId?: string | string[] }>;
};

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const { serviceId } = await searchParams;
  const initialServiceId = Array.isArray(serviceId) ? serviceId[0] : serviceId;

  return (
    <>
      <SiteHeader />
      <main className="page-wrap">
        <span className="eyebrow">Um tempinho para você</span>
        <h1 className="page-title">Agende seu atendimento</h1>
        <p className="muted">Escolha o serviço, encontre o melhor horário e deixe o resto com a gente.</p>
        <BookingForm initialServiceId={initialServiceId} />
      </main>
      <SiteFooter />
      <WhatsAppLink floating />
    </>
  );
}
