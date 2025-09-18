
import React from 'react';
import type { Employer } from '../types';

interface EmployerListProps {
    employers: Employer[];
    onAdd: () => void;
    onEdit: (employer: Employer) => void;
    onDelete: (id: string) => void;
    pendingAmounts: Map<string, number>;
}

export const EmployerList: React.FC<EmployerListProps> = ({ employers, onAdd, onEdit, onDelete, pendingAmounts }) => {
    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

    const sortedEmployers = [...employers].sort((a, b) => {
        const pendingA = pendingAmounts.get(a.id) || 0;
        const pendingB = pendingAmounts.get(b.id) || 0;
        return pendingB - pendingA;
    });

    return (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Employers</h2>
                <button onClick={onAdd} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Employer
                </button>
            </div>
            <div className="overflow-x-auto">
                {employers.length === 0 ? (
                    <p className="text-center py-10 text-gray-500 dark:text-gray-400">No employers added yet. Get started by adding one!</p>
                ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pending Amount</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedEmployers.map((employer) => (
                            <tr key={employer.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{employer.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{employer.contact || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    {currencyFormatter.format(pendingAmounts.get(employer.id) || 0)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => onEdit(employer)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">Edit</button>
                                    <button onClick={() => onDelete(employer.id)} className="ml-4 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 )}
            </div>
        </div>
    );
};
