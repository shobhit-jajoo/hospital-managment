import { addToCollection, getData, updateInCollection, type Bill } from './localStorageService';
import { generateId } from '@/utils/idGenerator';

export const generateBill = (appointmentId: string, patientId: string, amount: number = 500): Bill => {
  const bill: Bill = {
    id: generateId(),
    appointmentId,
    patientId,
    amount,
    status: 'unpaid',
    date: new Date().toISOString().split('T')[0],
  };
  addToCollection('bills', bill);
  return bill;
};

export const markBillAsPaid = (billId: string): void => {
  updateInCollection('bills', billId, { status: 'paid' });
};

export const getPatientBills = (patientId: string): Bill[] => {
  return getData().bills.filter(b => b.patientId === patientId);
};
