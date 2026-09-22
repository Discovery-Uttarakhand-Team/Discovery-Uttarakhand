import React from 'react';
import { MapPin, Calendar, Users, Wallet, ArrowRight } from 'lucide-react';
import './TripContextStrip.css';

export default function TripContextStrip({ tripContext }) {
  if (!tripContext) return null;

  const { destination, origin, startDate, duration, travelers, budget } = tripContext;
  if (!destination && !origin && !budget) return null;

  return (
    <div className="trip-context-strip" role="region" aria-label="Active Trip Parameters">
      <div className="trip-context-strip__scroll">
        {destination && (
          <div className="trip-badge destination">
            <span className="badge-icon">🌿</span>
            <span className="badge-text font-bold">{destination}</span>
          </div>
        )}

        {origin && destination && (
          <div className="trip-badge route">
            <span className="badge-text">{origin}</span>
            <ArrowRight size={11} className="text-emerald-700" />
            <span className="badge-text">{destination}</span>
          </div>
        )}

        {(startDate || duration || travelers) && (
          <div className="trip-badge schedule">
            <Calendar size={12} className="text-emerald-700" />
            <span className="badge-text">
              {[
                startDate,
                duration ? `${duration} days` : null,
                travelers ? `${travelers} travelers` : null
              ].filter(Boolean).join(' · ')}
            </span>
          </div>
        )}

        {budget != null && (
          <div className="trip-badge budget">
            <Wallet size={12} className="text-emerald-700" />
            <span className="badge-text font-bold">₹{Number(budget).toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
