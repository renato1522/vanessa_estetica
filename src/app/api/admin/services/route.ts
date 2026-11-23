import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { serviceSchema } from "@/lib/validations";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  return NextResponse.json(await prisma.service.findMany({ orderBy: { name: "asc" } }));
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const payload: unknown = await request.json().catch(() => null);
  const parsed = serviceSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Confira os dados do serviço." }, { status: 400 });
  }
  return NextResponse.json(await prisma.service.create({ data: parsed.data }), { status: 201 });
}
