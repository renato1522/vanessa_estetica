export const ADMIN_SESSION_COOKIE = "vanessa_session";

export function getSessionSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET deve estar definido e conter pelo menos 32 caracteres.");
  }
  return new TextEncoder().encode(secret);
}
