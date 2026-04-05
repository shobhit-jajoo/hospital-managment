import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getData, setData, type Hospital, type Doctor, type Patient } from '@/services/localStorageService';
import { generateId } from '@/utils/idGenerator';

type User = (Hospital | Doctor | Patient) | null;

interface AuthContextType {
  user: User;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  registerPatient: (patient: Omit<Patient, 'id' | 'role'>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(null);

  // Load user from local storage when the app first mounts
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hms_currentUser');
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to parse user from local storage:', error);
      localStorage.removeItem('hms_currentUser'); // Clear corrupted data
    }
  }, []);

  const login = async (email: string, password: string): Promise<string | null> => {
    // Simulate a brief network delay (so UI loading states work)
    await new Promise(resolve => setTimeout(resolve, 500));

    const data = getData();
    
    // Safety check: Ensure arrays exist before spreading them
    const all: Array<Hospital | Doctor | Patient> = [
      ...(data.hospitals || []),
      ...(data.doctors || []),
      ...(data.patients || []),
    ];
    
    const found = all.find(u => u.email === email && u.password === password);
    
    if (found) {
      setUser(found);
      localStorage.setItem('hms_currentUser', JSON.stringify(found));
      return found.role;
    }
    
    return null;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hms_currentUser');
  };

  const registerPatient = async (patient: Omit<Patient, 'id' | 'role'>): Promise<boolean> => {
    // Simulate a brief network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const data = getData();
    
    // Initialize patients array if it doesn't exist in local storage yet
    if (!data.patients) data.patients = [];

    // Check if email is already taken
    if (data.patients.some(p => p.email === patient.email)) {
      throw new Error('This email is already registered.');
    }

    const newPatient: Patient = { 
      ...patient, 
      id: generateId(), 
      role: 'patient' 
    };
    
    data.patients.push(newPatient);
    setData(data);
    
    // Automatically log the user in after successful registration
    setUser(newPatient);
    localStorage.setItem('hms_currentUser', JSON.stringify(newPatient));
    
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, registerPatient }}>
      {children}
    </AuthContext.Provider>
  );
};