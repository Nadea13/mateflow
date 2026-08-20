import Link from "next/link";
import { MateFlowLogo } from "@/components/brand/mateflow-logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Layers, 
  FileSpreadsheet, 
  BarChart3, 
  Warehouse, 
  FileText, 
  Receipt, 
  Users, 
  Lock, 
  Globe2, 
  RefreshCw,
  ChevronRight,
  Star,
  Check,
  TrendingUp,
  Cpu,
  Building2
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 antialiased overflow-x-hidden font-sans">
      
      {/* Dynamic Background Glow & Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-[25%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-cyan-500/15 via-blue-600/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-[35%] -left-[10%] w-[600px] h-[500px] bg-indigo-600/10 blur-[130px] rounded-full" />
        <div className="absolute top-[60%] -right-[10%] w-[600px] h-[500px] bg-cyan-600/10 blur-[130px] rounded-full" />
        <div 
          className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" 
        />
      </div>

      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#07090E]/75 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <MateFlowLogo size={34} textClassName="text-white" />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-cyan-400 transition-colors">ฟีเจอร์หลัก</a>
            <a href="#architecture" className="hover:text-cyan-400 transition-colors">สถาปัตยกรรมระบบ</a>
            <a href="#pricing" className="hover:text-cyan-400 transition-colors">แพ็กเกจ & ราคา</a>
            <a href="#security" className="hover:text-cyan-400 transition-colors">ความปลอดภัย</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] h-9 px-4">
                เข้าสู่ระบบ
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 border border-cyan-400/30 h-9 px-4 rounded-lg">
                เริ่มต้นใช้งานฟรี
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative z-10 pt-20 pb-24 md:pt-32 md:pb-36 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          
          {/* Badge Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 backdrop-blur-md shadow-inner text-cyan-300 text-xs font-medium tracking-wide animate-fade-in">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Next-Gen Omnichannel ERP & Smart Commerce System</span>
            <span className="w-1 h-1 rounded-full bg-cyan-400" />
            <span className="text-white font-semibold">v1.0 Ready</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.12]">
            บริหารจัดการธุรกิจครบวงจร <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
              ฉลาด รวดเร็ว และไร้รอยต่อ
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            ระบบ Backoffice ERP ที่ออกแบบมาเพื่อธุรกิจยุคใหม่ เชื่อมต่อคลังสินค้า, บิลใบกำกับภาษี e-Tax, บัญชีรายรับ-จ่าย และสิทธิ์ทีมงาน จบในแพลตฟอร์มเดียว
          </p>

          {/* CTA Group */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-xl shadow-cyan-500/25 rounded-xl gap-2 transition-all duration-200">
                เปิดร้านค้าและเริ่มใช้งาน
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#features" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base font-medium border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-200 rounded-xl backdrop-blur-sm">
                สำรวจระบบและฟังก์ชัน
              </Button>
            </a>
          </div>

          {/* Trust Highlights */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-xs font-medium text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>ทดลองใช้งานฟรี ไม่มีผูกมัด</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>รองรับ e-Tax Invoice & WHT มาตรฐานกรมสรรพากร</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Cloudflare Enterprise Security & R2 Storage</span>
            </div>
          </div>
        </div>

        {/* HERO APP PREVIEW / DASHBOARD MOCKUP */}
        <div className="mt-16 md:mt-24 relative max-w-5xl mx-auto">
          <div className="relative rounded-2xl border border-white/[0.12] bg-slate-950/80 p-2 sm:p-3 backdrop-blur-2xl shadow-[0_0_80px_-20px_rgba(6,182,212,0.25)]">
            <div className="relative rounded-xl overflow-hidden border border-slate-800/80 bg-[#0B0F19]">
              
              {/* Window Header */}
              <div className="h-10 bg-slate-900/90 border-b border-slate-800/80 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="text-[11px] font-mono text-slate-400 bg-slate-950/60 px-3 py-1 rounded-md border border-slate-800">
                  mateflow.io/dashboard/overview
                </div>
                <div className="w-12" />
              </div>

              {/* Mockup Dashboard Content */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
                    <div className="text-xs text-slate-400">ยอดขายรวมประจำเดือน</div>
                    <div className="text-2xl font-bold text-white mt-1">฿842,500.00</div>
                    <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3" /> +18.4% จากเดือนก่อน
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
                    <div className="text-xs text-slate-400">ใบเสร็จ / บิลที่ออกแล้ว</div>
                    <div className="text-2xl font-bold text-white mt-1">1,248 ใบ</div>
                    <div className="text-[11px] text-cyan-400 font-medium mt-1">e-Tax Generated 100%</div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
                    <div className="text-xs text-slate-400">สินค้าในคลังคงเหลือ</div>
                    <div className="text-2xl font-bold text-white mt-1">5,890 ชิ้น</div>
                    <div className="text-[11px] text-slate-400 mt-1">ข้าม 4 คลังสินค้าหลัก</div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
                    <div className="text-xs text-slate-400">กำไรสุทธิโดยประมาณ</div>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">฿312,800.00</div>
                    <div className="text-[11px] text-slate-400 mt-1">หักภาษี WHT เรียบร้อย</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 p-5 rounded-xl border border-slate-800 bg-slate-900/30 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm font-semibold text-white">ประสิทธิภาพรายได้และช่องทางการขาย (Omnichannel Sync)</div>
                      <Badge variant="outline" className="text-[10px] text-cyan-400 border-cyan-500/30">Live Realtime</Badge>
                    </div>
                    <div className="h-36 w-full flex items-end gap-3 pt-6 px-2">
                      {[40, 65, 45, 80, 55, 95, 75, 88, 92, 100].map((h, i) => (
                        <div key={i} className="flex-1 bg-gradient-to-t from-cyan-600/30 to-cyan-400 rounded-t-sm" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/30 space-y-3">
                    <div className="text-sm font-semibold text-white">ช่องทางที่เชื่อมต่อ</div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-300">Shopee Official</span>
                        <span className="text-emerald-400 font-medium">เชื่อมต่อแล้ว</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-300">Lazada Flagship</span>
                        <span className="text-emerald-400 font-medium">เชื่อมต่อแล้ว</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-300">TikTok Shop</span>
                        <span className="text-emerald-400 font-medium">เชื่อมต่อแล้ว</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE FEATURES GRID */}
      <section id="features" className="relative z-10 py-24 border-t border-white/[0.06] bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs uppercase font-bold tracking-widest text-cyan-400">Comprehensive Backoffice Solution</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">
              สร้างขึ้นเพื่อตอบสนองการทำงานจริงของร้านค้าและองค์กร
            </p>
            <p className="text-slate-400 text-sm sm:text-base">
              ทุกโมดูลถูกออกแบบอย่างประณีต เพื่อลดขั้นตอนซ้ำซ้อนและลดความผิดพลาดในการจัดการร้านค้า
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl border border-slate-800/80 bg-slate-900/30 hover:bg-slate-900/60 transition-all duration-300 group hover:border-cyan-500/40">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Receipt className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Smart Invoicing & e-Tax</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                ออกบิลใบเสร็จรับเงิน ใบกำกับภาษีเต็มรูป และใบหัก ณ ที่จ่าย (WHT) แบบอัตโนมัติ พร้อมส่งออกตามมาตรฐานกรมสรรพากร
              </p>
              <ul className="text-xs text-slate-300 space-y-2 border-t border-slate-800/60 pt-4">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-cyan-400" /> คำนวณ VAT 7% & ภาษี WHT อัตโนมัติ</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-cyan-400" /> Export PDF ใบเสร็จมาตรฐานสากล</li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl border border-slate-800/80 bg-slate-900/30 hover:bg-slate-900/60 transition-all duration-300 group hover:border-cyan-500/40">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Warehouse className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Multi-Location Inventory</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                บริหารสต็อกหลายคลังสินค้า รองรับการโอนย้ายสินค้าระหว่างสาขา ตรวจนับสต็อกแบบ Real-time และแจ้งเตือนของใกล้หมด
              </p>
              <ul className="text-xs text-slate-300 space-y-2 border-t border-slate-800/60 pt-4">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-cyan-400" /> บาร์โค้ด SKU และจัดการ Lot สินค้า</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-cyan-400" /> ใบสั่งซื้อ PO เชื่อมซัพพลายเออร์</li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl border border-slate-800/80 bg-slate-900/30 hover:bg-slate-900/60 transition-all duration-300 group hover:border-cyan-500/40">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Role-Based Team Control</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                แบ่งสิทธิ์ทีมงานอย่างปลอดภัย (Owner, Admin, Manager, Staff) กำหนดขอบเขตการดูรายรับและจัดการสินค้าได้อย่างอิสระ
              </p>
              <ul className="text-xs text-slate-300 space-y-2 border-t border-slate-800/60 pt-4">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-cyan-400" /> เข้าร่วมทีมผ่าน Store Invite Code</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-cyan-400" /> Audit Log ติดตามประวัติทุกรายการ</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* 4. ARCHITECTURE & TECH SPECS */}
      <section id="architecture" className="relative z-10 py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <Badge variant="outline" className="text-cyan-400 border-cyan-500/30 px-3 py-1">
                Enterprise-Grade Infrastructure
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                ขับเคลื่อนด้วยเทคโนโลยีระดับโลก เพื่อความเร็วและความปลอดภัยสูงสุด
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                สถาปัตยกรรมไร้รอยต่อระหว่าง Next.js 16, Supabase Distributed PostgreSQL และ Cloudflare Network ช่วยให้คุณจัดการธุรกรรมนับแสนรายการได้อย่างราบรื่น
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
                  <div className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
                    <Lock className="h-4 w-4 text-cyan-400" /> Cloudflare Turnstile
                  </div>
                  <p className="text-xs text-slate-400">ป้องกันบอทและการโจมตีโดยไม่สร้างความยุ่งยากให้ผู้ใช้งาน</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
                  <div className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
                    <Cpu className="h-4 w-4 text-cyan-400" /> Cloudflare R2
                  </div>
                  <p className="text-xs text-slate-400">จัดเก็บรูปภาพสินค้าความละเอียดสูง ไร้ค่า egress bandwidth</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
                  <div className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
                    <Globe2 className="h-4 w-4 text-cyan-400" /> Multi-Currency & i18n
                  </div>
                  <p className="text-xs text-slate-400">รองรับค่าเงิน THB/USD และสลับภาษา ไทย / อังกฤษ สมบูรณ์แบบ</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
                  <div className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
                    <ShieldCheck className="h-4 w-4 text-cyan-400" /> Stripe Billing Engine
                  </div>
                  <p className="text-xs text-slate-400">ระบบชำระเงินมาตรฐานโลก พร้อม Self-Service Customer Portal</p>
                </div>
              </div>
            </div>

            {/* Architecture Visual Diagram */}
            <div className="p-8 rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/80 space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">System Topology</div>
              
              <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-sm font-semibold text-white">Mateflow Core Frontend & Edge API</span>
                </div>
                <span className="text-xs font-mono text-cyan-400">Next.js 16 SSR</span>
              </div>

              <div className="w-0.5 h-4 bg-slate-800 mx-auto" />

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-center">
                  <div className="text-xs font-semibold text-white">Supabase PostgreSQL</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Dual-layer Auth & RBAC</div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-center">
                  <div className="text-xs font-semibold text-white">Cloudflare R2 & Edge</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Asset Storage & Analytics</div>
                </div>
              </div>

              <div className="w-0.5 h-4 bg-slate-800 mx-auto" />

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-semibold text-white">Payment & Marketplace Hub</span>
                </div>
                <span className="text-xs font-mono text-slate-400">Stripe / Shopee / Lazada</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. PRICING PLANS SECTION */}
      <section id="pricing" className="relative z-10 py-24 border-t border-white/[0.06] bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> Launch Special Promo
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              เลือกแพ็กเกจที่เหมาะสมกับขนาดธุรกิจของคุณ
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              เริ่มต้นได้ฟรีวันนี้ อัปเกรดเพื่อปลดล็อกฟังก์ชันขั้นสูงได้ตลอดเวลาโดยไม่มีสัญญาผูกมัด
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* Starter Plan */}
            <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/20 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Starter</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[36px]">เครื่องมือ ERP เริ่มต้นสำหรับเจ้าของคนเดียวและร้านค้าขนาดเล็ก</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">฿0</span>
                  <span className="text-xs text-slate-400">/ ตลอดชีพ</span>
                </div>
                <ul className="mt-8 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400" /> สร้างใบแจ้งหนี้สูงสุด 50 ใบ / เดือน</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400" /> เพิ่มสินค้าในแคตาล็อก 100 รายการ</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400" /> 1 คลังสินค้าหลัก & 1 เจ้าของร้าน</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400" /> ระบบตัดสต็อกและบันทึกรายจ่าย</li>
                </ul>
              </div>
              <Link href="/signup" className="mt-8">
                <Button variant="outline" className="w-full h-11 border-slate-800 hover:bg-slate-800 text-white font-medium">
                  เริ่มต้นใช้งานฟรี
                </Button>
              </Link>
            </div>

            {/* Business Pro Plan (Featured & 50% Promo) */}
            <div className="p-8 rounded-2xl border-2 border-cyan-500 bg-gradient-to-b from-cyan-950/30 to-slate-900/40 relative flex flex-col justify-between shadow-[0_0_50px_-15px_rgba(6,182,212,0.3)]">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-md">
                MOST POPULAR • ลด 50% 1 เดือน
              </div>
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  Business Pro
                </h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[36px]">ระบบอัตโนมัติเต็มรูปแบบ ไม่จำกัดบิล รองรับ e-Tax และทีมงานหลายคน</p>
                
                <div className="mt-6 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 line-through">฿590</span>
                    <Badge className="bg-rose-500 text-white text-[10px] font-extrabold">SAVE 50%</Badge>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-cyan-400">฿295</span>
                    <span className="text-xs text-slate-400">/ เดือนแรก (จากนั้น ฿590)</span>
                  </div>
                </div>

                <ul className="mt-8 space-y-3 text-xs text-slate-200 font-medium">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400" /> ออกใบเสร็จและใบแจ้งหนี้ <strong>ไม่จำกัด</strong></li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400" /> เพิ่มสินค้าและสแกนบาร์โค้ด <strong>ไม่จำกัด</strong></li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400" /> จัดการคลังสินค้าและสาขาได้สูงสุด 5 คลัง</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400" /> สิทธิ์ทีมงานสูงสุด 5 บัญชี (กำหนดบทบาทได้)</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400" /> ระบบ e-Tax Invoice และรายงานภาษี VAT</li>
                </ul>
              </div>
              <Link href="/signup" className="mt-8">
                <Button className="w-full h-11 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
                  อัปเกรดเป็น Business Pro
                </Button>
              </Link>
            </div>

            {/* Enterprise Scale Plan */}
            <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/20 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Enterprise Scale</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[36px]">สำหรับธุรกิจที่ต้องการขยายสาขา คลังสินค้า 3PL และ Developer API</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">฿1,890</span>
                  <span className="text-xs text-slate-400">/ เดือน</span>
                </div>
                <ul className="mt-8 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400" /> ได้รับทุกฟีเจอร์ใน Business Pro</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400" /> สิทธิ์ทีมงานและบทบาทกำหนดเอง <strong>ไม่จำกัด</strong></li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400" /> ศูนย์กระจายสินค้า 3PL <strong>ไม่จำกัดสาขา</strong></li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400" /> สิทธิ์เข้าถึง Developer API และ Webhooks</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400" /> ผู้ดูแลระบบและ SLA ดูแลโดยเฉพาะ</li>
                </ul>
              </div>
              <Link href="/signup" className="mt-8">
                <Button variant="outline" className="w-full h-11 border-slate-800 hover:bg-slate-800 text-white font-medium">
                  ติดต่อฝ่ายขาย / เริ่มต้น Scale
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 6. FINAL CALL TO ACTION (FOOTER CTA) */}
      <section className="relative z-10 py-24 border-t border-white/[0.06] overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            ยกระดับการจัดการธุรกิจของคุณวันนี้ด้วย Mateflow
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            เข้าร่วมกับผู้ประกอบการและร้านค้าที่วางใจในระบบ ERP ของเรา สมัครสมาชิกง่ายๆ ใน 30 วินาที
          </p>
          <div className="pt-2">
            <Link href="/signup">
              <Button size="lg" className="h-12 px-9 text-base font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-xl shadow-cyan-500/25 rounded-xl gap-2">
                เปิดบัญชีร้านค้าฟรีทันที
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-[#04060A] py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <MateFlowLogo size={24} textClassName="text-slate-400" />
            <span>© 2026 Mateflow Inc. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-slate-400">
            <Link href="/login" className="hover:text-white transition-colors">เข้าสู่ระบบ</Link>
            <Link href="/signup" className="hover:text-white transition-colors">ลงทะเบียนร้านค้า</Link>
            <a href="#privacy" className="hover:text-white transition-colors">นโยบายความเป็นส่วนตัว</a>
            <a href="#terms" className="hover:text-white transition-colors">เงื่อนไขการให้บริการ</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
