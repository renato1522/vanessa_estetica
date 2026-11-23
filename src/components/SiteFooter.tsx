import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link className="brand footer-brand" href="/">
        Vanessa Carla <small>Estética & cuidado</small>
      </Link>
      <small className="footer-copyright">
        © {new Date().getFullYear()} Vanessa Carla. Todos os direitos reservados.
      </small>
      <Link className="footer-admin-link" href="/admin/login">
        Acesso administrativo
      </Link>
    </footer>
  );
}
