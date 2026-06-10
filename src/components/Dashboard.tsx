import React, { useState, useEffect } from 'react';
import { Download, Settings, BarChart, FileText, Wallet, Calendar, TrendingUp, DollarSign, Plus, Trash2, Smartphone, Save, LogIn, LogOut, Cloud, Eye, EyeOff } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { exportToCSV, exportToPDF } from '../lib/exportUtils';
import { SettingsModal, SupportChat } from './IntegrationWidgets';
import type { FinancialData, ExpenseItem } from '../types';
import { auth, loginWithGoogle, logout, saveBoardToCloud, loadBoardFromCloud } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [showValues, setShowValues] = useState(true);

  const formatVisibleCur = (value: number) => {
    return showValues ? formatCurrency(value) : 'R$ ****';
  };

  const [salaryHistory, setSalaryHistory] = useState<Record<string, string>>({});
  const [data, setData] = useState<FinancialData | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [locale, setLocale] = useState<'pt'|'en'>('pt');
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [descInput, setDescInput] = useState('');
  const [valInput, setValInput] = useState('');
  const [fixedExpensesList, setFixedExpensesList] = useState<ExpenseItem[]>([]);
  const [fixedDescInput, setFixedDescInput] = useState('');
  const [fixedValInput, setFixedValInput] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const currentSalaryStr = salaryHistory[selectedMonth] ?? '';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const cloudData = await loadBoardFromCloud(u.uid);
          // Only overwrite if cloud has data, or we could just trust it.
          if (Object.keys(cloudData.salaryHistory).length > 0) {
            setSalaryHistory(cloudData.salaryHistory);
            setExpenses(cloudData.dailyExpenses);
            setFixedExpensesList(cloudData.fixedExpensesList);
          }
        } catch (e) {
          console.error('Failed to load from cloud', e);
        }
      } else {
        // If logged out, board should be "refreshed as default" (empty)
        if (firebaseInitialized) {
          setSalaryHistory({});
          setExpenses([]);
          setFixedExpensesList([]);
          setData(null);
        }
      }
      setFirebaseInitialized(true);
    });
    return () => unsubscribe();
  }, [firebaseInitialized]);

  const handleSaveToCloud = async () => {
    if (!user) {
      // User must log in first
      try {
        const loggedInUser = await loginWithGoogle();
        if (loggedInUser) {
          setIsSaving(true);
          await saveBoardToCloud(loggedInUser.uid, salaryHistory, expenses, fixedExpensesList);
          setIsSaving(false);
          // Saved successfully
        }
      } catch (err) {
        console.error(err);
      }
      return;
    }

    setIsSaving(true);
    try {
      await saveBoardToCloud(user.uid, salaryHistory, expenses, fixedExpensesList);
      // Saved successfully
    } catch (err) {
      console.error(err);
    }
    setIsSaving(false);
  };


  // Handle PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert("Para instalar o app no seu celular:\n\n🍎 iOS: Toque em 'Compartilhar' > 'Adicionar à Tela de Início'.\n🤖 Android: Abra o menu do navegador > 'Adicionar à tela inicial'.");
    }
  };

  // Calculate whenever salary changes
  useEffect(() => {
    const salaryNum = parseFloat(currentSalaryStr.replace(/\D/g, '')) || 0;
    
    if (salaryNum > 0) {
      setData({
        salary: salaryNum,
        monthlyInvestment: salaryNum * 0.2,
        variableExpenses: salaryNum * 0.3,
        fixedExpenses: salaryNum * 0.5,
        shortTermGoal: salaryNum * 6,
        longTermGoal: salaryNum * 93,
      });
    } else {
      setData(null);
    }
  }, [currentSalaryStr]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanStr = valInput.replace(',', '.').replace(/[^\d.]/g, '');
    const amt = parseFloat(cleanStr);
    if (!descInput.trim() || isNaN(amt) || amt <= 0) return;

    const isCurrentMonth = selectedMonth === new Date().toISOString().slice(0, 7);
    const dateToSave = isCurrentMonth ? new Date().toISOString() : `${selectedMonth}-15T12:00:00.000Z`;

    const newExpense: ExpenseItem = {
      id: Date.now().toString(),
      description: descInput,
      amount: amt,
      date: dateToSave
    };

    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    setDescInput('');
    setValInput('');
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter(ex => ex.id !== id);
    setExpenses(updated);
  };

  const handleAddFixedExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanStr = fixedValInput.replace(',', '.').replace(/[^\d.]/g, '');
    const amt = parseFloat(cleanStr);
    if (!fixedDescInput.trim() || isNaN(amt) || amt <= 0) return;

    const isCurrentMonth = selectedMonth === new Date().toISOString().slice(0, 7);
    const dateToSave = isCurrentMonth ? new Date().toISOString() : `${selectedMonth}-15T12:00:00.000Z`;

    const newExpense: ExpenseItem = {
      id: Date.now().toString(),
      description: fixedDescInput,
      amount: amt,
      date: dateToSave
    };

    const updated = [newExpense, ...fixedExpensesList];
    setFixedExpensesList(updated);
    setFixedDescInput('');
    setFixedValInput('');
  };

  const handleDeleteFixedExpense = (id: string) => {
    const updated = fixedExpensesList.filter(ex => ex.id !== id);
    setFixedExpensesList(updated);
  };

  const uniqueMonths = Array.from(new Set([
    new Date().toISOString().slice(0, 7),
    ...Array.from({length: 6}).map((_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      return d.toISOString().slice(0, 7);
    }),
    ...expenses.map(e => e.date.substring(0, 7)),
    ...fixedExpensesList.map(e => e.date.substring(0, 7)),
    ...Object.keys(salaryHistory)
  ])).filter(m => m >= '2026-05').sort((a, b) => b.localeCompare(a));

  const filteredExpenses = expenses.filter(e => e.date.startsWith(selectedMonth)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalMonthlyExpenses = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const remainingVariable = data ? data.variableExpenses - totalMonthlyExpenses : 0;

  const filteredFixedExpenses = fixedExpensesList.filter(e => e.date.startsWith(selectedMonth)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalMonthlyFixedPaid = filteredFixedExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const remainingFixed = data ? data.fixedExpenses - totalMonthlyFixedPaid : 0;

  const totalInvestedAccumulated: number = Object.entries(salaryHistory)
    .filter(([month]) => month >= '2026-06')
    .reduce<number>((acc, [, currSalaryStr]) => {
      const sNum = parseFloat(String(currSalaryStr).replace(/\D/g, '')) || 0;
      return acc + (sNum * 0.2);
    }, 0);

  const accumulatedLeftover = uniqueMonths
    .filter(monthStr => monthStr >= '2026-06')
    .reduce((acc, monthStr) => {
    const sNum = parseFloat(String(salaryHistory[monthStr] || '0').replace(/\D/g, '')) || 0;
    if (sNum === 0) return acc;
    const fixedBudget = sNum * 0.5;
    const varBudget = sNum * 0.3;

    const expInMonth = expenses.filter(e => e.date.startsWith(monthStr)).reduce((sum, e) => sum + e.amount, 0);
    const fixedInMonth = fixedExpensesList.filter(e => e.date.startsWith(monthStr)).reduce((sum, e) => sum + e.amount, 0);

    const monthLeftover = (fixedBudget - fixedInMonth) + (varBudget - expInMonth);
    return acc + monthLeftover;
  }, 0);

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans p-4 md:p-8 selection:bg-indigo-500/30">
      {/* Sticky Header & Metrics Container */}
      <div className="sticky top-0 z-40 bg-black/85 backdrop-blur-xl pb-4 pt-4 md:pt-8 -mt-4 md:-mt-8 -mx-4 px-4 md:-mx-8 md:px-8 border-b border-zinc-800/80 shadow-2xl shadow-black/50 mb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white mb-2 flex items-center gap-3">
                <Wallet className="text-indigo-500" /> 
                {locale === 'pt' ? 'Planejador Wealth' : 'Wealth Planner'}
              </h1>
              <p className="text-zinc-400 text-sm hidden sm:block">Dashboard consolidado com Open Finance e projeções automáticas.</p>
            </div>
            
            <div className="flex items-stretch flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
              {/* Header Controls */}
              <div className="flex w-full md:w-auto gap-2">
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-full px-4 py-3 md:py-2 text-zinc-300 text-sm focus:outline-none focus:border-indigo-500 capitalize shrink-0 focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                >
                  {uniqueMonths.map(monthStr => {
                     const [year, month] = monthStr.split('-');
                     const date = new Date(parseInt(year), parseInt(month) - 1, 15);
                     const label = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
                     return <option key={monthStr} value={monthStr}>{label}</option>
                  })}
                </select>
                <div className="relative group flex-1 w-full md:w-48">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium pb-0.5">R$</span>
                  <input 
                    type="text"
                    inputMode="decimal" 
                    value={currentSalaryStr}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.,]/g, '');
                      const updated = { ...salaryHistory, [selectedMonth]: val };
                      setSalaryHistory(updated);
                    }}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-full py-3 md:py-2 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
                    placeholder="Salário Mensal"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-2 md:w-auto">
                <button
                  onClick={handleSaveToCloud}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 p-3 md:p-2 rounded-full bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 transition shadow-lg shrink-0 disabled:opacity-50"
                  title="Salvar na Nuvem"
                >
                  {isSaving ? <Cloud size={18} className="animate-pulse" /> : <Save size={18} />}
                  <span className="text-sm font-medium pr-2 hidden md:inline">Salvar</span>
                </button>

                {user ? (
                  <button
                    onClick={logout}
                    className="flex items-center justify-center p-3 md:p-2 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-rose-400 transition"
                    title="Sair da Conta"
                  >
                    <LogOut size={18} />
                  </button>
                ) : (
                  <button
                    onClick={() => loginWithGoogle()}
                    className="flex items-center justify-center p-3 md:p-2 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-indigo-400 transition"
                    title="Entrar com Google"
                  >
                    <LogIn size={18} />
                  </button>
                )}

                <button
                  onClick={() => setShowValues(!showValues)}
                  className="flex items-center justify-center w-12 h-12 md:w-[42px] md:h-[42px] rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 transition"
                  title="Ocultar valores"
                >
                  {showValues ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>

                <button
                  onClick={handleInstallApp}
                  className="flex items-center justify-center gap-2 p-3 md:p-2 rounded-full bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 transition shadow-lg shrink-0"
                  title="Baixar Aplicativo"
                >
                  <Smartphone size={18} />
                  <span className="text-sm font-medium pr-2 hidden md:inline">App</span>
                </button>

                <button onClick={() => setLocale(locale === 'pt' ? 'en' : 'pt')} className="flex items-center justify-center w-12 h-12 md:w-[42px] md:h-[42px] rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 transition" title="Mudar Idioma">
                  <span className="text-xs font-bold">{locale === 'pt' ? 'PT' : 'EN'}</span>
                </button>
                
                <button onClick={() => setSettingsOpen(true)} className="flex items-center justify-center w-12 h-12 md:w-[42px] md:h-[42px] rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 transition">
                   <Settings size={18} />
                </button>
              </div>
            </div>
          </header>

          {data && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
              <MetricCard 
                title="Despesas Fixas (50%)" 
                value={formatVisibleCur(data.fixedExpenses)} 
                subtitle={totalMonthlyFixedPaid > 0 ? `Restam ${formatVisibleCur(remainingFixed)} (Pago: ${formatVisibleCur(totalMonthlyFixedPaid)})` : "Aluguel, contas..."}
                icon={<Calendar size={20} className="text-blue-400" />}
              />
              <MetricCard 
                title="Passar o Mês (30%)" 
                value={formatVisibleCur(data.variableExpenses)} 
                subtitle={totalMonthlyExpenses > 0 ? `Restam ${formatVisibleCur(remainingVariable)} (Gasto: ${formatVisibleCur(totalMonthlyExpenses)})` : "Alimentação..."}
                icon={<DollarSign size={20} className="text-amber-400" />}
              />
              <MetricCard 
                title="Para Investir (20%)" 
                value={formatVisibleCur(data.monthlyInvestment)} 
                subtitle={`Mês. Acumulado: ${formatVisibleCur(totalInvestedAccumulated)}`}
                icon={<TrendingUp size={20} className="text-emerald-400" />}
                highlight
              />
              <MetricCard 
                title="Independência 93x" 
                value={formatVisibleCur(data.longTermGoal)} 
                subtitle="Meta patrimonial a longo prazo"
                icon={<BarChart size={20} className="text-purple-400" />}
              />
              <MetricCard 
                title="Sobra Acumulada" 
                value={formatVisibleCur(accumulatedLeftover)} 
                subtitle="Fundo de Emergência"
                icon={<Wallet size={20} className="text-teal-400" />}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      {data && (
        <main className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
          
          {/* Export & Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pb-2">
             <button onClick={() => exportToPDF(data)} className="flex items-center justify-center w-full sm:w-auto gap-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl sm:rounded-md transition font-medium">
               <FileText size={16} /> Exportar PDF
             </button>
             <button onClick={() => exportToCSV(data)} className="flex items-center justify-center w-full sm:w-auto gap-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl sm:rounded-md transition font-medium">
               <Download size={16} /> Download CSV
             </button>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 text-center">
            <h3 className="text-zinc-100 font-medium mb-2 opacity-90">Resumo do Planejamento</h3>
            <p className="text-zinc-400 text-sm max-w-3xl mx-auto leading-relaxed">
              O orçamento está distribuído conforme a regra 50/30/20. Acompanhe o registro de suas despesas nos painéis abaixo para compor o seu patrimônio e garantir a sua Independência Financeira.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              {/* Daily Expenses Section */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h3 className="text-zinc-300 font-medium mb-1">Histórico de Gastos (Passar o Mês)</h3>
                <p className="text-zinc-500 text-xs text-balance">Anote seus gastos para acompanhar o saldo disponível do mês</p>
              </div>
              <div className="flex flex-col items-end gap-2 text-right w-full md:w-auto">
                <div>
                  <p className="text-sm text-zinc-400">Gasto Total no Mês</p>
                  <p className="text-xl font-semibold text-rose-400">-{formatVisibleCur(totalMonthlyExpenses)}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleAddExpense} className="flex flex-col md:flex-row gap-3 mb-6">
              <input
                type="text"
                placeholder="Descrição (ex: Almoço, Uber)"
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-3 md:py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-600"
                required
              />
              <div className="relative w-full md:w-48">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium pb-0.5">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={valInput}
                  onChange={(e) => setValInput(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg py-3 md:py-2 pl-10 pr-3 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-600"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white py-3 md:py-2 md:px-5 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Plus size={20} />
                <span className="font-medium">Adicionar</span>
              </button>
            </form>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {filteredExpenses.length === 0 ? (
                <div className="text-center text-zinc-600 py-8 text-sm border border-dashed border-zinc-800 rounded-xl">
                  Nenhum gasto registrado neste mês.
                </div>
              ) : (
                filteredExpenses.map((expense) => {
                  const expenseDate = new Date(expense.date);
                  const isToday = expenseDate.toDateString() === new Date().toDateString();
                  const timeString = expenseDate.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
                  const dateString = expenseDate.toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'});
                  
                  return (
                  <div key={expense.id} className="flex items-center justify-between bg-zinc-800/30 border border-zinc-700/30 p-3.5 rounded-xl group hover:bg-zinc-800/50 transition">
                    <div>
                      <p className="text-zinc-200 font-medium text-sm">{expense.description}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{isToday ? `Hoje, ${timeString}` : `${dateString}, ${timeString}`}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-white font-medium">{formatVisibleCur(expense.amount)}</p>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-zinc-600 hover:text-rose-400 transition opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        title="Remover"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
                })
              )}
            </div>
          </div>

          {/* Fixed Expenses Paid Section */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h3 className="text-zinc-300 font-medium mb-1">Despesas Fixas Pagas</h3>
                <p className="text-zinc-500 text-xs text-balance">Anote as contas fixas já pagas para compor o orçamento do mês</p>
              </div>
              <div className="flex flex-col items-end gap-2 text-right w-full md:w-auto">
                <div>
                  <p className="text-sm text-zinc-400">Total Pago no Mês</p>
                  <p className="text-xl font-semibold text-emerald-400">-{formatVisibleCur(totalMonthlyFixedPaid)}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleAddFixedExpense} className="flex flex-col md:flex-row gap-3 mb-6">
              <input
                type="text"
                placeholder="Descrição (ex: Aluguel, Internet)"
                value={fixedDescInput}
                onChange={(e) => setFixedDescInput(e.target.value)}
                className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-3 md:py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-600"
                required
              />
              <div className="relative w-full md:w-48">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium pb-0.5">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={fixedValInput}
                  onChange={(e) => setFixedValInput(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg py-3 md:py-2 pl-10 pr-3 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-600"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white py-3 md:py-2 md:px-5 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Plus size={20} />
                <span className="font-medium">Adicionar</span>
              </button>
            </form>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {filteredFixedExpenses.length === 0 ? (
                <div className="text-center text-zinc-600 py-8 text-sm border border-dashed border-zinc-800 rounded-xl">
                  Nenhuma despesa fixa registrada como paga neste mês.
                </div>
              ) : (
                filteredFixedExpenses.map((expense) => {
                  const expenseDate = new Date(expense.date);
                  const isToday = expenseDate.toDateString() === new Date().toDateString();
                  const timeString = expenseDate.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
                  const dateString = expenseDate.toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'});
                  
                  return (
                  <div key={expense.id} className="flex items-center justify-between bg-zinc-800/30 border border-zinc-700/30 p-3.5 rounded-xl group hover:bg-zinc-800/50 transition">
                    <div>
                      <p className="text-zinc-200 font-medium text-sm">{expense.description}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{isToday ? `Hoje, ${timeString}` : `${dateString}, ${timeString}`}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-white font-medium">{formatVisibleCur(expense.amount)}</p>
                      <button
                        onClick={() => handleDeleteFixedExpense(expense.id)}
                        className="text-zinc-600 hover:text-rose-400 transition opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        title="Remover"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
                })
              )}
            </div>
          </div>
          </div>
        </main>
      )}

      {/* Missing Data State */}
      {!data && (
        <div className="max-w-md mx-auto mt-20 text-center text-zinc-500 animate-in fade-in">
          <Wallet size={48} className="mx-auto mb-4 opacity-50" />
          <p>Insira seu salário do mês selecionado acima para iniciar suas análises gráficas e metas.</p>
        </div>
      )}

      {/* Widgets & Modals */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <SupportChat />

    </div>
  );
}

// Subcomponent: MetricCard
function MetricCard({ title, value, subtitle, icon, highlight = false }: { title: string; value: string; subtitle: string; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={cn(
      "p-4 sm:p-5 rounded-2xl border transition-all duration-300 w-full",
      highlight ? "bg-indigo-900/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]" : "bg-zinc-900/30 border-zinc-800/80"
    )}>
      <div className="flex justify-between items-start mb-3 sm:mb-4">
        <h3 className="text-zinc-400 text-xs sm:text-sm font-medium pr-2">{title}</h3>
        <div className="p-1.5 sm:p-2 bg-zinc-800/50 rounded-lg shrink-0">{icon}</div>
      </div>
      <div>
        <p className={cn("text-xl sm:text-2xl font-semibold tracking-tight break-words", highlight ? "text-indigo-100" : "text-white")}>{value}</p>
        <p className="text-xs text-zinc-500 mt-1 leading-snug">{subtitle}</p>
      </div>
    </div>
  );
}
