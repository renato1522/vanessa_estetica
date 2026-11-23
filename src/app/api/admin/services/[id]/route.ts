import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { serviceSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
  return NextResponse.json(service);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const payload: unknown = await request.json().catch(() => null);
  const parsed = serviceSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Confira os dados do serviço." }, { status: 400 });
  }
  const { id } = await context.params;
  const exists = await prisma.service.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
  return NextResponse.json(await prisma.service.update({ where: { id }, data: parsed.data }));
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  try {
    await prisma.service.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json(
        { error: "Não é possível excluir um serviço que já possui agendamentos. Desative-o em vez disso." },
        { status: 409 },
      );
    }
    throw error;
  }
  return NextResponse.json({ ok: true });
}
