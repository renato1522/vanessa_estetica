import { z } from "zod";

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Data inválida");

export const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Horário inválido");

export const appointmentSchema = z.object({
  serviceId: z.string().min(1).max(100),
  clientName: z.string().trim().min(2).max(100),
  clientPhone: z.string().trim().min(8).max(30),
  date: dateSchema,
  time: timeSchema,
  notes: z.string().trim().max(500).optional().default(""),
  email: z.union([z.string().trim().email().max(254), z.literal("")]).optional().default(""),
});

export const bookingStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "REJECTED", "CANCELLED"]),
});

export const serviceSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).default(""),
  durationMinutes: z.number().int().min(15).max(480),
  priceCents: z.number().int().min(0).max(10000000),
  active: z.boolean().default(true),
});

export const businessHoursSchema = z
  .array(
    z.object({
      weekday: z.number().int().min(0).max(6),
      openMinute: z.number().int().min(0).max(1439),
      closeMinute: z.number().int().min(1).max(1440),
      enabled: z.boolean(),
    }),
  )
  .length(7)
  .refine(
    (hours) =>
      new Set(hours.map((hour) => hour.weekday)).size === 7 &&
      hours.every((hour) => !hour.enabled || hour.closeMinute > hour.openMinute),
    "Configure um horário válido para cada dia da semana.",
  );

export const scheduleBlockSchema = z
  .object({
    date: dateSchema,
    startTime: timeSchema.optional(),
    endTime: timeSchema.optional(),
    reason: z.string().trim().max(200).default(""),
  })
  .refine(
    (block) =>
      Boolean(block.startTime) === Boolean(block.endTime) &&
      (!block.startTime ||
        !block.endTime ||
        block.endTime > block.startTime),
    "Informe início e fim válidos para um bloqueio por horário.",
  );
