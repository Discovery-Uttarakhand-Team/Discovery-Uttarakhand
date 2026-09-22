import React from 'react';
import { CloudSun, Hotel, Wallet, MapPin, ShieldCheck, Wind, Thermometer, CheckCircle2, Navigation } from 'lucide-react';
import './StructuredTravelCards.css';

export default function StructuredTravelCards({ cards }) {
  if (!cards) return null;

  const { weather, stays, budget, route, roadAdvisory } = cards;
  const hasCards = weather || (stays && stays.length > 0) || budget || route || roadAdvisory;
  if (!hasCards) return null;

  return (
    <div className="travel-cards-container">
      {/* 1. Weather Card */}
      {weather && (
        <div className="travel-card weather-card">
          <div className="travel-card__header">
            <div className="travel-card__title">
              <CloudSun size={18} className="text-emerald-700" />
              <span>Weather</span>
            </div>
            <span className="travel-card__badge verified">Verified (Open-Meteo)</span>
          </div>
          <div className="weather-card__body">
            <div className="weather-card__main">
              <span className="weather-temp">
                {weather.temperatureC !== undefined ? `${weather.temperatureC}°C` : (weather.temperature !== undefined ? `${weather.temperature}°C` : '--')}
              </span>
              <span className="weather-condition">{weather.condition || weather.weatherCondition || 'Clear Mountain Weather'}</span>
            </div>
            <div className="weather-card__details">
              {(weather.windSpeedKmh || weather.windSpeed) && (
                <div className="weather-detail-item">
                  <Wind size={14} />
                  <span>Wind: {weather.windSpeedKmh || weather.windSpeed} km/h</span>
                </div>
              )}
              <div className="weather-detail-item">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Daylight transit safe</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Route & Road Advisory Card */}
      {(route || roadAdvisory) && (
        <div className="travel-card route-card">
          <div className="travel-card__header">
            <div className="travel-card__title">
              <Navigation size={18} className="text-emerald-700" />
              <span>Route &amp; Travel Corridor</span>
            </div>
            <span className="travel-card__badge corridor">NH Highway</span>
          </div>
          <div className="route-card__body">
            {route && (
              <div className="route-metrics">
                <div className="route-metric">
                  <span className="metric-label">Distance</span>
                  <span className="metric-val">{route.estimatedDistanceKm ? `${route.estimatedDistanceKm} km` : '--'}</span>
                </div>
                <div className="route-metric">
                  <span className="metric-label">Estimated Drive</span>
                  <span className="metric-val">{route.estimatedDurationHours ? `~${route.estimatedDurationHours} hrs` : '--'}</span>
                </div>
              </div>
            )}
            {roadAdvisory && (
              <div className="road-advisory-note">
                <ShieldCheck size={14} className="text-emerald-700 shrink-0" />
                <span>{roadAdvisory.safetyNote || roadAdvisory.routeCondition || 'Daylight mountain transit strictly recommended.'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Verified Stays Card */}
      {stays && Array.isArray(stays) && stays.length > 0 && (
        <div className="travel-card stays-card">
          <div className="travel-card__header">
            <div className="travel-card__title">
              <Hotel size={18} className="text-emerald-700" />
              <span>Verified Stays</span>
            </div>
            <span className="travel-card__badge count">{stays.length} options</span>
          </div>
          <div className="stays-list">
            {stays.map((stay, idx) => (
              <div key={idx} className="stay-item">
                <div className="stay-info">
                  <span className="stay-name">{stay?.name || stay?.title || 'Mountain Stay'}</span>
                  <span className="stay-category">{stay?.category || stay?.type || 'Hotel / Homestay'}</span>
                </div>
                <div className="stay-pricing">
                  <span className="stay-price">
                    {stay?.pricePerNight ? `₹${Number(stay.pricePerNight).toLocaleString()}` : 'Counter rate'}
                    <span className="stay-price-sub">/night</span>
                  </span>
                  <span className="stay-badge-tag">
                    <CheckCircle2 size={11} /> Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Trip Budget Card */}
      {budget && (
        <div className="travel-card budget-card">
          <div className="travel-card__header">
            <div className="travel-card__title">
              <Wallet size={18} className="text-emerald-700" />
              <span>Trip Budget Breakdown</span>
            </div>
            {budget.status === 'OVER_BUDGET' ? (
              <span className="travel-card__badge bg-amber-100 text-amber-900 border border-amber-300 font-semibold">⚠️ Over Budget</span>
            ) : (
              <span className="travel-card__badge budget">Local Rates</span>
            )}
          </div>
          <div className="budget-card__body">
            {budget.userBudget != null && (
              <div className="flex justify-between items-center text-xs pb-1 mb-1 border-b border-slate-100">
                <span className="text-slate-500">Your Target Budget</span>
                <span className="font-semibold text-slate-700">₹{Number(budget.userBudget).toLocaleString()}</span>
              </div>
            )}
            <div className="budget-total-row">
              <span className="budget-total-label">Total Estimated Cost</span>
              <span className="budget-total-val" style={{ color: budget.status === 'OVER_BUDGET' ? '#b45309' : undefined }}>
                ₹{budget.totalEstimatedCost != null ? Number(budget.totalEstimatedCost).toLocaleString() : '--'}
              </span>
            </div>
            {budget.status === 'OVER_BUDGET' && budget.warning && (
              <div className="budget-warning-banner p-2 my-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-snug flex items-start gap-1.5">
                <span className="shrink-0">⚠️</span>
                <span>{budget.warning}</span>
              </div>
            )}
            {budget.breakdown && (
              <div className="budget-breakdown-grid">
                {budget.breakdown.accommodation !== undefined && (
                  <div className="budget-item">
                    <span className="budget-item-name">🏨 Stay</span>
                    <span className="budget-item-val">₹{Number(budget.breakdown.accommodation || 0).toLocaleString()}</span>
                  </div>
                )}
                {budget.breakdown.transport !== undefined && (
                  <div className="budget-item">
                    <span className="budget-item-name">🚗 Transport</span>
                    <span className="budget-item-val">₹{Number(budget.breakdown.transport || 0).toLocaleString()}</span>
                  </div>
                )}
                {budget.breakdown.food !== undefined && (
                  <div className="budget-item">
                    <span className="budget-item-name">🍲 Food</span>
                    <span className="budget-item-val">₹{Number(budget.breakdown.food || 0).toLocaleString()}</span>
                  </div>
                )}
                {(budget.breakdown.activities !== undefined || budget.breakdown.activitiesAndBuffer !== undefined) && (
                  <div className="budget-item">
                    <span className="budget-item-name">🎟 Activities</span>
                    <span className="budget-item-val">₹{Number(budget.breakdown.activities || budget.breakdown.activitiesAndBuffer || 0).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
