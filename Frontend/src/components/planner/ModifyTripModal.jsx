import React from 'react';

export default function ModifyTripModal({
  isOpen,
  onClose,
  editDuration,
  setEditDuration,
  editPace,
  setEditPace,
  editTransport,
  setEditTransport,
  onUpdateTrip
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-border-light">
        <h3 className="font-bold text-text-dark text-base font-display mb-4">
          Modify Journey Parameters
        </h3>

        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-muted-text uppercase tracking-wider block mb-1">
              Duration (Exact Days)
            </label>
            <select
              value={editDuration}
              onChange={(e) => setEditDuration(e.target.value)}
              className="w-full font-semibold border border-border-light rounded-xl p-2.5 bg-[#faf9f6]"
            >
              {['3 Days', '5 Days', '7 Days', '10 Days'].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-muted-text uppercase tracking-wider block mb-1">
              Travel Pace
            </label>
            <select
              value={editPace}
              onChange={(e) => setEditPace(e.target.value)}
              className="w-full font-semibold border border-border-light rounded-xl p-2.5 bg-[#faf9f6]"
            >
              {['Relaxed', 'Balanced', 'Fast'].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-muted-text uppercase tracking-wider block mb-1">
              Transport Preference
            </label>
            <select
              value={editTransport}
              onChange={(e) => setEditTransport(e.target.value)}
              className="w-full font-semibold border border-border-light rounded-xl p-2.5 bg-[#faf9f6]"
            >
              {['By Car', 'Taxi', 'Motorbike', 'Bus / Public Transport'].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border-light">
          <button
            onClick={onClose}
            className="btn-outline px-4 py-2 text-xs font-bold rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={onUpdateTrip}
            className="btn-primary px-5 py-2 text-xs font-bold rounded-xl"
          >
            Recalculate Journey
          </button>
        </div>
      </div>
    </div>
  );
}
