import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { minuteFromTime } from "@/lib/availability";
import { prisma } from "@/lib/prisma";
import { scheduleBlockSchema } from "@/lib/validations";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  return NextResponse.json(await prisma.scheduleBlock.findMany({ orderBy: [{ date: "asc" }, { startMinute: "asc" }] }));
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const payload: unknown = await request.json().catch(() => null);
  const parsed = scheduleBlockSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Informe uma data e, para bloqueios parciais, início e fim válidos." }, { status: 400 });
  }

  const block = await prisma.scheduleBlock.create({
    data: {
      date: parsed.data.date,
      startMinute: parsed.data.startTime ? minuteFromTime(parsed.data.startTime) : null,
      endMinute: parsed.data.endTime ? minuteFromTime(parsed.data.endTime) : null,
      reason: parsed.data.reason,
    },
  });
  return NextResponse.json(block, { status: 201 });
}
