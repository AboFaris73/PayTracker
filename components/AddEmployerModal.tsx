
import React, { useState, useEffect } from 'react';
import type { Employer } from '../types';
import { Modal } from './Modal';

interface AddEmployerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (employer: Omit<Employer, 'id'> | Employer) => void;
    existingEmployer: Employer | null;
}

export const AddEmployerModal: React.FC<AddEmployerModalProps> = ({ isOpen, onClose, onSave, existingEmployer }) => {
    const [name, setName] = useState('');
    const [contact, setContact] = useState('');

    useEffect(() => {
        if (existingEmployer) {
            setName(existingEmployer.name);
            setContact(existingEmployer.contact || '');
        } else {
            setName('');
            setContact('');
        }
    }, [existingEmployer, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            alert("Employer name is required.");
            return;
        }
        const employerData = { name, contact };
        if (existingEmployer) {
            onSave({ ...employerData, id: existingEmployer.id });
        } else {
            onSave(employerData);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={existingEmployer ? 'Edit Employer' : 'Add Employer'}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Employer Name</label>
                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                        <label htmlFor="contact" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact (Optional)</label>
                        <input type="text" id="contact" value={contact} onChange={e => setContact(e.target.value)} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
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
