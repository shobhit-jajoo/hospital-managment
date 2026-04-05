import React, { useMemo, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useNavigate } from 'react-router-dom';
import { bookAppointment } from '@/services/appointmentService';
import { generateBill, markBillAsPaid } from '@/services/billingService';
import { formatDate, formatTime, getTodayDate } from '@/utils/timeUtils';
import type { Patient } from '@/services/localStorageService';
import { Activity, Building2, CalendarClock, ClipboardList, Clock3, FileText, Receipt, Sparkles, Wallet } from 'lucide-react';

const GST_RATE = 0.18;

const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const { data, refresh } = useData();
  const navigate = useNavigate();
  const patient = user as Patient;

  const [tab, setTab] = useState<'hospitals' | 'appointments' | 'prescriptions' | 'reports' | 'bills' | 'receipts'>('hospitals');
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [bookingMsg, setBookingMsg] = useState('');
  const [pendingPaymentBillId, setPendingPaymentBillId] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'online' | 'upi' | 'card'>('online');
  const [selectedReceiptBillId, setSelectedReceiptBillId] = useState<string | null>(null);
  const [activeHospitalCardId, setActiveHospitalCardId] = useState<string | null>(null);

  const bookingFormRef = useRef<HTMLFormElement | null>(null);

  const tabs = [
    { id: 'hospitals', label: 'Book Appointment', icon: Building2 },
    { id: 'appointments', label: 'My Appointments', icon: CalendarClock },
    { id: 'prescriptions', label: 'Prescriptions', icon: ClipboardList },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'bills', label: 'Bills', icon: Wallet },
    { id: 'receipts', label: 'Receipts', icon: Receipt },
  ] as const;

  const currentTabIndex = tabs.findIndex(t => t.id === tab);

  const myAppts = data.appointments.filter(a => a.patientId === patient.id);
  const myRxs = data.prescriptions.filter(p => p.patientId === patient.id);
  const myReports = data.medicalReports.filter(r => r.patientId === patient.id);
  const myBills = data.bills.filter(b => b.patientId === patient.id);
  const paidBills = myBills.filter(b => b.status === 'paid');
  const today = getTodayDate();

  const upcomingAppointmentsCount = myAppts.filter(a => a.status === 'booked' && a.date >= today).length;
  const pendingReportsCount = myAppts.filter(a => a.status === 'completed' && !myReports.some(r => r.appointmentId === a.id)).length;

  const dailyTip = useMemo(() => {
    const tips = [
      'Drink enough water through the day to support circulation and recovery.',
      'A 20-minute walk can significantly improve cardiovascular health.',
      'Keep a consistent sleep schedule to strengthen your immune system.',
      'Choose lighter evening meals for better digestion and restful sleep.',
      'Practice 5 minutes of deep breathing to reduce stress and blood pressure.',
    ];
    return tips[new Date(today).getDate() % tips.length];
  }, [today]);

  const recentActivity = [...myAppts]
    .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
    .slice(0, 2);

  const filteredDepts = data.departments.filter(d => d.hospitalId === selectedHospital);
  const filteredDoctors = data.doctors.filter(d => d.hospitalId === selectedHospital && (!selectedDept || d.departmentId === selectedDept));
  const pendingBill = pendingPaymentBillId ? myBills.find(b => b.id === pendingPaymentBillId) : null;
  const pendingBillGst = pendingBill ? Number((pendingBill.amount * GST_RATE).toFixed(2)) : 0;
  const pendingBillTotal = pendingBill ? Number((pendingBill.amount + pendingBillGst).toFixed(2)) : 0;

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

  const handlePayBill = () => {
    if (!pendingPaymentBillId) return;
    markBillAsPaid(pendingPaymentBillId, paymentMode, GST_RATE);
    refresh();
    setSelectedReceiptBillId(pendingPaymentBillId);
    setPendingPaymentBillId(null);
    setTab('receipts');
  };

  const navigateWithTransition = (path: string) => {
    const root = document.getElementById('root');
    if (!root) return navigate(path);

    root.classList.add('page-exit');
    setTimeout(() => {
      navigate(path);
      requestAnimationFrame(() => root.classList.remove('page-exit'));
    }, 280);
  };

  const handleLogout = () => {
    logout();
    navigateWithTransition('/login');
  };

  const handleHospitalCardSelect = (hospitalId: string) => {
    setSelectedHospital(hospitalId);
    setSelectedDept('');
    setSelectedDoctor('');
    setActiveHospitalCardId(hospitalId);
    setTimeout(() => setActiveHospitalCardId(null), 750);

    requestAnimationFrame(() => {
      bookingFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const tabClass = (t: string) =>
    `relative z-10 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${
      tab === t ? 'text-white' : 'text-slate-600 hover:text-slate-900'
    }`;

  return (
    <div className="medical-bg app-shell min-h-screen bg-slate-50">
      <header className="premium-glass sticky top-0 z-20 flex items-center justify-between border-b border-white/80 px-6 py-4">
        <div>
          <h1 className="stagger-item text-xl font-bold text-slate-900" style={{ ['--delay' as string]: '20ms' }}>Welcome, {patient.name}</h1>
          <p className="stagger-item text-sm text-slate-500" style={{ ['--delay' as string]: '110ms' }}>Patient Dashboard</p>
        </div>
        <button onClick={handleLogout} className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:text-slate-900">Logout</button>
      </header>

      <div className="mx-auto max-w-6xl p-6">
        <div className="stagger-item premium-glass relative z-30 mb-6 flex flex-wrap items-center gap-1 rounded-2xl p-1.5" style={{ ['--delay' as string]: '180ms' }}>
          <div
            className="pointer-events-none absolute top-1.5 h-[calc(100%-12px)] rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 shadow-lg shadow-cyan-600/30 transition-all duration-300"
            style={{
              width: `${100 / tabs.length}%`,
              transform: `translateX(${currentTabIndex * 100}%)`,
            }}
          />
          {tabs.map(tabItem => (
            <button key={tabItem.id} onClick={() => setTab(tabItem.id)} className={`${tabClass(tabItem.id)} flex-1 justify-center`}>
              <tabItem.icon className="h-4 w-4" />
              <span className="hidden lg:inline">{tabItem.label}</span>
              <span className="lg:hidden">{tabItem.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {tab === 'hospitals' && (
          <div className="tab-panel grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              <form ref={bookingFormRef} onSubmit={handleBook} className="stagger-item premium-glass relative z-10 scroll-mt-36 space-y-4 rounded-3xl p-6" style={{ ['--delay' as string]: '70ms' }}>
                <h3 className="font-semibold text-slate-900">Book an Appointment</h3>
                {bookingMsg && (
                  <p className={`rounded-xl p-3 text-sm ${bookingMsg.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {bookingMsg}
                  </p>
                )}

                <div className={`floating-field floating-select ${selectedHospital ? 'has-value' : ''}`}>
                  <select value={selectedHospital} onChange={e => { setSelectedHospital(e.target.value); setSelectedDept(''); setSelectedDoctor(''); }} required className="premium-input">
                    <option value="" disabled>Choose a hospital</option>
                    {data.hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                  <label>Select Hospital</label>
                </div>

                <div className={`cascade-block ${selectedHospital ? 'open' : ''}`}>
                  <div className={`floating-field floating-select ${selectedDept ? 'has-value' : ''}`}>
                    <select value={selectedDept} onChange={e => { setSelectedDept(e.target.value); setSelectedDoctor(''); }} className="premium-input" required={Boolean(selectedHospital)}>
                      <option value="" disabled>Choose department</option>
                      {filteredDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <label>Select Department</label>
                  </div>
                </div>

                <div className={`cascade-block ${selectedDept ? 'open' : ''}`}>
                  <div className="space-y-4 pt-4">
                    <div className={`floating-field floating-select ${selectedDoctor ? 'has-value' : ''}`}>
                      <select value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)} required={Boolean(selectedDept)} className="premium-input">
                        <option value="" disabled>Choose a doctor</option>
                        {filteredDoctors.map(d => <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>)}
                      </select>
                      <label>Choose a Doctor</label>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="floating-field">
                        <input type="date" value={apptDate} onChange={e => setApptDate(e.target.value)} required={Boolean(selectedDept)} className="premium-input" placeholder=" " />
                        <label>Date</label>
                      </div>
                      <div className="floating-field">
                        <input type="time" value={apptTime} onChange={e => setApptTime(e.target.value)} required={Boolean(selectedDept)} className="premium-input" placeholder=" " />
                        <label>Time</label>
                      </div>
                    </div>

                    <button type="submit" className="premium-button rounded-xl px-6 py-2.5 font-medium text-white">Book Appointment</button>
                  </div>
                </div>
              </form>

              <div>
                <h3 className="mb-3 text-lg font-semibold text-slate-900">Available Hospitals</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {data.hospitals.map((h, idx) => (
                    <div
                      key={h.id}
                      className={`premium-card stagger-item cursor-pointer p-4 ${activeHospitalCardId === h.id ? 'hospital-flash border-cyan-300' : ''}`}
                      style={{ ['--delay' as string]: `${idx * 90}ms` }}
                      onClick={() => handleHospitalCardSelect(h.id)}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <div className="rounded-lg bg-cyan-50 p-2 text-cyan-700"><Building2 className="h-4 w-4" /></div>
                        <p className="font-semibold text-slate-900">{h.name}</p>
                      </div>
                      <p className="text-sm text-slate-500">{h.address}</p>
                      <p className="mt-1 text-xs text-slate-400">{h.phone}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-4 lg:col-span-4">
              <div className="stagger-item premium-glass rounded-3xl p-5" style={{ ['--delay' as string]: '140ms' }}>
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-lg bg-cyan-50 p-2 text-cyan-700"><Activity className="h-4 w-4" /></div>
                  <h4 className="font-semibold text-slate-900">Quick Stats</h4>
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl border border-cyan-100 bg-white/80 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Upcoming Appointments</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{upcomingAppointmentsCount}</p>
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-white/80 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Pending Reports</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{pendingReportsCount}</p>
                  </div>
                </div>
              </div>

              <div className="stagger-item premium-glass rounded-3xl p-5" style={{ ['--delay' as string]: '220ms' }}>
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-lg bg-violet-50 p-2 text-violet-700"><Sparkles className="h-4 w-4" /></div>
                  <h4 className="font-semibold text-slate-900">Daily Health Tip</h4>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">{dailyTip}</p>

                <div className="mt-4 border-t border-slate-200 pt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Recent Activity</p>
                  {recentActivity.length === 0 && <p className="text-sm text-slate-500">No recent appointments.</p>}
                  {recentActivity.map(item => (
                    <div key={item.id} className="mb-2 flex items-start gap-2 rounded-lg bg-white/80 p-2">
                      <Clock3 className="mt-0.5 h-3.5 w-3.5 text-cyan-700" />
                      <p className="text-xs text-slate-600">{formatDate(item.date)} at {formatTime(item.time)} · {item.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}

        {tab === 'appointments' && (
          <div className="tab-panel space-y-3">
            {myAppts.length === 0 && <p className="py-12 text-center text-slate-500">No appointments yet</p>}
            {myAppts.map((appt, idx) => {
              const doctor = data.doctors.find(d => d.id === appt.doctorId);
              const hospital = data.hospitals.find(h => h.id === appt.hospitalId);
              return (
                  <div key={appt.id} className="premium-card stagger-item flex items-center justify-between p-4" style={{ ['--delay' as string]: `${idx * 80}ms` }}>
                  <div>
                    <p className="font-medium text-slate-900">{doctor?.name}</p>
                    <p className="text-sm text-slate-500">{hospital?.name} · {formatDate(appt.date)} · {formatTime(appt.time)}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    appt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    appt.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>{appt.status}</span>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'prescriptions' && (
          <div className="tab-panel space-y-3">
            {myRxs.length === 0 && <p className="py-12 text-center text-slate-500">No prescriptions yet</p>}
            {myRxs.map((rx, idx) => {
              const doctor = data.doctors.find(d => d.id === rx.doctorId);
              return (
                <div key={rx.id} className="premium-card stagger-item space-y-2 p-5" style={{ ['--delay' as string]: `${idx * 80}ms` }}>
                  <div className="flex justify-between">
                    <p className="font-medium text-slate-900">{rx.diagnosis}</p>
                    <p className="text-xs text-slate-500">{formatDate(rx.date)}</p>
                  </div>
                  <p className="text-sm text-slate-500">By: {doctor?.name}</p>
                  <p className="text-sm text-slate-700"><span className="font-medium">Medications:</span> {rx.medications}</p>
                  {rx.notes && <p className="text-sm text-slate-500">{rx.notes}</p>}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'reports' && (
          <div className="tab-panel space-y-3">
            {myReports.length === 0 && <p className="py-12 text-center text-slate-500">No reports yet</p>}
            {myReports.map((report, idx) => {
              const doctor = data.doctors.find(d => d.id === report.doctorId);
              const hospital = data.hospitals.find(h => h.id === report.hospitalId);
              return (
                <div key={report.id} className="premium-card stagger-item p-5" style={{ ['--delay' as string]: `${idx * 80}ms` }}>
                  <div className="flex justify-between">
                    <p className="font-medium text-slate-900">{hospital?.name}</p>
                    <p className="text-xs text-slate-500">{formatDate(report.date)}</p>
                  </div>
                  <p className="text-sm text-slate-500">Doctor: {doctor?.name}</p>
                  <p className="mt-2 text-sm text-slate-700"><span className="font-medium">Earlier disease:</span> {report.earlyDisease}</p>
                  <p className="text-sm text-slate-700"><span className="font-medium">Treatment done:</span> {report.treatmentDone}</p>
                  {report.remarks && <p className="mt-1 text-sm text-slate-500">{report.remarks}</p>}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'bills' && (
          <div className="tab-panel space-y-3">
            {myBills.length === 0 && <p className="py-12 text-center text-slate-500">No bills yet</p>}
            {myBills.map((bill, idx) => (
              <div key={bill.id} className="premium-card stagger-item flex items-center justify-between p-4" style={{ ['--delay' as string]: `${idx * 80}ms` }}>
                <div>
                  <p className="font-medium text-slate-900">Base: {formatCurrency(bill.amount)}</p>
                  <p className="text-sm text-slate-500">{formatDate(bill.date)}</p>
                  {bill.status === 'paid' && (
                    <p className="mt-1 text-xs text-emerald-700">
                      Paid via {bill.paymentMode?.toUpperCase()} · Total {formatCurrency(bill.totalAmount || bill.amount)}
                    </p>
                  )}
                </div>
                {bill.status === 'unpaid' ? (
                  <button onClick={() => setPendingPaymentBillId(bill.id)}
                    className="premium-button rounded-lg px-4 py-1.5 text-xs text-white">Pay Now</button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedReceiptBillId(bill.id);
                      setTab('receipts');
                    }}
                    className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-700"
                  >
                    View Receipt
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'receipts' && (
          <div className="tab-panel space-y-4">
            {paidBills.length === 0 && <p className="py-12 text-center text-slate-500">No paid bill receipts yet</p>}
            {paidBills.map((bill, idx) => {
              const appointment = data.appointments.find(a => a.id === bill.appointmentId);
              const doctor = data.doctors.find(d => d.id === appointment?.doctorId);
              const hospital = data.hospitals.find(h => h.id === appointment?.hospitalId);
              const isActive = selectedReceiptBillId ? selectedReceiptBillId === bill.id : true;

              if (!isActive) return null;

              return (
                <div key={bill.id} className="premium-card stagger-item rounded-2xl border-cyan-100 p-6" style={{ ['--delay' as string]: `${idx * 70}ms` }}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Hospital Payment Receipt</h3>
                      <p className="text-sm text-slate-500">Receipt ID: {bill.id}</p>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">PAID</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <p><span className="font-medium">Patient:</span> {patient.name}</p>
                    <p><span className="font-medium">Hospital:</span> {hospital?.name || '-'}</p>
                    <p><span className="font-medium">Doctor:</span> {doctor?.name || '-'}</p>
                    <p><span className="font-medium">Bill date:</span> {formatDate(bill.date)}</p>
                    <p><span className="font-medium">Mode:</span> {bill.paymentMode?.toUpperCase()}</p>
                    <p><span className="font-medium">Paid at:</span> {bill.paidAt ? new Date(bill.paidAt).toLocaleString() : '-'}</p>
                  </div>

                  <div className="mt-5 space-y-1 border-t border-dashed border-cyan-200 pt-4 text-sm">
                    <p className="flex justify-between"><span>Consultation Fee</span><span>{formatCurrency(bill.amount)}</span></p>
                    <p className="flex justify-between"><span>GST ({((bill.gstRate ?? GST_RATE) * 100).toFixed(0)}%)</span><span>{formatCurrency(bill.gstAmount ?? bill.amount * GST_RATE)}</span></p>
                    <p className="mt-2 flex justify-between text-base font-bold text-slate-900"><span>Total Paid</span><span>{formatCurrency(bill.totalAmount ?? bill.amount * (1 + GST_RATE))}</span></p>
                  </div>
                </div>
              );
            })}

            {selectedReceiptBillId && (
              <div className="text-center">
                <button onClick={() => setSelectedReceiptBillId(null)} className="text-sm text-primary hover:underline">Show all receipts</button>
              </div>
            )}
          </div>
        )}
      </div>

      {pendingBill && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="premium-glass w-full max-w-md rounded-2xl p-6 animate-payment-pop">
            <h3 className="text-xl font-bold text-slate-900">Payment Splash</h3>
            <p className="mt-1 text-sm text-slate-500">Confirm bill payment with GST and payment mode.</p>

            <div className="mt-4 space-y-1 text-sm">
              <p className="flex justify-between"><span>Base amount</span><span>{formatCurrency(pendingBill.amount)}</span></p>
              <p className="flex justify-between"><span>GST (18%)</span><span>{formatCurrency(pendingBillGst)}</span></p>
              <p className="flex justify-between text-base font-semibold"><span>Total amount</span><span>{formatCurrency(pendingBillTotal)}</span></p>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium mb-2">Select payment mode</p>
              <div className="grid grid-cols-3 gap-2">
                {(['online', 'upi', 'card'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setPaymentMode(mode)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-300 ${paymentMode === mode ? 'border-primary bg-primary text-white' : 'border-sky-100 hover:bg-sky-50'}`}
                  >
                    {mode.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setPendingPaymentBillId(null)} className="rounded-lg border border-sky-100 px-4 py-2 text-sm hover:bg-sky-50">Cancel</button>
              <button onClick={handlePayBill} className="premium-button rounded-lg px-4 py-2 text-sm text-white">Pay {formatCurrency(pendingBillTotal)}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
