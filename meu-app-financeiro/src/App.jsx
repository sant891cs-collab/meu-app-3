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
// COMPONENTES UI LOCAIS - ESTILO GLASS
// =====================================================
const Card = ({ children, className }) => (
  <div className={`rounded-3xl border border-white/30 bg-white/40 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.03)] overflow-hidden ${className || ""}`}>
    {children}
  </div>
);
const CardContent = ({ children, className }) => (
  <div className={`p-3 ${className || ""}`}>{children}</div>
);
const Button = ({ children, onClick, className, variant }) => {
  let base = "px-3 py-1.5 rounded-2xl font-medium transition-all shadow-sm text-sm ";
  if (variant === "destructive") base += "bg-rose-500/90 hover:bg-rose-600 text-white backdrop-blur-sm ";
  else if (variant === "secondary") base += "bg-white/60 hover:bg-white/80 text-gray-700 backdrop-blur-sm border border-white/40 ";
  else base += "bg-gray-800/90 hover:bg-gray-900 text-white backdrop-blur-sm ";
  return <button onClick={onClick} className={base + (className || "")}>{children}</button>;
};
const Input = (props) => (
  <input {...props} className={`rounded-xl border border-white/40 bg-white/60 backdrop-blur-sm py-2 px-3 text-base text-gray-800 placeholder:text-gray-500 ${props.className || ""}`} />
);

// =====================================================
// FORMATAÇÃO DE MOEDA
// =====================================================
function formatCurrency(value) {
  const numeric = typeof value === "number"
    ? value
    : Number(String(value).replace(/\./g, "").replace(",", "."));
  if (Number.isNaN(numeric)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numeric);
}

function formatCurrencyInput(value) {
  const digits = value.replace(/[^0-9]/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(digits) / 100);
}

function parseCurrencyInput(value) {
  const digits = value.replace(/[^0-9]/g, "");
  if (!digits) return 0;
  return Number(digits) / 100;
}

const DEFAULT_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    <rect width="128" height="128" rx="64" fill="#f8fafc"/>
    <circle cx="64" cy="48" r="22" fill="#cbd5e1"/>
    <path d="M24 112c7-22 24-34 40-34s33 12 40 34" fill="#cbd5e1"/>
  </svg>
`)}`;

const ANALISES_ESPECIAIS = [
  { id: "luz", label: "Luz", keywords: ["luz", "energia"] },
  { id: "agua", label: "Água", keywords: ["agua", "água"] },
  { id: "combustivel", label: "Combustível", keywords: ["gasolina", "combust", "posto"] },
];

// =====================================================
// FUNÇÕES AUXILIARES
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
// PERFIL DO USUÁRIO - ESTILO GLASS
// =====================================================
function UserProfile({ isOpen, onClose, onLogout, user, contas, cartoes, onDisconnectConta, onDisconnectCartao, onOpenPremium, onOpenPrivacy, onOpenDeleteAccount, onUpdateName }) {
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(user.name);
  useEffect(() => { setTempName(user.name); }, [user.name, isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[240] bg-black/20 backdrop-blur-sm transition-opacity">
      <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} className="absolute left-0 top-0 h-full w-full max-w-sm bg-white/70 backdrop-blur-xl shadow-2xl overflow-y-auto flex flex-col border-r border-white/30">
        <div className="relative h-48 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 p-6 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="flex items-center justify-between relative z-10">
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ArrowLeft size={24} /></button>
            <div className="size-6" />
          </div>
          <div className="absolute top-full -translate-y-[105%] left-8 z-20">
            <div className="relative group">
              <div className="size-24 rounded-[32px] bg-white/30 backdrop-blur p-1 shadow-xl rotate-3 group-hover:rotate-0 transition-transform duration-500 overflow-hidden border border-white/40">
                <img src={user.photo || DEFAULT_AVATAR} className="w-full h-full object-cover rounded-[28px]" alt="Avatar" />
              </div>
              <label className="absolute -bottom-1 -right-1 bg-gray-800 text-white p-2 rounded-2xl cursor-pointer shadow-lg hover:scale-110 transition-transform border-2 border-white/30">
                <Sparkles size={12} />
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === "string") {
                      localStorage.setItem("userPhoto", reader.result);
                      window.location.reload();
                    }
                  };
                  reader.readAsDataURL(file);
                }} />
              </label>
            </div>
          </div>
        </div>
        <div className="mt-14 px-6 space-y-6 pb-8">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {editingName ? (
                <div className="flex items-center gap-2 w-full">
                  <input value={tempName} onChange={(e) => setTempName(e.target.value)} className="flex-1 rounded-2xl border border-white/40 bg-white/60 backdrop-blur-sm px-3 py-2 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-gray-400" />
                  <button onClick={() => { onUpdateName(tempName.trim() || "Usuário"); setEditingName(false); }} className="rounded-2xl bg-gray-800 px-3 py-2 text-xs font-medium text-white shadow-sm">Salvar</button>
                  <button onClick={() => { setTempName(user.name); setEditingName(false); }} className="rounded-2xl border border-white/40 bg-white/60 px-3 py-2 text-xs font-medium text-gray-600">Cancelar</button>
                </div>
              ) : (
                <h3 className="text-2xl font-bold text-gray-800 tracking-tight truncate cursor-pointer hover:opacity-70" onClick={() => setEditingName(true)} title="Toque para editar nome">{user.name}</h3>
              )}
              {user.isPro && <Crown size={18} className="text-amber-500 fill-amber-500" />}
            </div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-tighter">{user.email}</p>
          </div>
          <button onClick={onOpenPremium} className="w-full group relative bg-white/40 backdrop-blur-sm border border-white/30 p-5 rounded-[28px] shadow-sm hover:shadow-md transition-all overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-amber-100/30 to-transparent opacity-50" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="size-12 bg-amber-100/50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:rotate-12 transition-transform"><Crown size={24} /></div>
              <div className="text-left"><h4 className="font-bold text-gray-800 text-sm uppercase">Upgrade para Pro</h4><p className="text-[10px] font-medium text-gray-500 uppercase">Acesso total ao Manin Intelligence</p></div>
            </div>
          </button>
          <div className="grid gap-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase ml-2 tracking-widest">Configurações</p>
            <MenuButton icon={<Bell size={18} />} label="Notificações" />
            <MenuButton icon={<Shield size={18} />} label="Privacidade" onClick={onOpenPrivacy} />
            <div className="h-px bg-gray-200/50 my-2" />
            <p className="text-[10px] font-bold text-gray-400 uppercase ml-2 tracking-widest">Conexões</p>
            {contas.length ? contas.map((c) => (
              <div key={c.id} className="w-full rounded-2xl bg-white/40 backdrop-blur-sm border border-white/30 p-4 shadow-sm flex items-center justify-between gap-3">
                <div className="min-w-0"><div className="text-sm font-medium text-gray-800 truncate">{c.descricao}</div><div className="text-xs text-gray-500 truncate">{c.banco || "Sem banco"}</div></div>
                <Button variant="destructive" onClick={() => onDisconnectConta(c.id)}>Desconectar</Button>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-white/40 bg-white/30 backdrop-blur-sm p-5 text-center text-xs text-gray-500">Espaço reservado para suas contas conectadas via Open Banking.</div>
            )}
            {cartoes.length ? cartoes.map((cartao) => (
              <div key={cartao.id} className="w-full rounded-2xl bg-white/40 backdrop-blur-sm border border-white/30 p-4 shadow-sm flex items-center justify-between gap-3">
                <div className="min-w-0"><div className="text-sm font-medium text-gray-800 truncate">{cartao.descricao}</div><div className="text-xs text-gray-500 truncate">Limite: R$ {cartao.limite.toFixed(2)}</div></div>
                <Button variant="destructive" onClick={() => onDisconnectCartao(cartao.id)}>Desconectar</Button>
              </div>
            )) : null}
            <button onClick={onLogout} className="w-full p-4 bg-white/40 backdrop-blur-sm text-rose-600 rounded-2xl flex items-center gap-3 font-medium text-sm shadow-sm border border-white/30 hover:bg-rose-50/50 transition-colors"><LogOut size={18} /> Sair da conta</button>
            <button onClick={onOpenDeleteAccount} className="w-full p-4 bg-white/40 backdrop-blur-sm text-gray-600 rounded-2xl flex items-center gap-3 font-medium text-sm shadow-sm border border-white/30 hover:bg-rose-50/50 hover:text-rose-600 transition-all"><Trash2 size={18} /> Excluir minha conta</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function MenuButton({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="w-full p-4 bg-white/40 backdrop-blur-sm text-gray-800 rounded-2xl flex items-center justify-between font-medium text-sm shadow-sm border border-white/30 hover:bg-white/60 transition-all">
      <div className="flex items-center gap-3"><span className="opacity-70">{icon}</span>{label}</div>
      <ArrowLeft size={16} className="rotate-180 opacity-40" />
    </button>
  );
}

// =====================================================
// MODAL PREMIUM - GLASS
// =====================================================
function PremiumModal({ isOpen, onClose, onContinue }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[260] bg-black/30 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl rounded-t-3xl md:rounded-3xl p-6 shadow-2xl border border-white/30">
        <div className="flex items-start justify-between gap-4">
          <div><div className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Plano Premium</div><h3 className="text-2xl font-bold text-gray-800">Desbloqueie tudo</h3></div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/40"><ArrowLeft size={20} /></button>
        </div>
        <div className="mt-5 rounded-2xl bg-white/40 backdrop-blur-sm p-4 space-y-3 border border-white/30">
          <div className="text-sm font-semibold text-gray-700">O que fica desbloqueado:</div>
          <ul className="space-y-2 text-sm text-gray-600 list-disc pl-5"><li>Contas conectadas via Open Banking</li><li>Visão consolidada das transações</li><li>Relatórios e análises avançadas</li><li>Automação e alertas inteligentes</li></ul>
          <div className="text-xs text-gray-500">Cancele a qualquer momento.</div>
        </div>
        <div className="mt-5 flex items-end justify-between gap-4"><div><div className="text-[10px] font-bold uppercase text-gray-500">Valor</div><div className="text-3xl font-bold text-gray-800">R$ 15,00</div><div className="text-xs text-gray-500">por mês</div></div></div>
        <div className="mt-5 grid grid-cols-1 gap-3"><Button onClick={onContinue}>Continuar</Button></div>
      </div>
    </div>
  );
}

// =====================================================
// FITA DE SOBREVIVÊNCIA - MANTIDA ELEGANTE
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
    <div className="fixed top-0 left-0 w-full z-[100] h-[4px] bg-gray-300/50 backdrop-blur-sm">
      <div className="relative w-full h-full shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
        <div className="h-full transition-all duration-1000 ease-in-out shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]" style={{ width: `${larguraBarra}%`, backgroundImage: getGradienteTermometro() }}><div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50" /></div>
        <div className="absolute top-0 h-full w-[1.5px] bg-white z-20 shadow-[0_0_12px_2px_rgba(255,255,255,0.9)]" style={{ left: `${percentualTempo}%` }} />
      </div>
    </div>
  );
}

// =====================================================
// GAUGE - AJUSTE FINAL
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
    <div className="relative w-full min-h-[150px] flex justify-center items-center overflow-visible pr-1">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "auto", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3399FF" />
            <stop offset="25%" stopColor="#6A6CDE" />
            <stop offset="50%" stopColor="#9B45C4" />
            <stop offset="75%" stopColor="#DA2C5B" />
            <stop offset="100%" stopColor="#FF0000" />
          </linearGradient>
        </defs>
        <path d={arcPath || undefined} fill="#e2e8f0" transform={`translate(${width / 2}, ${height})`} />
        <path d={arcPath || undefined} fill="url(#gaugeGradient)" transform={`translate(${width / 2}, ${height})`} />
        <g transform={`translate(${width / 2}, ${height}) rotate(${anguloPonteiro})`} className="transition-transform duration-700 ease-out">
          <path d={`M -4,0 A 4,4 0 1,1 4,0 L 0.4,-${outerRadius * 0.8} A 0.4,0.4 0 0,1 -0.4,-${outerRadius * 0.8} Z`} fill="#001f3f" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
          <circle cx="0" cy="0" r="7" fill="#001f3f" stroke="white" strokeWidth="2" />
          <circle cx="0" cy="0" r="2.5" fill="white" fillOpacity="0.4" />
        </g>
      </svg>
    </div>
  );
}

function TermometroSobrevivencia({ gastoAtual, metaMensal }) {
  const hoje = new Date();
  const diaAtual = hoje.getDate();
  const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const percentualTempo = diasNoMes > 0 ? (diaAtual / diasNoMes) * 100 : 0;
  const percentualGasto = metaMensal > 0 ? (gastoAtual / metaMensal) * 100 : 0;
  const taNoSufoco = percentualGasto > percentualTempo + 10;
  const getTermometroGradient = () => {
    if (percentualGasto <= 10) return "linear-gradient(to right, #1d4ed8 0%, #3b82f6 55%, #60a5fa 100%)";
    if (taNoSufoco) return "linear-gradient(to right, #7c3aed 0%, #c026d3 45%, #ef4444 100%)";
    return "linear-gradient(to right, #2563eb 0%, #8b5cf6 55%, #a855f7 100%)";
  };
  return (
    <div className="bg-white/40 backdrop-blur-sm p-3 rounded-2xl shadow-sm border border-white/30 mt-3">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-gray-700 font-semibold text-xs">Termômetro de sobrevivência</h3>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${taNoSufoco ? "bg-rose-100/70 text-rose-600" : percentualGasto > 10 ? "bg-violet-100/70 text-violet-600" : "bg-blue-100/70 text-blue-600"} backdrop-blur-sm`}>{taNoSufoco ? "Situação crítica" : percentualGasto > 10 ? "Atenção" : "Estável"}</span>
      </div>
      <div className="relative h-5 w-full bg-gray-100/50 rounded-lg overflow-hidden border border-white/30"><div className="h-full transition-all duration-500" style={{ width: `${Math.min(percentualGasto, 100)}%`, backgroundImage: getTermometroGradient() }} /></div>
      <div className="flex justify-between mt-1.5 text-[10px] text-gray-500"><span>Gasto atual</span><span>Hoje (dia {diaAtual})</span></div>
      <div className="mt-2 text-[10px] text-gray-700">{taNoSufoco ? "Você está gastando mais rápido que o tempo do mês. Atenção no ritmo." : percentualGasto > 10 ? "Você já passou da faixa azul. Começa a ficar mais sério daqui pra frente." : "Ritmo de gastos dentro do esperado para o período."}</div>
    </div>
  );
}

// =====================================================
// TELA DE LOGIN - GLASS
// =====================================================
function TelaInicialLogin({ onLogin }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200 p-6 text-center relative">
      {/* Textura sutil */}
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
      <div className="w-full max-w-md rounded-[32px] bg-white/40 backdrop-blur-xl p-8 shadow-[0_25px_50px_rgba(0,0,0,0.05)] ring-1 ring-white/50 relative z-10">
        <div className="mx-auto mb-6 flex items-center justify-center">
          <img
            src="/manyn_logo.png"
            alt="Logo manyn"
            className="h-24 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextSibling.style.display = "flex";
            }}
          />
          <div
            style={{ display: "none" }}
            className="items-center justify-center rounded-full bg-gray-800 px-6 py-4"
          >
            <span className="text-white text-2xl font-bold lowercase tracking-tight">manyn</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Bem-vindo</h1>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">Seus dados são protegidos e você pode sair quando quiser.</p>
        <div className="mt-2 text-[13px] font-bold text-gray-400 tracking-wide"><span className="font-bold text-gray-500">Open</span><span className="font-normal text-gray-400">Finance</span></div>
        <div className="mt-8 grid gap-4 w-full">
          <Button onClick={onLogin} className="w-full bg-white !text-gray-800 border border-white/40 hover:bg-white/80 font-medium rounded-2xl shadow-sm">
            <div className="flex items-center justify-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5"><path fill="#EA4335" d="M24 9.5c3.54 0 6.69 1.22 9.18 3.61l6.85-6.85C35.9 2.36 30.4 0 24 0 14.64 0 6.46 5.48 2.69 13.44l7.98 6.2C12.52 13.09 17.76 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.63-.15-3.2-.43-4.71H24v9.02h12.68c-.55 2.96-2.23 5.47-4.75 7.15l7.29 5.67C43.98 37.73 46.5 31.64 46.5 24.5z"/><path fill="#FBBC05" d="M10.67 28.64a14.49 14.49 0 010-9.28l-7.98-6.2A23.93 23.93 0 000 24c0 3.9.94 7.58 2.69 10.84l7.98-6.2z"/><path fill="#34A853" d="M24 48c6.4 0 11.9-2.12 15.86-5.77l-7.29-5.67c-2.02 1.36-4.61 2.17-8.57 2.17-6.24 0-11.48-3.59-13.33-8.74l-7.98 6.2C6.46 42.52 14.64 48 24 48z"/></svg>
              <span>Continuar com Google</span>
            </div>
          </Button>
        </div>
        <div className="mt-6 text-xs text-gray-500">Ao continuar, você concorda com os Termos de Uso e com a Política de Privacidade do aplicativo.</div>
      </div>
    </div>
  );
}

// =====================================================
// CHAT GEMINI - GLASS
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
  async function toggleRecording() { if (isRecording) { recorderRef.current?.stop(); return; } try { if (!navigator.mediaDevices?.getUserMedia) { console.error("Gravação de áudio não suportada neste navegador."); return; } const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const recorder = new MediaRecorder(stream); audioChunksRef.current = []; recorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); }; recorder.onstop = () => { const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" }); const url = URL.createObjectURL(blob); const now = new Date(); const name = `Áudio ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`; setAttachments((prev) => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, kind: "audio", name, url }]); stream.getTracks().forEach((track) => track.stop()); setIsRecording(false); }; recorderRef.current = recorder; recorder.start(); setIsRecording(true); setMenuOpen(false); } catch (error) { console.error(error); setIsRecording(false); } }
  function handleSend() { const trimmed = input.trim(); if (!trimmed && attachments.length === 0) return; const currentAttachments = attachments; setMensagens((prev) => [...prev, { id: `${Date.now()}`, role: "user", text: trimmed || "Anexo enviado", attachments: currentAttachments }]); setInput(""); setAttachments([]); setTimeout(() => { setMensagens((prev) => [...prev, { id: `bot-${Date.now()}`, role: "bot", text: "Entendido! Processando aqui... (Em breve vou integrar isso de verdade no seu banco de dados)." }]); }, 1000); }
  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-6 right-6 z-[300] size-14 rounded-full bg-gray-800/90 backdrop-blur-sm text-white shadow-2xl flex items-center justify-center active:scale-90 transition-transform border border-white/30">{isOpen ? <ArrowLeft className="rotate-[-90deg]" /> : <Sparkles className="size-6" />}{!isOpen && <span className="absolute -top-2 -right-2 bg-rose-500 text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce">AI</span>}</button>
      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { appendAttachments(e.currentTarget.files, "image"); e.currentTarget.value = ""; }} />
      <input ref={fileInputRef} type="file" accept="*/*" multiple className="hidden" onChange={(e) => { appendAttachments(e.currentTarget.files, "file"); e.currentTarget.value = ""; }} />
      {isOpen && (
        <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="fixed bottom-24 right-6 z-[300] w-[calc(100vw-48px)] max-w-[350px] bg-white/70 backdrop-blur-xl rounded-[28px] shadow-2xl border border-white/30 overflow-hidden flex flex-col" style={{ height: "450px" }}>
          <div className="bg-white/40 p-4 flex items-center justify-center border-b border-white/30"><div className="size-8 bg-white/60 rounded-full flex items-center justify-center"><Sparkles className="text-gray-600 size-4" /></div></div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/20 flex flex-col">
            {mensagens.length === 0 && (<div className="flex-1 flex flex-col justify-center px-2"><div className="w-full text-left text-gray-700 font-bold" style={{ fontSize: "18px", lineHeight: "1.2" }}>Olá,</div><div className="w-full text-left text-gray-600 font-normal" style={{ fontSize: "20px", lineHeight: "1.4", marginTop: "4px" }}>Por onde começamos?</div></div>)}
            {mensagens.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "user" ? (
                  <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-gray-200/70 backdrop-blur-sm px-4 py-3 text-sm font-medium text-gray-800 shadow-sm border border-white/30">
                    <div>{msg.text}</div>
                    {msg.attachments?.length ? (<div className="mt-3 space-y-2">{msg.attachments.map((att) => { if (att.kind === "image") return <div key={att.id} className="overflow-hidden rounded-xl border border-white/30 bg-white/50"><img src={att.url} alt={att.name} className="max-h-48 w-full object-cover" /><div className="px-3 py-2 text-[11px] text-gray-500 bg-white/60">{att.name}</div></div>; if (att.kind === "audio") return <div key={att.id} className="rounded-xl border border-white/30 bg-white/50 p-3"><div className="mb-2 flex items-center gap-2 text-xs text-gray-500"><Mic size={14} />{att.name}</div><audio controls src={att.url} className="w-full" /></div>; return <div key={att.id} className="rounded-xl border border-white/30 bg-white/50 p-3 flex items-center gap-2 text-xs text-gray-600"><Paperclip size={14} /><span className="truncate">{att.name}</span></div>; })}</div>) : null}
                  </div>
                ) : (
                  <div className="max-w-[85%] px-1 py-1 text-sm font-medium text-gray-800 leading-relaxed">
                    <div>{msg.text}</div>
                    {msg.attachments?.length ? (<div className="mt-3 space-y-2">{msg.attachments.map((att) => { if (att.kind === "image") return <div key={att.id} className="overflow-hidden rounded-xl border border-white/30 bg-white/50"><img src={att.url} alt={att.name} className="max-h-48 w-full object-cover" /><div className="px-3 py-2 text-[11px] text-gray-500 bg-white/60">{att.name}</div></div>; if (att.kind === "audio") return <div key={att.id} className="rounded-xl border border-white/30 bg-white/50 p-3"><div className="mb-2 flex items-center gap-2 text-xs text-gray-500"><Mic size={14} />{att.name}</div><audio controls src={att.url} className="w-full" /></div>; return <div key={att.id} className="rounded-xl border border-white/30 bg-white/50 p-3 flex items-center gap-2 text-xs text-gray-600"><Paperclip size={14} /><span className="truncate">{att.name}</span></div>; })}</div>) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
          {attachments.length > 0 && (<div className="px-4 pt-3 pb-2 flex flex-wrap gap-2 bg-white/40 border-t border-white/30">{attachments.map((att) => (<div key={att.id} className="relative">{att.kind === "image" ? (<img src={att.url} alt={att.name} className="h-16 w-16 rounded-2xl object-cover border border-white/30 shadow-sm" />) : (<div className="h-16 max-w-[180px] rounded-2xl border border-white/30 bg-white/50 px-3 py-2 shadow-sm flex items-center gap-2 text-xs text-gray-600">{att.kind === "audio" ? <Mic size={14} /> : <Paperclip size={14} />}<span className="truncate">{att.name}</span></div>)}<button onClick={() => removeAttachment(att.id)} className="absolute -top-2 -right-2 size-5 rounded-full bg-gray-800 text-white flex items-center justify-center shadow"><X size={11} /></button></div>))}</div>)}
          <div className="p-4 bg-white/40 backdrop-blur-sm border-t border-white/30 flex gap-2">
            <div className="relative flex items-center"><button type="button" onClick={() => setMenuOpen((prev) => !prev)} className="size-10 rounded-full bg-white/60 text-gray-600 flex items-center justify-center hover:bg-white/80 transition-colors" title="Adicionar anexo"><span className="text-xl font-bold">+</span></button>{menuOpen && (<div className="absolute bottom-12 left-0 bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl shadow-lg p-2 flex flex-col gap-2 z-50"><button type="button" onClick={async () => { try { const stream = await navigator.mediaDevices.getUserMedia({ video: true }); const track = stream.getVideoTracks()[0]; const imageCapture = new ImageCapture(track); const blob = await imageCapture.takePhoto(); const url = URL.createObjectURL(blob); const now = new Date(); setAttachments((prev) => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, kind: "image", name: `Foto ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`, url }]); track.stop(); setMenuOpen(false); } catch (err) { console.error(err); } }} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white text-sm text-gray-700"><Camera size={16} className="text-gray-600" /> Câmera</button><button type="button" onClick={() => { imageInputRef.current?.click(); setMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white text-sm text-gray-700"><Image size={16} /> Galeria</button><button type="button" onClick={() => { fileInputRef.current?.click(); setMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white text-sm text-gray-700"><Paperclip size={16} className="text-gray-600" /> Arquivo</button></div>)}</div>
            <div className="relative flex-1"><input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Ex: Gastei 50 no mercado..." className="w-full bg-white/60 backdrop-blur-sm border border-white/40 rounded-full px-4 pr-12 py-2 text-sm text-gray-800 placeholder:text-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300" /><button type="button" onClick={toggleRecording} className={`absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-full flex items-center justify-center transition-colors ${isRecording ? "bg-rose-500 text-white animate-pulse" : "bg-white/60 text-gray-600 hover:bg-white/80"}`} title={isRecording ? "Parar gravação" : "Gravar áudio"}>{isRecording ? <Square size={14} /> : <Mic size={16} />}</button></div>
            <button onClick={handleSend} className="bg-gray-800 text-white p-2 rounded-full active:scale-90 transition-transform hover:bg-gray-900"><ArrowLeft className="rotate-180 size-5" /></button>
          </div>
        </motion.div>
      )}
      {isOpen && <div className="fixed inset-0 z-[290] bg-black/5 backdrop-blur-[2px]" onClick={() => setIsOpen(false)} />}
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
        setLancamentos([]);
        setContas([]);
        setCartoes([]);
        setGastosFixos([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function carregarDadosDoUsuario(userId) {
    const { data: lancamentosData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('data', { ascending: false });
    if (lancamentosData) setLancamentos(lancamentosData);

    const { data: contasData } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId);
    if (contasData) {
      setContas(contasData);
      setCartoes(contasData.filter(c => c.tipo === 'cartao'));
    }

    const { data: gastosData } = await supabase
      .from('fixed_expenses')
      .select('*')
      .eq('user_id', userId);
    if (gastosData) setGastosFixos(gastosData);

    const { data: metaData } = await supabase
      .from('user_settings')
      .select('meta_mensal')
      .eq('user_id', userId)
      .single();
    if (metaData) setMetaMensal(metaData.meta_mensal || 0);
  }

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) console.error(error);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAviso("Você saiu da conta.");
  };

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
    
    const novoLancamento = {
      user_id: userId,
      descricao: lancamento.descricao,
      valor: lancamento.valor,
      tipo: lancamento.tipo,
      categoria: lancamento.categoria,
      natureza: lancamento.natureza,
      data: lancamento.data,
      conta_id: lancamento.contaId || null
    };

    if (editandoId) {
      const { error } = await supabase
        .from('transactions')
        .update(novoLancamento)
        .eq('id', editandoId)
        .eq('user_id', userId);
      if (!error) {
        setLancamentos(prev => prev.map(l => l.id === editandoId ? { ...l, ...novoLancamento } : l));
        setAviso("Movimentação atualizada.");
      }
    } else {
      const { data, error } = await supabase
        .from('transactions')
        .insert([novoLancamento])
        .select();
      if (!error && data) {
        setLancamentos(prev => [data[0], ...prev]);
        setAviso("Movimentação registrada.");
      }
    }
    setPreviewLancamento(null);
    limparFormulario();
  }

  function limparFormulario() {
    setValorInput("");
    setDescricaoInput("");
    setContaSelecionada("");
    setEditandoId(null);
  }

  function registradorBase(payload) {
    salvarLancamento(payload);
  }

  function registrarMovimentoManual(tipoOverride) {
    if (!descricaoInput.trim() || !valorInput.trim()) return;
    const valor = parseCurrencyInput(valorInput);
    if (Number.isNaN(valor)) return;
    const categoriaEncontrada = categorias.find(c => c.nome === categorize(descricaoInput) && c.tipo === tipoOverride);
    const categoriaFinal = categoriaEncontrada ? categoriaEncontrada.nome : categorize(descricaoInput);
    const natureza = detectNature(descricaoInput);
    setPreviewLancamento({
      descricao: descricaoInput.trim(),
      valor,
      tipo: tipoOverride,
      categoria: categoriaFinal,
      natureza,
      data: dataSelecionada,
      contaId: contaSelecionada || null,
    });
    setAviso("Confira a prévia antes de confirmar.");
  }

  function confirmarLancamentoPreview() {
    if (!previewLancamento) return;
    registradorBase(previewLancamento);
  }

  function cancelarLancamentoPreview() {
    setPreviewLancamento(null);
  }

  function iniciarEdicao(lancamento) {
    setDescricaoInput(lancamento.descricao);
    setValorInput(formatCurrency(lancamento.valor));
    setContaSelecionada(lancamento.conta_id || "");
    setDataSelecionada(lancamento.data);
    setEditandoId(lancamento.id);
    setAviso("Editando lançamento.");
  }

  async function excluirLancamento(id) {
    const userId = user?.id;
    if (!userId) return;
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (!error) {
      setLancamentos(prev => prev.filter(l => l.id !== id));
      setAviso("Lançamento excluído.");
    }
  }

  async function adicionarConta() {
    if (!contaNome.trim()) return;
    const userId = user?.id;
    if (!userId) return;
    const novaConta = {
      user_id: userId,
      nome: contaNome,
      banco: contaBanco,
      tipo: 'conta',
      saldo_inicial: 0
    };
    const { data, error } = await supabase
      .from('accounts')
      .insert([novaConta])
      .select();
    if (!error && data) {
      setContas(prev => [data[0], ...prev]);
      setContaNome("");
      setContaBanco("");
      setAviso("Conta cadastrada.");
    }
  }

  async function adicionarCartao() {
    if (!cartaoNome.trim() || !limiteCartao) return;
    const userId = user?.id;
    if (!userId) return;
    const novoCartao = {
      user_id: userId,
      nome: cartaoNome,
      tipo: 'cartao',
      limite: Number(limiteCartao),
      saldo_inicial: 0
    };
    const { data, error } = await supabase
      .from('accounts')
      .insert([novoCartao])
      .select();
    if (!error && data) {
      setCartoes(prev => [data[0], ...prev]);
      setContas(prev => [data[0], ...prev]);
      setCartaoNome("");
      setLimiteCartao("");
      setAviso("Cartão cadastrado.");
    }
  }

  async function desconectarConta(id) {
    const userId = user?.id;
    if (!userId) return;
    await supabase.from('accounts').delete().eq('id', id).eq('user_id', userId);
    setContas(prev => prev.filter(c => c.id !== id));
    setCartoes(prev => prev.filter(c => c.id !== id));
    setAviso("Conta desconectada.");
  }

  async function desconectarCartao(id) {
    await desconectarConta(id);
  }

  const mesAtual = new Date().toISOString().slice(0, 7);
  const lancamentosMesAtual = useMemo(() => lancamentos.filter(l => String(l.data).startsWith(mesAtual)), [lancamentos, mesAtual]);
  const totalEntradasMes = lancamentosMesAtual.filter(l => l.tipo === "receita").reduce((acc, l) => acc + l.valor, 0);
  const totalDespesasMes = lancamentosMesAtual.filter(l => l.tipo === "despesa").reduce((acc, l) => acc + l.valor, 0);
  const saldoMes = totalEntradasMes - totalDespesasMes;
  const percentualMeta = metaMensal > 0 ? Math.min((totalDespesasMes / metaMensal) * 100, 100) : 0;

  const categoriasReceita = useMemo(() => [...new Set(lancamentos.filter(l => l.tipo === "receita").map(l => l.categoria))], [lancamentos]);
  const categoriasDespesa = useMemo(() => [...new Set(lancamentos.filter(l => l.tipo === "despesa").map(l => l.categoria))], [lancamentos]);

  const dadosPizza = useMemo(() => {
    const cats = {};
    lancamentosMesAtual.filter(l => l.tipo === "despesa").forEach(l => {
      cats[l.categoria] = (cats[l.categoria] || 0) + l.valor;
    });
    return Object.entries(cats).map(([categoria, valor]) => ({ categoria, valor }));
  }, [lancamentosMesAtual]);

  const lancamentosFiltrados = useMemo(() => lancamentos.filter(l => String(l.data).startsWith(mesFiltro)), [lancamentos, mesFiltro]);

  const analiseSelecionada = tipoAnalise === "receita" ? analiseSelecionadaReceita : analiseSelecionadaDespesa;
  const mesesAnalise = getMonthRange(mesAtual, periodoAnalise);
  const serieAnaliseEspecial = useMemo(() => {
    const filtrados = lancamentos.filter(l => {
      if (l.tipo !== tipoAnalise) return false;
      const mes = l.data.slice(0, 7);
      if (!mesesAnalise.includes(mes)) return false;
      if (tipoAnalise === "despesa") {
        const especial = ANALISES_ESPECIAIS.find(e => e.id === analiseSelecionada);
        if (especial) return isKeywordMatch(l.descricao, especial.keywords);
      }
      return l.categoria === analiseSelecionada;
    });
    return buildMonthlyCategorySeries(filtrados, mesesAnalise);
  }, [lancamentos, analiseSelecionada, tipoAnalise, mesAtual, periodoAnalise]);

  const mesesReferenciaAnalise = useMemo(() => getMonthRange(mesAtual, periodoAnalise), [mesAtual, periodoAnalise]);
  const lancamentosAnaliseEspecial = useMemo(() => lancamentos.filter(l => {
    if (l.tipo !== tipoAnalise) return false;
    const mes = l.data.slice(0, 7);
    if (!mesesReferenciaAnalise.includes(mes)) return false;
    if (tipoAnalise === "despesa") {
      const especial = ANALISES_ESPECIAIS.find(e => e.id === analiseSelecionada);
      if (especial) return isKeywordMatch(l.descricao, especial.keywords);
    }
    return l.categoria === analiseSelecionada;
  }), [lancamentos, analiseSelecionada, tipoAnalise, mesesReferenciaAnalise]);
  const totalAnaliseEspecial = lancamentosAnaliseEspecial.reduce((acc, l) => acc + l.valor, 0);
  const quantidadeAnaliseEspecial = lancamentosAnaliseEspecial.length;

  function getContaNomeById(id) {
    if (!id) return "Sem conta";
    const conta = contas.find(c => c.id === id);
    return conta ? conta.nome : "Conta não encontrada";
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200">
        <div className="text-gray-800 font-medium">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <TelaInicialLogin onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-100 via-white to-gray-200 relative">
      {/* Textura sutil global */}
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
      
      <FitaMetalicaElite gastoAtual={totalDespesasMes} receitaAtual={totalEntradasMes} metaMensal={metaMensal} />
      <div className="fixed top-4 left-4 z-[200]">
        <button onClick={() => setProfileOpen(true)} className="size-10 rounded-full border-2 border-white/50 bg-white/40 backdrop-blur-sm overflow-hidden shadow-lg active:scale-90 transition-transform">
          <img src={userPhoto} alt="Perfil" className="w-full h-full object-cover" />
        </button>
      </div>

      {/* Área fixa superior */}
      <div className="flex-shrink-0 pt-14 px-3 sm:px-6 max-w-6xl mx-auto w-full relative z-10">
        {aviso && (
          <div className="text-xs text-gray-600 text-center rounded-full bg-white/40 backdrop-blur-sm px-3 py-1 border border-white/30 mb-1">
            {aviso}
          </div>
        )}

        <Card className="mb-2">
          <CardContent className="grid gap-2 p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                placeholder="Valor (R$)"
                inputMode="numeric"
                value={valorInput}
                onChange={(e) => setValorInput(formatCurrencyInput(e.target.value))}
                className="text-right font-semibold"
              />
              <Input
                placeholder="Descrição do gasto"
                value={descricaoInput}
                onChange={(e) => setDescricaoInput(e.target.value)}
                className="font-semibold text-center"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button onClick={() => registrarMovimentoManual("receita")} className="bg-emerald-500/90 hover:bg-emerald-600 text-white">
                Adicionar Receita
              </Button>
              <Button onClick={() => registrarMovimentoManual("despesa")} className="bg-rose-500/90 hover:bg-rose-600 text-white">
                Adicionar Despesa
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex overflow-x-auto whitespace-nowrap gap-1 rounded-2xl bg-white/40 backdrop-blur-md p-1 shadow-sm mb-2 border border-white/30">
          <button onClick={() => setActiveTab("inicio")} className={`flex-shrink-0 px-3 py-1.5 rounded-xl font-medium text-sm transition-all ${activeTab === "inicio" ? "bg-white/70 shadow-sm text-gray-800" : "text-gray-600 hover:bg-white/40"}`}>Início</button>
          <button onClick={() => setActiveTab("movimentos")} className={`flex-shrink-0 px-3 py-1.5 rounded-xl font-medium text-sm transition-all ${activeTab === "movimentos" ? "bg-white/70 shadow-sm text-gray-800" : "text-gray-600 hover:bg-white/40"}`}>Movimentos</button>
          <button onClick={() => setActiveTab("fixos")} className={`flex-shrink-0 px-3 py-1.5 rounded-xl font-medium text-sm transition-all ${activeTab === "fixos" ? "bg-white/70 shadow-sm text-gray-800" : "text-gray-600 hover:bg-white/40"}`}>Fixos</button>
          <button onClick={() => setActiveTab("analises")} className={`flex-shrink-0 px-3 py-1.5 rounded-xl font-medium text-sm transition-all ${activeTab === "analises" ? "bg-white/70 shadow-sm text-gray-800" : "text-gray-600 hover:bg-white/40"}`}>Análises</button>
          <button onClick={() => setActiveTab("meta")} className={`flex-shrink-0 px-3 py-1.5 rounded-xl font-medium text-sm transition-all ${activeTab === "meta" ? "bg-white/70 shadow-sm text-gray-800" : "text-gray-600 hover:bg-white/40"}`}>Meta</button>
        </div>
      </div>

      {/* Área rolável */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 max-w-6xl mx-auto w-full pb-4 relative z-10">
        {activeTab === "inicio" && (
          <Card>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <div className="rounded-2xl bg-white/40 backdrop-blur-sm p-2 border border-white/30 shadow-sm"><div className="text-xs text-gray-600">Entradas do mês</div><div className="text-base font-semibold text-gray-800">{formatCurrency(totalEntradasMes)}</div></div>
                <div className="rounded-2xl bg-white/40 backdrop-blur-sm p-2 border border-white/30 shadow-sm"><div className="text-xs text-gray-600">Despesas do mês</div><div className="text-base font-semibold text-gray-800">{formatCurrency(totalDespesasMes)}</div></div>
                <div className="rounded-2xl bg-white/40 backdrop-blur-sm p-2 border border-white/30 shadow-sm"><div className="text-xs text-gray-600">Saldo do mês</div><div className="text-base font-semibold text-gray-800">{formatCurrency(saldoMes)}</div></div>
                <div className="rounded-2xl bg-white/40 backdrop-blur-sm p-2 border border-white/30 shadow-sm"><div className="text-xs text-gray-600">Meta de gastos</div><div className="text-base font-semibold text-gray-800">{formatCurrency(metaMensal)}</div><div className="text-[10px] mt-0.5 text-gray-500">Usado: {percentualMeta.toFixed(0)}%</div></div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart><Tooltip /><Legend /><Pie data={dadosPizza} dataKey="valor" nameKey="categoria" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={3}>{dadosPizza.map((_, index) => { const cores = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#64748b"]; return <Cell key={index} fill={cores[index % cores.length]} />; })}</Pie></PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {activeTab === "meta" && (
          <Card>
            <CardContent className="p-3">
              <div className="text-base font-semibold mb-2 text-gray-800">Meta de Gastos Mensal</div>
              
              <div className="flex flex-row gap-2 items-stretch">
                {/* Coluna do gráfico - maior proporção */}
                <div className="flex-[8] rounded-2xl bg-white/40 backdrop-blur-sm p-2 flex flex-col items-center justify-center overflow-visible border border-white/30">
                  <TermometroGauge totalDespesas={totalDespesasMes} totalReceitas={totalEntradasMes} metaMensal={metaMensal} />
                  <div className="mt-1 text-center">
                    <div className="text-xs text-gray-600">Uso da meta</div>
                    <div className="text-xl font-semibold text-gray-800">{percentualMeta.toFixed(0)}%</div>
                  </div>
                  {percentualMeta >= 100 && <div className="text-rose-600 font-medium mt-0.5 text-[10px]">Ultrapassou a meta!</div>}
                  {percentualMeta >= 80 && percentualMeta < 100 && <div className="text-amber-600 font-medium mt-0.5 text-[10px]">Perto do limite.</div>}
                </div>

                {/* Coluna do formulário - menor proporção */}
                <div className="flex-[3] rounded-2xl bg-white/40 backdrop-blur-sm p-2 flex flex-col gap-1.5 min-w-[120px] border border-white/30">
                  <div className="text-[10px] text-gray-600">Valor máximo:</div>
                  <Input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9.,]*"
                    placeholder="Ex: 2000"
                    value={metaMensalInput}
                    onChange={(e) => setMetaMensalInput(e.target.value)}
                    onBlur={() => {
                      const cleaned = metaMensalInput.replace(/[^0-9,\.]/g, "");
                      const numeric = parseFloat(cleaned.replace(",", "."));
                      setMetaMensal(Number.isNaN(numeric) ? 0 : numeric);
                    }}
                    className="px-2 py-1.5 font-bold text-center text-sm"
                    style={{ fontSize: "16px", height: "40px" }}
                  />
                  <Button
                    className="text-[10px] py-1"
                    onClick={async () => {
                      if (user?.id) {
                        await supabase.from('user_settings').upsert({ user_id: user.id, meta_mensal: metaMensal });
                        setAviso("Meta mensal atualizada.");
                      }
                    }}
                  >
                    Salvar meta
                  </Button>
                  <div className="text-[8px] text-gray-400 text-center">Aviso de limite</div>
                </div>
              </div>

              <div className="mt-3">
                <TermometroSobrevivencia gastoAtual={totalDespesasMes} metaMensal={metaMensal} />
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "movimentos" && (
          <Card>
            <CardContent className="grid gap-2 p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Selecionar mês:</span>
                <Input type="month" value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)} className="w-40 text-sm py-1" />
              </div>
              {Object.entries(lancamentosFiltrados.reduce((acc, l) => { if (!acc[l.data]) acc[l.data] = []; acc[l.data].push(l); return acc; }, {})).sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([data, itens]) => (
                <div key={data} className="grid gap-1.5">
                  <div className="text-xs font-bold text-gray-400 mt-1">{new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</div>
                  {itens.map((l) => (
                    <div key={l.id} className="rounded-xl bg-white/40 backdrop-blur-sm p-2 flex justify-between items-center border border-white/30">
                      <div>
                        <div className="flex items-center gap-1.5 font-medium text-sm text-gray-800">
                          <span className={`w-2.5 h-2.5 rounded-full ${l.tipo === "receita" ? "bg-emerald-500" : "bg-rose-500"}`} />
                          {l.descricao}
                        </div>
                        <div className="text-[10px] text-gray-500">{l.categoria} • {l.natureza}{l.conta_id ? ` • ${getContaNomeById(l.conta_id)}` : ""}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`font-semibold text-base ${l.tipo === "receita" ? "text-emerald-600" : "text-rose-600"}`}>
                          {formatCurrency(Number(l.valor || 0))}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="secondary" onClick={() => iniciarEdicao(l)} className="px-2 py-1 text-xs">Editar</Button>
                          <Button variant="destructive" className="px-2 py-1 text-xs" onClick={() => excluirLancamento(l.id)}>Excluir</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {activeTab === "fixos" && (
          <Card>
            <CardContent className="grid gap-3 p-3">
              <div className="text-base font-semibold text-gray-800">Despesas Fixas</div>
              <div className="grid md:grid-cols-4 gap-2">
                <Input placeholder="Nome da despesa" value={gastoFixoNome} onChange={(e) => setGastoFixoNome(e.target.value)} className="text-sm py-1.5" />
                <Input inputMode="decimal" placeholder="Valor" value={gastoFixoValor} onChange={(e) => setGastoFixoValor(e.target.value.replace(/[^0-9.,]/g, ""))} className="text-sm py-1.5" />
                <Input inputMode="numeric" placeholder="Dia do vencimento" value={gastoFixoDia} onChange={(e) => setGastoFixoDia(e.target.value.replace(/[^0-9]/g, ""))} className="text-sm py-1.5" />
                <Input inputMode="numeric" placeholder="Avisar dias antes" value={gastoFixoAviso} onChange={(e) => setGastoFixoAviso(e.target.value.replace(/[^0-9]/g, ""))} className="text-sm py-1.5" />
              </div>
              <Button onClick={async () => { if (!gastoFixoNome || !gastoFixoValor || !gastoFixoDia) return; const userId = user?.id; if (!userId) return; const novo = { user_id: userId, nome: gastoFixoNome, valor: Number(gastoFixoValor.replace(",", ".")), dia_vencimento: Number(gastoFixoDia), dias_aviso: Number(gastoFixoAviso || 3), ativa: true, categoria: null }; const { data, error } = await supabase.from('fixed_expenses').insert([novo]).select(); if (!error && data) { setGastosFixos(prev => [...prev, data[0]]); setGastoFixoNome(""); setGastoFixoValor(""); setGastoFixoDia(""); setGastoFixoAviso("3"); setAviso("Despesa fixa cadastrada."); } }}>Adicionar despesa fixa</Button>
              <div className="grid gap-2">
                {gastosFixos.map((g) => (
                  <div key={g.id} className="rounded-xl bg-white/40 backdrop-blur-sm p-2 flex justify-between items-center border border-white/30">
                    <div>
                      <div className="font-medium text-sm text-gray-800">{g.nome}</div>
                      <div className="text-xs text-gray-500">{formatCurrency(g.valor)} • vence dia {g.dia_vencimento} • próximo: {calcularProximaData(g.dia_vencimento)} • aviso {g.dias_aviso} dias antes</div>
                    </div>
                    <Button variant="destructive" className="px-2 py-1 text-xs" onClick={async () => { await supabase.from('fixed_expenses').delete().eq('id', g.id); setGastosFixos(prev => prev.filter(x => x.id !== g.id)); setAviso("Despesa fixa removida."); }}>Excluir</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "analises" && (
          <Card>
            <CardContent className="p-3 grid gap-2">
              <div className="grid md:grid-cols-3 gap-2 items-end">
                <div className="grid gap-0.5">
                  <div className="text-[10px] text-gray-500">Tipo</div>
                  <select value={tipoAnalise} onChange={(e) => setTipoAnalise(e.target.value)} className="rounded-xl bg-white/60 backdrop-blur-sm p-1.5 text-sm text-gray-700 border border-white/40">
                    <option value="despesa">Despesas</option>
                    <option value="receita">Receitas</option>
                  </select>
                </div>
                <div className="grid gap-0.5">
                  <div className="text-[10px] text-gray-500">Categoria</div>
                  <select value={analiseSelecionada} onChange={(e) => { const valor = e.target.value; if (tipoAnalise === "receita") setAnaliseSelecionadaReceita(valor); else setAnaliseSelecionadaDespesa(valor); }} className="rounded-xl bg-white/60 backdrop-blur-sm p-1.5 text-sm text-gray-700 border border-white/40">
                    {(tipoAnalise === "receita" ? categoriasReceita : [...ANALISES_ESPECIAIS.map(a => a.id), ...categoriasDespesa]).map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                </div>
                <div className="grid gap-0.5">
                  <div className="text-[10px] text-gray-500">Período</div>
                  <select value={periodoAnalise} onChange={(e) => setPeriodoAnalise(Number(e.target.value))} className="rounded-xl bg-white/60 backdrop-blur-sm p-1.5 text-sm text-gray-700 border border-white/40">
                    <option value={1}>Mês atual</option>
                    <option value={2}>Últimos 2 meses</option>
                    <option value={3}>Últimos 3 meses</option>
                    <option value={4}>Últimos 4 meses</option>
                    <option value={5}>Últimos 5 meses</option>
                    <option value={6}>Últimos 6 meses</option>
                  </select>
                </div>
              </div>
              <div className="text-xs text-gray-500">Evolução mensal da categoria selecionada</div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={serieAnaliseEspecial}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="mes" ticks={mesesReferenciaAnalise} tickFormatter={formatMonthLabel} interval={0} minTickGap={0} tickMargin={8} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="linear" dataKey="valor" stroke={tipoAnalise === "receita" ? "#10b981" : "#ef4444"} fill={tipoAnalise === "receita" ? "#10b981" : "#ef4444"} fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="text-xs text-gray-600">Total no período: <strong>{formatCurrency(totalAnaliseEspecial)}</strong> • Quantidade: <strong>{quantidadeAnaliseEspecial}</strong></div>
            </CardContent>
          </Card>
        )}

        <div className="w-full text-center mt-3 pb-2">
          <div className="inline-block bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30 shadow-sm">
            <span className="text-[10px] text-gray-500 tracking-wide font-medium">
              Segue em frente... a cada passo de confiança a luz aparece.
            </span>
          </div>
        </div>
      </div>

      {previewLancamento && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-5 w-full max-w-md grid gap-3 shadow-2xl border border-white/40">
            <div className="flex items-center justify-between"><h2 className="text-base font-bold text-gray-800">Prévia do lançamento</h2><div className="text-[10px] font-semibold text-gray-400 uppercase">Revise antes de salvar</div></div>
            <div className="flex items-center justify-between rounded-2xl bg-white/50 backdrop-blur-sm px-3 py-3 border border-white/40"><span className="text-sm font-semibold text-gray-600">Valor do lançamento</span><Input inputMode="decimal" pattern="[0-9.,]*" value={formatCurrency(previewLancamento.valor)} onChange={(e) => setPreviewLancamento(prev => prev ? { ...prev, valor: parseCurrencyInput(e.target.value) } : prev)} className="w-24 border-none bg-transparent text-right text-lg font-bold focus:ring-0" /></div>
            <div className="flex items-center justify-between rounded-2xl bg-white/50 backdrop-blur-sm px-3 py-2 border border-white/40"><span className="text-sm font-semibold text-gray-600">Descrição</span><Input value={previewLancamento.descricao} onChange={(e) => setPreviewLancamento(prev => prev ? { ...prev, descricao: e.target.value } : prev)} className="w-40 border-none bg-transparent text-right font-bold focus:ring-0" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-0.5"><span className="text-xs text-gray-400">Data</span><div className="relative group"><input type="date" value={previewLancamento.data} onChange={(e) => { const novaData = e.target.value; setDataSelecionada(novaData); setPreviewLancamento(prev => prev ? { ...prev, data: novaData } : prev); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" /><div className="flex items-center justify-between rounded-xl bg-white/50 backdrop-blur-sm px-2 py-1.5 border border-white/40 group-hover:border-gray-300 transition-all"><span className="text-sm font-semibold text-gray-700">{new Date(previewLancamento.data).toLocaleDateString("pt-BR")}</span><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div></div></div>
              <div className="grid gap-0.5"><span className="text-xs text-gray-400">Tipo</span><div className="flex bg-white/40 backdrop-blur-sm rounded-xl p-0.5"><button onClick={() => setPreviewLancamento(prev => prev ? { ...prev, tipo: "receita" } : prev)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${previewLancamento.tipo === "receita" ? "bg-white text-emerald-600 shadow" : "text-gray-500"}`}>Receita</button><button onClick={() => setPreviewLancamento(prev => prev ? { ...prev, tipo: "despesa" } : prev)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${previewLancamento.tipo === "despesa" ? "bg-white text-rose-600 shadow" : "text-gray-500"}`}>Despesa</button></div></div>
            </div>
            <div className="grid gap-0.5"><span className="text-xs text-gray-400">Categoria</span><select value={previewLancamento.categoria} onChange={(e) => setPreviewLancamento(prev => prev ? { ...prev, categoria: e.target.value } : prev)} className="rounded-xl bg-white/60 backdrop-blur-sm p-2 text-sm border border-white/40">{(previewLancamento?.tipo === "receita" ? categoriasReceita : categoriasDespesa).map((cat) => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
            <div className="flex gap-2"><Input placeholder="Nova categoria" value={novaCategoriaInput} onChange={(e) => setNovaCategoriaInput(e.target.value)} className="p-2 text-sm" /><Button onClick={() => { const nova = novaCategoriaInput.trim().toLowerCase(); if (nova && !categoriasReceita.includes(nova) && !categoriasDespesa.includes(nova)) { setCategorias(prev => [...prev, { nome: nova, tipo: previewLancamento?.tipo || "despesa" }]); setNovaCategoriaInput(""); } }} className="px-3 text-sm">+</Button></div>
            <div className="grid grid-cols-2 gap-2 pt-1"><Button variant="secondary" onClick={cancelarLancamentoPreview} className="font-semibold text-sm">Cancelar</Button><Button onClick={confirmarLancamentoPreview} className="font-semibold text-sm">Confirmar</Button></div>
          </div>
        </div>
      )}

      <UserProfile isOpen={profileOpen} onClose={() => setProfileOpen(false)} onLogout={handleLogout} user={{ name: userName, email: user?.email || "usuario@email.com", photo: userPhoto, isPro: false }} contas={contas.filter(c => c.tipo === 'conta')} cartoes={cartoes} onDisconnectConta={desconectarConta} onDisconnectCartao={desconectarCartao} onOpenPremium={() => setPremiumOpen(true)} onOpenPrivacy={() => setPrivacyOpen(true)} onOpenDeleteAccount={() => setDeleteAccountModalOpen(true)} onUpdateName={(name) => setUserName(name)} />

      {privacyOpen && (
        <div className="fixed inset-0 z-[270] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-2xl overflow-y-auto max-h-[80vh] border border-white/40">
            <h3 className="text-lg font-bold mb-3 text-gray-800">Política de Privacidade</h3>
            <div className="text-sm text-gray-600 space-y-2 text-left">
              <p><strong>1. Coleta e Armazenamento de Dados</strong><br/>O aplicativo armazena informações financeiras fornecidas pelo usuário...</p>
            </div>
            <Button className="mt-4" onClick={() => setPrivacyOpen(false)}>Fechar</Button>
          </div>
        </div>
      )}

      {deleteAccountModalOpen && (
        <div className="fixed inset-0 z-[280] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-2xl space-y-3 border border-white/40">
            <h3 className="text-lg font-bold text-rose-600">Excluir conta permanentemente</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>Ao excluir sua conta, todos os dados armazenados no aplicativo serão removidos permanentemente deste dispositivo.</p>
              <p>Isso inclui:</p>
              <ul className="list-disc pl-5 space-y-0.5 text-sm"><li>Movimentações financeiras</li><li>Categorias</li><li>Contas e cartões</li><li>Metas e configurações</li></ul>
              <p className="text-xs text-gray-500">Esta ação não pode ser desfeita.</p>
              <p className="text-xs text-gray-400">Para suporte ou solicitações adicionais, entre em contato:<br /><strong>suporte@manin.app</strong></p>
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
