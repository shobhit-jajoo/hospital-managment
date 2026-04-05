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

export const markBillAsPaid = (
  billId: string,
  paymentMode: Bill['paymentMode'],
  gstRate: number,
): void => {
  const data = getData();
  const bill = data.bills.find(b => b.id === billId);
  if (!bill) return;

  const gstAmount = Number((bill.amount * gstRate).toFixed(2));
  const totalAmount = Number((bill.amount + gstAmount).toFixed(2));

  updateInCollection('bills', billId, {
    status: 'paid',
    paymentMode,
    gstRate,
    gstAmount,
    totalAmount,
    paidAt: new Date().toISOString(),
  });
};

export const getPatientBills = (patientId: string): Bill[] => {
  return getData().bills.filter(b => b.patientId === patientId);
};
