
import React from 'react';
import type { WorkEntry, Employer, Payment } from '../types';
import { WorkStatus } from '../types';

interface WorkLogProps {
    workEntries: WorkEntry[];
    employers: Employer[];
    payments: Payment[];
    onAdd: () => void;
    onEdit: (workEntry: WorkEntry) => void;
    onDelete: (id: string) => void;
    onAddPayment: (workEntry: WorkEntry) => void;
}

const getStatusBadge = (status: WorkStatus) => {
    switch (status) {
        case WorkStatus.Paid:
            return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Paid</span>;
        case WorkStatus.PartiallyPaid:
            return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Partially Paid</span>;
        case WorkStatus.Pending:
            return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Pending</span>;
    }
}

export const WorkLog: React.FC<WorkLogProps> = ({ workEntries, employers, payments, onAdd, onEdit, onDelete, onAddPayment }) => {
    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    
    const getWorkEntryDetails = (workEntry: WorkEntry) => {
        const employer = employers.find(e => e.id === workEntry.employerId);
        if (!employer) return { employerName: 'Unknown', amountDue: 0, amountPaid: 0 };
        
        const amountDue = workEntry.rateType === 'hourly' ? (workEntry.hours ?? 0) * workEntry.rate : workEntry.rate;
        const amountPaid = payments
            .filter(p => p.workEntryId === workEntry.id)
            .reduce((sum, p) => sum + p.amount, 0);

        return { employerName: employer.name, amountDue, amountPaid };
    };

    const sortedWorkEntries = [...workEntries].sort((a, b) => new Date(`${b.date}T00:00:00`).getTime() - new Date(`${a.date}T00:00:00`).getTime());

    return (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Work Log</h2>
                <button onClick={onAdd} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400" disabled={employers.length === 0} title={employers.length === 0 ? "Add an employer first" : "Add work entry"}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Work
                </button>
            </div>
             <div className="overflow-x-auto">
                {workEntries.length === 0 ? (
                    <p className="text-center py-10 text-gray-500 dark:text-gray-400">No work logged yet. Add some work to track your income.</p>
                ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employer</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount Due / Paid</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedWorkEntries.map((entry) => {
                             const { employerName, amountDue, amountPaid } = getWorkEntryDetails(entry);
                             return (
                            <tr key={entry.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(`${entry.date}T00:00:00`).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{employerName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate">{entry.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    {currencyFormatter.format(amountDue)} / <span className="font-semibold text-green-600 dark:text-green-400">{currencyFormatter.format(amountPaid)}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{getStatusBadge(entry.status)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {entry.status !== WorkStatus.Paid && 
                                      <button onClick={() => onAddPayment(entry)} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200">Log Payment</button>
                                    }
                                    <button onClick={() => onEdit(entry)} className="ml-4 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">Edit</button>
                                    <button onClick={() => onDelete(entry.id)} className="ml-4 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200">Delete</button>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
                )}
            </div>
        </div>
    );
};
