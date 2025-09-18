
import React, { useState, useEffect } from 'react';
import type { WorkEntry, Employer } from '../types';
import { RateType } from '../types';
import { Modal } from './Modal';

interface AddWorkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (workEntry: Omit<WorkEntry, 'id' | 'status'> | WorkEntry) => void;
    existingWorkEntry: WorkEntry | null;
    employers: Employer[];
}

export const AddWorkModal: React.FC<AddWorkModalProps> = ({ isOpen, onClose, onSave, existingWorkEntry, employers }) => {
    const [employerId, setEmployerId] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [rate, setRate] = useState(0);
    const [rateType, setRateType] = useState<RateType>(RateType.Hourly);
    const [hours, setHours] = useState<number | undefined>(undefined);

    useEffect(() => {
        if (existingWorkEntry) {
            setEmployerId(existingWorkEntry.employerId);
            setDescription(existingWorkEntry.description);
            setDate(existingWorkEntry.date); // Fix: Use the date string directly to avoid timezone shift
            setRate(existingWorkEntry.rate);
            setRateType(existingWorkEntry.rateType);
            setHours(existingWorkEntry.hours);
        } else if (employers.length > 0) {
            setEmployerId(employers[0].id);
            setDescription('');
            setDate(new Date().toISOString().split('T')[0]);
            setRate(0);
            setRateType(RateType.Hourly);
            setHours(undefined);
        }
    }, [existingWorkEntry, employers, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!employerId || !description || rate <= 0 || (rateType === RateType.Hourly && (hours === undefined || hours <= 0))) {
            alert('Please fill all required fields correctly. Rate and hours must be positive.');
            return;
        }
        
        const workData = { employerId, description, date, rate, rateType, hours: rateType === RateType.Hourly ? hours : undefined };
        
        if (existingWorkEntry) {
            onSave({ ...existingWorkEntry, ...workData });
        } else {
            onSave(workData);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={existingWorkEntry ? 'Edit Work Entry' : 'Add Work Entry'}>
             <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="employer" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Employer</label>
                        <select id="employer" value={employerId} onChange={e => setEmployerId(e.target.value)} required className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            {employers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} required rows={3} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                     <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="rateType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rate Type</label>
                            <select id="rateType" value={rateType} onChange={e => setRateType(e.target.value as RateType)} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                <option value={RateType.Hourly}>Hourly</option>
                                <option value={RateType.Fixed}>Fixed</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{rateType === RateType.Hourly ? 'Rate ($/hr)' : 'Rate ($)'}</label>
                            <input type="number" id="rate" value={rate} onChange={e => setRate(parseFloat(e.target.value))} required min="0.01" step="0.01" className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                        {rateType === RateType.Hourly && (
                            <div>
                                <label htmlFor="hours" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hours</label>
                                <input type="number" id="hours" value={hours || ''} onChange={e => setHours(parseFloat(e.target.value))} required min="0.01" step="0.01" className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                            </div>
                        )}
                    </div>
                    <div>
                         <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                         <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                </div>
                 <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                    <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm">
                        Save
                    </button>
                    <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">
                        Cancel
                    </button>
                </div>
            </form>
        </Modal>
    );
};
