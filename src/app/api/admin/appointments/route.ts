import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { dateSchema } from "@/lib/validations";
import { z } from "zod";

const statusSchema = z.enum(["PENDING", "CONFIRMED", "REJECTED", "CANCELED", "CANCELLED"]);

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const date = request.nextUrl.searchParams.get("date");
  const status = request.nextUrl.searchParams.get("status");
  const filters: { date?: string; status?: z.infer<typeof statusSchema> } = {};
  if (date) {
    const parsedDate = dateSchema.safeParse(date);
    if (!parsedDate.success) {
      return NextResponse.json({ error: "Filtro de data inválido." }, { status: 400 });
    }
    filters.date = parsedDate.data;
  }
  if (status) {
    const parsedStatus = statusSchema.safeParse(status);
    if (!parsedStatus.success) {
      return NextResponse.json({ error: "Filtro de status inválido." }, { status: 400 });
    }
    filters.status = parsedStatus.data;
  }

  const appointments = await prisma.booking.findMany({
    where: filters,
    include: { service: true },
    orderBy: [{ date: "asc" }, { startMinute: "asc" }],
  });
  return NextResponse.json(appointments);
}
