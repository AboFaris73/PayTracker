
import React, { useState, useMemo, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { Employer, WorkEntry, Payment, RateType } from './types';
import { WorkStatus } from './types';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { EmployerList } from './components/EmployerList';
import { WorkLog } from './components/WorkLog';
import { AddEmployerModal } from './components/AddEmployerModal';
import { AddWorkModal } from './components/AddWorkModal';
import { AddPaymentModal } from './components/AddPaymentModal';
import { Notification } from './components/Notification';
import { Reports } from './components/Reports';
import { PaymentsTab } from './components/PaymentsTab';

const App: React.FC = () => {
    const [employers, setEmployers] = useLocalStorage<Employer[]>('employers', []);
    const [workEntries, setWorkEntries] = useLocalStorage<WorkEntry[]>('workEntries', []);
    const [payments, setPayments] = useLocalStorage<Payment[]>('payments', []);

    const [activeTab, setActiveTab] = useState<'dashboard' | 'employers' | 'worklog' | 'payments'>('dashboard');
    const [isEmployerModalOpen, setEmployerModalOpen] = useState(false);
    const [isWorkModalOpen, setWorkModalOpen] = useState(false);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    
    const [editingEmployer, setEditingEmployer] = useState<Employer | null>(null);
    const [editingWorkEntry, setEditingWorkEntry] = useState<WorkEntry | null>(null);
    const [payingWorkEntry, setPayingWorkEntry] = useState<WorkEntry | null>(null);

    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };
    
    const handleAddOrUpdateEmployer = (employer: Omit<Employer, 'id'> | Employer) => {
        if ('id' in employer) {
            setEmployers(prev => prev.map(e => e.id === employer.id ? employer : e));
            showNotification('Employer updated successfully!');
        } else {
            setEmployers(prev => [...prev, { ...employer, id: Date.now().toString() }]);
            showNotification('Employer added successfully!');
        }
        setEmployerModalOpen(false);
        setEditingEmployer(null);
    };

    const handleDeleteEmployer = (id: string) => {
        if (window.confirm('Are you sure you want to delete this employer and all related work/payments?')) {
            setEmployers(prev => prev.filter(e => e.id !== id));
            const relatedWork = workEntries.filter(w => w.employerId === id);
            const relatedWorkIds = relatedWork.map(w => w.id);
            setWorkEntries(prev => prev.filter(w => w.employerId !== id));
            setPayments(prev => prev.filter(p => !relatedWorkIds.includes(p.workEntryId)));
            showNotification('Employer deleted.', 'error');
        }
    };
    
    const handleAddOrUpdateWorkEntry = (workEntry: Omit<WorkEntry, 'id' | 'status'> | WorkEntry) => {
        if ('id' in workEntry) {
            setWorkEntries(prev => prev.map(w => w.id === workEntry.id ? workEntry : w));
             showNotification('Work entry updated successfully!');
        } else {
            const newEntry: WorkEntry = {
                ...workEntry,
                id: Date.now().toString(),
                status: WorkStatus.Pending,
            };
            setWorkEntries(prev => [...prev, newEntry]);
            showNotification('Work entry added successfully!');
        }
        setWorkModalOpen(false);
        setEditingWorkEntry(null);
    };

    const handleDeleteWorkEntry = (id: string) => {
        if (window.confirm('Are you sure you want to delete this work entry and all related payments?')) {
            setWorkEntries(prev => prev.filter(w => w.id !== id));
            setPayments(prev => prev.filter(p => p.workEntryId !== id));
            showNotification('Work entry deleted.', 'error');
        }
    };
    
    const handleAddPayment = (payment: Omit<Payment, 'id'>) => {
        const newPayment = { ...payment, id: Date.now().toString() };
        const allPayments = [...payments, newPayment];
        setPayments(allPayments);
        
        const workEntry = workEntries.find(w => w.id === payment.workEntryId);
        if (workEntry) {
            const totalAmountDue = workEntry.rateType === 'hourly' ? (workEntry.hours ?? 0) * workEntry.rate : workEntry.rate;
            const paymentsForWork = allPayments.filter(p => p.workEntryId === workEntry.id);
            const totalPaid = paymentsForWork.reduce((sum, p) => sum + p.amount, 0);

            let newStatus = WorkStatus.PartiallyPaid;
            if (totalPaid >= totalAmountDue) {
                newStatus = WorkStatus.Paid;
            }

            setWorkEntries(prev => prev.map(w => w.id === workEntry.id ? { ...w, status: newStatus } : w));
        }
        showNotification('Payment added successfully!');
        setPaymentModalOpen(false);
        setPayingWorkEntry(null);
    };
    
    const handleFifoPayment = useCallback(({ employerId, amount, date }: { employerId: string; amount: number; date: string }) => {
        let paymentAmountToApply = amount;

        const unpaidWorkEntries = workEntries
            .filter(w => w.employerId === employerId && w.status !== WorkStatus.Paid)
            .sort((a, b) => new Date(`${a.date}T00:00:00`).getTime() - new Date(`${b.date}T00:00:00`).getTime());

        const newPayments: Omit<Payment, 'id'>[] = [];
        const workEntryStatusUpdates = new Map<string, WorkStatus>();

        for (const entry of unpaidWorkEntries) {
            if (paymentAmountToApply <= 0) break;

            const totalDue = entry.rateType === 'hourly' ? (entry.hours ?? 0) * entry.rate : entry.rate;
            const totalPaid = payments
                .filter(p => p.workEntryId === entry.id)
                .reduce((sum, p) => sum + p.amount, 0);
            
            const outstandingBalance = totalDue - totalPaid;

            if (outstandingBalance > 0) {
                const paymentForThisEntry = Math.min(paymentAmountToApply, outstandingBalance);

                newPayments.push({
                    workEntryId: entry.id,
                    amount: paymentForThisEntry,
                    date: date,
                });

                const newTotalPaid = totalPaid + paymentForThisEntry;
                const newStatus = newTotalPaid >= totalDue ? WorkStatus.Paid : WorkStatus.PartiallyPaid;
                workEntryStatusUpdates.set(entry.id, newStatus);

                paymentAmountToApply -= paymentForThisEntry;
            }
        }
        
        if (newPayments.length === 0) {
            showNotification('No outstanding work entries found for this employer.', 'error');
            return;
        }
        
        const createdPayments = newPayments.map(p => ({ ...p, id: `${Date.now()}-${Math.random()}` }));
        setPayments(prev => [...prev, ...createdPayments]);

        setWorkEntries(prev => prev.map(w => {
            if (workEntryStatusUpdates.has(w.id)) {
                return { ...w, status: workEntryStatusUpdates.get(w.id)! };
            }
            return w;
        }));
        
        showNotification(`${currencyFormatter.format(amount - paymentAmountToApply)} payment applied successfully!`);
    }, [workEntries, payments, setPayments, setWorkEntries, currencyFormatter]);


    const openEditEmployerModal = (employer: Employer) => {
        setEditingEmployer(employer);
        setEmployerModalOpen(true);
    };

    const openEditWorkModal = (workEntry: WorkEntry) => {
        setEditingWorkEntry(workEntry);
        setWorkModalOpen(true);
    };

    const openPaymentModal = (workEntry: WorkEntry) => {
        setPayingWorkEntry(workEntry);
        setPaymentModalOpen(true);
    };

    const stats = useMemo(() => {
        let totalPending = 0;
        let totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

        workEntries.forEach(w => {
            const amountDue = w.rateType === 'hourly' ? (w.hours ?? 0) * w.rate : w.rate;
            const paidForThisWork = payments.filter(p => p.workEntryId === w.id).reduce((sum, p) => sum + p.amount, 0);
            
            if (w.status !== WorkStatus.Paid) {
                totalPending += (amountDue - paidForThisWork);
            }
        });

        const overdueEntries = workEntries.filter(w => {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return w.status !== WorkStatus.Paid && new Date(`${w.date}T00:00:00`) < thirtyDaysAgo;
        }).length;
        
        return { totalPending, totalPaid, overdueEntries };
    }, [workEntries, payments]);

    const employerPendingAmounts = useMemo(() => {
        const amounts = new Map<string, number>();
        employers.forEach(employer => {
            let totalPendingForEmployer = 0;
            const employerWorkEntries = workEntries.filter(w => w.employerId === employer.id && w.status !== WorkStatus.Paid);
            
            employerWorkEntries.forEach(w => {
                const amountDue = w.rateType === 'hourly' ? (w.hours ?? 0) * w.rate : w.rate;
                const paidForThisWork = payments.filter(p => p.workEntryId === w.id).reduce((sum, p) => sum + p.amount, 0);
                totalPendingForEmployer += (amountDue - paidForThisWork);
            });
            amounts.set(employer.id, totalPendingForEmployer);
        });
        return amounts;
    }, [employers, workEntries, payments]);
    
    const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result;
                    if (typeof text !== 'string') throw new Error("File is not readable");
                    const data = JSON.parse(text);
                    if (data.employers && data.workEntries && data.payments) {
                        setEmployers(data.employers);
                        setWorkEntries(data.workEntries);
                        setPayments(data.payments);
                        showNotification('Data imported successfully!');
                    } else {
                        throw new Error('Invalid data format');
                    }
                } catch (error) {
                    showNotification('Failed to import data. Please check file format.', 'error');
                }
            };
            reader.readAsText(file);
        }
    }, [setEmployers, setWorkEntries, setPayments]);
    
    const handleExport = useCallback(() => {
        const data = JSON.stringify({ employers, workEntries, payments }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `paytracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Data exported successfully!');
    }, [employers, workEntries, payments]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
            <Header onExport={handleExport} onImport={handleImport} />
            
            <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                <StatsCards stats={stats} />

                <div className="mt-8">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button onClick={() => setActiveTab('dashboard')} className={`${activeTab === 'dashboard' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                Dashboard
                            </button>
                            <button onClick={() => setActiveTab('employers')} className={`${activeTab === 'employers' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                Employers
                            </button>
                            <button onClick={() => setActiveTab('worklog')} className={`${activeTab === 'worklog' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                Work Log
                            </button>
                             <button onClick={() => setActiveTab('payments')} className={`${activeTab === 'payments' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                Payments
                            </button>
                        </nav>
                    </div>
                </div>

                <div className="mt-6">
                    {activeTab === 'dashboard' && <Reports workEntries={workEntries} payments={payments} employers={employers} />}
                    {activeTab === 'employers' && (
                        <EmployerList
                            employers={employers}
                            onAdd={() => { setEditingEmployer(null); setEmployerModalOpen(true); }}
                            onEdit={openEditEmployerModal}
                            onDelete={handleDeleteEmployer}
                            pendingAmounts={employerPendingAmounts}
                        />
                    )}
                    {activeTab === 'worklog' && (
                        <WorkLog
                            workEntries={workEntries}
                            employers={employers}
                            payments={payments}
                            onAdd={() => { setEditingWorkEntry(null); setWorkModalOpen(true); }}
                            onEdit={openEditWorkModal}
                            onDelete={handleDeleteWorkEntry}
                            onAddPayment={openPaymentModal}
                        />
                    )}
                    {activeTab === 'payments' && (
                        <PaymentsTab
                            employers={employers}
                            payments={payments}
                            workEntries={workEntries}
                            onAddPayment={handleFifoPayment}
                            pendingAmounts={employerPendingAmounts}
                        />
                    )}
                </div>

            </main>

            {isEmployerModalOpen && (
                <AddEmployerModal
                    isOpen={isEmployerModalOpen}
                    onClose={() => { setEmployerModalOpen(false); setEditingEmployer(null); }}
                    onSave={handleAddOrUpdateEmployer}
                    existingEmployer={editingEmployer}
                />
            )}
            
            {isWorkModalOpen && (
                 <AddWorkModal
                    isOpen={isWorkModalOpen}
                    onClose={() => { setWorkModalOpen(false); setEditingWorkEntry(null); }}
                    onSave={handleAddOrUpdateWorkEntry}
                    existingWorkEntry={editingWorkEntry}
                    employers={employers}
                />
            )}

            {isPaymentModalOpen && payingWorkEntry && (
                <AddPaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => { setPaymentModalOpen(false); setPayingWorkEntry(null); }}
                    onSave={handleAddPayment}
                    workEntry={payingWorkEntry}
                    payments={payments}
                />
            )}
            
            {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}

        </div>
    );
};

export default App;
