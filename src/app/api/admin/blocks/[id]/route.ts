import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  const block = await prisma.scheduleBlock.findUnique({ where: { id } });
  if (!block) return NextResponse.json({ error: "Bloqueio não encontrado." }, { status: 404 });
  return NextResponse.json(block);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  try {
    await prisma.scheduleBlock.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Bloqueio não encontrado." }, { status: 404 });
    }
    throw error;
  }
  return NextResponse.json({ ok: true });
}
