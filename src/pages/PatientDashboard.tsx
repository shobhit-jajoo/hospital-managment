import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useNavigate } from 'react-router-dom';
import { bookAppointment } from '@/services/appointmentService';
import { generateBill, markBillAsPaid } from '@/services/billingService';
import { formatDate, formatTime } from '@/utils/timeUtils';
import type { Patient } from '@/services/localStorageService';

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const { data, refresh } = useData();
  const navigate = useNavigate();
  const patient = user as Patient;

  const [tab, setTab] = useState<'hospitals' | 'appointments' | 'prescriptions' | 'bills'>('hospitals');
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [bookingMsg, setBookingMsg] = useState('');

  const myAppts = data.appointments.filter(a => a.patientId === patient.id);
  const myRxs = data.prescriptions.filter(p => p.patientId === patient.id);
  const myBills = data.bills.filter(b => b.patientId === patient.id);

  const filteredDepts = data.departments.filter(d => d.hospitalId === selectedHospital);
  const filteredDoctors = data.doctors.filter(d => d.hospitalId === selectedHospital && (!selectedDept || d.departmentId === selectedDept));

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingMsg('');
    if (!selectedDoctor || !apptDate || !apptTime) return;
    const doctor = data.doctors.find(d => d.id === selectedDoctor);
    if (!doctor) return;
    const appt = bookAppointment({
      patientId: patient.id,
      doctorId: selectedDoctor,
      hospitalId: doctor.hospitalId,
      departmentId: doctor.departmentId,
      date: apptDate,
      time: apptTime,
      notes: '',
    });
    if (appt) {
      generateBill(appt.id, patient.id, 500);
      refresh();
      setBookingMsg('Appointment booked successfully!');
      setSelectedDoctor(''); setApptDate(''); setApptTime('');
    } else {
      setBookingMsg('Doctor is not available at this time (conflict within ±1 hour). Please choose another slot.');
    }
  };

  const handlePayBill = (billId: string) => {
    markBillAsPaid(billId);
    refresh();
  };

  const handleLogout = () => { logout(); navigate('/login'); };
  const tabClass = (t: string) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Welcome, {patient.name}</h1>
          <p className="text-sm text-muted-foreground">Patient Dashboard</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-muted-foreground hover:text-foreground transition">Logout</button>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setTab('hospitals')} className={tabClass('hospitals')}>Book Appointment</button>
          <button onClick={() => setTab('appointments')} className={tabClass('appointments')}>My Appointments</button>
          <button onClick={() => setTab('prescriptions')} className={tabClass('prescriptions')}>Prescriptions</button>
          <button onClick={() => setTab('bills')} className={tabClass('bills')}>Bills</button>
        </div>

        {tab === 'hospitals' && (
          <div className="space-y-6">
            <form onSubmit={handleBook} className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-foreground">Book an Appointment</h3>
              {bookingMsg && (
                <p className={`text-sm p-3 rounded-lg ${bookingMsg.includes('success') ? 'bg-accent text-accent-foreground' : 'bg-destructive/10 text-destructive'}`}>
                  {bookingMsg}
                </p>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Select Hospital</label>
                <select value={selectedHospital} onChange={e => { setSelectedHospital(e.target.value); setSelectedDept(''); setSelectedDoctor(''); }} required
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Choose a hospital</option>
                  {data.hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              {selectedHospital && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Select Department</label>
                  <select value={selectedDept} onChange={e => { setSelectedDept(e.target.value); setSelectedDoctor(''); }}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">All departments</option>
                    {filteredDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
              {selectedHospital && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Select Doctor</label>
                  <select value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)} required
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Choose a doctor</option>
                    {filteredDoctors.map(d => <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Date</label>
                  <input type="date" value={apptDate} onChange={e => setApptDate(e.target.value)} required
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Time</label>
                  <input type="time" value={apptTime} onChange={e => setApptTime(e.target.value)} required
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <button type="submit" className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition">Book Appointment</button>
            </form>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Available Hospitals</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {data.hospitals.map(h => (
                  <div key={h.id} className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary transition"
                    onClick={() => { setSelectedHospital(h.id); setSelectedDept(''); setSelectedDoctor(''); }}>
                    <p className="font-medium text-foreground">{h.name}</p>
                    <p className="text-sm text-muted-foreground">{h.address}</p>
                    <p className="text-xs text-muted-foreground mt-1">{h.phone}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'appointments' && (
          <div className="space-y-3">
            {myAppts.length === 0 && <p className="text-muted-foreground text-center py-12">No appointments yet</p>}
            {myAppts.map(appt => {
              const doctor = data.doctors.find(d => d.id === appt.doctorId);
              const hospital = data.hospitals.find(h => h.id === appt.hospitalId);
              return (
                <div key={appt.id} className="bg-card border border-border rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-foreground">{doctor?.name}</p>
                    <p className="text-sm text-muted-foreground">{hospital?.name} · {formatDate(appt.date)} · {formatTime(appt.time)}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    appt.status === 'completed' ? 'bg-accent text-accent-foreground' :
                    appt.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                    'bg-muted text-muted-foreground'
                  }`}>{appt.status}</span>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'prescriptions' && (
          <div className="space-y-3">
            {myRxs.length === 0 && <p className="text-muted-foreground text-center py-12">No prescriptions yet</p>}
            {myRxs.map(rx => {
              const doctor = data.doctors.find(d => d.id === rx.doctorId);
              return (
                <div key={rx.id} className="bg-card border border-border rounded-xl p-5 space-y-2">
                  <div className="flex justify-between">
                    <p className="font-medium text-foreground">{rx.diagnosis}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(rx.date)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">By: {doctor?.name}</p>
                  <p className="text-sm text-foreground"><span className="font-medium">Medications:</span> {rx.medications}</p>
                  {rx.notes && <p className="text-sm text-muted-foreground">{rx.notes}</p>}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'bills' && (
          <div className="space-y-3">
            {myBills.length === 0 && <p className="text-muted-foreground text-center py-12">No bills yet</p>}
            {myBills.map(bill => (
              <div key={bill.id} className="bg-card border border-border rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-foreground">${bill.amount}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(bill.date)}</p>
                </div>
                {bill.status === 'unpaid' ? (
                  <button onClick={() => handlePayBill(bill.id)}
                    className="text-xs bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:opacity-80 transition">Pay Now</button>
                ) : (
                  <span className="text-xs bg-accent text-accent-foreground px-3 py-1 rounded-full">Paid</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
