import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { getData, addToCollection, type AppData, type Department, type Doctor, type Prescription, type MedicalReport } from '@/services/localStorageService';
import { generateId } from '@/utils/idGenerator';

interface DataContextType {
  data: AppData;
  refresh: () => void;
  addDepartment: (dept: Omit<Department, 'id'>) => void;
  addDoctor: (doc: Omit<Doctor, 'id' | 'role'>) => void;
  addPrescription: (rx: Omit<Prescription, 'id'>) => void;
  addMedicalReport: (report: Omit<MedicalReport, 'id'>) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [data, setLocalData] = useState<AppData>(getData());

  const refresh = useCallback(() => {
    setLocalData(getData());
  }, []);

  const addDepartment = (dept: Omit<Department, 'id'>) => {
    const newDept: Department = { ...dept, id: generateId() };
    addToCollection('departments', newDept);
    refresh();
  };

  const addDoctor = (doc: Omit<Doctor, 'id' | 'role'>) => {
    const newDoc: Doctor = { ...doc, id: generateId(), role: 'doctor' };
    addToCollection('doctors', newDoc);
    refresh();
  };

  const addPrescription = (rx: Omit<Prescription, 'id'>) => {
    const newRx: Prescription = { ...rx, id: generateId() };
    addToCollection('prescriptions', newRx);
    refresh();
  };

  const addMedicalReport = (report: Omit<MedicalReport, 'id'>) => {
    const newReport: MedicalReport = { ...report, id: generateId() };
    addToCollection('medicalReports', newReport);
    refresh();
  };

  return (
    <DataContext.Provider value={{ data, refresh, addDepartment, addDoctor, addPrescription, addMedicalReport }}>
      {children}
    </DataContext.Provider>
  );
};
