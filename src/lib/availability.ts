import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SLOT_INTERVAL_MINUTES = 30;
const TIME_ZONE = "America/Sao_Paulo";
type AvailabilityDb = Prisma.TransactionClient | typeof prisma;

function weekdayForDate(date: string) {
  return new Date(`${date}T12:00:00.000Z`).getUTCDay();
}

function isPastSlot(date: string, startMinute: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const today = `${value("year")}-${value("month")}-${value("day")}`;
  if (date !== today) return date < today;
  return startMinute <= Number(value("hour")) * 60 + Number(value("minute"));
}

export async function getAvailableSlots(
  date: string,
  serviceId: string,
  db: AvailabilityDb = prisma,
) {
  const [service, hours, blocked, bookings] = await Promise.all([
    db.service.findFirst({ where: { id: serviceId, active: true }, select: { durationMinutes: true } }),
    db.businessHour.findUnique({ where: { weekday: weekdayForDate(date) } }),
    db.scheduleBlock.findMany({
      where: { date },
      select: { startMinute: true, endMinute: true },
    }),
    db.booking.findMany({
      where: { date, status: { in: ["PENDING", "CONFIRMED"] } },
      select: { startMinute: true, endMinute: true },
    }),
  ]);

  if (!service || !hours?.enabled || blocked.some((block) => block.startMinute === null)) return [];

  const slots: number[] = [];
  for (
    let startMinute = hours.openMinute;
    startMinute + service.durationMinutes <= hours.closeMinute;
    startMinute += SLOT_INTERVAL_MINUTES
  ) {
    const endMinute = startMinute + service.durationMinutes;
    const overlaps = bookings.some(
      (booking) => startMinute < booking.endMinute && endMinute > booking.startMinute,
    );
    const overlapsBlock = blocked.some(
      (block) =>
        block.startMinute !== null &&
        block.endMinute !== null &&
        startMinute < block.endMinute &&
        endMinute > block.startMinute,
    );
    if (!overlaps && !overlapsBlock && !isPastSlot(date, startMinute)) slots.push(startMinute);
  }
  return slots;
}

export function formatMinute(minute: number) {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

export function toSaoPauloDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00-03:00`);
}

export function minuteFromTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
