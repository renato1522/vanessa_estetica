import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { businessHoursSchema } from "@/lib/validations";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const hours = await prisma.businessHour.findMany({ orderBy: { weekday: "asc" } });
  return NextResponse.json({ hours });
}

export async function PUT(request: NextRequest) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const payload: unknown = await request.json().catch(() => null);
  const parsed = businessHoursSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Configure horários válidos para os sete dias." }, { status: 400 });
  }

  await prisma.$transaction(
    parsed.data.map((hour) =>
      prisma.businessHour.upsert({
        where: { weekday: hour.weekday },
        update: hour,
        create: hour,
      }),
    ),
  );
  return NextResponse.json({ ok: true });
}
