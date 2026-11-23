import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots, minuteFromTime, toSaoPauloDateTime } from "@/lib/availability";
import { prisma } from "@/lib/prisma";
import { appointmentSchema } from "@/lib/validations";

const CONFLICT_MESSAGE = "Este horário acabou de ser preenchido. Por favor, escolha outro.";

function isWriteConflict(error: unknown) {
  return (
    (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") ||
    (error instanceof Error && /database is locked|SQLITE_BUSY/i.test(error.message))
  );
}

export async function POST(request: NextRequest) {
  const payload: unknown = await request.json().catch(() => null);
  const parsed = appointmentSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Confira nome, telefone, serviço, data e horário do agendamento." },
      { status: 400 },
    );
  }

  const { serviceId, clientName, clientPhone, date, time, notes, email } = parsed.data;
  const startMinute = minuteFromTime(time);
  const result = await prisma
    .$transaction(async (tx) => {
      const service = await tx.service.findFirst({
        where: { id: serviceId, active: true },
        select: { durationMinutes: true },
      });
      if (!service) return { kind: "service-not-found" as const };

      const slots = await getAvailableSlots(date, serviceId, tx);
      if (!slots.includes(startMinute)) return { kind: "conflict" as const };

      const startDateTime = toSaoPauloDateTime(date, time);
      const endDateTime = new Date(startDateTime.getTime() + service.durationMinutes * 60_000);
      const booking = await tx.booking.create({
        data: {
          customerName: clientName,
          phone: clientPhone,
          email,
          notes,
          date,
          startMinute,
          endMinute: startMinute + service.durationMinutes,
          startDateTime,
          endDateTime,
          serviceId,
          status: "PENDING",
        },
        include: { service: true },
      });
      return { kind: "created" as const, booking };
    })
    .catch((error: unknown) => {
      if (isWriteConflict(error)) return { kind: "conflict" as const };
      throw error;
    });

  if (result.kind === "service-not-found") {
    return NextResponse.json({ error: "Serviço não encontrado ou inativo." }, { status: 404 });
  }
  if (result.kind === "conflict") {
    return NextResponse.json({ error: CONFLICT_MESSAGE }, { status: 409 });
  }
  return NextResponse.json(result.booking, { status: 201 });
}
