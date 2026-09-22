import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck,
  Compass,
  Mountain,
  Sun
} from 'lucide-react';
import { getLiveWeather, evaluateTripAdvisories } from '../../api/liveDataApi';
import LiveSafetyBadge from './LiveSafetyBadge';

export default function WorkspaceAdvisories({ destination = null, tripContext = null }) {
  const [weatherData, setWeatherData] = useState(null);
  const [advisoriesData, setAdvisoriesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchLiveTelemetry = async () => {
      let lat = 29.3919;
      let lon = 79.4542;
      let name = 'Uttarakhand';
      let altitude = null;

      if (destination) {
        if (Array.isArray(destination.coordinates) && destination.coordinates.length === 2) {
          lat = destination.coordinates[0];
          lon = destination.coordinates[1];
        }
        name = destination.name || name;
        altitude = destination.altitude || altitude;
      } else if (tripContext?.destination) {
        name = tripContext.destination.name || name;
        if (Array.isArray(tripContext.destination.coordinates)) {
          lat = tripContext.destination.coordinates[0];
          lon = tripContext.destination.coordinates[1];
        }
      }

      // Auto-detect and swap if GeoJSON [lon, lat] format was passed
      if (lat > 50 && lon < 40) {
        const temp = lat;
        lat = lon;
        lon = temp;
      }

      setLoading(true);
      try {
        const [weatherRes, advRes] = await Promise.allSettled([
          getLiveWeather(lat, lon, { name, altitude }),
          tripContext ? evaluateTripAdvisories(tripContext) : Promise.resolve(null)
        ]);

        if (isMounted) {
          if (weatherRes.status === 'fulfilled' && weatherRes.value?.data) {
            setWeatherData(weatherRes.value.data);
          }
          if (advRes.status === 'fulfilled' && advRes.value?.data) {
            setAdvisoriesData(advRes.value.data);
          }
        }
      } catch (err) {
        console.warn('Advisory fetch warning:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLiveTelemetry();

    return () => {
      isMounted = false;
    };
  }, [destination, tripContext]);

  const criticalAdvisories = advisoriesData?.advisories?.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH') || [];

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-2xs space-y-5">
      {/* Header with Live Telemetry Badge */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-forest-green/10 border border-forest-green/20 flex items-center justify-center text-forest-green flex-shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-lg md:text-xl font-display">
              Mountain Safety & Travel Advisories
            </h3>
            <p className="text-sm text-slate-600 font-medium">
              Guidelines for mountain transit, weather, altitude, and permits
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LiveSafetyBadge
            status={weatherData?.status || 'UNKNOWN'}
            source={weatherData?.source || 'Open-Meteo Alpine Model'}
            label={weatherData?.status === 'LIVE' ? 'LIVE TELEMETRY' : weatherData?.status === 'STALE' ? 'CACHED' : 'SAFETY GUIDELINES'}
          />
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 text-xs font-bold text-forest-green hover:bg-forest-green/5 rounded-lg flex items-center gap-1 transition-colors"
          >
            <span>{isExpanded ? 'Hide Details' : 'View Safety Details'}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Critical Alert Banner (if any) */}
      {criticalAdvisories.length > 0 && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1.5">
          {criticalAdvisories.map((adv) => (
            <div key={adv.id} className="flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold uppercase tracking-wider text-[10px] bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded mr-1.5">
                  {adv.severity} ALERT
                </span>
                <strong className="font-bold">{adv.title}:</strong> {adv.message}
                <span className="block text-[10px] text-rose-700/80 mt-0.5 italic">
                  Source: {adv.source}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Row (Always Visible) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-[#faf9f6] border border-border-light flex items-center gap-2.5">
          <Sun size={16} className="text-forest-green flex-shrink-0" />
          <div>
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block">Daylight Travel</span>
            <span className="font-bold text-text-dark">Recommended</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[#faf9f6] border border-border-light flex items-center gap-2.5">
          <Mountain size={16} className="text-forest-green flex-shrink-0" />
          <div>
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block">Altitude Profile</span>
            <span className="font-bold text-text-dark">Hydrate & Rest</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[#faf9f6] border border-border-light flex items-center gap-2.5">
          <Compass size={16} className="text-forest-green flex-shrink-0" />
          <div>
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block">Road Transit</span>
            <span className="font-bold text-text-dark">Daytime Ghats</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[#faf9f6] border border-border-light flex items-center gap-2.5">
          <FileText size={16} className="text-forest-green flex-shrink-0" />
          <div>
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block">Permits & IDs</span>
            <span className="font-bold text-text-dark">Check Requirements</span>
          </div>
        </div>
      </div>

      {/* Expandable Detailed Guidelines */}
      {isExpanded && (
        <div className="space-y-4 pt-2 border-t border-border-light/60">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-[#faf9f6] p-4 rounded-xl border border-border-light flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-text-dark mb-1 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-forest-green" />
                  Permits & Official Registrations
                </h4>
                <p className="text-muted-text leading-relaxed">
                  Remote border corridors (such as Adi Kailash, Om Parvat, Milam, and Niti Valley) require Inner Line Permits (ILP) or Yatra registrations. Keep government photo IDs and passport copies accessible.
                </p>
              </div>
              <a
                href="https://eservices.uk.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-forest-green hover:underline"
              >
                <span>Uttarakhand e-District Portal</span>
                <ExternalLink size={12} />
              </a>
            </div>

            <div className="bg-[#faf9f6] p-4 rounded-xl border border-border-light">
              <h4 className="font-bold text-text-dark mb-1 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-forest-green" />
                Acclimatization & Altitude Health
              </h4>
              <p className="text-muted-text leading-relaxed">
                Gradual ascent is advised for high Himalayan elevations. Maintain steady hydration, avoid heavy physical exertion upon initial arrival, and descend if symptoms of altitude sickness occur.
              </p>
            </div>

            <div className="bg-[#faf9f6] p-4 rounded-xl border border-border-light">
              <h4 className="font-bold text-text-dark mb-1 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-forest-green" />
                Mountain Transit & Daylight Travel
              </h4>
              <p className="text-muted-text leading-relaxed">
                Daylight travel is recommended for mountain routes to allow adequate buffer for weather and terrain conditions. Early morning departures provide optimal driving visibility.
              </p>
            </div>
          </div>

          <p className="text-[11px] text-muted-text italic text-center pt-1">
            Weather and road conditions can vary across mountain corridors. Check local updates before setting out.
          </p>
        </div>
      )}
    </div>
  );
}
