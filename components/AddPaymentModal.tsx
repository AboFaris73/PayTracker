
import React, { useState, useMemo } from 'react';
import type { Payment, WorkEntry } from '../types';
import { Modal } from './Modal';

interface AddPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (payment: Omit<Payment, 'id'>) => void;
    workEntry: WorkEntry;
    payments: Payment[];
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ isOpen, onClose, onSave, workEntry, payments }) => {
    const [amount, setAmount] = useState(0);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

    const { amountDue, amountPaid } = useMemo(() => {
        const totalDue = workEntry.rateType === 'hourly' ? (workEntry.hours ?? 0) * workEntry.rate : workEntry.rate;
        const totalPaid = payments
            .filter(p => p.workEntryId === workEntry.id)
            .reduce((sum, p) => sum + p.amount, 0);

        return { amountDue: totalDue, amountPaid: totalPaid };
    }, [workEntry, payments]);

    const amountRemaining = amountDue - amountPaid;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amount <= 0 || amount > amountRemaining) {
            alert(`Payment must be positive and no more than the remaining amount of ${currencyFormatter.format(amountRemaining)}.`);
            return;
        }
        onSave({ workEntryId: workEntry.id, amount, date });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Log Payment">
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-300">Logging payment for: <span className="font-semibold">{workEntry.description}</span></p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Total Due: <span className="font-semibold">{currencyFormatter.format(amountDue)}</span></p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Remaining: <span className="font-semibold text-red-600 dark:text-red-400">{currencyFormatter.format(amountRemaining)}</span></p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-grow">
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Amount ($)</label>
                            <input type="number" id="amount" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} required min="0.01" step="0.01" max={amountRemaining} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                        <div>
                             <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Date</label>
                             <input type="date" id="paymentDate" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                    <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm">
                        Save Payment
                    </button>
                    <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">
                        Cancel
                    </button>
                </div>
            </form>
        </Modal>
    );
};
