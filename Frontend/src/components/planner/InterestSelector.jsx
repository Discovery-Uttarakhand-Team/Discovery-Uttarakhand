import React from 'react';
import { 
  MdTempleHindu, 
  MdTerrain, 
  MdKayaking, 
  MdPhotoCamera, 
  MdFamilyRestroom, 
  MdAcUnit 
} from 'react-icons/md';

const INTERESTS = [
  { id: 'spiritual', label: 'Sacred Pilgrimage', icon: MdTempleHindu },
  { id: 'trekking', label: 'High Treks & Summits', icon: MdTerrain },
  { id: 'adventure', label: 'Rafting & Bungee', icon: MdKayaking },
  { id: 'photography', label: 'Landscape Photos', icon: MdPhotoCamera },
  { id: 'family', label: 'Family Leisure', icon: MdFamilyRestroom },
  { id: 'snow', label: 'Snow & Skiing', icon: MdAcUnit }
];

export default function InterestSelector({ selectedInterests = [], onToggle }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
        Trip Style & Interests
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {INTERESTS.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedInterests.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium transition-all text-left border ${
                isSelected
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <Icon className={`text-base ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
