
import React from 'react';

interface StatsCardsProps {
    stats: {
        totalPending: number;
        totalPaid: number;
        overdueEntries: number;
    };
}

const StatCard: React.FC<{ title: string; value: string; icon: JSX.Element }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div className="p-5">
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    {icon}
                </div>
                <div className="ml-5 w-0 flex-1">
                    <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
                        <dd className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</dd>
                    </dl>
                </div>
            </div>
        </div>
    </div>
);


export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    
    const PendingIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
    const PaidIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
    const OverdueIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    );

    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
           <StatCard title="Total Pending" value={currencyFormatter.format(stats.totalPending)} icon={PendingIcon} />
           <StatCard title="Total Received" value={currencyFormatter.format(stats.totalPaid)} icon={PaidIcon} />
           <StatCard title="Overdue Items" value={stats.overdueEntries.toString()} icon={OverdueIcon} />
        </div>
    );
};
