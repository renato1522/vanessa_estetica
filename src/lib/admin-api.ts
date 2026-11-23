import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function requireAdminApi() {
  if (await getAdminSession()) return null;
  return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
}
