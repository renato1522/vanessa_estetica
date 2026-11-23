# Agendamento Vanessa

Aplicação de agendamentos para Vanessa Carla Estética, construída com Next.js, Prisma e SQLite.

## Preparar ambiente

1. Instale o Node.js 20.9 ou superior.
2. Copie `.env.example` para `.env` e defina `ADMIN_PASSWORD` e `AUTH_SECRET`. Use uma senha forte e uma chave aleatória com pelo menos 32 caracteres. O administrador criado pelo seed é `admin@vanessa.com`.
   Opcionalmente, defina `NEXT_PUBLIC_WHATSAPP_NUMBER` com o número completo incluindo código do país e DDD, somente dígitos, para que os atalhos abram diretamente a conversa. Sem essa configuração, o WhatsApp abre com a mensagem pronta para escolher um contato.
3. Instale as dependências e crie o banco com os dados iniciais:

   ```bash
   npm install
   npm run db:setup
   ```

4. Inicie o servidor local:

   ```bash
   npm run dev
   ```

A página dos clientes fica em `http://localhost:3000`; o acesso administrativo fica em `http://localhost:3000/admin/login`.

O seed cria o administrador, os quatro serviços de estética e o expediente padrão (segunda a sábado). Para atualizar a senha, altere `ADMIN_PASSWORD` e execute `npm run db:seed`.

## Funcionalidades

- Página pública com apresentação e serviços.
- Reserva em etapas, com cálculo de disponibilidade, duração do serviço, bloqueios e conflitos de horário verificados novamente dentro de transação.
- Pedidos de agendamento ficam pendentes até a confirmação da Vanessa.
- Painel administrativo com confirmação/recusa, cadastro de serviços, expediente e bloqueio de datas.
- Sessão administrativa em cookie HTTP-only, assinatura `AUTH_SECRET` e senha armazenada com hash bcrypt.
- APIs públicas e administrativas documentadas pelo próprio contrato REST (`/api/services`, `/api/availability`, `/api/appointments` e `/api/admin/*`).

SQLite é indicado para desenvolvimento e instalações simples em um único servidor. Para publicar em ambiente com múltiplas instâncias, configure um banco de dados compartilhado e uma estratégia de deploy/migrações adequada.
