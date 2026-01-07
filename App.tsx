
import React, { useState, useMemo, useRef } from 'react';
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

declare const html2pdf: any;

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
  const exportRef = useRef<HTMLDivElement>(null);
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

  const handleExportPDF = async () => {
    const loader = document.getElementById('pdf-loading');
    if (loader) loader.style.display = 'flex';
    
    try {
      const element = exportRef.current;
      const opt = {
        margin: 10,
        filename: `KPR_MASTER_REPORT_${new Date().getTime()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 1.5, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a3', orientation: 'landscape' }
      };

      await html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error('PDF Generation Failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      if (loader) loader.style.display = 'none';
    }
  };

  const updateRateTier = (index: number, newRate: number) => {
    const newSchedule = [...config.interestRateSchedule];
    newSchedule[index].rate = newRate / 100;
    setConfig({ ...config, interestRateSchedule: newSchedule });
  };

  const penaltyEfficiency = summary.totalExtraPaidRaw > 0 
    ? (summary.totalExtraPaidEffective / summary.totalExtraPaidRaw) * 100 
    : 100;

  const [activeChart, setActiveChart] = useState<'principal' | 'savings' | 'installments' | 'reserves'>('principal');

  const getDTIColor = (ratio: number) => {
    if (ratio > 0.4) return 'text-rose-600';
    if (ratio > 0.3) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const getExpColor = (ratio: number) => {
    if (ratio > 0.6) return 'text-rose-600';
    if (ratio > 0.45) return 'text-amber-600';
    return 'text-indigo-600';
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      
      {/* HIDDEN EXPORT TEMPLATE FOR HTML2PDF */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={exportRef} className="pdf-export-container">
          <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-8">
            <div>
              <h1 className="text-4xl font-black text-slate-900 uppercase">KPR Master Sim Report</h1>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">alanburhanudin • developer authority</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-black uppercase text-slate-400">Date Generated</span>
              <p className="text-sm font-bold text-slate-900">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-4 mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div><span className="text-[10px] font-black uppercase text-slate-400">Base Salary</span><p className="text-xs font-bold">{formatCurrency(config.initialBasicSalary)}</p></div>
            <div><span className="text-[10px] font-black uppercase text-slate-400">Salary Growth</span><p className="text-xs font-bold">{config.salaryGrowthRate}%/Y</p></div>
            <div><span className="text-[10px] font-black uppercase text-slate-400">Base Exp</span><p className="text-xs font-bold">{formatCurrency(INITIAL_NON_MORTGAGE_EXPENSES)}</p></div>
            <div><span className="text-[10px] font-black uppercase text-slate-400">Exp Inflation</span><p className="text-xs font-bold">{config.expenseInflationRate}%/Y</p></div>
            <div><span className="text-[10px] font-black uppercase text-slate-400">Penalty</span><p className="text-xs font-bold text-rose-600">{config.extraPaymentPenaltyRate}%</p></div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-emerald-600 text-white p-6 rounded-2xl">
              <span className="text-xs font-black uppercase opacity-80">Total Interest Savings</span>
              <div className="text-3xl font-black">{formatCurrency(summary.totalSavings)}</div>
            </div>
            <div className="bg-slate-900 text-white p-6 rounded-2xl">
              <span className="text-xs font-black uppercase opacity-80">Debt Freedom Date</span>
              <div className="text-3xl font-black">{summary.mortgagePaidDate}</div>
            </div>
            <div className="bg-indigo-600 text-white p-6 rounded-2xl">
              <span className="text-xs font-black uppercase opacity-80">Total Penalty Leakage</span>
              <div className="text-3xl font-black">{formatCurrency(summary.totalPenaltyPaid)}</div>
            </div>
          </div>

          <table className="pdf-table">
            <thead>
              <tr>
                <th>Idx</th><th>Period</th><th>Basic Sal.</th><th>THR/Comp</th><th>Total Inc.</th><th>E/I %</th><th>DTI %</th><th>Installment</th><th>Reduction</th><th>Principal Rem.</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={i}>
                  <td className="text-center">{r.monthIndex}</td>
                  <td className="font-bold">{r.date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }).toUpperCase()}</td>
                  <td className="text-right">{formatCurrency(r.basicSalary)}</td>
                  <td className="text-right">{formatCurrency(r.thr + r.compensation)}</td>
                  <td className="text-right font-bold">{formatCurrency(r.totalIncome)}</td>
                  <td className="text-center">{( (r.totalExpenses-r.mortgageInstallment) / r.totalIncome * 100).toFixed(1)}%</td>
                  <td className="text-center">{(r.mortgageInstallment / r.totalIncome * 100).toFixed(1)}%</td>
                  <td className="text-right font-bold">{formatCurrency(r.mortgageInstallment)}</td>
                  <td className="text-right text-emerald-600">{formatCurrency(r.installmentReduction)}</td>
                  <td className="text-right font-black bg-slate-50">{formatCurrency(r.remainingPrincipal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center opacity-50">
            <span className="text-[10px] font-black uppercase">© alanburhanudin • developer</span>
            <span className="text-[10px] font-black uppercase tracking-widest">KPR Master Sim Engine v5.6</span>
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
            <Download size={16} />
            Download PDF
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

            <div className="pt-6 px-2 text-center">
               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-4">
                 Note: Exporting PDF works best<br/>in high-speed data connections.
               </p>
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
                <Download size={18} />
                Download PDF Report
              </button>
            </div>
          )}

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
                </div>

                <div className="flex-[1.2] p-10 bg-slate-50 border-l border-slate-100 flex flex-col justify-center">
                  <div className="space-y-8">
                    <div className="group">
                      <div className="flex justify-between items-end mb-3">
                         <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Acceleration Cost</span>
                         <span className="text-2xl font-black text-indigo-600 tracking-tight">{formatCurrency(summary.totalInterestPaid)}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200">
                         <div 
                           className="bg-gradient-to-r from-indigo-500 to-indigo-700 h-full rounded-full transition-all duration-1000 shadow-lg" 
                           style={{ width: `${(summary.totalInterestPaid / summary.totalInterestBaseline) * 100}%` }}
                         ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-6">
                <div className="flex-1 bg-slate-900 rounded-[40px] p-8 text-white flex flex-col justify-between shadow-xl relative group overflow-hidden">
                  <Target size={20} className="text-indigo-400" />
                  <div className="relative z-10">
                    <div className="text-4xl font-black tracking-tighter mb-1">{summary.mortgagePaidDate || 'PENDING'}</div>
                    <p className="text-xs font-medium text-slate-400">Total Tenor Reduction: <span className="text-emerald-400 font-bold">{Math.max(0, config.initialTotalMonths - (summary.mortgagePaidMonth || 0))} Months</span></p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="charts-section bg-white p-8 rounded-[40px] border border-slate-200 no-print shadow-sm space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <BarChart3 size={24} className="text-indigo-600" />
                <div>
                  <h3 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em]">Strategy Performance Visualizer</h3>
                </div>
              </div>
              <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 border border-slate-200 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveChart('principal')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeChart === 'principal' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Debt Liquidation</button>
                <button onClick={() => setActiveChart('reserves')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeChart === 'reserves' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Reserve Funds</button>
              </div>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={records.map((r, i) => ({ ...r, monthIndex: i+1 }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="monthIndex" tick={{fontSize: 9}} />
                  <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} tick={{fontSize: 9}} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Area name="Remaining Principal" type="monotone" dataKey="remainingPrincipal" stroke="#6366f1" fill="#6366f122" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="table-section bg-white rounded-[40px] border border-slate-200 overflow-hidden flex flex-col shadow-sm">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 no-print">
              <div className="flex items-center gap-3">
                <TableIcon size={20} className="text-slate-400" />
                <h3 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em]">Transaction Ledger</h3>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                <HeartPulse size={12} />
                FINANCIAL HEALTH RATIOS ENABLED
              </div>
            </div>
            
            <div className="table-container overflow-x-auto relative">
              <table className="w-full text-left border-collapse min-w-[3200px]">
                <thead className="bg-slate-900 text-white sticky top-0 z-20">
                  <tr className="text-[10px] font-black uppercase tracking-widest text-center border-b border-slate-800">
                    <th className="px-4 py-5 text-left border-r border-slate-800 w-16">Idx</th>
                    <th className="px-4 py-5 text-left border-r border-slate-800 w-28">Period</th>
                    <th className="px-4 py-5">Basic Sal.</th>
                    <th className="px-4 py-5">Total Income</th>
                    <th className="px-4 py-5">DTI %</th>
                    <th className="px-4 py-5">Installment</th>
                    <th className="px-4 py-5">Reduction</th>
                    <th className="px-6 py-5 bg-indigo-900 font-black text-right">Rem. Principal</th>
                  </tr>
                </thead>
                <tbody className="text-[10px] divide-y divide-slate-100 font-mono">
                  {records.map((r, i) => {
                    const dtiRatio = r.mortgageInstallment / r.totalIncome;
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-400 border-r border-slate-50 text-center font-black">{r.monthIndex}</td>
                        <td className="px-4 py-3 font-black bg-slate-50 border-r border-slate-100 text-slate-700 uppercase">{r.date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(r.basicSalary)}</td>
                        <td className="px-4 py-3 text-right font-black bg-slate-50/50">{formatCurrency(r.totalIncome)}</td>
                        <td className="px-4 py-3 text-center border-r border-slate-50 font-black">
                          <span className={getDTIColor(dtiRatio)}>{formatPercent(dtiRatio)}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-slate-800">{formatCurrency(r.mortgageInstallment)}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-black">{r.installmentReduction > 0 ? `-${formatCurrency(r.installmentReduction)}` : '-'}</td>
                        <td className="px-6 py-3 text-right bg-indigo-900/95 text-white font-black">{formatCurrency(r.remainingPrincipal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default App;
