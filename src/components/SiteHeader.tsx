import Link from "next/link";
import { ProfileAvatar } from "@/components/ProfileAvatar";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand site-brand" href="/">
        <ProfileAvatar />
        <span className="site-brand-copy">
          Vanessa Carla
          <small>Estética & cuidado</small>
        </span>
      </Link>
      <nav className="nav-links" aria-label="Navegação principal">
        <Link href="/#servicos">Serviços</Link>
        <Link href="/#horarios">Horários</Link>
        <Link href="/#contato">Contato</Link>
        <Link className="button" href="/agendar">
          Agendar Horário
        </Link>
      </nav>
    </header>
  );
}
