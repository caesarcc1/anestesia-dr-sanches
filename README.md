# Sistema de Gestão Anestésica Veterinária por Voz (Adote Vi.Ca / Dr. Daniel Sanches)

Sistema web mobile-first de alto rendimento para centros cirúrgicos veterinários de mutirões de castração e rotina clínica. Desenvolvido especialmente para o **Dr. Daniel Sanches (Sanka)** e a equipe do **Centro Cirúrgico Adote Vi.Ca**.

---

## 🎯 Funcionalidades Principais

1. **Cadastro Hands-Free por Voz no Celular:**
   - Botão de microfone estilo *Walkie-Talkie* para gravação rápida.
   - Compreensão de jargões cirúrgicos veterinários em português (*"propo"*, *"queta"*, *"OSH"*, *"orquio"*, etc.) com inteligência artificial **Gemini Flash**.
   - Preenchimento automático instantâneo com confirmação visual em 1 clique.
2. **Campos Completos & Novos Requisitos:**
   - Microchip, Espécie (CAN/FEL), Sexo (M/F), Peso (kg), Idade, **Nome do Animal** e **Raça** (SRD ou raça definida).
   - Anestesia com códigos oficiais: `[P]` Propofol, `[I]` Isoflurano, `[K]` Quetamina, `[X]` Xilazina, `[T]` Tramadol, `[VK]` Vitamina K, `[TM]` Transamin + Fármacos extras.
   - Medicação pós-operatória: `[A]` Agemoxi, `[M]` Meloxicam, `[D]` Dipirona.
   - Procedimentos: `[1]` ORQ (Orquiectomia), `[2]` OSH (Castração Fêmea), `[3]` Outros.
   - Alerta visual e auditoria de Intercorrências cirúrgicas e observações.
3. **Ficha Oficial em PDF Idêntica ao Modelo Físico:**
   - Layout fiel em A4 Paisagem (8 animais por página com quebra automática).
   - Cabeçalho institucional, tabela dividida com linha de observações, rodapé oficial com legenda e assinatura do veterinário responsável.
4. **Disparo Imediato para o WhatsApp:**
   - Integração com a *Web Share API* nativa do celular para compartilhar o PDF gerado diretamente no WhatsApp em 1 toque.
5. **Painel de Métricas (Dashboard):**
   - Total de animais operados (cães vs gatos, machos vs fêmeas, ORQ vs OSH).
   - Contagem exata de consumo e doses de cada fármaco anestésico.
   - Auditoria de intercorrências com exportação de dados em planilha Excel/CSV.
6. **Arquitetura Resiliente & Offline-First:**
   - Funciona mesmo se a internet oscilar no centro cirúrgico com sincronização automática no Supabase.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend / Fullstack:** Next.js 14 (App Router, TypeScript, React 18).
- **Estilização & UI:** Tailwind CSS, Lucide Icons, Shadcn UI primitives e paleta visual Vi.Ca.
- **Inteligência Artificial:** Google Gemini Flash API (`@google/generative-ai`).
- **Banco de Dados & Auth:** Supabase (PostgreSQL com RLS e triggers).
- **Motor de PDF:** `jspdf` e `jspdf-autotable`.
- **Hospedagem & Deploy:** Vercel + Repositório GitHub.

---

## 🚀 Como Executar Localmente

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env.local` baseado no `.env.example`:
   ```env
   # Google Gemini API (chave gratuita em https://aistudio.google.com/)
   GEMINI_API_KEY=sua_chave_gemini_aqui

   # Supabase (opcional para persistência em nuvem)
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse [http://localhost:3000](http://localhost:3000) no navegador ou pelo IP local no celular.

---

## 🗄️ Configuração do Banco de Dados no Supabase

Para ativar a persistência em nuvem multi-dispositivo:
1. Crie um projeto gratuito no [Supabase](https://supabase.com/).
2. Abra o **SQL Editor** no painel do Supabase.
3. Cole e execute o script localizado em [`supabase/schema.sql`](./supabase/schema.sql).
4. Copie a `Project URL` e `anon public API Key` para o seu `.env.local` e para as variáveis de ambiente da Vercel.

---

## ☁️ Deploy na Vercel

1. Suba o projeto para o GitHub:
   ```bash
   git add .
   git commit -m "feat: Sistema de Gestão Anestésica Adote Vi.Ca"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/anestesia-dr-sanches.git
   git push -u origin main
   ```
2. No painel da [Vercel](https://vercel.com/):
   - Clique em **"Add New Project"** e importe o repositório.
   - Adicione a variável de ambiente `GEMINI_API_KEY`.
   - Adicione `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Clique em **Deploy**.
