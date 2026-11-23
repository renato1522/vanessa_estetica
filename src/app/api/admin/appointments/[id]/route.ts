import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { bookingStatusSchema } from "@/lib/validations";

const CONFLICT_MESSAGE = "Este horário conflita com outro atendimento confirmado ou bloqueio de agenda.";
type RouteContext = { params: Promise<{ id: string }> };

function isWriteConflict(error: unknown) {
  return (
    (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") ||
    (error instanceof Error && /database is locked|SQLITE_BUSY/i.test(error.message))
  );
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const payload: unknown = await request.json().catch(() => null);
  const parsed = bookingStatusSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }
  const { id } = await context.params;

  const result = await prisma
    .$transaction(async (tx) => {
      const current = await tx.booking.findUnique({ where: { id } });
      if (!current) return { kind: "not-found" as const };

      if (parsed.data.status === "CONFIRMED") {
        const [conflict, block] = await Promise.all([
          tx.booking.findFirst({
            where: {
              id: { not: id },
              date: current.date,
              status: "CONFIRMED",
              startMinute: { lt: current.endMinute },
              endMinute: { gt: current.startMinute },
            },
            select: { id: true },
          }),
          tx.scheduleBlock.findFirst({
            where: {
              date: current.date,
              OR: [
                { startMinute: null },
                {
                  startMinute: { lt: current.endMinute },
                  endMinute: { gt: current.startMinute },
                },
              ],
            },
            select: { id: true },
          }),
        ]);
        if (conflict || block) return { kind: "conflict" as const };
      }

      const appointment = await tx.booking.update({
        where: { id },
        data: { status: parsed.data.status },
        include: { service: true },
      });
      return { kind: "updated" as const, appointment };
    })
    .catch((error: unknown) => {
      if (isWriteConflict(error)) return { kind: "conflict" as const };
      throw error;
    });

  if (result.kind === "not-found") {
    return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }
  if (result.kind === "conflict") {
    return NextResponse.json({ error: CONFLICT_MESSAGE }, { status: 409 });
  }
  return NextResponse.json(result.appointment);
}
