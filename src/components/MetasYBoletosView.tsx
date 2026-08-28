import React, { useState } from 'react';
import { GoalItem, CouponItem, UserProfile } from '../types';
import { playCutePop, playHeartSound, playWinSound } from '../utils/audio';
import confetti from 'canvas-confetti';

interface MetasYBoletosViewProps {
  goals: GoalItem[];
  coupons: CouponItem[];
  onAddGoal: (goal: GoalItem) => void;
  onToggleGoal: (id: string) => void;
  onAddCoupon: (coupon: CouponItem) => void;
  onRedeemCoupon: (id: string) => void;
  onUnredeemCoupon: (id: string) => void;
  sapoProfile: UserProfile;
  miReyProfile: UserProfile;
}

export const MetasYBoletosView: React.FC<MetasYBoletosViewProps> = ({
  goals,
  coupons,
  onAddGoal,
  onToggleGoal,
  onAddCoupon,
  onRedeemCoupon,
  onUnredeemCoupon,
  sapoProfile,
  miReyProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'metas' | 'boletos'>('metas');

  // Goals filters & state
  const [goalCategoryFilter, setGoalCategoryFilter] = useState<string>('todas');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDesc, setNewGoalDesc] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<'distancia' | 'reencuentro' | 'madrid' | 'guayaquil' | 'futuro'>('reencuentro');
  const [newGoalAuthor, setNewGoalAuthor] = useState<'Sapo' | 'Mi Rey' | 'Juntos'>('Juntos');

  // Coupons filters & state
  const [couponFilter, setCouponFilter] = useState<'todos' | 'disponibles' | 'canjeados' | 'para-sapo' | 'para-mirey'>('todos');
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [newCouponTitle, setNewCouponTitle] = useState('');
  const [newCouponDesc, setNewCouponDesc] = useState('');
  const [newCouponFrom, setNewCouponFrom] = useState<'Sapo' | 'Mi Rey'>('Sapo');
  const [newCouponTo, setNewCouponTo] = useState<'Sapo' | 'Mi Rey'>('Mi Rey');
  const [newCouponCategory, setNewCouponCategory] = useState('Cariño');
  const [newCouponColor, setNewCouponColor] = useState<'pink' | 'amber' | 'emerald' | 'purple' | 'cyan'>('pink');

  // Calculation for goals progress
  const completedGoalsCount = goals.filter((g) => g.isCompleted).length;
  const totalGoalsCount = goals.length;
  const progressPercent = totalGoalsCount > 0 ? Math.round((completedGoalsCount / totalGoalsCount) * 100) : 0;

  // Filtered Goals
  const filteredGoals = goals.filter((g) => {
    if (goalCategoryFilter === 'todas') return true;
    return g.category === goalCategoryFilter;
  });

  // Filtered Coupons
  const filteredCoupons = coupons.filter((c) => {
    if (couponFilter === 'disponibles') return !c.isRedeemed;
    if (couponFilter === 'canjeados') return c.isRedeemed;
    if (couponFilter === 'para-sapo') return c.to === 'Sapo';
    if (couponFilter === 'para-mirey') return c.to === 'Mi Rey';
    return true;
  });

  // Handlers
  const handleToggleGoalCheck = (id: string, currentlyCompleted: boolean) => {
    onToggleGoal(id);
    if (!currentlyCompleted) {
      playWinSound();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF5470', '#fabc41', '#7adaa1', '#ffb2b8'],
      });
    } else {
      playCutePop();
    }
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const newGoal: GoalItem = {
      id: 'goal-' + Date.now(),
      title: newGoalTitle.trim(),
      description: newGoalDesc.trim() || undefined,
      category: newGoalCategory,
      author: newGoalAuthor,
      isCompleted: false,
      dateCreated: new Date().toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
    };

    onAddGoal(newGoal);
    playCutePop();
    setNewGoalTitle('');
    setNewGoalDesc('');
    setIsGoalModalOpen(false);
  };

  const handleRedeemTicket = (coupon: CouponItem) => {
    onRedeemCoupon(coupon.id);
    playHeartSound();
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.55 },
      colors: ['#ff5470', '#fabc41', '#7adaa1', '#eaddff'],
    });
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponTitle.trim()) return;

    const newCoupon: CouponItem = {
      id: 'coupon-' + Date.now(),
      code: `VALE-AMOR-${Math.floor(10 + Math.random() * 90)}`,
      title: newCouponTitle.trim(),
      description: newCouponDesc.trim(),
      from: newCouponFrom,
      to: newCouponTo,
      themeColor: newCouponColor,
      isRedeemed: false,
      category: newCouponCategory,
    };

    onAddCoupon(newCoupon);
    playCutePop();
    setNewCouponTitle('');
    setNewCouponDesc('');
    setIsCouponModalOpen(false);
  };

  const getCategoryBadge = (cat: GoalItem['category']) => {
    switch (cat) {
      case 'distancia':
        return { label: 'A Distancia 🌐', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'reencuentro':
        return { label: 'Reencuentro ✈️', color: 'bg-[#ff5470]/20 text-[#ffb2b8] border-[#ff5470]/30' };
      case 'madrid':
        return { label: 'En Madrid 🇪🇸', color: 'bg-[#fabc41]/20 text-[#fabc41] border-[#fabc41]/30' };
      case 'guayaquil':
        return { label: 'En Guayaquil 🇪🇨', color: 'bg-[#7adaa1]/20 text-[#7adaa1] border-[#7adaa1]/30' };
      case 'futuro':
        return { label: 'A Futuro 💫', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
    }
  };

  const getCouponTheme = (theme: CouponItem['themeColor']) => {
    switch (theme) {
      case 'pink':
        return {
          border: 'border-[#ff5470]/40 hover:border-[#ff5470]',
          headerBg: 'bg-gradient-to-r from-[#ff5470]/25 to-[#ff5470]/10',
          accentText: 'text-[#ff5470]',
          badge: 'bg-[#ff5470]/20 text-[#ffb2b8] border-[#ff5470]/30',
          btn: 'bg-[#ff5470] hover:bg-[#ff6b84] shadow-[0_4px_16px_rgba(255,84,112,0.4)]',
          lightGlow: 'shadow-[0_0_20px_rgba(255,84,112,0.15)]',
        };
      case 'amber':
        return {
          border: 'border-[#fabc41]/40 hover:border-[#fabc41]',
          headerBg: 'bg-gradient-to-r from-[#fabc41]/25 to-[#fabc41]/10',
          accentText: 'text-[#fabc41]',
          badge: 'bg-[#fabc41]/20 text-[#fabc41] border-[#fabc41]/30',
          btn: 'bg-[#fabc41] text-[#221934] hover:bg-[#ffcd66] shadow-[0_4px_16px_rgba(250,188,65,0.4)]',
          lightGlow: 'shadow-[0_0_20px_rgba(250,188,65,0.15)]',
        };
      case 'emerald':
        return {
          border: 'border-[#7adaa1]/40 hover:border-[#7adaa1]',
          headerBg: 'bg-gradient-to-r from-[#7adaa1]/25 to-[#7adaa1]/10',
          accentText: 'text-[#7adaa1]',
          badge: 'bg-[#7adaa1]/20 text-[#7adaa1] border-[#7adaa1]/30',
          btn: 'bg-[#7adaa1] text-[#180c30] hover:bg-[#92e8b2] shadow-[0_4px_16px_rgba(122,218,161,0.4)]',
          lightGlow: 'shadow-[0_0_20px_rgba(122,218,161,0.15)]',
        };
      case 'purple':
        return {
          border: 'border-purple-400/40 hover:border-purple-400',
          headerBg: 'bg-gradient-to-r from-purple-500/25 to-purple-500/10',
          accentText: 'text-purple-300',
          badge: 'bg-purple-500/20 text-purple-200 border-purple-400/30',
          btn: 'bg-purple-500 hover:bg-purple-600 shadow-[0_4px_16px_rgba(168,85,247,0.4)]',
          lightGlow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]',
        };
      case 'cyan':
      default:
        return {
          border: 'border-cyan-400/40 hover:border-cyan-400',
          headerBg: 'bg-gradient-to-r from-cyan-500/25 to-cyan-500/10',
          accentText: 'text-cyan-300',
          badge: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30',
          btn: 'bg-cyan-500 text-[#180c30] hover:bg-cyan-400 shadow-[0_4px_16px_rgba(6,182,212,0.4)]',
          lightGlow: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]',
        };
    }
  };

  return (
    <div className="relative pt-6 px-4 md:px-8 min-h-screen bg-[#221934] pb-32 text-white">
      <div className="flex flex-col w-full relative max-w-5xl mx-auto min-h-[80vh]">
        
        {/* Main Segmented Header Tabs */}
        <div className="flex gap-3 mb-8 px-1 mt-2">
          <button
            onClick={() => {
              setActiveTab('metas');
              playCutePop();
            }}
            className={`flex-1 py-3 px-4 rounded-2xl font-headline-md text-center transition-all cursor-pointer font-bold flex items-center justify-center gap-2 text-sm sm:text-base ${
              activeTab === 'metas'
                ? 'bg-[#FF5470] text-white shadow-[0_0_25px_rgba(255,84,112,0.3)]'
                : 'bg-[#2E2247] border border-[#5a4042]/40 text-[#e2bec0] hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-lg">flag</span>
            Metas para Hacer ({completedGoalsCount}/{totalGoalsCount})
          </button>

          <button
            onClick={() => {
              setActiveTab('boletos');
              playCutePop();
            }}
            className={`flex-1 py-3 px-4 rounded-2xl font-headline-md text-center transition-all cursor-pointer font-bold flex items-center justify-center gap-2 text-sm sm:text-base ${
              activeTab === 'boletos'
                ? 'bg-[#FF5470] text-white shadow-[0_0_25px_rgba(255,84,112,0.3)]'
                : 'bg-[#2E2247] border border-[#5a4042]/40 text-[#e2bec0] hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-lg">confirmation_number</span>
            Boletos para Canjear ({coupons.filter(c => !c.isRedeemed).length} Vales)
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: METAS PARA HACER (BUCKET LIST)                   */}
        {/* ======================================================== */}
        {activeTab === 'metas' && (
          <div className="flex flex-col w-full gap-6">
            {/* Progress & Milestone Overview Card */}
            <div className="bg-[#2E2247] rounded-3xl p-6 shadow-xl border border-[#5a4042]/25 relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                  <h2 className="font-headline-md text-xl md:text-2xl text-white font-bold flex items-center gap-2">
                    <span className="text-[#fabc41] material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      stars
                    </span>
                    Nuestra Lista de Metas y Sueños
                  </h2>
                  <p className="text-xs sm:text-sm text-[#e2bec0] mt-1">
                    Planes que hemos soñado para la distancia, el reencuentro y toda la vida juntos.
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-[#201439] px-4 py-2.5 rounded-2xl border border-[#5a4042]/40">
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] uppercase font-label-mono text-[#e2bec0]/70">Progreso total</span>
                    <span className="font-headline-md text-base sm:text-lg text-[#fabc41] font-bold">
                      {completedGoalsCount} de {totalGoalsCount} Cumplidas
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#ff5470]/20 flex items-center justify-center border border-[#ff5470]/40 text-sm font-bold text-[#ffb2b8]">
                    {progressPercent}%
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#201439] h-3.5 rounded-full overflow-hidden p-0.5 border border-[#5a4042]/30">
                <div
                  className="h-full bg-gradient-to-r from-[#ff5470] via-[#fabc41] to-[#7adaa1] rounded-full transition-all duration-700 relative shadow-[0_0_10px_rgba(255,84,112,0.5)]"
                  style={{ width: `${Math.max(progressPercent, 4)}%` }}
                ></div>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {[
                { id: 'todas', label: 'Todas las Metas' },
                { id: 'reencuentro', label: '✈️ Reencuentro' },
                { id: 'distancia', label: '🌐 A Distancia' },
                { id: 'madrid', label: '🇪🇸 En Madrid' },
                { id: 'guayaquil', label: '🇪🇨 En Guayaquil' },
                { id: 'futuro', label: '💫 A Futuro' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setGoalCategoryFilter(cat.id);
                    playCutePop();
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-label-caps uppercase tracking-wider transition-all whitespace-nowrap border ${
                    goalCategoryFilter === cat.id
                      ? 'bg-[#fabc41] text-[#221934] font-bold border-[#fabc41] shadow-[0_0_12px_rgba(250,188,65,0.3)]'
                      : 'bg-[#2E2247] text-[#e2bec0] border-[#5a4042]/40 hover:bg-[#3a2e54]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGoals.map((goal) => {
                const badge = getCategoryBadge(goal.category);
                const isSapo = goal.author === 'Sapo';
                const isMiRey = goal.author === 'Mi Rey';

                return (
                  <div
                    key={goal.id}
                    className={`rounded-2xl p-5 border transition-all relative flex flex-col justify-between group ${
                      goal.isCompleted
                        ? 'bg-[#2E2247]/60 border-[#7adaa1]/40 shadow-[0_0_15px_rgba(122,218,161,0.1)]'
                        : 'bg-[#2E2247] border-[#5a4042]/30 hover:border-white/20 shadow-md hover:shadow-xl'
                    }`}
                  >
                    {/* Top Row: Category Badge & Author */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-label-mono uppercase tracking-wider border font-bold ${badge.color}`}>
                        {badge.label}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <img
                          alt={goal.author}
                          className="w-5 h-5 rounded-full object-cover border border-white/30"
                          src={isSapo ? sapoProfile.avatar : isMiRey ? miReyProfile.avatar : sapoProfile.avatar}
                        />
                        <span className="text-[11px] text-[#e2bec0] font-label-mono">
                          {goal.author === 'Juntos' ? 'De los dos 💕' : `Por ${goal.author}`}
                        </span>
                      </div>
                    </div>

                    {/* Main Title & Checkbox */}
                    <div className="flex items-start gap-3 my-2">
                      <button
                        onClick={() => handleToggleGoalCheck(goal.id, goal.isCompleted)}
                        className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                          goal.isCompleted
                            ? 'bg-[#7adaa1] text-[#180c30] shadow-[0_0_10px_#7adaa1]'
                            : 'bg-[#201439] border border-[#5a4042]/60 text-transparent hover:border-[#ff5470]'
                        }`}
                        title={goal.isCompleted ? 'Marcar como pendiente' : '¡Marcar como cumplida!'}
                      >
                        <span className="material-symbols-outlined text-[18px] font-bold">check</span>
                      </button>

                      <div className="flex-1">
                        <p
                          className={`font-headline-md text-base sm:text-lg leading-snug transition-all ${
                            goal.isCompleted ? 'line-through text-[#e2bec0]/60 italic' : 'text-white'
                          }`}
                        >
                          {goal.title}
                        </p>
                        {goal.description && (
                          <p className="font-body-md text-xs text-[#e2bec0]/80 mt-1 leading-relaxed">
                            {goal.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Status note */}
                    <div className="mt-3 pt-2.5 border-t border-[#5a4042]/20 flex items-center justify-between text-[11px] font-label-mono">
                      {goal.isCompleted ? (
                        <span className="text-[#7adaa1] flex items-center gap-1 font-bold">
                          <span className="material-symbols-outlined text-[14px]">verified</span>
                          {goal.completedAt || '¡Meta Cumplida!'}
                        </span>
                      ) : (
                        <span className="text-[#fabc41] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
                          Pendiente por vivir juntos
                        </span>
                      )}

                      <button
                        onClick={() => handleToggleGoalCheck(goal.id, goal.isCompleted)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-all ${
                          goal.isCompleted
                            ? 'border-[#7adaa1]/30 text-[#7adaa1] hover:bg-[#7adaa1]/10'
                            : 'border-[#ff5470]/40 text-[#ffb2b8] hover:bg-[#ff5470]/15'
                        }`}
                      >
                        {goal.isCompleted ? 'Desmarcar' : 'Completar ✨'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredGoals.length === 0 && (
              <div className="bg-[#2E2247]/50 rounded-2xl p-8 text-center text-[#e2bec0] border border-dashed border-[#5a4042]/30 my-4">
                <span className="text-3xl block mb-2">🎯</span>
                <p className="font-headline-md text-white text-base">No hay metas en esta categoría aún.</p>
                <p className="text-xs text-[#e2bec0]/70 mt-1">¡Presiona el botón para agregar una nueva meta juntos!</p>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: BOLETOS PARA CANJEAR (LOVE COUPONS)              */}
        {/* ======================================================== */}
        {activeTab === 'boletos' && (
          <div className="flex flex-col w-full gap-6">
            {/* Header info card */}
            <div className="bg-[#2E2247] rounded-3xl p-6 shadow-xl border border-[#5a4042]/25 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="font-headline-md text-xl md:text-2xl text-white font-bold flex items-center gap-2">
                  <span className="text-[#ff5470] material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    confirmation_number
                  </span>
                  Talonario de Vales y Boletos de Amor
                </h2>
                <p className="text-xs sm:text-sm text-[#e2bec0] mt-1">
                  Vales románticos para canjear en cualquier momento a distancia o en nuestro reencuentro.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-[#201439] px-4 py-2 rounded-2xl border border-[#5a4042]/40">
                <span className="text-xs font-label-mono uppercase text-[#e2bec0]">Disponibles:</span>
                <span className="font-headline-md text-xl text-[#7adaa1] font-bold">
                  {coupons.filter((c) => !c.isRedeemed).length}
                </span>
                <span className="text-xs text-[#e2bec0]/60">/ {coupons.length}</span>
              </div>
            </div>

            {/* Coupons filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {[
                { id: 'todos', label: 'Todos los Boletos' },
                { id: 'disponibles', label: '✨ Disponibles' },
                { id: 'canjeados', label: '💖 Ya Canjeados' },
                { id: 'para-sapo', label: `🐸 Para ${sapoProfile.name}` },
                { id: 'para-mirey', label: `👑 Para ${miReyProfile.name}` },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => {
                    setCouponFilter(filter.id as any);
                    playCutePop();
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-label-caps uppercase tracking-wider transition-all whitespace-nowrap border ${
                    couponFilter === filter.id
                      ? 'bg-[#FF5470] text-white font-bold border-[#FF5470] shadow-[0_0_12px_rgba(255,84,112,0.3)]'
                      : 'bg-[#2E2247] text-[#e2bec0] border-[#5a4042]/40 hover:bg-[#3a2e54]'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Coupons Grid (Ticket design) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCoupons.map((coupon) => {
                const theme = getCouponTheme(coupon.themeColor);
                const fromAvatar = coupon.from === 'Sapo' ? sapoProfile.avatar : miReyProfile.avatar;
                const toAvatar = coupon.to === 'Sapo' ? sapoProfile.avatar : miReyProfile.avatar;

                return (
                  <div
                    key={coupon.id}
                    className={`relative rounded-3xl bg-[#2E2247] border ${theme.border} ${theme.lightGlow} p-6 flex flex-col justify-between overflow-hidden transition-all duration-300 ${
                      coupon.isRedeemed ? 'opacity-75 grayscale-[20%]' : 'hover:-translate-y-1 shadow-xl'
                    }`}
                  >
                    {/* Realistic Perforation Cutouts on left & right sides */}
                    <div className="absolute top-1/2 -left-3.5 -translate-y-1/2 w-7 h-7 bg-[#221934] rounded-full border-r border-[#5a4042]/40"></div>
                    <div className="absolute top-1/2 -right-3.5 -translate-y-1/2 w-7 h-7 bg-[#221934] rounded-full border-l border-[#5a4042]/40"></div>

                    {/* Top Ticket Header */}
                    <div className={`-mx-6 -mt-6 p-4 px-6 ${theme.headerBg} border-b border-white/10 flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                          local_activity
                        </span>
                        <span className="font-label-mono text-xs uppercase tracking-widest text-white/90 font-bold">
                          {coupon.code}
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-label-mono uppercase tracking-wider border font-bold ${theme.badge}`}>
                        {coupon.category}
                      </span>
                    </div>

                    {/* From & To Row */}
                    <div className="flex items-center justify-between my-3 px-2 text-xs font-label-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#e2bec0]/70">De:</span>
                        <img alt={coupon.from} src={fromAvatar} className="w-5 h-5 rounded-full object-cover border border-white/20" />
                        <span className="font-bold text-white">{coupon.from === 'Sapo' ? sapoProfile.name : miReyProfile.name}</span>
                      </div>

                      <span className="material-symbols-outlined text-xs text-[#e2bec0]/50">arrow_forward</span>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[#e2bec0]/70">Para:</span>
                        <img alt={coupon.to} src={toAvatar} className="w-5 h-5 rounded-full object-cover border border-white/20" />
                        <span className="font-bold text-[#fabc41]">{coupon.to === 'Sapo' ? sapoProfile.name : miReyProfile.name}</span>
                      </div>
                    </div>

                    {/* Perforated Divider line */}
                    <div className="w-full border-b-2 border-dashed border-white/10 my-2"></div>

                    {/* Ticket Content */}
                    <div className="my-2 px-2">
                      <h3 className="font-headline-md text-lg sm:text-xl font-bold text-white leading-snug">
                        {coupon.title}
                      </h3>
                      <p className="font-body-md text-xs sm:text-sm text-[#eaddff]/85 mt-2 leading-relaxed italic">
                        "{coupon.description}"
                      </p>
                    </div>

                    {/* Canjeado Stamp or Action Button */}
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                      {coupon.isRedeemed ? (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-3 py-1 bg-[#ff5470]/20 border border-[#ff5470] text-[#ffb2b8] rounded-xl text-xs font-label-caps uppercase font-bold tracking-wider rotate-[-3deg] shadow-[0_0_10px_rgba(255,84,112,0.3)]">
                              ✓ CANJEADO 💖
                            </span>
                            <span className="text-[10px] text-[#e2bec0]/60 font-label-mono hidden sm:inline">
                              {coupon.redeemedAt || 'Utilizado con amor'}
                            </span>
                          </div>

                          <button
                            onClick={() => onUnredeemCoupon(coupon.id)}
                            className="text-[11px] text-[#e2bec0]/70 hover:text-white underline cursor-pointer"
                            title="Volver a poner disponible"
                          >
                            Reactivar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRedeemTicket(coupon)}
                          className={`w-full py-3 rounded-xl font-headline-md font-bold text-sm tracking-wide transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${theme.btn}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">redeem</span>
                          <span>¡CANJEAR BOLETO AHORA!</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredCoupons.length === 0 && (
              <div className="bg-[#2E2247]/50 rounded-2xl p-8 text-center text-[#e2bec0] border border-dashed border-[#5a4042]/30 my-4">
                <span className="text-3xl block mb-2">🎟️</span>
                <p className="font-headline-md text-white text-base">No se encontraron boletos en esta sección.</p>
                <p className="text-xs text-[#e2bec0]/70 mt-1">¡Presiona el botón de abajo para emitir un nuevo boleto de amor!</p>
              </div>
            )}
          </div>
        )}

        {/* Global Floating Action Button */}
        <button
          onClick={() => {
            if (activeTab === 'metas') {
              setIsGoalModalOpen(true);
            } else {
              setIsCouponModalOpen(true);
            }
          }}
          className="fixed bottom-8 md:bottom-12 right-6 md:right-8 h-14 px-6 rounded-full bg-[#FF5470] text-white shadow-[0_8px_30px_rgba(255,84,112,0.4)] flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-transform z-40 font-bold border border-white/20 cursor-pointer"
        >
          <span className="text-2xl font-bold leading-none mb-0.5">+</span>
          <span className="font-label-caps tracking-wider text-xs md:text-sm uppercase">
            {activeTab === 'metas' ? 'NUEVA META' : 'NUEVO BOLETO'}
          </span>
        </button>

        {/* Footer info note */}
        <div className="mt-12 mb-4 text-center">
          <p className="font-label-mono text-[10px] text-[#e2bec0]/40 uppercase tracking-widest">
           
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: NUEVA META                                        */}
      {/* ======================================================== */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-[#2E2247] rounded-3xl shadow-2xl border border-[#5a4042]/40 flex flex-col overflow-hidden text-white animate-pop">
            <div className="px-6 py-5 flex items-center justify-between border-b border-[#5a4042]/30 bg-[#2E2247]">
              <h2 className="font-headline-md text-xl text-white flex items-center gap-2 font-bold">
                <span>🎯</span>
                Nueva Meta o Sueño Juntos
              </h2>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#201439] flex items-center justify-center text-[#e2bec0] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-label-mono text-[#e2bec0] uppercase tracking-wider">
                  ¿Cuál es la meta o plan?:
                </label>
                <input
                  required
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="w-full bg-[#201439] text-white font-body-md text-base rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-[#FF5470] placeholder-[#e2bec0]/50 border border-[#5a4042]/30"
                  placeholder="Ej. Caminar juntos por la playa al atardecer"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-label-mono text-[#e2bec0] uppercase tracking-wider">
                  Detalles o notas bonitas (opcional):
                </label>
                <textarea
                  rows={2}
                  value={newGoalDesc}
                  onChange={(e) => setNewGoalDesc(e.target.value)}
                  className="w-full bg-[#201439] text-white font-body-md text-sm rounded-2xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-[#FF5470] placeholder-[#e2bec0]/50 border border-[#5a4042]/30"
                  placeholder="Ej. Tomar fotos con la cámara instantánea y comer helado..."
                ></textarea>
              </div>

              {/* Category selector */}
              <div className="flex flex-col gap-2">
                <label className="font-label-mono text-xs text-[#e2bec0] uppercase tracking-wider">
                  Categoría del plan:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'reencuentro', label: '✈️ Reencuentro' },
                    { id: 'distancia', label: '🌐 A Distancia' },
                    { id: 'madrid', label: '🇪🇸 En Madrid' },
                    { id: 'guayaquil', label: '🇪🇨 En Guayaquil' },
                    { id: 'futuro', label: '💫 A Futuro' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewGoalCategory(cat.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-label-caps transition-all text-center ${
                        newGoalCategory === cat.id
                          ? 'bg-[#FF5470]/20 border-[#FF5470] text-white font-bold shadow-[0_0_10px_rgba(255,84,112,0.3)]'
                          : 'bg-[#201439] border-[#5a4042]/30 text-[#e2bec0]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Author Selector */}
              <div className="flex flex-col gap-2">
                <label className="font-label-mono text-xs text-[#e2bec0] uppercase tracking-wider">
                  ¿Quién la propone?:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewGoalAuthor('Sapo')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      newGoalAuthor === 'Sapo'
                        ? 'bg-[#7adaa1]/20 border-[#7adaa1] text-[#7adaa1]'
                        : 'bg-[#201439] border-[#5a4042]/30 text-[#e2bec0]'
                    }`}
                  >
                    🐸 {sapoProfile.name}
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewGoalAuthor('Mi Rey')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      newGoalAuthor === 'Mi Rey'
                        ? 'bg-[#fabc41]/20 border-[#fabc41] text-[#fabc41]'
                        : 'bg-[#201439] border-[#5a4042]/30 text-[#e2bec0]'
                    }`}
                  >
                    👑 {miReyProfile.name}
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewGoalAuthor('Juntos')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      newGoalAuthor === 'Juntos'
                        ? 'bg-[#ff5470]/20 border-[#ff5470] text-[#ffb2b8]'
                        : 'bg-[#201439] border-[#5a4042]/30 text-[#e2bec0]'
                    }`}
                  >
                    💕 De los dos
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#FF5470] hover:bg-[#ff6b84] text-white font-headline-md text-base py-3.5 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 font-bold cursor-pointer"
                >
                  <span>Guardar Meta</span>
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: NUEVO BOLETO / VALE ROMÁNTICO                     */}
      {/* ======================================================== */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-[#2E2247] rounded-3xl shadow-2xl border border-[#5a4042]/40 flex flex-col overflow-hidden text-white animate-pop">
            <div className="px-6 py-5 flex items-center justify-between border-b border-[#5a4042]/30 bg-[#2E2247]">
              <h2 className="font-headline-md text-xl text-white flex items-center gap-2 font-bold">
                <span>🎟️</span>
                Emitir Nuevo Boleto de Amor
              </h2>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#201439] flex items-center justify-center text-[#e2bec0] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-label-mono text-[#e2bec0] uppercase tracking-wider">
                  Título del Vale:
                </label>
                <input
                  required
                  type="text"
                  value={newCouponTitle}
                  onChange={(e) => setNewCouponTitle(e.target.value)}
                  className="w-full bg-[#201439] text-white font-body-md text-base rounded-2xl p-3.5 focus:outline-none focus:ring-2 focus:ring-[#FF5470] placeholder-[#e2bec0]/50 border border-[#5a4042]/30"
                  placeholder="Ej. Vale por un abrazo infinito sin decir nada"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-label-mono text-[#e2bec0] uppercase tracking-wider">
                  ¿Cómo funciona o qué incluye?:
                </label>
                <textarea
                  required
                  rows={3}
                  value={newCouponDesc}
                  onChange={(e) => setNewCouponDesc(e.target.value)}
                  className="w-full bg-[#201439] text-white font-body-md text-sm rounded-2xl p-3.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#FF5470] placeholder-[#e2bec0]/50 border border-[#5a4042]/30"
                  placeholder="Ej. Válido en cualquier momento que necesitemos recargar energías..."
                ></textarea>
              </div>

              {/* De / Para */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-label-mono text-[#e2bec0] uppercase">Emitido por:</label>
                  <select
                    value={newCouponFrom}
                    onChange={(e) => setNewCouponFrom(e.target.value as any)}
                    className="w-full bg-[#201439] text-white rounded-xl p-2.5 border border-[#5a4042]/30 text-xs font-bold"
                  >
                    <option value="Sapo">🐸 {sapoProfile.name}</option>
                    <option value="Mi Rey">👑 {miReyProfile.name}</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-label-mono text-[#e2bec0] uppercase">Válido para:</label>
                  <select
                    value={newCouponTo}
                    onChange={(e) => setNewCouponTo(e.target.value as any)}
                    className="w-full bg-[#201439] text-white rounded-xl p-2.5 border border-[#5a4042]/30 text-xs font-bold"
                  >
                    <option value="Mi Rey">👑 {miReyProfile.name}</option>
                    <option value="Sapo">🐸 {sapoProfile.name}</option>
                  </select>
                </div>
              </div>

              {/* Categoría & Color */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-label-mono text-[#e2bec0] uppercase">Categoría:</label>
                  <input
                    type="text"
                    value={newCouponCategory}
                    onChange={(e) => setNewCouponCategory(e.target.value)}
                    className="w-full bg-[#201439] text-white rounded-xl p-2.5 border border-[#5a4042]/30 text-xs"
                    placeholder="Ej. Cariño, Relax, Comida"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-label-mono text-[#e2bec0] uppercase">Color del boleto:</label>
                  <select
                    value={newCouponColor}
                    onChange={(e) => setNewCouponColor(e.target.value as any)}
                    className="w-full bg-[#201439] text-white rounded-xl p-2.5 border border-[#5a4042]/30 text-xs font-bold"
                  >
                    <option value="pink">💖  Romántico</option>
                    <option value="amber">💛 Relajante</option>
                    <option value="purple">💜 Provocador</option>
                    <option value="cyan">🩵 Divertido</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#FF5470] hover:bg-[#ff6b84] text-white font-headline-md text-base py-3.5 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 font-bold cursor-pointer"
                >
                  <span>Emitir Boleto de Amor</span>
                  <span className="material-symbols-outlined text-[20px]">confirmation_number</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
