
import React, { useState, useMemo } from 'react';
import { SimulationConfig, MonthRecord, SummaryData, InterestTier } from './types';
import { runSimulation } from './services/simulatorEngine';
import { BASE_START_DATE, MORTGAGE_SCHEDULE, INITIAL_NON_MORTGAGE_EXPENSES } from './constants';
import { 
  TrendingUp, 
  Wallet, 
  ShieldCheck, 
  Home, 
  Download, 
  FileText,
  Table as TableIcon,
  BarChart3,
  Calculator,
  AlertTriangle,
  Zap,
  Clock,
  ArrowRight,
  Layers,
  Percent,
  ChevronDown,
  ChevronUp,
  Banknote,
  Landmark,
  Coins,
  History,
  Target,
  ArrowDownToLine,
  Activity,
  CheckCircle2,
  Printer,
  MinusCircle,
  TrendingDown,
  ArrowRightLeft,
  Info,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Briefcase,
  Gift,
  Award,
  HeartPulse
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar
} from 'recharts';

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val);
};

const formatPercent = (val: number) => {
  return (val * 100).toFixed(2) + '%';
};

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 px-2 hover:bg-slate-50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
            {icon}
          </div>
          <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${isOpen ? 'text-slate-900' : 'text-slate-500'}`}>
            {title}
          </span>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100 pb-6 px-2' : 'max-h-0 opacity-0'}`}>
        <div className="pt-2 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [config, setConfig] = useState<SimulationConfig>({
    startDate: BASE_START_DATE,
    initialBasicSalary: 12000000,
    allowance: 2000000,
    salaryGrowthRate: 5,
    expenseInflationRate: 4,
    initialMortgagePrincipal: 631489642,
    initialTotalMonths: 240,
    extraPaymentPenaltyRate: 1.0,
    interestRateSchedule: [...MORTGAGE_SCHEDULE.map(s => ({ startYear: s.years[0], endYear: s.years[1], rate: s.rate }))]
  });

  const { records, summary } = useMemo(() => runSimulation(config), [config]);

  const chartData = useMemo(() => {
    let cumulativeSavings = 0;
    return records.map((r, i) => {
      cumulativeSavings += r.installmentReduction;
      return {
        ...r,
        cumulativeSavings,
        monthLabel: `M${r.monthIndex}`,
        baselinePrincipal: Math.max(0, config.initialMortgagePrincipal * (1 - r.monthIndex / config.initialTotalMonths))
      };
    });
  }, [records, config]);

  const handleExportCSV = () => {
    const headers = [
      "Month", "Date", "Basic Salary", "Total Salary", "THR", "Compensation", "Total Income",
      "THR Exp", "THR to Funds", "Comp to Funds",
      "Non-Mortgage Exp", "Mortgage Inst", "Total Exp", "Excess", "Buffer Bal", "Emergency Bal",
      "Extra Bucket", "Extra Paid Raw", "Penalty Amount", "Interest", "Principal Paid", 
      "Inst Before", "Inst After", "Reduction", "Rem Principal", "Interest Rate"
    ];
    
    const rows = records.map(r => [
      r.monthIndex,
      r.date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
      r.basicSalary, r.totalSalary, r.thr, r.compensation, r.totalIncome,
      r.thrExpense, r.thrToFunds, r.compToFunds,
      r.nonMortgageExpenses, r.mortgageInstallment, r.totalExpenses, r.excess,
      r.bufferBalance, r.emergencyBalance, r.extraPaymentBucket,
      r.extraPaymentPaid, r.penaltyAmount,
      r.mortgageInterest, r.principalPaid, r.installmentBeforeExtra,
      r.installmentAfterExtra, r.installmentReduction,
      r.remainingPrincipal, r.interestRate
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KPR_SIM_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const updateRateTier = (index: number, newRate: number) => {
    const newSchedule = [...config.interestRateSchedule];
    newSchedule[index].rate = newRate / 100;
    setConfig({ ...config, interestRateSchedule: newSchedule });
  };

  const penaltyEfficiency = summary.totalExtraPaidRaw > 0 
    ? (summary.totalExtraPaidEffective / summary.totalExtraPaidRaw) * 100 
    : 100;

  const penaltyLeakage = summary.totalExtraPaidRaw - summary.totalExtraPaidEffective;

  const [activeChart, setActiveChart] = useState<'principal' | 'savings' | 'installments' | 'reserves'>('principal');

  // Health indicator styling helpers
  const getDTIColor = (ratio: number) => {
    if (ratio > 0.4) return 'text-rose-600 bg-rose-50';
    if (ratio > 0.3) return 'text-amber-600 bg-amber-50';
    return 'text-emerald-600 bg-emerald-50';
  };

  const getExpColor = (ratio: number) => {
    if (ratio > 0.6) return 'text-rose-600 bg-rose-50';
    if (ratio > 0.45) return 'text-amber-600 bg-amber-50';
    return 'text-indigo-600 bg-indigo-50';
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      {/* PDF PRINT HEADER */}
      <div className="print-header hidden p-8 bg-white">
        <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-8">
          <div className="flex items-center gap-5">
            <div className="bg-slate-900 text-white p-4 rounded-2xl">
              <Calculator size={40} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Mortgage Acceleration Audit</h1>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em] mt-2">Executive Strategy Report</p>
            </div>
          </div>
          <div className="text-right">
             <div className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1">Generated On</div>
             <div className="text-xs font-bold text-slate-900 uppercase">
               {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
             </div>
          </div>
        </div>

        {/* PRINT ONLY CONFIG SUMMARY */}
        <div className="grid grid-cols-5 gap-6 mb-8 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
           <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Base Salary</span>
              <div className="text-sm font-black text-slate-900">{formatCurrency(config.initialBasicSalary)}</div>
           </div>
           <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Salary Growth</span>
              <div className="text-sm font-black text-slate-900">{config.salaryGrowthRate}% / Year</div>
           </div>
           <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Base Expenses</span>
              <div className="text-sm font-black text-slate-900">{formatCurrency(INITIAL_NON_MORTGAGE_EXPENSES)}</div>
           </div>
           <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Expense Inflation</span>
              <div className="text-sm font-black text-slate-900">{config.expenseInflationRate}% / Year</div>
           </div>
           <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Penalty Rate</span>
              <div className="text-sm font-black text-rose-600">{config.extraPaymentPenaltyRate}% per Extra</div>
           </div>
        </div>
      </div>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between shadow-sm no-print">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-100">
            <Calculator size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-slate-800 flex items-center gap-2 uppercase">
              KPR MASTER SIM <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-md tracking-normal">V5.6</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Mortgage Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-5 py-2.5 rounded-xl transition-all text-sm font-bold active:scale-95 border border-indigo-100"
          >
            <Printer size={16} />
            Generate PDF
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl transition-all text-sm font-bold shadow-xl active:scale-95"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <aside className="no-print w-full lg:w-96 bg-white border-r border-slate-200 overflow-y-auto shrink-0 shadow-xl z-20">
          <div className="p-4 space-y-2">
            <CollapsibleSection title="Income Settings" icon={<Banknote size={16} />}>
              <div className="space-y-6">
                <div className="group">
                  <label className="text-[11px] font-black text-slate-500 uppercase mb-2 block group-hover:text-indigo-600 transition-colors">Starting Basic Salary</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">IDR</span>
                    <input 
                      type="number"
                      value={config.initialBasicSalary}
                      onChange={(e) => setConfig({ ...config, initialBasicSalary: Number(e.target.value) })}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-mono text-sm font-bold transition-all"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase">Annual Salary Growth</label>
                    <span className="text-sm font-black text-indigo-600">{config.salaryGrowthRate}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="25" step="0.5"
                    value={config.salaryGrowthRate}
                    onChange={(e) => setConfig({ ...config, salaryGrowthRate: Number(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Mortgage Policy" icon={<Landmark size={16} />} defaultOpen={false}>
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-500 uppercase block">Interest Rate Tiers</label>
                  {config.interestRateSchedule.map((tier, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Years {tier.startYear}-{tier.endYear}</span>
                        <span className="text-xs font-black text-amber-600">{formatPercent(tier.rate)}</span>
                      </div>
                      <input 
                        type="range" min="1" max="15" step="0.05"
                        value={tier.rate * 100}
                        onChange={(e) => updateRateTier(idx, Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                   <Percent size={16} className="text-amber-600 mt-1 shrink-0" />
                   <p className="text-[9px] text-amber-700 leading-relaxed font-bold uppercase">
                     Automatic recalculation occurs upon rate shift or extra principal payment.
                   </p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase">Acceleration Penalty</label>
                    <span className="text-sm font-black text-rose-600">{config.extraPaymentPenaltyRate}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="10" step="0.1"
                    value={config.extraPaymentPenaltyRate}
                    onChange={(e) => setConfig({ ...config, extraPaymentPenaltyRate: Number(e.target.value) })}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Expense Control" icon={<Coins size={16} />} defaultOpen={false}>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase">Expense Inflation</label>
                    <span className="text-sm font-black text-emerald-600">{config.expenseInflationRate}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="15" step="0.5"
                    value={config.expenseInflationRate}
                    onChange={(e) => setConfig({ ...config, expenseInflationRate: Number(e.target.value) })}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>
            </CollapsibleSection>

            <div className="pt-6 px-2">
               <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                     <Zap size={16} className="text-amber-400 fill-amber-400" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Engine Analytics</span>
                  </div>
                  <div className="space-y-3">
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Status</span>
                        <span className="text-[10px] text-emerald-400 font-black uppercase bg-emerald-400/10 px-2 py-0.5 rounded">Live</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Data Points</span>
                        <span className="font-mono font-bold text-slate-100">{records.length} Months</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 space-y-10 lg:p-10 bg-slate-50">
          
          {/* COMPLETION BANNER */}
          {summary.mortgagePaidDate && (
            <div className="no-print bg-gradient-to-r from-emerald-600 to-indigo-700 p-8 rounded-[40px] shadow-2xl shadow-indigo-200 text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity"></div>
              <div className="flex items-center gap-6 relative z-10">
                <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md">
                  <CheckCircle2 size={48} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Simulation Optimized</h2>
                  <p className="text-sm font-medium text-emerald-100 opacity-90">KPR payoff target achieved by <span className="font-black text-white">{summary.mortgagePaidDate}</span>. Total savings: {formatCurrency(summary.totalSavings)}.</p>
                </div>
              </div>
              <button 
                onClick={handleExportPDF}
                className="bg-white text-indigo-700 hover:bg-indigo-50 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-black/10 relative z-10"
              >
                <Printer size={18} />
                Generate A3 PDF Report
              </button>
            </div>
          )}

          {/* REFINED EXECUTIVE SUMMARY SECTION */}
          <section className="no-print space-y-8">
            <div className="flex flex-col xl:flex-row gap-8">
              
              <div className="flex-[3] bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden flex flex-col md:flex-row">
                <div className="flex-1 bg-gradient-to-br from-emerald-600 to-emerald-800 p-10 text-white flex flex-col justify-between relative group">
                  <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-125 transition-all duration-700">
                    <TrendingUp size={180} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                        <Coins size={24} className="text-emerald-100" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-[0.4em] text-emerald-100">Total Interest Savings</span>
                    </div>
                    <div className="text-6xl font-black tracking-tighter mb-4 leading-none">
                      {formatCurrency(summary.totalSavings)}
                    </div>
                    <p className="text-sm font-medium text-emerald-50/80 leading-relaxed max-w-xs">
                      Total financial liability eliminated through strategic early settlement and dynamic installment reduction.
                    </p>
                  </div>
                  <div className="mt-8 relative z-10">
                    <div className="flex items-center gap-2 bg-emerald-900/30 w-fit px-4 py-2 rounded-2xl border border-white/10">
                      <CheckCircle2 size={16} className="text-emerald-300" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Baseline comparison verified</span>
                    </div>
                  </div>
                </div>

                <div className="flex-[1.2] p-10 bg-slate-50 flex flex-col justify-center border-l border-slate-100">
                  <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
                    <div className="flex items-center gap-3">
                      <Activity size={20} className="text-slate-400" />
                      <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Interest Cost Audit</span>
                    </div>
                    <ArrowRightLeft size={16} className="text-slate-300" />
                  </div>

                  <div className="space-y-8">
                    <div className="group">
                      <div className="flex justify-between items-end mb-3">
                         <div className="flex items-center gap-2">
                           <Zap size={14} className="text-indigo-500 fill-indigo-500" />
                           <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">With Acceleration</span>
                         </div>
                         <span className="text-2xl font-black text-indigo-600 tracking-tight">{formatCurrency(summary.totalInterestPaid)}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200">
                         <div 
                           className="bg-gradient-to-r from-indigo-500 to-indigo-700 h-full rounded-full transition-all duration-1000 shadow-lg" 
                           style={{ width: `${(summary.totalInterestPaid / summary.totalInterestBaseline) * 100}%` }}
                         ></div>
                      </div>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase mt-2 text-right">Optimized Total Interest</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-3">
                         <div className="flex items-center gap-2">
                           <History size={14} className="text-slate-400" />
                           <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Baseline Projection</span>
                         </div>
                         <span className="text-2xl font-black text-slate-400 tracking-tight">{formatCurrency(summary.totalInterestBaseline)}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200">
                         <div className="bg-slate-300 h-full rounded-full w-full"></div>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 text-right">Initial Liability projection</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-6">
                <div className="flex-1 bg-slate-900 rounded-[40px] p-8 text-white flex flex-col justify-between shadow-xl border border-slate-800 relative group overflow-hidden">
                  <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                     <Target size={120} />
                  </div>
                  <div className="flex items-center gap-3 relative z-10">
                    <Target size={20} className="text-indigo-400" />
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Debt Freedom Date</span>
                  </div>
                  <div className="relative z-10">
                    <div className="text-4xl font-black tracking-tighter mb-1">{summary.mortgagePaidDate || 'PENDING'}</div>
                    <p className="text-xs font-medium text-slate-400">Total Tenor Reduction: <span className="text-emerald-400 font-bold">{Math.max(0, config.initialTotalMonths - (summary.mortgagePaidMonth || 0))} Months</span></p>
                  </div>
                  <div className="pt-4 border-t border-slate-800 relative z-10 flex items-center gap-2 text-indigo-300">
                        <Clock size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Early Liquidation Active</span>
                  </div>
                </div>

                <div className="flex-1 bg-white rounded-[40px] p-8 flex flex-col justify-between shadow-sm border border-slate-200 border-b-8 border-b-rose-500">
                  <div className="flex items-center gap-3">
                    <MinusCircle size={20} className="text-rose-500" />
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Penalty Leakage Cost</span>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-rose-600 tracking-tight">{formatCurrency(summary.totalPenaltyPaid)}</div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Capital loss to bank early-pay fees</p>
                  </div>
                  <div className="bg-rose-50 p-3 rounded-2xl flex items-center gap-3">
                     <AlertTriangle size={14} className="text-rose-400" />
                     <p className="text-[9px] font-black text-rose-700 uppercase leading-tight">Quantified friction loss on extra payments</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
                      <ArrowDownToLine size={24} />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Acceleration Efficiency Detail</h4>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    <Info size={12} className="text-slate-400" />
                    <span className="text-[9px] font-black text-slate-500 uppercase">Retention: {penaltyEfficiency.toFixed(1)}% Applied</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Submitted Extra</span>
                    <div className="text-xl font-black text-slate-800 tracking-tight">{formatCurrency(summary.totalExtraPaidRaw)}</div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Gross capital submitted</p>
                  </div>
                  
                  <div className="flex items-center justify-center text-rose-300">
                    <ArrowRight size={24} />
                  </div>

                  <div className="space-y-1 text-right">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">Effective Reduction</span>
                    <div className="text-xl font-black text-emerald-600 tracking-tight">{formatCurrency(summary.totalExtraPaidEffective)}</div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase text-right">Net principal decrease</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-2 flex justify-between items-center text-[11px] font-black">
                   <span className="text-slate-500 uppercase tracking-widest">Penalty Leakage (Difference):</span>
                   <div className="flex items-center gap-2 text-rose-600">
                      <TrendingDown size={14} />
                      <span>{formatCurrency(penaltyLeakage)}</span>
                   </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex items-center gap-8">
                <div className="bg-blue-50 p-5 rounded-3xl text-blue-600">
                  <ShieldCheck size={32} />
                </div>
                <div className="flex-1 grid grid-cols-2 gap-8 border-l border-slate-100 pl-8">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Buffer Fund Status</span>
                    <div className="text-xl font-black text-slate-800 tracking-tight">{formatCurrency(summary.finalBufferBalance)}</div>
                    <div className={`text-[10px] font-black uppercase mt-1 ${summary.bufferFundedDate ? 'text-blue-600' : 'text-slate-300'}`}>
                      {summary.bufferFundedDate || 'ONGOING'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Emergency Core</span>
                    <div className="text-xl font-black text-slate-800 tracking-tight">{formatCurrency(summary.finalEmergencyBalance)}</div>
                    <div className={`text-[10px] font-black uppercase mt-1 ${summary.emergencyFundedDate ? 'text-blue-600' : 'text-slate-300'}`}>
                      {summary.emergencyFundedDate || 'ONGOING'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="charts-section bg-white p-8 rounded-[40px] border border-slate-200 no-print shadow-sm space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-100">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em]">Strategy Performance Visualizer</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Simulated Outcome vs. Baseline Projection</p>
                </div>
              </div>
              
              <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 border border-slate-200 self-stretch md:self-auto overflow-x-auto no-scrollbar">
                <button 
                  onClick={() => setActiveChart('principal')}
                  className={`flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeChart === 'principal' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Layers size={14} />
                  Debt Liquidation
                </button>
                <button 
                  onClick={() => setActiveChart('reserves')}
                  className={`flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeChart === 'reserves' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Briefcase size={14} />
                  Reserve Funds
                </button>
                <button 
                  onClick={() => setActiveChart('savings')}
                  className={`flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeChart === 'savings' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <TrendingUp size={14} />
                  Savings Growth
                </button>
                <button 
                  onClick={() => setActiveChart('installments')}
                  className={`flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeChart === 'installments' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Activity size={14} />
                  Installment Trend
                </button>
              </div>
            </div>

            <div className="h-[500px] w-full bg-slate-50/50 rounded-[32px] p-6 border border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                {activeChart === 'principal' ? (
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="accelPrincipal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="monthIndex" tick={{fontSize: 9, fontWeight: 700}} interval={24} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} tick={{fontSize: 9, fontWeight: 700}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }} formatter={(v: number) => formatCurrency(v)} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                    <Area name="Accelerated Principal" type="monotone" dataKey="remainingPrincipal" stroke="#6366f1" fill="url(#accelPrincipal)" strokeWidth={4} />
                    <Line name="Baseline (Passive)" type="monotone" dataKey="baselinePrincipal" stroke="#cbd5e1" strokeDasharray="8 8" strokeWidth={2} dot={false} />
                  </AreaChart>
                ) : activeChart === 'reserves' ? (
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBuffer" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorEmergency" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="monthIndex" tick={{fontSize: 9, fontWeight: 700}} interval={24} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} tick={{fontSize: 9, fontWeight: 700}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }} formatter={(v: number) => formatCurrency(v)} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                    <Area name="Buffer Fund" type="monotone" dataKey="bufferBalance" stroke="#3b82f6" fill="url(#colorBuffer)" strokeWidth={3} />
                    <Area name="Emergency Fund" type="monotone" dataKey="emergencyBalance" stroke="#10b981" fill="url(#colorEmergency)" strokeWidth={3} />
                  </AreaChart>
                ) : activeChart === 'savings' ? (
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="monthIndex" tick={{fontSize: 9, fontWeight: 700}} interval={24} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} tick={{fontSize: 9, fontWeight: 700}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }} formatter={(v: number) => formatCurrency(v)} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                    <Area name="Cumulative Installment Savings" type="monotone" dataKey="cumulativeSavings" fill="#10b981" fillOpacity={0.1} stroke="#10b981" strokeWidth={4} />
                    <Bar name="Annual Extra Payments" dataKey="extraPaymentPaid" barSize={12} fill="#fbbf24" radius={[4, 4, 0, 0]} />
                  </ComposedChart>
                ) : (
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="monthIndex" tick={{fontSize: 9, fontWeight: 700}} interval={24} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} tick={{fontSize: 9, fontWeight: 700}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }} formatter={(v: number) => formatCurrency(v)} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                    <Line name="Installment Amount" type="stepAfter" dataKey="mortgageInstallment" stroke="#f43f5e" strokeWidth={4} dot={false} />
                    <Line name="Interest Component" type="monotone" dataKey="mortgageInterest" stroke="#94a3b8" strokeWidth={2} dot={false} strokeDasharray="3 3" />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </section>

          <section className="table-section bg-white rounded-[40px] border border-slate-200 overflow-hidden flex flex-col shadow-sm">
            <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between bg-slate-50/50 gap-4 no-print">
              <div className="flex items-center gap-3">
                <TableIcon size={20} className="text-slate-400" />
                <h3 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em]">Simulation Transaction Ledger</h3>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                    <HeartPulse size={12} />
                    FINANCIAL HEALTH RATIOS ENABLED
                 </div>
              </div>
            </div>
            
            <div className="table-container overflow-x-auto relative">
              <table className="w-full text-left border-collapse min-w-[4200px]">
                <thead className="bg-slate-900 text-white sticky top-0 z-20">
                  <tr className="text-[10px] font-black uppercase tracking-widest text-center border-b border-slate-800">
                    <th className="px-4 py-5 text-left border-r border-slate-800 w-16">Idx</th>
                    <th className="px-4 py-5 text-left border-r border-slate-800 w-28">Period</th>
                    <th className="px-4 py-5">Basic Sal.</th>
                    <th className="px-4 py-5">Bonus/THR</th>
                    <th className="px-4 py-5 bg-rose-900/40">THR Expense</th>
                    <th className="px-4 py-5 bg-emerald-900/40">THR/Comp Sav.</th>
                    <th className="px-4 py-5 bg-slate-800 shadow-inner">Total Income</th>
                    <th className="px-4 py-5 font-black text-indigo-400">Exp/Inc %</th>
                    <th className="px-4 py-5 font-black text-amber-400">DTI / KPR %</th>
                    <th className="px-4 py-5">Expenses</th>
                    <th className="px-4 py-5 font-black text-amber-400">Installment</th>
                    <th className="px-4 py-5 text-emerald-400">Net Surplus</th>
                    <th className="px-4 py-5">Buffer Fund</th>
                    <th className="px-4 py-5">Emergency Fund</th>
                    <th className="px-4 py-5 bg-indigo-800">Extra Bucket</th>
                    <th className="px-4 py-5 bg-indigo-700">Extra Paid</th>
                    <th className="px-4 py-5 italic text-slate-400">Interest</th>
                    <th className="px-4 py-5 text-amber-400">Rate</th>
                    <th className="px-4 py-5 font-black">Final Inst</th>
                    <th className="px-4 py-5 text-emerald-400 font-black">Reduction</th>
                    <th className="px-6 py-5 bg-indigo-900 font-black text-right text-indigo-100">Rem. Principal</th>
                  </tr>
                </thead>
                <tbody className="text-[10px] divide-y divide-slate-100 font-mono">
                  {records.map((r, i) => {
                    const dtiRatio = r.mortgageInstallment / r.totalIncome;
                    const routineExpOnly = r.totalExpenses - r.mortgageInstallment;
                    const expRatio = routineExpOnly / r.totalIncome;

                    return (
                      <tr key={i} className={`hover:bg-slate-50 ${(r.thr > 0 || r.compensation > 0) ? 'bg-amber-50/20' : ''} ${r.extraPaymentPaid > 0 ? 'bg-indigo-50/50' : ''}`}>
                        <td className="px-4 py-3 text-slate-400 border-r border-slate-50 text-center font-black">{r.monthIndex}</td>
                        <td className="px-4 py-3 font-black bg-slate-50 border-r border-slate-100 text-slate-700 uppercase">{r.date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(r.basicSalary)}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-black">
                          {r.thr > 0 ? <div className="flex items-center justify-end gap-1"><Gift size={12}/>{formatCurrency(r.thr)}</div> : 
                           r.compensation > 0 ? <div className="flex items-center justify-end gap-1"><Award size={12}/>{formatCurrency(r.compensation)}</div> : '-'}
                        </td>
                        <td className={`px-4 py-3 text-right font-black ${r.thrExpense > 0 ? 'text-rose-600 bg-rose-50/30' : 'text-slate-300'}`}>
                          {r.thrExpense > 0 ? formatCurrency(r.thrExpense) : '-'}
                        </td>
                        <td className={`px-4 py-3 text-right font-black ${r.thrToFunds + r.compToFunds > 0 ? 'text-emerald-700 bg-emerald-50/30' : 'text-slate-300'}`}>
                          {r.thrToFunds + r.compToFunds > 0 ? formatCurrency(r.thrToFunds + r.compToFunds) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-black bg-slate-50/50">{formatCurrency(r.totalIncome)}</td>
                        
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-md font-black ${getExpColor(expRatio)}`}>
                            {formatPercent(expRatio)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center border-r border-slate-50">
                          <span className={`px-2 py-1 rounded-md font-black ${getDTIColor(dtiRatio)}`}>
                            {formatPercent(dtiRatio)}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right opacity-60">{formatCurrency(routineExpOnly)}</td>
                        <td className="px-4 py-3 text-right font-black text-slate-800">{formatCurrency(r.mortgageInstallment)}</td>
                        <td className="px-4 py-3 text-right font-black text-emerald-700 bg-emerald-50/20">{formatCurrency(r.excess)}</td>
                        <td className="px-4 py-3 text-right text-blue-600 font-bold">{formatCurrency(r.bufferBalance)}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-bold">{formatCurrency(r.emergencyBalance)}</td>
                        <td className="px-4 py-3 text-right text-indigo-400 bg-indigo-50/10">{formatCurrency(r.extraPaymentBucket)}</td>
                        <td className={`px-4 py-3 text-right font-black ${r.extraPaymentPaid > 0 ? 'bg-indigo-100 text-indigo-700' : 'text-slate-300'}`}>
                          {r.extraPaymentPaid > 0 ? formatCurrency(r.extraPaymentPaid) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-400 font-medium italic">{formatCurrency(r.mortgageInterest)}</td>
                        <td className="px-4 py-3 text-center font-black text-slate-400">{formatPercent(r.interestRate)}</td>
                        <td className="px-4 py-3 text-right font-black text-slate-800">{formatCurrency(r.installmentAfterExtra)}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-black">{r.installmentReduction > 0 ? `-${formatCurrency(r.installmentReduction)}` : '-'}</td>
                        <td className="px-6 py-3 text-right bg-indigo-900/95 text-white font-black">{formatCurrency(r.remainingPrincipal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PRINT ONLY FOOTER */}
            <div className="print-footer hidden border-t border-slate-200 mt-10 pt-6 px-4">
               <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <div>© alanburhanudin • developer</div>
                  <div>KPR Master Sim V5.6 • Ledger Authority</div>
                  <div>Page 1 of 1</div>
               </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default App;
