import { getData, addToCollection, updateInCollection, type Appointment } from './localStorageService';
import { isWithinOneHour } from '@/utils/timeUtils';
import { generateId } from '@/utils/idGenerator';

export const checkDoctorAvailability = (doctorId: string, date: string, time: string): boolean => {
  const data = getData();
  const doctorAppts = data.appointments.filter(
    a => a.doctorId === doctorId && a.date === date && a.status !== 'cancelled'
  );
  return !doctorAppts.some(a => isWithinOneHour(a.time, time));
};

export const bookAppointment = (appt: Omit<Appointment, 'id' | 'status'>): Appointment | null => {
  if (!checkDoctorAvailability(appt.doctorId, appt.date, appt.time)) {
    return null;
  }
  const newAppt: Appointment = { ...appt, id: generateId(), status: 'booked' };
  addToCollection('appointments', newAppt);
  return newAppt;
};

export const updateAppointmentStatus = (id: string, status: Appointment['status']): void => {
  updateInCollection('appointments', id, { status });
};

export const getDoctorAppointments = (doctorId: string): Appointment[] => {
  return getData().appointments.filter(a => a.doctorId === doctorId);
};

export const getPatientAppointments = (patientId: string): Appointment[] => {
  return getData().appointments.filter(a => a.patientId === patientId);
};

export const getHospitalAppointments = (hospitalId: string): Appointment[] => {
  return getData().appointments.filter(a => a.hospitalId === hospitalId);
};
