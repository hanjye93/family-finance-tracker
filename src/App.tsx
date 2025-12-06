import React, { useState, useMemo, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { LayoutDashboard, Table, Plus, X, Wallet, TrendingUp, TrendingDown, Users, Sprout, Save, Download, Edit2, Lock, Unlock, KeyRound } from 'lucide-react';

// --- Configuration ---
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyK2P2EFABg1kwG1Riz-wWwuX7yfoWo6C-1Iul8qy_lS71MzYsrObTsBkCSdQZcacSI/exec';
const ADMIN_PIN = '8888'; // <--- CHANGE THIS PIN IF YOU WANT

const CONTRIBUTORS = ['YR', 'HJ', 'HC', 'YH', 'MY'];
const EXPENSE_CATEGORIES = ['Pocket Money', 'Health Expense', 'Durian Farm', 'Others'];
const COLORS = {
  income: ['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb', '#1d4ed8'],
  expense: ['#10b981', '#ef4444', '#f59e0b', '#6b7280'],
};

// --- Helper Functions ---
const formatCurrency = (value: number) => new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(value);

const normalizeMonth = (val: string) => {
  if (!val) return '';
  if (/^\d{4}-\d{2}$/.test(val)) return val;
  const date = new Date(val);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
  return val;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-sm">
        <p className="font-bold text-gray-700 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// --- Components ---

// NEW: Custom PIN Modal to replace window.prompt
const PinModal = ({ isOpen, onClose, onSuccess }: any) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      onSuccess();
      onClose();
      setPin('');
      setError('');
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-2 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg">
                <KeyRound className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Admin Access</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">Please enter the security PIN to enable editing mode.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={pin}
            onChange={(e) => {
                setPin(e.target.value);
                setError('');
            }}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-center text-2xl tracking-widest font-mono"
            placeholder="••••"
            autoFocus
            maxLength={4}
          />
          {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 py-1 rounded">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
            >
              Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DetailsModal = ({ isOpen, onClose, title, data }: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            {title} Breakdown
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-6">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
              <tr>
                <th scope="col" className="px-6 py-3 rounded-l-lg">Month</th>
                <th scope="col" className="px-6 py-3 rounded-r-lg text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item: any, index: number) => (
                <tr key={index} className="bg-white border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.month}</td>
                  <td className="px-6 py-4 text-right font-mono text-blue-600">{formatCurrency(item.value)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold text-gray-900 bg-gray-50">
                <td className="px-6 py-4">Total</td>
                <td className="px-6 py-4 text-right">{formatCurrency(data.reduce((acc: any, curr: any) => acc + curr.value, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subtext, icon: Icon, colorClass }: any) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start justify-between transition hover:shadow-md">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
);

const Dashboard = ({ data, onDrillDown }: any) => {
  const totals = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    const incomeByPerson = CONTRIBUTORS.map(p => ({ name: p, value: 0 }));
    const expenseByCategory = EXPENSE_CATEGORIES.map(c => ({ name: c, value: 0 }));

    data.forEach((row: any) => {
      Object.entries(row.incomes).forEach(([person, amount]: any) => {
        totalIncome += Number(amount);
        const pIndex = incomeByPerson.findIndex(i => i.name === person);
        if (pIndex > -1) incomeByPerson[pIndex].value += Number(amount);
      });
      Object.entries(row.expenses).forEach(([cat, amount]: any) => {
        totalExpense += Number(amount);
        const cIndex = expenseByCategory.findIndex(c => c.name === cat);
        if (cIndex > -1) expenseByCategory[cIndex].value += Number(amount);
      });
    });

    return { totalIncome, totalExpense, incomeByPerson, expenseByCategory };
  }, [data]);

  const cumulativeData = useMemo(() => {
    const sorted = [...data].sort((a: any, b: any) => a.month.localeCompare(b.month));
    let runningTotal = 0;
    return sorted.map((row: any) => {
      const monthIncome = Object.values(row.incomes).reduce((a: any, b: any) => a + Number(b), 0);
      const monthExpense = Object.values(row.expenses).reduce((a: any, b: any) => a + Number(b), 0);
      const net = (monthIncome as number) - (monthExpense as number);
      runningTotal += net;
      return {
        month: row.month,
        Balance: runningTotal
      };
    });
  }, [data]);

  const sortedMonths = useMemo(() => {
    return [...data].sort((a: any, b: any) => b.month.localeCompare(a.month));
  }, [data]);

  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
     if ((!selectedMonth || !data.find((d: any) => d.month === selectedMonth)) && sortedMonths.length > 0) {
         setSelectedMonth(sortedMonths[0].month);
     }
  }, [data, sortedMonths, selectedMonth]);

  const monthlyExpenses = useMemo(() => {
    const monthRecord = data.find((d: any) => d.month === selectedMonth);
    if (!monthRecord) return [];
    return EXPENSE_CATEGORIES.map(cat => ({
      name: cat,
      value: Number(monthRecord.expenses[cat]) || 0
    }));
  }, [data, selectedMonth]);

  const trendData = useMemo(() => {
      return [...data].sort((a: any, b: any) => a.month.localeCompare(b.month)).map((row: any) => ({
        month: row.month,
        Income: Object.values(row.incomes).reduce((a: any, b: any) => a + Number(b), 0),
        Expense: Object.values(row.expenses).reduce((a: any, b: any) => a + Number(b), 0),
      }));
  }, [data]);

  if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-gray-400">
            <Wallet className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">No records found. Please add data in the Data Editor.</p>
        </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Family Income" 
          value={formatCurrency(totals.totalIncome)} 
          subtext="Lifetime contributions"
          icon={Wallet}
          colorClass="bg-blue-500"
        />
        <StatCard 
          title="Total Parents' Expense" 
          value={formatCurrency(totals.totalExpense)} 
          subtext="Lifetime expenditure"
          icon={TrendingDown}
          colorClass="bg-red-500"
        />
        <StatCard 
          title="Net Savings/Balance" 
          value={formatCurrency(totals.totalIncome - totals.totalExpense)} 
          subtext="Available fund"
          icon={Sprout}
          colorClass="bg-green-500"
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-800">Cumulative Account Balance</h3>
          <p className="text-sm text-gray-500">Total fund growth over time</p>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cumulativeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} tickFormatter={(val) => `RM${val/1000}k`} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend iconType="circle" />
              <Line 
                type="monotone" 
                dataKey="Balance" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{r: 4, strokeWidth: 2, fill: '#fff'}} 
                activeDot={{r: 6, strokeWidth: 0}} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-800">Overall Expense Breakdown</h3>
            <p className="text-sm text-gray-500">Total spending by category (All Time)</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={totals.expenseByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  cursor="pointer"
                  onClick={(entry) => onDrillDown(entry.name)}
                >
                  {totals.expenseByCategory.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS.expense[index % COLORS.expense.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h3 className="text-lg font-bold text-gray-800">Monthly Expenses</h3>
                <p className="text-sm text-gray-500">Breakdown for specific month</p>
            </div>
            
            {sortedMonths.length > 0 && (
                <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                >
                    {sortedMonths.map((m: any) => (
                        <option key={m.id} value={m.month}>{m.month}</option>
                    ))}
                </select>
            )}
          </div>

          <div className="h-72 w-full">
             {monthlyExpenses.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={monthlyExpenses}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {monthlyExpenses.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS.expense[index % COLORS.expense.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
             ) : (
                 <div className="h-full flex items-center justify-center text-gray-400">No data for selected month</div>
             )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
           <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-800">Income vs Expense Trend</h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} tickFormatter={(val) => `RM${val/1000}k`} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="Income" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                <Line type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const DataEditor = ({ data, onAdd, onDelete, onUpdate, loading, isAdmin }: any) => {
  const [newRow, setNewRow] = useState({
    month: new Date().toISOString().slice(0, 7),
    incomes: CONTRIBUTORS.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {}),
    expenses: EXPENSE_CATEGORIES.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {}),
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRowData, setEditRowData] = useState<any>(null);

  const handleAddClick = () => {
    onAdd(newRow);
    setNewRow({
        ...newRow,
        incomes: CONTRIBUTORS.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {}),
        expenses: EXPENSE_CATEGORIES.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {}),
    })
  };

  const handleEditClick = (row: any) => {
    setEditingId(row.id);
    setEditRowData(JSON.parse(JSON.stringify(row))); // Deep copy
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditRowData(null);
  };

  const handleSaveEdit = () => {
    onUpdate(editRowData);
    setEditingId(null);
    setEditRowData(null);
  };

  const handleExportCSV = () => {
    const headers = ['Month', ...CONTRIBUTORS.map(c => `${c} (Income)`), ...EXPENSE_CATEGORIES.map(c => `${c} (Expense)`)];
    const csvContent = [
      headers.join(','),
      ...data.sort((a: any, b: any) => b.month.localeCompare(a.month)).map((row: any) => {
        const incomeValues = CONTRIBUTORS.map(c => row.incomes[c] || 0);
        const expenseValues = EXPENSE_CATEGORIES.map(c => row.expenses[c] || 0);
        return [row.month, ...incomeValues, ...expenseValues].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `family_finance_data_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <div>
            <h3 className="text-lg font-bold text-gray-800">Transaction Records</h3>
            <p className="text-sm text-gray-500">
                {isAdmin 
                    ? <span className="text-green-600 font-medium flex items-center gap-1"><Unlock className="w-3 h-3"/> Admin Mode Active</span> 
                    : <span className="flex items-center gap-1"><Lock className="w-3 h-3"/> View Only Mode</span>
                }
            </p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium shadow-sm"
            >
                <Download className="w-4 h-4" /> Export CSV
            </button>
        </div>
      </div>
      
      {loading && (
          <div className="w-full bg-blue-50 text-blue-700 p-2 text-center text-sm">
            Syncing with Google Sheets...
          </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th className="px-4 py-3 sticky left-0 bg-gray-100 z-10">Month</th>
              {CONTRIBUTORS.map(c => <th key={c} className="px-4 py-3 text-blue-700">{c} (In)</th>)}
              {EXPENSE_CATEGORIES.map(c => <th key={c} className="px-4 py-3 text-red-700">{c} (Out)</th>)}
              <th className="px-4 py-3 w-28">Action</th>
            </tr>
          </thead>
          <tbody>
            {/* Input Row - Only Show if Admin */}
            {isAdmin && (
                <tr className="bg-blue-50 border-b border-blue-100">
                <td className="px-4 py-2">
                    <input 
                    type="month" 
                    value={newRow.month} 
                    onChange={(e) => setNewRow({...newRow, month: e.target.value})}
                    className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-32"
                    />
                </td>
                {CONTRIBUTORS.map(c => (
                    <td key={c} className="px-4 py-2">
                    <input 
                        type="number" 
                        placeholder="0"
                        value={(newRow.incomes as any)[c] || ''} 
                        onChange={(e) => setNewRow({
                        ...newRow, 
                        incomes: { ...newRow.incomes, [c]: e.target.value } 
                        })}
                        className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-20"
                    />
                    </td>
                ))}
                {EXPENSE_CATEGORIES.map(c => (
                    <td key={c} className="px-4 py-2">
                    <input 
                        type="number" 
                        placeholder="0"
                        value={(newRow.expenses as any)[c] || ''} 
                        onChange={(e) => setNewRow({
                        ...newRow, 
                        expenses: { ...newRow.expenses, [c]: e.target.value } 
                        })}
                        className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-24"
                    />
                    </td>
                ))}
                <td className="px-4 py-2">
                    <button 
                    onClick={handleAddClick}
                    disabled={!newRow.month || loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs flex items-center gap-1 disabled:opacity-50"
                    >
                    <Plus className="w-3 h-3" /> Add
                    </button>
                </td>
                </tr>
            )}

            {/* Data Rows */}
            {data.sort((a: any, b: any) => b.month.localeCompare(a.month)).map((row: any) => {
              const isEditing = editingId === row.id;

              return (
                <tr key={row.id} className={`border-b ${isEditing ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                  {isEditing ? (
                    // --- EDIT MODE ---
                    <>
                      <td className="px-4 py-2">
                        <input 
                          type="month" 
                          value={editRowData.month} 
                          onChange={(e) => setEditRowData({...editRowData, month: e.target.value})}
                          className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-32"
                        />
                      </td>
                      {CONTRIBUTORS.map(c => (
                        <td key={c} className="px-4 py-2">
                          <input 
                            type="number" 
                            value={editRowData.incomes[c] || ''} 
                            onChange={(e) => setEditRowData({
                              ...editRowData, 
                              incomes: { ...editRowData.incomes, [c]: e.target.value } 
                            })}
                            className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-20"
                          />
                        </td>
                      ))}
                      {EXPENSE_CATEGORIES.map(c => (
                        <td key={c} className="px-4 py-2">
                          <input 
                            type="number" 
                            value={editRowData.expenses[c] || ''} 
                            onChange={(e) => setEditRowData({
                              ...editRowData, 
                              expenses: { ...editRowData.expenses, [c]: e.target.value } 
                            })}
                            className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-24"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-2 flex items-center gap-2">
                         <button 
                          onClick={handleSaveEdit}
                          className="text-green-600 hover:text-green-800 bg-green-100 p-1.5 rounded"
                          title="Save Changes"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          className="text-gray-500 hover:text-gray-700 bg-gray-100 p-1.5 rounded"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </>
                  ) : (
                    // --- VIEW MODE ---
                    <>
                      <td className="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white">{row.month}</td>
                      {CONTRIBUTORS.map(c => (
                        <td key={c} className="px-4 py-3 text-gray-600">{formatCurrency(row.incomes[c])}</td>
                      ))}
                      {EXPENSE_CATEGORIES.map(c => (
                        <td key={c} className="px-4 py-3 text-gray-600">{formatCurrency(row.expenses[c])}</td>
                      ))}
                      <td className="px-4 py-3 flex items-center gap-2">
                        {isAdmin ? (
                            <>
                                <button 
                                    onClick={() => handleEditClick(row)}
                                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded transition"
                                    disabled={loading}
                                    title="Edit"
                                >
                                <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => onDelete(row.id)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition"
                                    disabled={loading}
                                    title="Delete"
                                >
                                <X className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <span className="text-gray-400 text-xs italic">Read Only</span>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // Default is View Only
  const [showPinModal, setShowPinModal] = useState(false);
  
  // Drill Down State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [drillDownInfo, setDrillDownInfo] = useState({ title: '', data: [] });

  // 1. Fetch Data
  const fetchData = async () => {
      setIsLoading(true);
      try {
          const res = await fetch(GOOGLE_SCRIPT_URL);
          const json = await res.json();
          if (Array.isArray(json)) {
              // NORMALIZE DATA HERE
              const normalizedData = json.map(item => ({
                  ...item,
                  month: normalizeMonth(item.month)
              }));
              setData(normalizedData);
          }
      } catch (e) {
          console.error("Failed to fetch data", e);
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Actions
  const handleToggleAdmin = () => {
      if (isAdmin) {
          setIsAdmin(false);
      } else {
          setShowPinModal(true);
      }
  };

  const handleAddRecord = async (newRow: any) => {
    setIsLoading(true);
    
    // Optimistic Update
    const tempId = Date.now();
    const tempRow = { ...newRow, id: tempId };
    setData(prev => [tempRow, ...prev]);

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // Avoids CORS preflight options
        body: JSON.stringify({ action: 'add', ...newRow, id: tempId }) 
      });
      // Background re-fetch to ensure sync
      fetchData();
    } catch (e) {
      console.error("Error adding document: ", e);
      setData(prev => prev.filter(item => item.id !== tempId)); // Revert on error
      setIsLoading(false);
    }
  };

  const handleUpdateRecord = async (updatedRow: any) => {
    setIsLoading(true);
    
    // Optimistic Update
    const prevData = [...data];
    setData(prev => prev.map(item => item.id === updatedRow.id ? updatedRow : item));

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'update', ...updatedRow }) 
      });
      // Background re-fetch
      fetchData();
    } catch (e) {
        console.error("Error updating", e);
        setData(prevData); // Revert
        setIsLoading(false);
    }
  };

  const handleDeleteRecord = async (id: any) => {
    setIsLoading(true);
    
    // Optimistic Update
    const prevData = [...data];
    setData(prev => prev.filter(item => item.id !== id));

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'delete', id: id }) 
      });
      // Background re-fetch
      fetchData();
    } catch (e) {
        console.error("Error deleting", e);
        setData(prevData); // Revert
        setIsLoading(false);
    }
  };

  const handleDrillDown = (categoryName: string) => {
    const breakdown = data.map(row => ({
      month: row.month,
      value: Number(row.expenses[categoryName]) || 0
    })).filter(item => item.value > 0).sort((a,b) => b.month.localeCompare(a.month));

    setDrillDownInfo({
      title: categoryName,
      data: breakdown as any
    });
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight hidden sm:block">Family Finance <span className="text-blue-600">Tracker</span></h1>
            </div>
            
            <div className="flex items-center gap-2">
                <nav className="flex space-x-1 sm:space-x-2 mr-2">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'dashboard' 
                        ? 'bg-slate-100 text-blue-700' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                </button>
                <button
                    onClick={() => setActiveTab('data')}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'data' 
                        ? 'bg-slate-100 text-blue-700' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                >
                    <Table className="w-4 h-4" />
                    <span className="hidden sm:inline">Data Editor</span>
                </button>
                </nav>

                {/* Admin Toggle */}
                <button
                    onClick={handleToggleAdmin}
                    className={`p-2 rounded-full transition-colors ${
                        isAdmin ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                    title={isAdmin ? "Lock Admin Mode" : "Unlock Admin Mode"}
                >
                    {isAdmin ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard data={data} onDrillDown={handleDrillDown} />
        )} 
        {activeTab === 'data' && (
          <DataEditor 
            data={data} 
            onAdd={handleAddRecord} 
            onUpdate={handleUpdateRecord}
            onDelete={handleDeleteRecord}
            loading={isLoading}
            isAdmin={isAdmin}
          />
        )}
      </main>

      <DetailsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={drillDownInfo.title} 
        data={drillDownInfo.data} 
      />

      <PinModal 
        isOpen={showPinModal} 
        onClose={() => setShowPinModal(false)} 
        onSuccess={() => setIsAdmin(true)} 
      />
    </div>
  );
};

export default App;