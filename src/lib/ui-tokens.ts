export const ui = {
  // Layout
  page: "min-h-screen bg-white text-[#0b0f0d]",
  container: "container-page",
  
  // Section
  sectionHero: "hero-gradient border-b border-[#edf1ee]",
  sectionMuted: "bg-[#f7f8f6]",
  sectionDark: "bg-[#020c0a]",
  
  // Cards
  card: "bg-white border border-[#dfe5e1] rounded-3xl shadow-sm",
  cardInteractive: "bg-white border border-[#dfe5e1] rounded-3xl shadow-sm hover:border-[#00d4a4] transition-all cursor-pointer",
  cardMuted: "bg-[#f7f8f6] border border-[#dfe5e1] rounded-3xl",
  
  // Typography
  h1: "text-4xl md:text-5xl lg:text-6xl font-black tracking-[-1.5px] text-[#0b0f0d]",
  h2: "text-2xl md:text-3xl font-black tracking-tight text-[#0b0f0d]",
  h3: "text-lg md:text-xl font-bold tracking-tight text-[#0b0f0d]",
  p: "text-base leading-relaxed text-[#47524d]",
  pMuted: "text-sm text-[#66736d]",
  label: "text-[10px] font-black uppercase tracking-[0.15em] text-[#8a9690]",
  
  // Buttons (Mapping to CSS classes in globals.css)
  buttonPrimary: "btn-primary", // Dark
  buttonAccent: "btn-accent",   // Green
  buttonSecondary: "btn-secondary", // Bordered white
  buttonDanger: "inline-flex items-center justify-center rounded-full bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-700 transition-all",
  
  // Inputs
  input: "w-full rounded-2xl border border-[#dfe5e1] bg-white px-5 py-3.5 text-sm font-bold text-[#0b0f0d] outline-none focus:border-[#00d4a4] focus:ring-1 focus:ring-[#00d4a4] transition-all placeholder:text-[#8a9690]",
  select: "w-full rounded-2xl border border-[#dfe5e1] bg-white px-5 py-3.5 text-sm font-black text-[#47524d] outline-none focus:border-[#00d4a4] transition-all cursor-pointer appearance-none",
  
  // Badges
  badge: "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider",
  badgeSuccess: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  badgeWarning: "bg-amber-50 text-amber-600 border border-amber-100",
  badgeDanger: "bg-red-50 text-red-600 border border-red-100",
  badgeNeutral: "bg-slate-50 text-slate-600 border border-slate-200",
  
  // Stats
  statValue: "text-3xl font-black tracking-tight text-[#0b0f0d]",
  statLabel: "text-[11px] font-black uppercase tracking-widest text-[#66736d]",
  
  // Tables
  tableHeader: "px-8 py-6 text-[10px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-left",
  tableRow: "group border-b border-[#edf1ee] hover:bg-[#fbfbf8] transition-colors",
  tableCell: "px-8 py-6 text-sm font-bold text-[#47524d]",
};
