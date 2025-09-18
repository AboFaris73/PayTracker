
import React, { useState, useMemo } from 'react';
import type { WorkEntry, Payment, Employer } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

interface ReportsProps {
    workEntries: WorkEntry[];
    payments: Payment[];
    employers: Employer[];
}

export const Reports: React.FC<ReportsProps> = ({ workEntries, payments, employers }) => {
    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    const compactCurrencyFormatter = new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD', 
        notation: 'compact',
        maximumFractionDigits: 1
    });
    
    const [filterType, setFilterType] = useState('this_vs_last_month'); // this_vs_last_month, month, year
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedEmployerId, setSelectedEmployerId] = useState('all');
    
    // Use a local date object to avoid timezone issues for display and calculations
    const localSelectedDate = new Date(`${selectedDate}T00:00:00`);
    const currentYear = new Date().getFullYear();
    const selectedYear = localSelectedDate.getFullYear();
    const selectedMonth = selectedDate.slice(0, 7); // YYYY-MM

    const chartData = useMemo(() => {
        const filteredWorkEntries = selectedEmployerId === 'all'
            ? workEntries
            : workEntries.filter(w => w.employerId === selectedEmployerId);

        const filteredPayments = selectedEmployerId === 'all'
            ? payments
            : payments.filter(p => {
                const workEntry = workEntries.find(w => w.id === p.workEntryId);
                return workEntry && workEntry.employerId === selectedEmployerId;
            });
            
        if (filterType === 'this_vs_last_month') {
            const now = new Date();
            const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

            const thisMonth = { earned: 0, received: 0 };
            const lastMonth = { earned: 0, received: 0 };
            
            filteredWorkEntries.forEach(entry => {
                const entryDate = new Date(`${entry.date}T00:00:00`);
                const amount = entry.rateType === 'hourly' ? (entry.hours ?? 0) * entry.rate : entry.rate;
                if (entryDate >= startOfThisMonth && entryDate <= endOfThisMonth) {
                    thisMonth.earned += amount;
                } else if (entryDate >= startOfLastMonth && entryDate <= endOfLastMonth) {
                    lastMonth.earned += amount;
                }
            });

            filteredPayments.forEach(payment => {
                const paymentDate = new Date(`${payment.date}T00:00:00`);
                 if (paymentDate >= startOfThisMonth && paymentDate <= endOfThisMonth) {
                    thisMonth.received += payment.amount;
                } else if (paymentDate >= startOfLastMonth && paymentDate <= endOfLastMonth) {
                    lastMonth.received += payment.amount;
                }
            });
            
            return [
                { name: 'Last Month', Earned: lastMonth.earned, Received: lastMonth.received },
                { name: 'This Month', Earned: thisMonth.earned, Received: thisMonth.received },
            ];
        }
        
        if (filterType === 'year') {
            const yearData = Array.from({ length: 12 }, (_, i) => ({
                name: new Date(0, i).toLocaleString('default', { month: 'short' }),
                Earned: 0,
                Received: 0,
            }));
            
            filteredWorkEntries.forEach(entry => {
                const entryDate = new Date(`${entry.date}T00:00:00`);
                if (entryDate.getFullYear() === selectedYear) {
                    const monthIndex = entryDate.getMonth();
                    yearData[monthIndex].Earned += entry.rateType === 'hourly' ? (entry.hours ?? 0) * entry.rate : entry.rate;
                }
            });

            filteredPayments.forEach(payment => {
                const paymentDate = new Date(`${payment.date}T00:00:00`);
                if (paymentDate.getFullYear() === selectedYear) {
                    const monthIndex = paymentDate.getMonth();
                    yearData[monthIndex].Received += payment.amount;
                }
            });

            return yearData;
        }

        if (filterType === 'month') {
            const [year, month] = selectedMonth.split('-').map(Number);
            const daysInMonth = new Date(year, month, 0).getDate();
            const monthData = Array.from({ length: daysInMonth }, (_, i) => ({
                name: (i + 1).toString(),
                Earned: 0,
                Received: 0
            }));

            filteredWorkEntries.forEach(entry => {
                const entryDate = new Date(`${entry.date}T00:00:00`);
                if (entryDate.getFullYear() === year && entryDate.getMonth() + 1 === month) {
                    const dayIndex = entryDate.getDate() - 1;
                    monthData[dayIndex].Earned += entry.rateType === 'hourly' ? (entry.hours ?? 0) * entry.rate : entry.rate;
                }
            });

            filteredPayments.forEach(payment => {
                const paymentDate = new Date(`${payment.date}T00:00:00`);
                 if (paymentDate.getFullYear() === year && paymentDate.getMonth() + 1 === month) {
                    const dayIndex = paymentDate.getDate() - 1;
                    monthData[dayIndex].Received += payment.amount;
                }
            });
            
            return monthData;
        }

        return [];
    }, [filterType, selectedDate, selectedEmployerId, workEntries, payments, selectedYear, selectedMonth]);
    
    const summaryTotals = useMemo(() => {
        if (!chartData || chartData.length === 0) {
            return { totalEarned: 0, totalReceived: 0 };
        }
        const totalEarned = chartData.reduce((sum, item) => sum + (item.Earned || 0), 0);
        const totalReceived = chartData.reduce((sum, item) => sum + (item.Received || 0), 0);
        return { totalEarned, totalReceived };
    }, [chartData]);
    
    const labelFormatter = (value: number) => {
        if (value === 0) return '';
        if (value >= 1000) return compactCurrencyFormatter.format(value);
        return currencyFormatter.format(value);
    };


    if (workEntries.length === 0 && payments.length === 0) {
        return (
            <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No data available</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Start logging work to see your income reports.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 sm:p-6">
            <div className="mb-6 flex flex-wrap gap-4 items-end">
                <div>
                    <label htmlFor="employer-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Employer</label>
                    <select id="employer-filter" value={selectedEmployerId} onChange={e => setSelectedEmployerId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option value="all">All Employers</option>
                        {employers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="filter-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Report Type</label>
                    <select id="filter-type" value={filterType} onChange={e => setFilterType(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option value="this_vs_last_month">This Month vs Last Month</option>
                        <option value="month">Monthly Breakdown</option>
                        <option value="year">Yearly Breakdown</option>
                    </select>
                </div>
                {filterType === 'month' && (
                    <div>
                         <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Month</label>
                         <input type="month" id="month-select" value={selectedMonth} onChange={e => setSelectedDate(e.target.value + '-01')} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                )}
                 {filterType === 'year' && (
                    <div>
                         <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Year</label>
                         <input type="number" id="year-select" value={selectedYear} onChange={e => setSelectedDate(`${e.target.value}-01-01`)} min="2000" max={currentYear} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                )}
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Income Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" tickFormatter={(value) => compactCurrencyFormatter.format(value as number)} fontSize={12} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(31, 41, 55, 0.8)',
                            borderColor: '#4b5563'
                        }}
                        formatter={(value) => currencyFormatter.format(value as number)}
                    />
                    <Legend />
                    <Bar dataKey="Earned" fill="#6366f1">
                        <LabelList 
                            dataKey="Earned" 
                            position="top" 
                            formatter={labelFormatter}
                            fontSize={12} 
                            fill="#9ca3af"
                        />
                    </Bar>
                    <Bar dataKey="Received" fill="#10b981">
                        <LabelList 
                            dataKey="Received" 
                            position="top" 
                            formatter={labelFormatter}
                            fontSize={12} 
                            fill="#9ca3af"
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-8">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Report Summary</h4>
                {filterType === 'this_vs_last_month' ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Period</th>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Earned</th>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Received</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {chartData.map(item => (
                                    <tr key={item.name}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.name}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{currencyFormatter.format(item.Earned as number)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-medium">{currencyFormatter.format(item.Received as number)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Earned ({filterType === 'year' ? `Year ${selectedYear}` : `${localSelectedDate.toLocaleString('default', { month: 'long', year: 'numeric'})}`})</p>
                            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{currencyFormatter.format(summaryTotals.totalEarned)}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Received ({filterType === 'year' ? `Year ${selectedYear}` : `${localSelectedDate.toLocaleString('default', { month: 'long', year: 'numeric'})}`})</p>
                            <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">{currencyFormatter.format(summaryTotals.totalReceived)}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
