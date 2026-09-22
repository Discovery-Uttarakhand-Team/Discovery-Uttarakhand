import React from "react";
import { 
  FileText, 
  DollarSign, 
  Cloud, 
  MapPin, 
  Home, 
  Calendar 
} from "lucide-react";

const ACTIONS = [
  { 
    label: "Explain my trip", 
    message: "Explain my current trip itinerary in detail", 
    Icon: FileText 
  },
  { 
    label: "Optimize budget", 
    message: "How can I optimize and make my trip budget cheaper?", 
    Icon: DollarSign 
  },
  { 
    label: "Check weather", 
    message: "What is the live weather forecast and advisory for my destination?", 
    Icon: Cloud 
  },
  { 
    label: "Road safety", 
    message: "Are the routes and mountain roads safe for travel currently?", 
    Icon: MapPin 
  },
  { 
    label: "Find verified stays", 
    message: "Find verified stays and homestays near my destination", 
    Icon: Home 
  },
  { 
    label: "Make Day 2 easier", 
    message: "Day 2 of my itinerary is too hectic. Can you suggest lighter alternatives?", 
    Icon: Calendar 
  }
];

export default function QuickActions({ onAction, disabled }) {
  return (
    <div className="copilot-quick-actions">
      <p className="copilot-quick-actions__label">Quick actions</p>
      <div className="copilot-quick-actions__grid">
        {ACTIONS.map(({ label, message, Icon }) => (
          <button
            key={label}
            className="copilot-qa-btn"
            onClick={() => onAction(message)}
            disabled={disabled}
            title={label}
          >
            <Icon size={16} className="copilot-qa-btn__icon text-slate-500" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}