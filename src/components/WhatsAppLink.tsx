type WhatsAppLinkProps = {
  floating?: boolean;
};

export function WhatsAppLink({ floating = false }: WhatsAppLinkProps) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  const message = encodeURIComponent(
    "Olá, Vanessa! Gostaria de saber mais sobre os atendimentos de cílios e sobrancelhas.",
  );
  const href = number
    ? `https://wa.me/${number}?text=${message}`
    : `https://wa.me/?text=${message}`;

  return (
    <a
      aria-label="Fale com Vanessa pelo WhatsApp"
      className={`whatsapp-link${floating ? " whatsapp-floating" : ""}`}
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path
          d="M20.2 11.7a8.2 8.2 0 0 1-12.1 7.2L3 20l1.2-4.9a8.2 8.2 0 1 1 16-3.4Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
        <path
          d="M8.8 8.3c.2-.5.4-.5.7-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.2.1.4 0 .6l-.5.6c-.2.2-.2.4 0 .6.4.7 1 1.3 1.7 1.7.2.1.4.1.6-.1l.6-.7c.2-.2.4-.2.6-.1l1.5.7c.3.1.4.3.4.5 0 .3-.2 1.1-.7 1.5-.5.5-1.2.7-1.9.5-.7-.2-1.6-.5-2.7-1.5-1.4-1.2-2.3-2.8-2.5-3.5-.2-.7 0-1.4.5-2Z"
          fill="currentColor"
        />
      </svg>
      <span>{floating ? "Fale pelo WhatsApp" : "WhatsApp"}</span>
    </a>
  );
}
