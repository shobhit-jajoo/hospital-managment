export interface Hospital {
  id: string;
  name: string;
  email: string;
  password: string;
  address: string;
  phone: string;
  role: 'hospital';
}

export interface Department {
  id: string;
  hospitalId: string;
  name: string;
}

export interface Doctor {
  id: string;
  hospitalId: string;
  departmentId: string;
  name: string;
  email: string;
  password: string;
  specialization: string;
  role: 'doctor';
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  age: number;
  gender: string;
  role: 'patient';
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  departmentId: string;
  date: string;
  time: string;
  status: 'booked' | 'completed' | 'cancelled';
  notes: string;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  medications: string;
  diagnosis: string;
  notes: string;
  date: string;
}

export interface Bill {
  id: string;
  appointmentId: string;
  patientId: string;
  amount: number;
  status: 'paid' | 'unpaid';
  date: string;
}

export interface AppData {
  hospitals: Hospital[];
  departments: Department[];
  doctors: Doctor[];
  patients: Patient[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  bills: Bill[];
}

const STORAGE_KEY = 'hms_data';

const initialData: AppData = {
  hospitals: [
    { id: 'h1', name: 'City General Hospital', email: 'city@hospital.com', password: 'password123', address: '123 Main St', phone: '555-0101', role: 'hospital' },
    { id: 'h2', name: 'Sunrise Medical Center', email: 'sunrise@hospital.com', password: 'password123', address: '456 Oak Ave', phone: '555-0102', role: 'hospital' },
    { id: 'h3', name: 'Green Valley Hospital', email: 'green@hospital.com', password: 'password123', address: '789 Pine Rd', phone: '555-0103', role: 'hospital' },
  ],
  departments: [
    { id: 'd1', hospitalId: 'h1', name: 'Cardiology' },
    { id: 'd2', hospitalId: 'h1', name: 'Neurology' },
    { id: 'd3', hospitalId: 'h1', name: 'Orthopedics' },
    { id: 'd4', hospitalId: 'h2', name: 'Pediatrics' },
    { id: 'd5', hospitalId: 'h2', name: 'Dermatology' },
    { id: 'd6', hospitalId: 'h3', name: 'Oncology' },
    { id: 'd7', hospitalId: 'h3', name: 'General Medicine' },
  ],
  doctors: [
  { id: 'doc1', hospitalId: 'h1', departmentId: 'd1', name: 'Dr. Arjun Mehta', email: 'arjun.mehta@doctor.in', password: 'arjun123', specialization: 'Cardiologist', role: 'doctor' },
  { id: 'doc2', hospitalId: 'h1', departmentId: 'd2', name: 'Dr. Priya Sharma', email: 'priya.sharma@doctor.in', password: 'priya123', specialization: 'Neurologist', role: 'doctor' },
  { id: 'doc3', hospitalId: 'h2', departmentId: 'd4', name: 'Dr. Rahul Verma', email: 'rahul.verma@doctor.in', password: 'rahul123', specialization: 'Pediatrician', role: 'doctor' },
  { id: 'doc4', hospitalId: 'h2', departmentId: 'd5', name: 'Dr. Sneha Iyer', email: 'sneha.iyer@doctor.in', password: 'sneha123', specialization: 'Dermatologist', role: 'doctor' },
  { id: 'doc5', hospitalId: 'h3', departmentId: 'd6', name: 'Dr. Karan Singh', email: 'karan.singh@doctor.in', password: 'karan123', specialization: 'Oncologist', role: 'doctor' },
  { id: 'doc6', hospitalId: 'h3', departmentId: 'd7', name: 'Dr. Ananya Reddy', email: 'ananya.reddy@doctor.in', password: 'ananya123', specialization: 'General Physician', role: 'doctor' },
],

patients: [
  {
    id: 'p1',
    name: 'Rohit Kumar',
    email: 'rohit.kumar@gmail.com',
    password: 'rohit123',
    phone: '9876543210',
    age: 28,
    gender: 'Male',
    role: 'patient'
  },
  {
    id: 'p2',
    name: 'Aditi Sharma',
    email: 'aditi.sharma@gmail.com',
    password: 'aditi123',
    phone: '9123456780',
    age: 24,
    gender: 'Female',
    role: 'patient'
  }
],
  appointments: [],
  prescriptions: [],
  bills: [],
};

export const getData = (): AppData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(stored);
};

export const setData = (data: AppData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const updateCollection = <K extends keyof AppData>(key: K, items: AppData[K]): void => {
  const data = getData();
  data[key] = items;
  setData(data);
};

export const addToCollection = <K extends keyof AppData>(key: K, item: AppData[K][number]): void => {
  const data = getData();
  (data[key] as any[]).push(item);
  setData(data);
};

export const updateInCollection = <K extends keyof AppData>(key: K, id: string, updates: Partial<AppData[K][number]>): void => {
  const data = getData();
  const idx = (data[key] as any[]).findIndex((i: any) => i.id === id);
  if (idx !== -1) {
    (data[key] as any[])[idx] = { ...(data[key] as any[])[idx], ...updates };
    setData(data);
  }
};
