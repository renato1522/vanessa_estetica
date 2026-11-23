import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots, formatMinute } from "@/lib/availability";
import { prisma } from "@/lib/prisma";
import { dateSchema } from "@/lib/validations";
import { z } from "zod";

const querySchema = z.object({
  date: dateSchema,
  serviceId: z.string().min(1).max(100),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    date: request.nextUrl.searchParams.get("date"),
    serviceId: request.nextUrl.searchParams.get("serviceId"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Informe uma data e um serviço válidos." }, { status: 400 });
  }

  const service = await prisma.service.findFirst({
    where: { id: parsed.data.serviceId, active: true },
    select: { durationMinutes: true },
  });
  if (!service) return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });

  const slots = await getAvailableSlots(parsed.data.date, parsed.data.serviceId);
  return NextResponse.json(slots.map((minute) => ({ minute, time: formatMinute(minute) })));
}
