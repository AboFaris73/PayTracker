import { useState, Dispatch, SetStateAction } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key “${key}”:`, error);
            return initialValue;
        }
    });

    const setValue: Dispatch<SetStateAction<T>> = (value) => {
        try {
            // By using the setter's functional update form, we ensure we have
            // the latest state value to avoid race conditions or stale state.
            setStoredValue(currentValue => {
                const valueToStore = value instanceof Function ? value(currentValue) : value;
                
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                }
                
                return valueToStore;
            });
        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    };

    return [storedValue, setValue];
}