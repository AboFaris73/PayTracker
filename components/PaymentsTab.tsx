
import React, { useState, useEffect, useMemo } from 'react';
import type { Employer, Payment, WorkEntry } from '../types';

interface PaymentsTabProps {
    employers: Employer[];
    payments: Payment[];
    workEntries: WorkEntry[];
    onAddPayment: (data: { employerId: string; amount: number; date: string }) => void;
    pendingAmounts: Map<string, number>;
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({ employers, payments, workEntries, onAddPayment, pendingAmounts }) => {
    const [employerId, setEmployerId] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

    useEffect(() => {
        if (employers.length > 0 && !employerId) {
            setEmployerId(employers[0].id);
        }
    }, [employers, employerId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!employerId || !amount || amount <= 0) {
            alert('Please select an employer and enter a positive payment amount.');
            return;
        }
        onAddPayment({ employerId, amount, date });
        setAmount('');
    };

    const selectedEmployerPendingAmount = useMemo(() => {
        if (!employerId) return 0;
        return pendingAmounts.get(employerId) || 0;
    }, [employerId, pendingAmounts]);
    
    const paymentDetails = useMemo(() => {
        return payments.map(payment => {
            const workEntry = workEntries.find(w => w.id === payment.workEntryId);
            const employer = workEntry ? employers.find(e => e.id === workEntry.employerId) : undefined;
            return {
                ...payment,
                employerName: employer?.name || 'Unknown Employer',
                workDescription: workEntry?.description || 'N/A'
            };
        }).sort((a,b) => new Date(`${b.date}T00:00:00`).getTime() - new Date(`${a.date}T00:00:00`).getTime());
    }, [payments, workEntries, employers]);

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
                <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                     <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Log Bulk Payment</h2>
                     <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Apply a single payment to the oldest outstanding work items for an employer (FIFO).</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="employer-payment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Employer</label>
                            <select id="employer-payment" value={employerId} onChange={e => setEmployerId(e.target.value)} required className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" disabled={employers.length === 0}>
                                {employers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                            {selectedEmployerPendingAmount > 0 && (
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    Outstanding balance: <span className="font-semibold text-red-500">{currencyFormatter.format(selectedEmployerPendingAmount)}</span>
                                </p>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-grow">
                                <label htmlFor="amount-payment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Amount ($)</label>
                                <input type="number" id="amount-payment" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} required min="0.01" step="0.01" className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                            </div>
                            <div>
                                <label htmlFor="date-payment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Date</label>
                                <input type="date" id="date-payment" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 text-right rounded-b-lg">
                        <button type="submit" className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-400" disabled={employers.length === 0}>
                            Log Payment
                        </button>
                    </div>
                </form>
            </div>
            
             <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
                <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Payment History</h2>
                </div>
                <div className="overflow-x-auto">
                    {paymentDetails.length === 0 ? (
                        <p className="text-center py-10 text-gray-500 dark:text-gray-400">No payments have been logged yet.</p>
                    ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employer</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Applied To Work</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {paymentDetails.map((payment) => (
                                <tr key={payment.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(`${payment.date}T00:00:00`).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">{currencyFormatter.format(payment.amount)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{payment.employerName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate">{payment.workDescription}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     )}
                </div>
            </div>
        </div>
    );
};
