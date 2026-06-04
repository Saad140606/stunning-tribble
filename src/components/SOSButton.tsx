import React, { useRef, useState } from 'react';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';
import { firestore, isFirebaseConfigured } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

const emergencyTypes = [
  'Gas Leak / گیس لیک',
  'Flooding / سیلاب',
  'Road Collapse / سڑک دھنسنے',
  'Other Emergency / دیگر ایمرجنسی',
];

export function SOSButton({ onCreated }: { onCreated?: (reference: string) => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(emergencyTypes[0]);
  const [holding, setHolding] = useState(false);
  const [successRef, setSuccessRef] = useState('');
  const holdTimer = useRef<number | null>(null);

  const submitSOS = () => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const reference = `SOS-${Date.now().toString().slice(-6)}`;
      const payload = {
        reference,
        type: 'emergency',
        category: selected,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        submittedBy: user?.uid ?? 'anonymous',
        phone: user?.phoneNumber ?? null,
        status: 'emergency',
        priority: 10,
        createdAt: serverTimestamp(),
        slaDeadline: Timestamp.fromDate(new Date(Date.now() + 15 * 60 * 1000)),
      };
      if (isFirebaseConfigured) {
        await addDoc(collection(firestore, 'reports'), payload);
      }
      await navigator.clipboard?.writeText(reference).catch(() => undefined);
      setSuccessRef(reference);
      onCreated?.(reference);
    }, () => {
      setSuccessRef('Location permission needed');
    }, { enableHighAccuracy: true, timeout: 10000 });
  };

  const startHold = () => {
    setHolding(true);
    holdTimer.current = window.setTimeout(() => {
      setHolding(false);
      submitSOS();
    }, 3000);
  };

  const stopHold = () => {
    setHolding(false);
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
  };

  return (
    <>
      <style>{`
        @keyframes sosPulse {
          0% { transform: scale(1); opacity: .65; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes sosHold {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
      <button
        onClick={() => setOpen(true)}
        className="fixed z-40 flex flex-col items-center gap-1"
        style={{ left: 18, bottom: 92, color: '#F0F4FF' }}
        aria-label="Emergency SOS"
      >
        <span className="relative w-[52px] h-[52px] rounded-full flex items-center justify-center" style={{ background: '#FF3B3B' }}>
          <span className="absolute inset-0 rounded-full" style={{ border: '2px solid #FF3B3B', animation: 'sosPulse 2s infinite' }} />
          <ShieldAlert className="w-6 h-6" />
        </span>
        <span style={{ fontSize: 11, fontWeight: 800 }}>SOS</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-t-3xl p-5" style={{ background: '#0F2040', border: '1px solid rgba(255,59,59,0.25)' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 style={{ color: '#F0F4FF', fontSize: 20, fontWeight: 900 }}>Emergency Report / ایمرجنسی</h2>
                <p className="mt-1" style={{ color: '#8BA3C7', fontSize: 13 }}>This will immediately alert KMC Emergency Response</p>
              </div>
              <button onClick={() => { setOpen(false); setSuccessRef(''); }} style={{ color: '#8BA3C7' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {successRef ? (
              <div className="rounded-2xl p-4 text-center" style={{ background: '#0A1628' }}>
                <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: '#FF3B3B' }} />
                <p style={{ color: '#F0F4FF', fontWeight: 800 }}>Emergency reported. Authorities notified.</p>
                <p className="mt-2" style={{ color: '#00D4FF' }}>Reference: #{successRef}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {emergencyTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelected(type)}
                      className="rounded-xl p-3 text-left text-sm"
                      style={{
                        background: selected === type ? 'rgba(255,59,59,0.18)' : '#0A1628',
                        color: selected === type ? '#FFB3B3' : '#8BA3C7',
                        border: `1px solid ${selected === type ? 'rgba(255,59,59,0.45)' : 'rgba(0,212,255,0.08)'}`,
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <button
                  onMouseDown={startHold}
                  onMouseUp={stopHold}
                  onMouseLeave={stopHold}
                  onTouchStart={startHold}
                  onTouchEnd={stopHold}
                  className="relative w-full py-4 rounded-2xl overflow-hidden font-black"
                  style={{ background: '#FF3B3B', color: '#FFFFFF' }}
                >
                  {holding && <span className="absolute inset-y-0 left-0" style={{ background: 'rgba(255,255,255,0.22)', animation: 'sosHold 3s linear forwards' }} />}
                  <span className="relative">HOLD 3s TO SEND SOS</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

