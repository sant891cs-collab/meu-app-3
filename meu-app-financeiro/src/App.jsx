import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Bell, Crown, Shield, LogOut, Sparkles, Paperclip, Mic, Image, Camera, X, Square, Trash2
} from "lucide-react";
import * as d3 from "d3-shape";
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area, XAxis, YAxis
} from "recharts";
import { supabase } from "./supabase";

// =====================================================
// LIQUID GLASS — ESTILOS BASE INJETADOS
// =====================================================
const LG_STYLES = `
  @keyframes liquidShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes shimmer {
    0%   { transform: translateX(-100%) skewX(-15deg); }
    100% { transform: translateX(300%) skewX(-15deg); }
  }
  .lg-bg {
    background: linear-gradient(135deg,
      #0a1628 0%,
      #0d2344 20%,
      #0a2550 40%,
      #071a38 60%,
      #0d1f3c 80%,
      #0a1628 100%
    );
    background-size: 400% 400%;
    animation: liquidShift 18s ease infinite;
  }
  .lg-card {
    background: rgba(255,255,255,0.08);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(255,255,255,0.18);
    box-shadow:
      0 8px 32px rgba(0,0,0,0.35),
      inset 0 1px 0 rgba(255,255,255,0.22),
      inset 0 -1px 0 rgba(255,255,255,0.06);
    border-radius: 24px;
    position: relative;
    overflow: hidden;
  }
  .lg-card::before {
    content: '';
    position: absolute;
    top: 0; left: -60%;
    width: 40%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
    animation: shimmer 6s ease-in-out infinite;
    pointer-events: none;
  }
  .lg-card-solid {
    background: rgba(255,255,255,0.11);
    backdrop-filter: blur(32px) saturate(200%);
    -webkit-backdrop-filter: blur(32px) saturate(200%);
    border: 1px solid rgba(255,255,255,0.2);
    box-shadow:
      0 12px 40px rgba(0,0,0,0.4),
      inset 0 1px 0 rgba(255,255,255,0.28),
      inset 0 -1px 0 rgba(255,255,255,0.06);
    border-radius: 28px;
  }
  .lg-btn {
    background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.25);
    box-shadow:
      0 4px 16px rgba(0,0,0,0.25),
      inset 0 1px 0 rgba(255,255,255,0.3);
    color: white;
    border-radius: 16px;
    transition: all 0.2s ease;
  }
  .lg-btn:active {
    transform: scale(0.96);
    box-shadow: 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2);
  }
  .lg-btn-green {
    background: linear-gradient(135deg, rgba(16,185,129,0.75) 0%, rgba(5,150,105,0.6) 100%);
    border: 1px solid rgba(52,211,153,0.45);
    box-shadow: 0 4px 16px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.25);
  }
  .lg-btn-red {
    background: linear-gradient(135deg, rgba(239,68,68,0.75) 0%, rgba(220,38,38,0.6) 100%);
    border: 1px solid rgba(252,165,165,0.4);
    box-shadow: 0 4px 16px rgba(239,68,68,0.3), inset 0 1px 0 rgba(255,255,255,0.25);
  }
  .lg-btn-dark {
    background: linear-gradient(135deg, rgba(30,58,138,0.85) 0%, rgba(15,39,71,0.9) 100%);
    border: 1px solid rgba(147,197,253,0.2);
    box-shadow: 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15);
  }
  .lg-btn-secondary {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: rgba(255,255,255,0.8);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.15);
  }
  .lg-btn-destructive {
    background: linear-gradient(135deg, rgba(239,68,68,0.7) 0%, rgba(185,28,28,0.7) 100%);
    border: 1px solid rgba(252,165,165,0.35);
    box-shadow: 0 4px 12px rgba(239,68,68,0.25), inset 0 1px 0 rgba(255,255,255,0.2);
  }
  .lg-input {
    background: rgba(255,255,255,0.08) !important;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.2) !important;
    color: white !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.2);
    border-radius: 14px !important;
  }
  .lg-input::placeholder { color: rgba(255,255,255,0.45) !important; }
  .lg-input:focus { 
    border-color: rgba(147,197,253,0.5) !important;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.12) !important;
    outline: none;
  }
  .lg-tab-bar {
    background: rgba(255,255,255,0.07);
    backdrop-filter: blur(20px) saturate(160%);
    -webkit-backdrop-filter: blur(20px) saturate(160%);
    border: 1px solid rgba(255,255,255,0.14);
    box-shadow: 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.18);
    border-radius: 18px;
  }
  .lg-tab-active {
    background: rgba(255,255,255,0.18);
    box-shadow: 0 2px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3);
    color: white;
    border-radius: 13px;
  }
  .lg-tab-inactive {
    color: rgba(255,255,255,0.5);
  }
  .lg-stat-green {
    background: rgba(16,185,129,0.15);
    border: 1px solid rgba(52,211,153,0.25);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
    border-radius: 16px;
  }
  .lg-stat-red {
    background: rgba(239,68,68,0.15);
    border: 1px solid rgba(252,165,165,0.25);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
    border-radius: 16px;
  }
  .lg-stat-blue {
    background: rgba(59,130,246,0.15);
    border: 1px solid rgba(147,197,253,0.25);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
    border-radius: 16px;
  }
  .lg-stat-amber {
    background: rgba(245,158,11,0.15);
    border: 1px solid rgba(252,211,77,0.25);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
    border-radius: 16px;
  }
  .lg-text-primary { color: rgba(255,255,255,0.95); }
  .lg-text-secondary { color: rgba(255,255,255,0.65); }
  .lg-text-muted { color: rgba(255,255,255,0.4); }
  .lg-divider { background: rgba(255,255,255,0.1); }
  .lg-profile-header {
    background: linear-gradient(135deg,
      rgba(10,22,40,0.95) 0%,
      rgba(13,35,68,0.95) 50%,
      rgba(30,58,138,0.95) 100%
    );
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
  }
  .lg-item-row {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 16px;
  }
  .lg-select {
    background: rgba(255,255,255,0.08) !important;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.18) !important;
    color: white !important;
    border-radius: 14px !important;
  }
  .lg-select option { background: #0d2344; color: white; }
  .lg-modal {
    background: rgba(10,22,40,0.92);
    backdrop-filter: blur(40px) saturate(200%);
    -webkit-backdrop-filter: blur(40px) saturate(200%);
    border: 1px solid rgba(255,255,255,0.18);
    box-shadow: 0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.22);
    border-radius: 32px;
  }
  .lg-avatar-ring {
    border: 2px solid rgba(147,197,253,0.5);
    box-shadow: 0 0 0 3px rgba(59,130,246,0.15), 0 4px 16px rgba(0,0,0,0.4);
  }
  .lg-chat-bubble-user {
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.18);
    backdrop-filter: blur(10px);
    color: rgba(255,255,255,0.9);
    border-radius: 18px 18px 4px 18px;
  }
  .lg-chat-bubble-bot {
    color: rgba(255,255,255,0.85);
  }
  .lg-chat-input {
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.15);
    backdrop-filter: blur(16px);
    color: white;
    border-radius: 999px;
  }
  .lg-chat-input::placeholder { color: rgba(255,255,255,0.4); }
  .lg-fita-track {
    background: rgba(255,255,255,0.08);
  }
  .scrollbar-hide::-webkit-scrollbar { display: none; }
`;

function InjectLGStyles() {
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = LG_STYLES;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  return null;
}

// =====================================================
// COMPONENTES UI — LIQUID GLASS
// =====================================================
const Card = ({ children, className }) => (
  <div className={`lg-card ${className || ""}`}>{children}</div>
);
const CardContent = ({ children, className }) => (
  <div className={`p-3 ${className || ""}`}>{children}</div>
);
const Button = ({ children, onClick, className, variant }) => {
  let variantClass = "lg-btn lg-btn-dark ";
  if (variant === "destructive") variantClass = "lg-btn lg-btn-destructive ";
  else if (variant === "secondary") variantClass = "lg-btn lg-btn-secondary ";
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 font-bold text-sm text-white transition-all ${variantClass} ${className || ""}`}
      style={{ borderRadius: 14 }}
    >
      {children}
    </button>
  );
};
const Input = ({ className, ...props }) => (
  <input
    {...props}
    className={`lg-input py-2 px-3 text-base w-full ${className || ""}`}
  />
);

// =====================================================
// FORMATAÇÃO DE MOEDA
// =====================================================
function formatCurrency(value) {
  const numeric = typeof value === "number"
    ? value
    : Number(String(value).replace(/\./g, "").replace(",", "."));
  if (Number.isNaN(numeric)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(numeric);
}
function formatCurrencyInput(value) {
  const digits = value.replace(/[^0-9]/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(digits) / 100);
}
function parseCurrencyInput(value) {
  const digits = value.replace(/[^0-9]/g, "");
  if (!digits) return 0;
  return Number(digits) / 100;
}

const DEFAULT_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    <rect width="128" height="128" rx="64" fill="#0d2344"/>
    <circle cx="64" cy="48" r="22" fill="rgba(147,197,253,0.4)"/>
    <path d="M24 112c7-22 24-34 40-34s33 12 40 34" fill="rgba(147,197,253,0.4)"/>
  </svg>
`)}`;

const ANALISES_ESPECIAIS = [
  { id: "luz", label: "Luz", keywords: ["luz", "energia"] },
  { id: "agua", label: "Água", keywords: ["agua", "água"] },
  { id: "combustivel", label: "Combustível", keywords: ["gasolina", "combust", "posto"] },
];

// =====================================================
// FUNÇÕES AUXILIARES — inalteradas
// =====================================================
function categorize(text) {
  const t = text.toLowerCase();
  if (t.includes("salario") || t.includes("salário") || t.includes("renda") || t.includes("recebi") || t.includes("pix recebido")) return "renda";
  if (t.includes("uber") || t.includes("onibus") || t.includes("ônibus") || t.includes("gasolina") || t.includes("combust")) return "transporte";
  if (t.includes("mercado") || t.includes("restaurante") || t.includes("comida") || t.includes("lanche")) return "alimentacao";
  if (t.includes("luz") || t.includes("energia") || t.includes("agua") || t.includes("água") || t.includes("internet") || t.includes("aluguel")) return "moradia";
  if (t.includes("beleza") || t.includes("cabelo")) return "beleza";
  if (t.includes("farm") || t.includes("consulta") || t.includes("med")) return "saude";
  if (t.includes("shopee") || t.includes("amazon") || t.includes("celular")) return "compras";
  return "outros";
}
function extractValue(text) {
  const match = text.match(/(\d+[\.,]?\d*)/);
  if (!match) return 0;
  return Number.parseFloat(match[1].replace(",", "."));
}
function detectType(text) {
  const t = text.toLowerCase();
  if (t.includes("salario") || t.includes("salário") || t.includes("recebi") || t.includes("pix recebido") || t.includes("renda")) return "receita";
  return "despesa";
}
function detectNature(text) {
  const t = text.toLowerCase();
  if (t.includes("x ") || t.includes("parcel")) return "parcelada";
  if (t.includes("luz") || t.includes("energia") || t.includes("agua") || t.includes("água") || t.includes("internet") || t.includes("aluguel")) return "fixa";
  return "variavel";
}
function isKeywordMatch(text, keywords) {
  const t = String(text || "").toLowerCase();
  return keywords.some((k) => t.includes(k.toLowerCase()));
}
function addMonths(monthKey, offset) {
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(year, (month || 1) - 1 + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function getMonthRange(endMonth, count) {
  const months = [];
  for (let i = count - 1; i >= 0; i -= 1) months.push(addMonths(endMonth, -i));
  return months;
}
function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(year, (month || 1) - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(d);
}
function calcularProximaData(dia) {
  const hoje = new Date();
  let ano = hoje.getFullYear();
  let mes = hoje.getMonth();
  if (hoje.getDate() > dia) mes += 1;
  return new Date(ano, mes, dia).toLocaleDateString("pt-BR");
}
function buildMonthlyCategorySeries(lancamentos, months) {
  const map = Object.fromEntries(months.map((m) => [m, 0]));
  lancamentos.forEach((l) => {
    const mes = String(l.data || "").slice(0, 7);
    if (!mes || !(mes in map)) return;
    map[mes] = (map[mes] || 0) + Number(l.valor || 0);
  });
  return months.map((mes) => ({ mes, valor: map[mes] || 0 }));
}

// =====================================================
// PERFIL DO USUÁRIO — Liquid Glass
// =====================================================
function UserProfile({ isOpen, onClose, onLogout, user, contas, cartoes, onDisconnectConta, onDisconnectCartao, onOpenPremium, onOpenPrivacy, onOpenDeleteAccount, onUpdateName }) {
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(user.name);
  useEffect(() => { setTempName(user.name); }, [user.name, isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[240] bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ x: "-100%" }} animate={{ x: 0 }}
        className="absolute left-0 top-0 h-full w-full max-w-sm shadow-2xl overflow-y-auto flex flex-col"
        style={{ background: "linear-gradient(160deg, #071a38 0%, #0d2344 60%, #071a38 100%)" }}
      >
        {/* Header */}
        <div className="relative h-48 lg-profile-header p-6 text-white overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20" style={{ background: "radial-gradient(circle, rgba(147,197,253,0.4) 0%, transparent 70%)", top: -20, right: -20 }} />
          <div className="flex items-center justify-between relative z-10">
            <button onClick={onClose} className="p-2 rounded-full transition-colors" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <ArrowLeft size={20} color="white" />
            </button>
            <div className="size-6" />
          </div>
          <div className="absolute top-full -translate-y-[105%] left-8 z-20">
            <div className="relative group">
              <div className="size-24 rounded-[32px] p-1 shadow-xl rotate-3 group-hover:rotate-0 transition-transform duration-500 overflow-hidden" style={{ background: "rgba(255,255,255,0.12)", border: "2px solid rgba(147,197,253,0.4)" }}>
                <img src={user.photo || DEFAULT_AVATAR} className="w-full h-full object-cover rounded-[28px]" alt="Avatar" />
              </div>
              <label className="absolute -bottom-1 -right-1 p-2 rounded-2xl cursor-pointer shadow-lg hover:scale-110 transition-transform" style={{ background: "rgba(30,58,138,0.9)", border: "1px solid rgba(147,197,253,0.3)" }}>
                <Sparkles size={12} color="white" />
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => { if (typeof reader.result === "string") { localStorage.setItem("userPhoto", reader.result); window.location.reload(); } };
                  reader.readAsDataURL(file);
                }} />
              </label>
            </div>
          </div>
        </div>

        <div className="mt-14 px-5 space-y-4 pb-8">
          {/* Nome */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {editingName ? (
                <div className="flex items-center gap-2 w-full">
                  <input value={tempName} onChange={(e) => setTempName(e.target.value)} className="flex-1 lg-input px-3 py-2 text-sm font-bold" />
                  <button onClick={() => { onUpdateName(tempName.trim() || "Usuário"); setEditingName(false); }} className="lg-btn lg-btn-dark px-3 py-2 text-xs font-black text-white rounded-xl">Salvar</button>
                  <button onClick={() => { setTempName(user.name); setEditingName(false); }} className="px-3 py-2 text-xs font-bold rounded-xl" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.15)" }}>×</button>
                </div>
              ) : (
                <h3 className="text-2xl font-black tracking-tight truncate cursor-pointer hover:opacity-70 lg-text-primary" onClick={() => setEditingName(true)}>{user.name}</h3>
              )}
              {user.isPro && <Crown size={18} className="text-amber-400 fill-amber-400" />}
            </div>
            <p className="text-xs font-bold lg-text-muted uppercase tracking-tighter">{user.email}</p>
          </div>

          {/* Premium */}
          <button onClick={onOpenPremium} className="w-full group relative p-4 overflow-hidden transition-all" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(252,211,77,0.25)", borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
            <div className="flex items-center gap-3 relative z-10">
              <div className="size-10 flex items-center justify-center rounded-2xl" style={{ background: "rgba(245,158,11,0.2)", border: "1px solid rgba(252,211,77,0.3)" }}>
                <Crown size={20} color="#FBBF24" />
              </div>
              <div className="text-left">
                <h4 className="font-black text-sm uppercase" style={{ color: "#FCD34D" }}>Upgrade para Pro</h4>
                <p className="text-[10px] font-bold lg-text-muted uppercase">Acesso total ao Manin Intelligence</p>
              </div>
            </div>
          </button>

          <div className="grid gap-2">
            <p className="text-[10px] font-black lg-text-muted uppercase ml-1 tracking-widest">Configurações</p>
            <ProfileMenuBtn icon={<Bell size={16} />} label="Notificações" />
            <ProfileMenuBtn icon={<Shield size={16} />} label="Privacidade" onClick={onOpenPrivacy} />
            <div className="h-px lg-divider my-1" />
            <p className="text-[10px] font-black lg-text-muted uppercase ml-1 tracking-widest">Conexões</p>

            {contas.length ? contas.map((c) => (
              <div key={c.id} className="lg-item-row p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-bold lg-text-primary truncate">{c.descricao || c.nome}</div>
                  <div className="text-xs lg-text-muted truncate">{c.banco || "Sem banco"}</div>
                </div>
                <Button variant="destructive" onClick={() => onDisconnectConta(c.id)}>Desconectar</Button>
              </div>
            )) : (
              <div className="lg-item-row p-4 text-center text-xs lg-text-muted">Espaço reservado para suas contas conectadas via Open Banking.</div>
            )}

            {cartoes.length ? cartoes.map((cartao) => (
              <div key={cartao.id} className="lg-item-row p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-bold lg-text-primary truncate">{cartao.descricao || cartao.nome}</div>
                  <div className="text-xs lg-text-muted truncate">Limite: {formatCurrency(cartao.limite)}</div>
                </div>
                <Button variant="destructive" onClick={() => onDisconnectCartao(cartao.id)}>Desconectar</Button>
              </div>
            )) : null}

            <button onClick={onLogout} className="w-full p-3 rounded-2xl flex items-center gap-3 font-bold text-sm transition-colors" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(252,165,165,0.2)", color: "#FCA5A5" }}>
              <LogOut size={16} /> Sair da conta
            </button>
            <button onClick={onOpenDeleteAccount} className="w-full p-3 rounded-2xl flex items-center gap-3 font-medium text-sm transition-all" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
              <Trash2 size={16} /> Excluir minha conta
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ProfileMenuBtn({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="w-full p-3 rounded-2xl flex items-center justify-between font-bold text-sm transition-all lg-item-row">
      <div className="flex items-center gap-3"><span style={{ color: "rgba(255,255,255,0.5)" }}>{icon}</span><span className="lg-text-primary">{label}</span></div>
      <ArrowLeft size={14} className="rotate-180" style={{ color: "rgba(255,255,255,0.3)" }} />
    </button>
  );
}

// =====================================================
// MODAL PREMIUM — Liquid Glass
// =====================================================
function PremiumModal({ isOpen, onClose, onContinue }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[260] bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
      <div className="w-full max-w-md p-6 shadow-2xl lg-modal">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase lg-text-muted tracking-widest">Plano Premium</div>
            <h3 className="text-2xl font-black lg-text-primary">Desbloqueie tudo</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <ArrowLeft size={18} color="white" />
          </button>
        </div>
        <div className="mt-4 rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="text-sm font-semibold lg-text-secondary">O que fica desbloqueado:</div>
          <ul className="space-y-2 text-sm lg-text-secondary list-disc pl-5">
            <li>Contas conectadas via Open Banking</li>
            <li>Visão consolidada das transações</li>
            <li>Relatórios e análises avançadas</li>
            <li>Automação e alertas inteligentes</li>
          </ul>
          <div className="text-xs lg-text-muted">Cancele a qualquer momento.</div>
        </div>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase lg-text-muted">Valor</div>
            <div className="text-3xl font-black lg-text-primary">R$ 15,00</div>
            <div className="text-xs lg-text-muted">por mês</div>
          </div>
        </div>
        <div className="mt-4"><Button onClick={onContinue} className="w-full py-3">Continuar</Button></div>
      </div>
    </div>
  );
}

// =====================================================
// FITA DE SOBREVIVÊNCIA — mantida, só cor da track
// =====================================================
function FitaMetalicaElite({ gastoAtual, metaMensal, receitaAtual = 0 }) {
  const hoje = new Date();
  const diaAtual = hoje.getDate();
  const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const percentualTempo = diasNoMes > 0 ? (diaAtual / diasNoMes) * 100 : 0;
  const gastoMes = Math.max(0, gastoAtual);
  const receitaMes = Math.max(0, receitaAtual);
  const saldoMesAtual = receitaMes - gastoMes;
  const baseMovimentacao = receitaMes + gastoMes;
  const intensidadeMovimentacao = baseMovimentacao > 0 ? Math.min((gastoMes / baseMovimentacao) * 100, 100) : 0;
  const risco = Math.max(percentualTempo, intensidadeMovimentacao);
  const larguraBarra = Math.max(0, Math.min(risco, 100));
  const getGradienteTermometro = () => {
    if (receitaMes > 0 && gastoMes === 0) return "linear-gradient(to right, #00c853 0%, #22c55e 55%, #7ee081 100%)";
    if (saldoMesAtual >= 0) return "linear-gradient(to right, #00c853 0%, #7ee081 55%, #f4e26a 100%)";
    if (Math.abs(saldoMesAtual) <= Math.max(100, receitaMes * 0.15)) return "linear-gradient(to right, #4ade80 0%, #facc15 55%, #f4c542 100%)";
    return "linear-gradient(to right, #22c55e 0%, #facc15 55%, #ef4444 85%, #991b1b 100%)";
  };
  return (
    <div className="fixed top-0 left-0 w-full z-[100] h-[4px] lg-fita-track">
      <div className="relative w-full h-full">
        <div className="h-full transition-all duration-1000 ease-in-out" style={{ width: `${larguraBarra}%`, backgroundImage: getGradienteTermometro() }} />
        <div className="absolute top-0 h-full w-[1.5px] z-20" style={{ left: `${percentualTempo}%`, background: "rgba(255,255,255,0.8)", boxShadow: "0 0 8px 1px rgba(255,255,255,0.6)" }} />
      </div>
    </div>
  );
}

// =====================================================
// GAUGE — inalterado em lógica, apenas SVG
// =====================================================
function TermometroGauge({ totalDespesas, totalReceitas, metaMensal }) {
  const percentualFinal = metaMensal > 0 ? Math.min((totalDespesas / metaMensal) * 100, 100) : 0;
  const anguloPonteiro = (percentualFinal - 50) * 1.8;
  const width = 320, height = 150, strokeWidth = 8;
  const innerRadius = (width / 2) - strokeWidth - 6;
  const outerRadius = (width / 2) - 6;
  const arcGenerator = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius).startAngle(-Math.PI / 2).endAngle(Math.PI / 2).cornerRadius(6);
  const arcPath = arcGenerator();
  return (
    <div className="relative w-full min-h-[150px] flex justify-center items-center overflow-visible">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "auto", overflow: "visible" }}>
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3399FF" />
            <stop offset="25%" stopColor="#6A6CDE" />
            <stop offset="50%" stopColor="#9B45C4" />
            <stop offset="75%" stopColor="#DA2C5B" />
            <stop offset="100%" stopColor="#FF0000" />
          </linearGradient>
        </defs>
        <path d={arcPath || undefined} fill="rgba(255,255,255,0.08)" transform={`translate(${width / 2}, ${height})`} />
        <path d={arcPath || undefined} fill="url(#gaugeGradient)" transform={`translate(${width / 2}, ${height})`} />
        <g transform={`translate(${width / 2}, ${height}) rotate(${anguloPonteiro})`} className="transition-transform duration-700 ease-out">
          <path d={`M -4,0 A 4,4 0 1,1 4,0 L 0.4,-${outerRadius * 0.8} A 0.4,0.4 0 0,1 -0.4,-${outerRadius * 0.8} Z`} fill="rgba(255,255,255,0.9)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          <circle cx="0" cy="0" r="7" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
          <circle cx="0" cy="0" r="2.5" fill="white" fillOpacity="0.8" />
        </g>
      </svg>
    </div>
  );
}

function TermometroSobrevivencia({ gastoAtual, metaMensal }) {
  const hoje = new Date();
  const diaAtual = hoje.getDate();
  const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const percentualGasto = metaMensal > 0 ? (gastoAtual / metaMensal) * 100 : 0;
  const percentualTempo = diasNoMes > 0 ? (diaAtual / diasNoMes) * 100 : 0;
  const taNoSufoco = percentualGasto > percentualTempo + 10;
  const getGradient = () => {
    if (percentualGasto <= 10) return "linear-gradient(to right, #1d4ed8 0%, #3b82f6 55%, #60a5fa 100%)";
    if (taNoSufoco) return "linear-gradient(to right, #7c3aed 0%, #c026d3 45%, #ef4444 100%)";
    return "linear-gradient(to right, #2563eb 0%, #8b5cf6 55%, #a855f7 100%)";
  };
  const badgeStyle = taNoSufoco
    ? { background: "rgba(239,68,68,0.2)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.3)" }
    : percentualGasto > 10
    ? { background: "rgba(139,92,246,0.2)", color: "#C4B5FD", border: "1px solid rgba(139,92,246,0.3)" }
    : { background: "rgba(59,130,246,0.2)", color: "#93C5FD", border: "1px solid rgba(59,130,246,0.3)" };
  return (
    <div className="lg-item-row p-3 mt-3">
      <div className="flex justify-between items-center mb-2">
        <h3 className="lg-text-secondary font-semibold text-xs">Termômetro de sobrevivência</h3>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={badgeStyle}>
          {taNoSufoco ? "Situação crítica" : percentualGasto > 10 ? "Atenção" : "Estável"}
        </span>
      </div>
      <div className="relative h-5 w-full rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="h-full transition-all duration-500" style={{ width: `${Math.min(percentualGasto, 100)}%`, backgroundImage: getGradient() }} />
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] lg-text-muted">
        <span>Gasto atual</span><span>Hoje (dia {diaAtual})</span>
      </div>
      <div className="mt-1.5 text-[10px] lg-text-secondary">
        {taNoSufoco ? "Você está gastando mais rápido que o tempo do mês. Atenção no ritmo."
          : percentualGasto > 10 ? "Você já passou da faixa azul. Começa a ficar mais sério daqui pra frente."
          : "Ritmo de gastos dentro do esperado para o período."}
      </div>
    </div>
  );
}

// =====================================================
// TELA DE LOGIN — Liquid Glass
// =====================================================
function TelaInicialLogin({ onLogin }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center lg-bg">
      <div className="w-full max-w-md p-8 shadow-2xl lg-modal" style={{ borderRadius: 36 }}>
        <div className="mx-auto mb-6 flex items-center justify-center">
          <img
            src="/manyn_logo.png"
            alt="Logo manin"
            className="h-24 object-contain"
            style={{ filter: "brightness(0) invert(1) drop-shadow(0 0 20px rgba(147,197,253,0.6))" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextSibling.style.display = "flex";
            }}
          />
          <div style={{ display: "none" }} className="items-center justify-center px-6 py-4 rounded-full" >
            <span className="text-white text-2xl font-black lowercase tracking-tight">manin</span>
          </div>
        </div>
        <h1 className="text-3xl font-black lg-text-primary">Bem-vindo</h1>
        <p className="mt-3 text-sm lg-text-secondary leading-relaxed">Seus dados são protegidos e você pode sair quando quiser.</p>
        <div className="mt-2 text-[13px] font-extrabold lg-text-muted tracking-wide">
          <span className="font-extrabold lg-text-secondary">Open</span>
          <span className="font-normal lg-text-muted">Finance</span>
        </div>
        <div className="mt-8 grid gap-4 w-full">
          <button
            onClick={onLogin}
            className="w-full lg-btn py-3 font-bold rounded-2xl flex items-center justify-center gap-3"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.69 1.22 9.18 3.61l6.85-6.85C35.9 2.36 30.4 0 24 0 14.64 0 6.46 5.48 2.69 13.44l7.98 6.2C12.52 13.09 17.76 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.63-.15-3.2-.43-4.71H24v9.02h12.68c-.55 2.96-2.23 5.47-4.75 7.15l7.29 5.67C43.98 37.73 46.5 31.64 46.5 24.5z"/>
              <path fill="#FBBC05" d="M10.67 28.64a14.49 14.49 0 010-9.28l-7.98-6.2A23.93 23.93 0 000 24c0 3.9.94 7.58 2.69 10.84l7.98-6.2z"/>
              <path fill="#34A853" d="M24 48c6.4 0 11.9-2.12 15.86-5.77l-7.29-5.67c-2.02 1.36-4.61 2.17-8.57 2.17-6.24 0-11.48-3.59-13.33-8.74l-7.98 6.2C6.46 42.52 14.64 48 24 48z"/>
            </svg>
            <span className="lg-text-primary">Continuar com Google</span>
          </button>
        </div>
        <div className="mt-6 text-xs lg-text-muted">Ao continuar, você concorda com os Termos de Uso e com a Política de Privacidade do aplicativo.</div>
      </div>
    </div>
  );
}

// =====================================================
// CHAT GEMINI — Liquid Glass
// =====================================================
function ChatGemini() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [mensagens, setMensagens] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  function appendAttachments(fileList, kind) { if (!fileList?.length) return; const novas = Array.from(fileList).map((file) => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, kind, name: file.name, url: URL.createObjectURL(file) })); setAttachments((prev) => [...prev, ...novas]); }
  function removeAttachment(id) { setAttachments((prev) => { const target = prev.find((item) => item.id === id); if (target) URL.revokeObjectURL(target.url); return prev.filter((item) => item.id !== id); }); }
  async function toggleRecording() { if (isRecording) { recorderRef.current?.stop(); return; } try { if (!navigator.mediaDevices?.getUserMedia) return; const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const recorder = new MediaRecorder(stream); audioChunksRef.current = []; recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); }; recorder.onstop = () => { const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" }); const url = URL.createObjectURL(blob); const now = new Date(); const name = `Áudio ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`; setAttachments((prev) => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, kind: "audio", name, url }]); stream.getTracks().forEach((t) => t.stop()); setIsRecording(false); }; recorderRef.current = recorder; recorder.start(); setIsRecording(true); setMenuOpen(false); } catch (error) { console.error(error); setIsRecording(false); } }
  function handleSend() { const trimmed = input.trim(); if (!trimmed && attachments.length === 0) return; const currentAttachments = attachments; setMensagens((prev) => [...prev, { id: `${Date.now()}`, role: "user", text: trimmed || "Anexo enviado", attachments: currentAttachments }]); setInput(""); setAttachments([]); setTimeout(() => { setMensagens((prev) => [...prev, { id: `bot-${Date.now()}`, role: "bot", text: "Entendido! Processando aqui..." }]); }, 1000); }

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-6 right-6 z-[300] size-14 rounded-full flex items-center justify-center active:scale-90 transition-transform" style={{ background: "linear-gradient(135deg, rgba(30,58,138,0.9) 0%, rgba(7,26,56,0.95) 100%)", border: "2px solid rgba(147,197,253,0.35)", boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)" }}>
        {isOpen ? <ArrowLeft className="rotate-[-90deg]" color="white" /> : <Sparkles className="size-6" color="white" />}
        {!isOpen && <span className="absolute -top-2 -right-2 text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce" style={{ background: "rgba(239,68,68,0.9)", color: "white", border: "1px solid rgba(252,165,165,0.4)" }}>AI</span>}
      </button>
      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { appendAttachments(e.currentTarget.files, "image"); e.currentTarget.value = ""; }} />
      <input ref={fileInputRef} type="file" accept="*/*" multiple className="hidden" onChange={(e) => { appendAttachments(e.currentTarget.files, "file"); e.currentTarget.value = ""; }} />
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          className="fixed bottom-24 right-6 z-[300] w-[calc(100vw-48px)] max-w-[350px] overflow-hidden flex flex-col"
          style={{ height: 450, background: "rgba(7,26,56,0.88)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(147,197,253,0.2)", borderRadius: 28, boxShadow: "0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)" }}
        >
          <div className="p-4 flex items-center justify-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
            <div className="size-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <Sparkles className="size-4" color="rgba(147,197,253,0.8)" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
            {mensagens.length === 0 && (
              <div className="flex-1 flex flex-col justify-center px-2">
                <div className="w-full text-left font-bold lg-text-primary" style={{ fontSize: 18 }}>Olá,</div>
                <div className="w-full text-left lg-text-secondary font-normal" style={{ fontSize: 20, marginTop: 4 }}>Por onde começamos?</div>
              </div>
            )}
            {mensagens.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "user" ? (
                  <div className="max-w-[85%] lg-chat-bubble-user px-4 py-3 text-sm font-medium">
                    <div>{msg.text}</div>
                  </div>
                ) : (
                  <div className="max-w-[85%] px-1 py-1 text-sm font-medium lg-text-secondary leading-relaxed">
                    <div>{msg.text}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {attachments.length > 0 && (
            <div className="px-4 pt-3 pb-2 flex flex-wrap gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              {attachments.map((att) => (
                <div key={att.id} className="relative">
                  {att.kind === "image"
                    ? <img src={att.url} alt={att.name} className="h-16 w-16 rounded-2xl object-cover" style={{ border: "1px solid rgba(255,255,255,0.15)" }} />
                    : <div className="h-16 max-w-[180px] rounded-2xl px-3 py-2 flex items-center gap-2 text-xs lg-text-secondary" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                        {att.kind === "audio" ? <Mic size={14} /> : <Paperclip size={14} />}
                        <span className="truncate">{att.name}</span>
                      </div>
                  }
                  <button onClick={() => removeAttachment(att.id)} className="absolute -top-2 -right-2 size-5 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.2)" }}>
                    <X size={11} color="white" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="p-4 flex gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="relative flex items-center">
              <button type="button" onClick={() => setMenuOpen((prev) => !prev)} className="size-10 rounded-full flex items-center justify-center transition-colors" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>
                <span className="text-xl font-bold">+</span>
              </button>
              {menuOpen && (
                <div className="absolute bottom-12 left-0 p-2 flex flex-col gap-2 z-50" style={{ background: "rgba(7,26,56,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(147,197,253,0.2)", borderRadius: 18, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
                  {[
                    { label: "Câmera", icon: <Camera size={14} />, action: async () => { try { const stream = await navigator.mediaDevices.getUserMedia({ video: true }); const track = stream.getVideoTracks()[0]; const ic = new ImageCapture(track); const blob = await ic.takePhoto(); const url = URL.createObjectURL(blob); const now = new Date(); setAttachments(p => [...p, { id: `${Date.now()}`, kind: "image", name: `Foto ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`, url }]); track.stop(); setMenuOpen(false); } catch {} } },
                    { label: "Galeria", icon: <Image size={14} />, action: () => { imageInputRef.current?.click(); setMenuOpen(false); } },
                    { label: "Arquivo", icon: <Paperclip size={14} />, action: () => { fileInputRef.current?.click(); setMenuOpen(false); } },
                  ].map(item => (
                    <button key={item.label} type="button" onClick={item.action} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm lg-text-secondary hover:opacity-80 transition-opacity">
                      {item.icon} {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative flex-1">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ex: Gastei 50 no mercado..."
                className="w-full py-2 px-4 pr-12 text-sm focus:outline-none lg-chat-input"
              />
              <button type="button" onClick={toggleRecording} className="absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-full flex items-center justify-center transition-colors" style={isRecording ? { background: "rgba(239,68,68,0.8)", color: "white" } : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                {isRecording ? <Square size={12} color="white" /> : <Mic size={14} color="rgba(255,255,255,0.6)" />}
              </button>
            </div>
            <button onClick={handleSend} className="p-2 rounded-full active:scale-90 transition-transform" style={{ background: "rgba(59,130,246,0.5)", border: "1px solid rgba(147,197,253,0.3)" }}>
              <ArrowLeft className="rotate-180 size-5" color="white" />
            </button>
          </div>
        </motion.div>
      )}
      {isOpen && <div className="fixed inset-0 z-[290]" onClick={() => setIsOpen(false)} />}
    </>
  );
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================
export default function AppFinanceiroCompleto() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [aviso, setAviso] = useState("");
  const [activeTab, setActiveTab] = useState("inicio");
  const [lancamentos, setLancamentos] = useState([]);
  const [contas, setContas] = useState([]);
  const [cartoes, setCartoes] = useState([]);
  const [gastosFixos, setGastosFixos] = useState([]);
  const [metaMensal, setMetaMensal] = useState(0);
  const [categorias, setCategorias] = useState([]);
  const [userName, setUserName] = useState("Usuário");
  const [userPhoto, setUserPhoto] = useState(DEFAULT_AVATAR);
  const [valorInput, setValorInput] = useState("");
  const [descricaoInput, setDescricaoInput] = useState("");
  const [previewLancamento, setPreviewLancamento] = useState(null);
  const [novaCategoriaInput, setNovaCategoriaInput] = useState("");
  const [mesFiltro, setMesFiltro] = useState(new Date().toISOString().slice(0, 7));
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().slice(0, 10));
  const [contaSelecionada, setContaSelecionada] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [tipoAnalise, setTipoAnalise] = useState("despesa");
  const [analiseSelecionadaReceita, setAnaliseSelecionadaReceita] = useState("renda");
  const [analiseSelecionadaDespesa, setAnaliseSelecionadaDespesa] = useState("luz");
  const [periodoAnalise, setPeriodoAnalise] = useState(1);
  const [contaNome, setContaNome] = useState("");
  const [contaBanco, setContaBanco] = useState("");
  const [cartaoNome, setCartaoNome] = useState("");
  const [limiteCartao, setLimiteCartao] = useState("");
  const [gastoFixoNome, setGastoFixoNome] = useState("");
  const [gastoFixoValor, setGastoFixoValor] = useState("");
  const [gastoFixoDia, setGastoFixoDia] = useState("");
  const [gastoFixoAviso, setGastoFixoAviso] = useState("3");
  const [metaMensalInput, setMetaMensalInput] = useState("");

  // Bloqueia zoom no Android — funcionalidade preservada
  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        setUser(session.user);
        setUserName(session.user.user_metadata?.full_name || "Usuário");
        setUserPhoto(session.user.user_metadata?.avatar_url || DEFAULT_AVATAR);
        carregarDadosDoUsuario(session.user.id);
      }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        setUser(session.user);
        setUserName(session.user.user_metadata?.full_name || "Usuário");
        setUserPhoto(session.user.user_metadata?.avatar_url || DEFAULT_AVATAR);
        carregarDadosDoUsuario(session.user.id);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setLancamentos([]); setContas([]); setCartoes([]); setGastosFixos([]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function carregarDadosDoUsuario(userId) {
    const { data: lancamentosData } = await supabase.from('transactions').select('*').eq('user_id', userId).order('data', { ascending: false });
    if (lancamentosData) setLancamentos(lancamentosData);
    const { data: contasData } = await supabase.from('accounts').select('*').eq('user_id', userId);
    if (contasData) { setContas(contasData); setCartoes(contasData.filter(c => c.tipo === 'cartao')); }
    const { data: gastosData } = await supabase.from('fixed_expenses').select('*').eq('user_id', userId);
    if (gastosData) setGastosFixos(gastosData);
    const { data: metaData } = await supabase.from('user_settings').select('meta_mensal').eq('user_id', userId).single();
    if (metaData) setMetaMensal(metaData.meta_mensal || 0);
  }

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (error) console.error(error);
  };
  const handleLogout = async () => { await supabase.auth.signOut(); setAviso("Você saiu da conta."); };
  async function excluirConta() {
    const userId = user?.id;
    if (userId) {
      await supabase.from('transactions').delete().eq('user_id', userId);
      await supabase.from('accounts').delete().eq('user_id', userId);
      await supabase.from('fixed_expenses').delete().eq('user_id', userId);
      await supabase.from('user_settings').delete().eq('user_id', userId);
    }
    await supabase.auth.signOut();
    setDeleteAccountModalOpen(false);
    setAviso("Conta excluída com sucesso.");
  }

  async function salvarLancamento(lancamento) {
    const userId = user?.id;
    if (!userId) return;
    const novoLancamento = { user_id: userId, descricao: lancamento.descricao, valor: lancamento.valor, tipo: lancamento.tipo, categoria: lancamento.categoria, natureza: lancamento.natureza, data: lancamento.data, conta_id: lancamento.contaId || null };
    if (editandoId) {
      const { error } = await supabase.from('transactions').update(novoLancamento).eq('id', editandoId).eq('user_id', userId);
      if (!error) { setLancamentos(prev => prev.map(l => l.id === editandoId ? { ...l, ...novoLancamento } : l)); setAviso("Movimentação atualizada."); }
    } else {
      const { data, error } = await supabase.from('transactions').insert([novoLancamento]).select();
      if (!error && data) { setLancamentos(prev => [data[0], ...prev]); setAviso("Movimentação registrada."); }
    }
    setPreviewLancamento(null); limparFormulario();
  }

  function limparFormulario() { setValorInput(""); setDescricaoInput(""); setContaSelecionada(""); setEditandoId(null); }
  function registradorBase(payload) { salvarLancamento(payload); }
  function registrarMovimentoManual(tipoOverride) {
    if (!descricaoInput.trim() || !valorInput.trim()) return;
    const valor = parseCurrencyInput(valorInput);
    if (Number.isNaN(valor)) return;
    const categoriaEncontrada = categorias.find(c => c.nome === categorize(descricaoInput) && c.tipo === tipoOverride);
    const categoriaFinal = categoriaEncontrada ? categoriaEncontrada.nome : categorize(descricaoInput);
    const natureza = detectNature(descricaoInput);
    setPreviewLancamento({ descricao: descricaoInput.trim(), valor, tipo: tipoOverride, categoria: categoriaFinal, natureza, data: dataSelecionada, contaId: contaSelecionada || null });
    setAviso("Confira a prévia antes de confirmar.");
  }
  function confirmarLancamentoPreview() { if (!previewLancamento) return; registradorBase(previewLancamento); }
  function cancelarLancamentoPreview() { setPreviewLancamento(null); }
  function iniciarEdicao(lancamento) { setDescricaoInput(lancamento.descricao); setValorInput(formatCurrency(lancamento.valor)); setContaSelecionada(lancamento.conta_id || ""); setDataSelecionada(lancamento.data); setEditandoId(lancamento.id); setAviso("Editando lançamento."); }
  async function excluirLancamento(id) {
    const userId = user?.id; if (!userId) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', userId);
    if (!error) { setLancamentos(prev => prev.filter(l => l.id !== id)); setAviso("Lançamento excluído."); }
  }
  async function desconectarConta(id) {
    const userId = user?.id; if (!userId) return;
    await supabase.from('accounts').delete().eq('id', id).eq('user_id', userId);
    setContas(prev => prev.filter(c => c.id !== id)); setCartoes(prev => prev.filter(c => c.id !== id)); setAviso("Conta desconectada.");
  }
  async function desconectarCartao(id) { await desconectarConta(id); }

  const mesAtual = new Date().toISOString().slice(0, 7);
  const lancamentosMesAtual = useMemo(() => lancamentos.filter(l => String(l.data).startsWith(mesAtual)), [lancamentos, mesAtual]);
  const totalEntradasMes = lancamentosMesAtual.filter(l => l.tipo === "receita").reduce((acc, l) => acc + l.valor, 0);
  const totalDespesasMes = lancamentosMesAtual.filter(l => l.tipo === "despesa").reduce((acc, l) => acc + l.valor, 0);
  const saldoMes = totalEntradasMes - totalDespesasMes;
  const percentualMeta = metaMensal > 0 ? Math.min((totalDespesasMes / metaMensal) * 100, 100) : 0;
  const categoriasReceita = useMemo(() => [...new Set(lancamentos.filter(l => l.tipo === "receita").map(l => l.categoria))], [lancamentos]);
  const categoriasDespesa = useMemo(() => [...new Set(lancamentos.filter(l => l.tipo === "despesa").map(l => l.categoria))], [lancamentos]);
  const dadosPizza = useMemo(() => { const cats = {}; lancamentosMesAtual.filter(l => l.tipo === "despesa").forEach(l => { cats[l.categoria] = (cats[l.categoria] || 0) + l.valor; }); return Object.entries(cats).map(([categoria, valor]) => ({ categoria, valor })); }, [lancamentosMesAtual]);
  const lancamentosFiltrados = useMemo(() => lancamentos.filter(l => String(l.data).startsWith(mesFiltro)), [lancamentos, mesFiltro]);
  const analiseSelecionada = tipoAnalise === "receita" ? analiseSelecionadaReceita : analiseSelecionadaDespesa;
  const mesesAnalise = getMonthRange(mesAtual, periodoAnalise);
  const serieAnaliseEspecial = useMemo(() => { const filtrados = lancamentos.filter(l => { if (l.tipo !== tipoAnalise) return false; const mes = l.data.slice(0, 7); if (!mesesAnalise.includes(mes)) return false; if (tipoAnalise === "despesa") { const especial = ANALISES_ESPECIAIS.find(e => e.id === analiseSelecionada); if (especial) return isKeywordMatch(l.descricao, especial.keywords); } return l.categoria === analiseSelecionada; }); return buildMonthlyCategorySeries(filtrados, mesesAnalise); }, [lancamentos, analiseSelecionada, tipoAnalise, mesAtual, periodoAnalise]);
  const mesesReferenciaAnalise = useMemo(() => getMonthRange(mesAtual, periodoAnalise), [mesAtual, periodoAnalise]);
  const lancamentosAnaliseEspecial = useMemo(() => lancamentos.filter(l => { if (l.tipo !== tipoAnalise) return false; const mes = l.data.slice(0, 7); if (!mesesReferenciaAnalise.includes(mes)) return false; if (tipoAnalise === "despesa") { const especial = ANALISES_ESPECIAIS.find(e => e.id === analiseSelecionada); if (especial) return isKeywordMatch(l.descricao, especial.keywords); } return l.categoria === analiseSelecionada; }), [lancamentos, analiseSelecionada, tipoAnalise, mesesReferenciaAnalise]);
  const totalAnaliseEspecial = lancamentosAnaliseEspecial.reduce((acc, l) => acc + l.valor, 0);
  const quantidadeAnaliseEspecial = lancamentosAnaliseEspecial.length;
  function getContaNomeById(id) { if (!id) return "Sem conta"; const conta = contas.find(c => c.id === id); return conta ? conta.nome : "Conta não encontrada"; }

  const CORES_PIZZA = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#84cc16","#64748b"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center lg-bg">
        <div className="text-white font-bold text-lg" style={{ textShadow: "0 0 20px rgba(147,197,253,0.5)" }}>Carregando...</div>
      </div>
    );
  }
  if (!isAuthenticated) return <TelaInicialLogin onLogin={handleLogin} />;

  return (
    <div className="h-screen flex flex-col lg-bg">
      <InjectLGStyles />
      <FitaMetalicaElite gastoAtual={totalDespesasMes} receitaAtual={totalEntradasMes} metaMensal={metaMensal} />

      {/* Avatar fixo */}
      <div className="fixed top-4 left-4 z-[200]">
        <button onClick={() => setProfileOpen(true)} className="size-10 rounded-full overflow-hidden active:scale-90 transition-transform lg-avatar-ring">
          <img src={userPhoto} alt="Perfil" className="w-full h-full object-cover" />
        </button>
      </div>

      {/* HEADER FIXO */}
      <div className="flex-shrink-0 pt-14 px-3 sm:px-4 max-w-6xl mx-auto w-full">
        {aviso && (
          <div className="text-xs text-center mb-1 px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.65)" }}>
            {aviso}
          </div>
        )}

        {/* Card de input */}
        <div className="lg-card mb-2">
          <div className="p-3 grid gap-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input placeholder="Valor (R$)" inputMode="numeric" value={valorInput} onChange={(e) => setValorInput(formatCurrencyInput(e.target.value))} className="text-right font-semibold" />
              <Input placeholder="Descrição do gasto" value={descricaoInput} onChange={(e) => setDescricaoInput(e.target.value)} className="text-center font-semibold" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => registrarMovimentoManual("receita")} className="lg-btn lg-btn-green py-2 text-sm font-bold text-white rounded-2xl">Adicionar Receita</button>
              <button onClick={() => registrarMovimentoManual("despesa")} className="lg-btn lg-btn-red py-2 text-sm font-bold text-white rounded-2xl">Adicionar Despesa</button>
            </div>
          </div>
        </div>

        {/* Barra de abas */}
        <div className="lg-tab-bar flex overflow-x-auto gap-1 p-1 mb-2 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
          {[
            { key: "inicio", label: "Início" },
            { key: "movimentos", label: "Movimentos" },
            { key: "fixos", label: "Fixos" },
            { key: "analises", label: "Análises" },
            { key: "meta", label: "Meta" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${activeTab === key ? "lg-tab-active" : "lg-tab-inactive"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ÁREA ROLÁVEL */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 max-w-6xl mx-auto w-full pb-24 scrollbar-hide">

        {/* ABA INÍCIO */}
        {activeTab === "inicio" && (
          <div className="lg-card">
            <div className="p-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <div className="lg-stat-green p-2"><div className="text-xs lg-text-muted">Entradas do mês</div><div className="text-base font-semibold" style={{ color: "#6EE7B7" }}>{formatCurrency(totalEntradasMes)}</div></div>
                <div className="lg-stat-red p-2"><div className="text-xs lg-text-muted">Despesas do mês</div><div className="text-base font-semibold" style={{ color: "#FCA5A5" }}>{formatCurrency(totalDespesasMes)}</div></div>
                <div className="lg-stat-blue p-2"><div className="text-xs lg-text-muted">Saldo do mês</div><div className="text-base font-semibold" style={{ color: "#93C5FD" }}>{formatCurrency(saldoMes)}</div></div>
                <div className="lg-stat-amber p-2"><div className="text-xs lg-text-muted">Meta de gastos</div><div className="text-base font-semibold" style={{ color: "#FCD34D" }}>{formatCurrency(metaMensal)}</div><div className="text-[10px] mt-0.5 lg-text-muted">Usado: {percentualMeta.toFixed(0)}%</div></div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Tooltip contentStyle={{ background: "rgba(7,26,56,0.95)", border: "1px solid rgba(147,197,253,0.2)", borderRadius: 12, color: "white" }} />
                  <Legend wrapperStyle={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }} />
                  <Pie data={dadosPizza} dataKey="valor" nameKey="categoria" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={3}>
                    {dadosPizza.map((_, index) => <Cell key={index} fill={CORES_PIZZA[index % CORES_PIZZA.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ABA META */}
        {activeTab === "meta" && (
          <div className="lg-card">
            <div className="p-3">
              <div className="text-base font-semibold mb-2 lg-text-primary">Meta de Gastos Mensal</div>
              <div className="flex flex-row gap-2 items-stretch">
                <div className="flex-[8] rounded-2xl p-2 flex flex-col items-center justify-center overflow-visible" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <TermometroGauge totalDespesas={totalDespesasMes} totalReceitas={totalEntradasMes} metaMensal={metaMensal} />
                  <div className="mt-1 text-center">
                    <div className="text-xs lg-text-muted">Uso da meta</div>
                    <div className="text-xl font-semibold lg-text-primary">{percentualMeta.toFixed(0)}%</div>
                  </div>
                  {percentualMeta >= 100 && <div className="text-[10px] mt-0.5 font-medium" style={{ color: "#FCA5A5" }}>Ultrapassou a meta!</div>}
                  {percentualMeta >= 80 && percentualMeta < 100 && <div className="text-[10px] mt-0.5 font-medium" style={{ color: "#FCD34D" }}>Perto do limite.</div>}
                </div>
                <div className="flex-[3] rounded-2xl p-2 flex flex-col gap-1.5 min-w-[120px]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div className="text-[10px] lg-text-muted">Valor máximo:</div>
                  <Input type="text" inputMode="decimal" pattern="[0-9.,]*" placeholder="Ex: 2000" value={metaMensalInput} onChange={(e) => setMetaMensalInput(e.target.value)} onBlur={() => { const cleaned = metaMensalInput.replace(/[^0-9,\.]/g, ""); const numeric = parseFloat(cleaned.replace(",", ".")); setMetaMensal(Number.isNaN(numeric) ? 0 : numeric); }} className="text-center font-bold" style={{ fontSize: 14, height: 40 }} />
                  <button
                    className="lg-btn lg-btn-dark py-1 text-[10px] font-bold text-white rounded-xl"
                    onClick={async () => { if (user?.id) { await supabase.from('user_settings').upsert({ user_id: user.id, meta_mensal: metaMensal }); setAviso("Meta mensal atualizada."); } }}
                  >
                    Salvar meta
                  </button>
                  <div className="text-[8px] lg-text-muted text-center">Aviso de limite</div>
                </div>
              </div>
              <TermometroSobrevivencia gastoAtual={totalDespesasMes} metaMensal={metaMensal} />
            </div>
          </div>
        )}

        {/* ABA MOVIMENTOS */}
        {activeTab === "movimentos" && (
          <div className="lg-card">
            <div className="grid gap-2 p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm lg-text-secondary">Selecionar mês:</span>
                <input type="month" value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)} className="lg-input w-40 text-sm py-1 px-3" style={{ borderRadius: 14 }} />
              </div>
              {Object.entries(
                lancamentosFiltrados.reduce((acc, l) => { if (!acc[l.data]) acc[l.data] = []; acc[l.data].push(l); return acc; }, {})
              ).sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([data, itens]) => (
                <div key={data} className="grid gap-1.5">
                  <div className="text-xs font-bold lg-text-muted mt-1">{new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</div>
                  {itens.map((l) => (
                    <div key={l.id} className="lg-item-row p-2.5 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-1.5 font-medium text-sm lg-text-primary">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: l.tipo === "receita" ? "#10b981" : "#ef4444" }} />
                          {l.descricao}
                        </div>
                        <div className="text-[10px] lg-text-muted">{l.categoria} • {l.natureza}{l.conta_id ? ` • ${getContaNomeById(l.conta_id)}` : ""}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-sm" style={{ color: l.tipo === "receita" ? "#6EE7B7" : "#FCA5A5" }}>{formatCurrency(Number(l.valor || 0))}</div>
                        <div className="flex gap-1">
                          <Button variant="secondary" onClick={() => iniciarEdicao(l)} className="px-2 py-1 text-xs">Editar</Button>
                          <Button variant="destructive" onClick={() => excluirLancamento(l.id)} className="px-2 py-1 text-xs">Excluir</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA FIXOS */}
        {activeTab === "fixos" && (
          <div className="lg-card">
            <div className="grid gap-3 p-3">
              <div className="text-base font-semibold lg-text-primary">Despesas Fixas</div>
              <div className="grid md:grid-cols-4 gap-2">
                <Input placeholder="Nome da despesa" value={gastoFixoNome} onChange={(e) => setGastoFixoNome(e.target.value)} className="text-sm" />
                <Input inputMode="decimal" placeholder="Valor" value={gastoFixoValor} onChange={(e) => setGastoFixoValor(e.target.value.replace(/[^0-9.,]/g, ""))} className="text-sm" />
                <Input inputMode="numeric" placeholder="Dia do vencimento" value={gastoFixoDia} onChange={(e) => setGastoFixoDia(e.target.value.replace(/[^0-9]/g, ""))} className="text-sm" />
                <Input inputMode="numeric" placeholder="Avisar dias antes" value={gastoFixoAviso} onChange={(e) => setGastoFixoAviso(e.target.value.replace(/[^0-9]/g, ""))} className="text-sm" />
              </div>
              <button
                className="lg-btn lg-btn-dark py-2 text-sm font-bold text-white w-full rounded-2xl"
                onClick={async () => {
                  if (!gastoFixoNome || !gastoFixoValor || !gastoFixoDia) return;
                  const userId = user?.id; if (!userId) return;
                  const novo = { user_id: userId, nome: gastoFixoNome, valor: Number(gastoFixoValor.replace(",", ".")), dia_vencimento: Number(gastoFixoDia), dias_aviso: Number(gastoFixoAviso || 3), ativa: true, categoria: null };
                  const { data, error } = await supabase.from('fixed_expenses').insert([novo]).select();
                  if (!error && data) { setGastosFixos(prev => [...prev, data[0]]); setGastoFixoNome(""); setGastoFixoValor(""); setGastoFixoDia(""); setGastoFixoAviso("3"); setAviso("Despesa fixa cadastrada."); }
                }}
              >Adicionar despesa fixa</button>
              <div className="grid gap-2">
                {gastosFixos.map((g) => (
                  <div key={g.id} className="lg-item-row p-2.5 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm lg-text-primary">{g.nome}</div>
                      <div className="text-xs lg-text-muted">{formatCurrency(g.valor)} • vence dia {g.dia_vencimento} • próximo: {calcularProximaData(g.dia_vencimento)} • aviso {g.dias_aviso} dias antes</div>
                    </div>
                    <Button variant="destructive" className="px-2 py-1 text-xs" onClick={async () => { await supabase.from('fixed_expenses').delete().eq('id', g.id); setGastosFixos(prev => prev.filter(x => x.id !== g.id)); setAviso("Despesa fixa removida."); }}>Excluir</Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ABA ANÁLISES */}
        {activeTab === "analises" && (
          <div className="lg-card">
            <div className="p-3 grid gap-2">
              <div className="grid md:grid-cols-3 gap-2 items-end">
                <div className="grid gap-0.5">
                  <div className="text-[10px] lg-text-muted">Tipo</div>
                  <select value={tipoAnalise} onChange={(e) => setTipoAnalise(e.target.value)} className="lg-select p-1.5 text-sm rounded-xl">
                    <option value="despesa">Despesas</option>
                    <option value="receita">Receitas</option>
                  </select>
                </div>
                <div className="grid gap-0.5">
                  <div className="text-[10px] lg-text-muted">Categoria</div>
                  <select value={analiseSelecionada} onChange={(e) => { const v = e.target.value; if (tipoAnalise === "receita") setAnaliseSelecionadaReceita(v); else setAnaliseSelecionadaDespesa(v); }} className="lg-select p-1.5 text-sm rounded-xl">
                    {(tipoAnalise === "receita" ? categoriasReceita : [...ANALISES_ESPECIAIS.map(a => a.id), ...categoriasDespesa]).map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                </div>
                <div className="grid gap-0.5">
                  <div className="text-[10px] lg-text-muted">Período</div>
                  <select value={periodoAnalise} onChange={(e) => setPeriodoAnalise(Number(e.target.value))} className="lg-select p-1.5 text-sm rounded-xl">
                    <option value={1}>Mês atual</option>
                    <option value={2}>Últimos 2 meses</option>
                    <option value={3}>Últimos 3 meses</option>
                    <option value={4}>Últimos 4 meses</option>
                    <option value={5}>Últimos 5 meses</option>
                    <option value={6}>Últimos 6 meses</option>
                  </select>
                </div>
              </div>
              <div className="text-xs lg-text-muted">Evolução mensal da categoria selecionada</div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={serieAnaliseEspecial}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.07)" />
                  <XAxis dataKey="mes" ticks={mesesReferenciaAnalise} tickFormatter={formatMonthLabel} interval={0} minTickGap={0} tickMargin={8} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.45)" }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.45)" }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} />
                  <Tooltip contentStyle={{ background: "rgba(7,26,56,0.95)", border: "1px solid rgba(147,197,253,0.2)", borderRadius: 12, color: "white" }} />
                  <Area type="linear" dataKey="valor" stroke={tipoAnalise === "receita" ? "#10b981" : "#ef4444"} fill={tipoAnalise === "receita" ? "#10b981" : "#ef4444"} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="text-xs lg-text-secondary">Total no período: <strong className="lg-text-primary">{formatCurrency(totalAnaliseEspecial)}</strong> • Quantidade: <strong className="lg-text-primary">{quantidadeAnaliseEspecial}</strong></div>
            </div>
          </div>
        )}

        <div className="w-full text-center mt-3 pb-2">
          <div className="inline-block px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span className="text-[10px] lg-text-muted tracking-wide font-bold">Segue em frente... a cada passo de confiança a luz aparece.</span>
          </div>
        </div>
      </div>

      {/* MODAL PREVIEW LANÇAMENTO */}
      {previewLancamento && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md grid gap-3 p-5 lg-modal">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold lg-text-primary">Prévia do lançamento</h2>
              <div className="text-[10px] font-semibold lg-text-muted uppercase">Revise antes de salvar</div>
            </div>
            <div className="flex items-center justify-between rounded-2xl px-3 py-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <span className="text-sm font-semibold lg-text-secondary">Valor do lançamento</span>
              <Input inputMode="decimal" pattern="[0-9.,]*" value={formatCurrency(previewLancamento.valor)} onChange={(e) => setPreviewLancamento(prev => prev ? { ...prev, valor: parseCurrencyInput(e.target.value) } : prev)} className="w-28 text-right text-lg font-bold border-none bg-transparent focus:ring-0 shadow-none" style={{ background: "transparent", border: "none", boxShadow: "none" }} />
            </div>
            <div className="flex items-center justify-between rounded-2xl px-3 py-2" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <span className="text-sm font-semibold lg-text-secondary">Descrição</span>
              <Input value={previewLancamento.descricao} onChange={(e) => setPreviewLancamento(prev => prev ? { ...prev, descricao: e.target.value } : prev)} className="w-40 text-right font-bold border-none bg-transparent focus:ring-0 shadow-none" style={{ background: "transparent", border: "none", boxShadow: "none" }} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-0.5">
                <span className="text-xs lg-text-muted">Data</span>
                <div className="relative group">
                  <input type="date" value={previewLancamento.data} onChange={(e) => { const novaData = e.target.value; setDataSelecionada(novaData); setPreviewLancamento(prev => prev ? { ...prev, data: novaData } : prev); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="flex items-center justify-between rounded-xl px-2 py-1.5" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <span className="text-sm font-semibold lg-text-primary">{new Date(previewLancamento.data).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              </div>
              <div className="grid gap-0.5">
                <span className="text-xs lg-text-muted">Tipo</span>
                <div className="flex rounded-xl p-0.5" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <button onClick={() => setPreviewLancamento(prev => prev ? { ...prev, tipo: "receita" } : prev)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${previewLancamento.tipo === "receita" ? "text-emerald-300 shadow" : "lg-text-muted"}`} style={previewLancamento.tipo === "receita" ? { background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.3)" } : {}}>Receita</button>
                  <button onClick={() => setPreviewLancamento(prev => prev ? { ...prev, tipo: "despesa" } : prev)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${previewLancamento.tipo === "despesa" ? "text-rose-300 shadow" : "lg-text-muted"}`} style={previewLancamento.tipo === "despesa" ? { background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)" } : {}}>Despesa</button>
                </div>
              </div>
            </div>
            <div className="grid gap-0.5">
              <span className="text-xs lg-text-muted">Categoria</span>
              <select value={previewLancamento.categoria} onChange={(e) => setPreviewLancamento(prev => prev ? { ...prev, categoria: e.target.value } : prev)} className="lg-select p-2 text-sm rounded-xl">
                {(previewLancamento?.tipo === "receita" ? categoriasReceita : categoriasDespesa).map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Nova categoria" value={novaCategoriaInput} onChange={(e) => setNovaCategoriaInput(e.target.value)} className="text-sm" />
              <button onClick={() => { const nova = novaCategoriaInput.trim().toLowerCase(); if (nova && !categoriasReceita.includes(nova) && !categoriasDespesa.includes(nova)) { setCategorias(prev => [...prev, { nome: nova, tipo: previewLancamento?.tipo || "despesa" }]); setNovaCategoriaInput(""); } }} className="lg-btn lg-btn-dark px-3 text-sm text-white font-bold" style={{ borderRadius: 14, minWidth: 40 }}>+</button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button variant="secondary" onClick={cancelarLancamentoPreview} className="rounded-xl font-semibold text-sm">Cancelar</Button>
              <Button onClick={confirmarLancamentoPreview} className="rounded-xl font-semibold text-sm">Confirmar</Button>
            </div>
          </div>
        </div>
      )}

      <UserProfile
        isOpen={profileOpen} onClose={() => setProfileOpen(false)} onLogout={handleLogout}
        user={{ name: userName, email: user?.email || "usuario@email.com", photo: userPhoto, isPro: false }}
        contas={contas.filter(c => c.tipo === 'conta')} cartoes={cartoes}
        onDisconnectConta={desconectarConta} onDisconnectCartao={desconectarCartao}
        onOpenPremium={() => setPremiumOpen(true)} onOpenPrivacy={() => setPrivacyOpen(true)}
        onOpenDeleteAccount={() => setDeleteAccountModalOpen(true)} onUpdateName={(name) => setUserName(name)}
      />

      {/* MODAL PRIVACIDADE */}
      {privacyOpen && (
        <div className="fixed inset-0 z-[270] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-5 shadow-2xl overflow-y-auto max-h-[80vh] lg-modal">
            <h3 className="text-lg font-bold mb-3 lg-text-primary">Política de Privacidade</h3>
            <div className="text-sm lg-text-secondary space-y-2">
              <p><strong className="lg-text-primary">1. Coleta e Armazenamento de Dados</strong><br/>O aplicativo armazena informações financeiras fornecidas pelo usuário...</p>
            </div>
            <Button className="mt-4" onClick={() => setPrivacyOpen(false)}>Fechar</Button>
          </div>
        </div>
      )}

      {/* MODAL EXCLUIR CONTA */}
      {deleteAccountModalOpen && (
        <div className="fixed inset-0 z-[280] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-5 shadow-2xl space-y-3 lg-modal">
            <h3 className="text-lg font-bold" style={{ color: "#FCA5A5" }}>Excluir conta permanentemente</h3>
            <div className="text-sm lg-text-secondary space-y-2">
              <p>Ao excluir sua conta, todos os dados armazenados no aplicativo serão removidos permanentemente.</p>
              <ul className="list-disc pl-5 space-y-0.5 text-sm"><li>Movimentações financeiras</li><li>Categorias</li><li>Contas e cartões</li><li>Metas e configurações</li></ul>
              <p className="text-xs lg-text-muted">Esta ação não pode ser desfeita.</p>
              <p className="text-xs lg-text-muted">Suporte: <strong className="lg-text-secondary">suporte@manin.app</strong></p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button variant="secondary" onClick={() => setDeleteAccountModalOpen(false)} className="flex-1 text-sm">Cancelar</Button>
              <Button variant="destructive" onClick={excluirConta} className="flex-1 text-sm">Sim, excluir</Button>
            </div>
          </div>
        </div>
      )}

      <PremiumModal isOpen={premiumOpen} onClose={() => setPremiumOpen(false)} onContinue={() => alert("Integração de pagamento em breve")} />
      {isAuthenticated && <ChatGemini />}
    </div>
  );
}
