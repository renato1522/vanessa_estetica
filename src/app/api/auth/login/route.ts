import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  const payload: unknown = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Informe seu e-mail e senha." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !(await compare(parsed.data.password, admin.passwordHash))) {
    return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  }

  await createAdminSession(admin.id);
  return NextResponse.json({ ok: true });
}
