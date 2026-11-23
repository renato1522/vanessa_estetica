import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@vanessa.com";
  const password = process.env.ADMIN_PASSWORD;

  if (!password || password.length < 8) {
    throw new Error("Defina ADMIN_PASSWORD (com pelo menos 8 caracteres) antes de executar o seed.");
  }

  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash: await hash(password, 12) },
    create: { email, passwordHash: await hash(password, 12) },
  });
  await prisma.adminUser.deleteMany({ where: { email: "vanessa@example.com" } });

  const services = [
    {
      id: "lash-lifting-tintura",
      name: "Lash Lifting + Tintura",
      description: "Curvatura e tintura para realçar os cílios naturais.",
      durationMinutes: 60,
      priceCents: 13000,
    },
    {
      id: "brow-lamination",
      name: "Brow Lamination",
      description: "Alinhamento e definição para sobrancelhas marcantes.",
      durationMinutes: 50,
      priceCents: 12000,
    },
    {
      id: "extensao-fio-a-fio-natural",
      name: "Extensão de Cílios Fio a Fio Natural",
      description: "Extensão leve e delicada com acabamento natural.",
      durationMinutes: 90,
      priceCents: 16000,
    },
    {
      id: "design-sobrancelhas-personalizado",
      name: "Design de Sobrancelhas Personalizado",
      description: "Design sob medida para valorizar o formato do seu rosto.",
      durationMinutes: 30,
      priceCents: 5500,
    },
  ];

  await prisma.service.updateMany({
    where: { id: { in: ["Limpeza de pele", "Design de sobrancelhas", "Massagem relaxante"] } },
    data: { active: false },
  });

  for (const service of services) {
    await prisma.service.upsert({
      where: { id: service.id },
      update: { ...service, active: true },
      create: { ...service, active: true },
    });
  }

  for (let weekday = 0; weekday < 7; weekday += 1) {
    await prisma.businessHour.upsert({
      where: { weekday },
      update: {},
      create: {
        weekday,
        openMinute: 9 * 60,
        closeMinute: weekday === 6 ? 14 * 60 : 18 * 60,
        enabled: weekday !== 0,
      },
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error("Falha ao carregar os dados iniciais:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
