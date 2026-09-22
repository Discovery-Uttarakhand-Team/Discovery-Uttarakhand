import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Cloud, CloudRain, Sun, Snowflake, AlertCircle, RefreshCw, MapPin } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function WeatherWidget({ lat, lng, name }) {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!lat || !lng) {
      setLoading(false);
      return;
    }

    let parsedLat = parseFloat(lat);
    let parsedLon = parseFloat(lng);

    // Auto-detect swapped coordinates (GeoJSON [lon, lat])
    if (parsedLat > 50 && parsedLon < 40) {
      const temp = parsedLat;
      parsedLat = parsedLon;
      parsedLon = temp;
    }

    const fetchWeather = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE}/live/weather`, {
          params: { lat: parsedLat, lon: parsedLon, name }
        });
        
        if (response.data?.success && response.data?.data) {
          setWeatherData(response.data.data);
        } else {
          setError('Unavailable');
        }
      } catch (err) {
        setWeatherData(err.response?.data?.data || null);
        setError('Unavailable');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [lat, lng, name]);

  if (loading) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-border-light rounded-xl shadow-2xs">
        <RefreshCw size={15} className="text-forest-green animate-spin" />
        <span className="text-xs text-slate-700 font-semibold">Checking {name || 'destination'} weather...</span>
      </div>
    );
  }

  if (!weatherData || weatherData.status === 'UNAVAILABLE' || error || !weatherData.data) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-border-light rounded-xl shadow-2xs">
        <AlertCircle size={15} className="text-slate-500" />
        <span className="text-xs font-semibold text-slate-700">{name || 'Destination'} weather unavailable</span>
      </div>
    );
  }

  const { data, status } = weatherData;
  const isStale = status === 'STALE';

  let WeatherIcon = Sun;
  if (data.wmoCode >= 1 && data.wmoCode <= 3) WeatherIcon = Cloud;
  else if (data.wmoCode >= 51 && data.wmoCode <= 65) WeatherIcon = CloudRain;
  else if (data.wmoCode >= 71) WeatherIcon = Snowflake;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-border-light rounded-xl shadow-2xs">
      <div className="w-8 h-8 rounded-lg bg-forest-green/10 flex items-center justify-center text-forest-green flex-shrink-0">
        <WeatherIcon size={18} />
      </div>
      <div className="flex flex-col">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-base font-black text-slate-900 font-display">
            {data.temperature}°C
          </span>
          <span className="text-xs font-bold text-forest-green">
            {data.weatherCondition || 'Clear'}
          </span>
          <span className="text-xs text-slate-600 font-semibold">
            • Rain {data.precipitationMm > 0 ? `${data.precipitationMm}mm` : '0%'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] text-slate-700 font-bold flex items-center gap-0.5">
            <MapPin size={11} className="text-forest-green" />
            {name} • Open-Meteo
          </span>
          {isStale && (
            <span className="text-[9px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-black uppercase">
              Cached
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
