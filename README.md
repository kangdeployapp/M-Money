# WealthPilot - Financial Navigator 🧭 💰

เว็บแอปพลิเคชันเพื่อการบริหารการเงินส่วนบุคคลแบบ Progressive Web App (PWA) ครบวงจร เน้นยุทธศาสตร์การปลดหนี้ (Avalanche / Snowball), การบริหารเงินออมตามเป้าหมาย (Goal-based Savings), การจัดสรรกระแสเงินสดตามหลัก 50/30/20, และที่ปรึกษาการเงินอัจฉริยะ (AI Financial Advisor) มาตรฐาน Certified Financial Planner (CFP) เมนูภาษาไทย 100%

---

## ✨ ฟีเจอร์หลัก (Key Features)

1. **ภาพรวมการเงิน (Dashboard):**
   - คำนวณความมั่งคั่งสุทธิ (Net Worth) แบบเรียลไทม์
   - วิเคราะห์กระแสเงินสดคงเหลือสุทธิ (Disposable Cash Gauge)
   - สรุปสัดส่วนภาระผูกพันคงที่เทียบกับรายได้รวม
   - แนะนำการจัดสรรเงินส่วนเกินตามสูตรมาตรฐาน 50/30/20

2. **ยุทธศาสตร์ปลดหนี้ (Debt Payoff Simulator):**
   - เปรียบเทียบ 2 กลยุทธ์ปลดหนี้ระดับโลก:
     - **Debt Avalanche:** เรียงลำดับจากดอกเบี้ยสูงสุดก่อน ประหยัดดอกเบี้ยได้สูงสุดทางคณิตศาสตร์
     - **Debt Snowball:** เรียงลำดับจากยอดหนี้เล็กสุดก่อน สร้างกำลังใจและปลดหนี้ก้อนแรกได้เร็วที่สุด
   - ตัวเร่งสปีดการปลดหนี้ (Extra Monthly Accelerator Slider)
   - กราฟจำลองการทยอยลดลงของหนี้ (Amortization Schedule) ด้วย Recharts
   - ลำดับขั้นความสำเร็จ (Payoff Milestones Timeline)

3. **เป้าหมายการออมเงิน (Goal-based Savings):**
   - คำนวณจำนวนเงินที่ต้องสะสมเพิ่มต่อเดือน: `(target - current) / remaining_months`
   - แถบสถานะความคืบหน้า (เป็นไปตามแผน / ล่าช้ากว่าเป้าหมาย / สำเร็จแล้ว)
   - ฟังก์ชันบันทึกเงินออมเพิ่ม (Quick Deposit)

4. **ที่ปรึกษา AI (AI Financial Advisor):**
   - พัฒนาด้วย Vercel AI SDK (`generateObject` + Zod Schema) รองรับ Google Gemini และ OpenAI
   - ประเมินคะแนนสุขภาพทางการเงิน 1-100 (Financial Health Score)
   - แผนปฏิบัติการจัดสรรเงินส่วนเกินประจำเดือน (Monthly Action Plan)
   - 3 แอ็กชันด่วนที่สุดสำหรับเดือนนี้ (Top 3 Urgent Financial Moves)
   - ระบบ Smart Deterministic Fallback ทำงานได้ต่อเนื่อง 100% แม้ไม่มี API Key

5. **รองรับ PWA & ออฟไลน์ (Offline-Ready PWA):**
   - ติดตั้งบนมือถือ (iOS/Android) และ Desktop เหมือนแอปพลิเคชัน Native
   - รองรับ Service Worker Caching UI Shell และ Web Manifest
   - ไอคอนความละเอียดสูง Maskable Icon 192x192 และ 512x512

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS, Lucide React, Recharts
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security)
- **Supabase Client:** `@supabase/ssr` + `@supabase/supabase-js`
- **PWA:** `@ducanh2912/next-pwa`
- **AI Engine:** Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/openai`, `zod`)

---

## 🚀 วิธีการติดตั้งและรันในเครื่อง (Local Setup)

1. **ติดตั้ง Dependencies:**
   ```bash
   npm install
   ```

2. **ตั้งค่า Environment Variables:**
   คัดลอกไฟล์ `.env.example` เป็น `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   ระบุค่า:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

   # ใส่คีย์ AI อย่างใดอย่างหนึ่ง (Google Gemini หรือ OpenAI):
   GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
   OPENAI_API_KEY=your-openai-api-key
   ```

3. **รัน Migration บน Supabase:**
   เปิด Supabase SQL Editor แล้วนำโค้ดในไฟล์ `supabase/migrations/001_initial_schema.sql` ไปรันเพื่อสร้างตารางพร้อมเปิดใช้ RLS Policies

4. **เริ่มรันโหมดพัฒนา:**
   ```bash
   npm run dev
   ```
   เข้าใช้งานผ่านเบราว์เซอร์ที่: [http://localhost:3000](http://localhost:3000)

5. **ทดสอบ Build สำหรับ Production:**
   ```bash
   npm run build
   npm start
   ```

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
├── app/
│   ├── api/advisor/route.ts       # POST API สำหรับ AI Financial Advisor
│   ├── dashboard/page.tsx         # หน้าสรุปภาพรวม Net Worth, Cash Flow & 50/30/20
│   ├── debts/page.tsx             # หน้ายุทธศาสตร์ปลดหนี้ Avalanche vs Snowball
│   ├── goals/page.tsx             # หน้าเป้าหมายเงินออม Goal-based Savings
│   ├── advisor/page.tsx           # หน้าที่ปรึกษาการเงินอัจฉริยะ AI
│   ├── layout.tsx                 # Root Layout + PWA Metadata + Kanit Font
│   └── globals.css                # Tailwind Dark Theme Styles
├── components/
│   ├── Navbar.tsx                 # เมนูนำทางภาษาไทย (Desktop + Mobile PWA Bar)
│   └── DataStoreContext.tsx       # React Context จัดการข้อมูล & Sync ข้อมูล
├── lib/
│   ├── finance/
│   │   ├── debt.ts                # Debt Avalanche & Snowball Algorithms
│   │   ├── savings.ts             # Savings Goal Calculator
│   │   └── budget.ts              # Cash Flow & 50/30/20 Allocation
│   ├── supabase/
│   │   ├── client.ts              # Browser Supabase Client (@supabase/ssr)
│   │   └── server.ts              # Server Supabase Client (@supabase/ssr)
│   └── utils.ts                   # Thai Currency & Date Formatters
├── public/
│   ├── manifest.json              # PWA Web App Manifest
│   ├── sw.js                      # Generated Service Worker
│   └── icons/                     # PWA Icons (192x192, 512x512, favicon)
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql # Complete Supabase SQL Schema with RLS
```
