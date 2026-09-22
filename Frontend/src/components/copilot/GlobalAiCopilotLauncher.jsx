import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Sparkles, X, MessageSquare } from 'lucide-react';
import AICopilotDrawer from './AICopilotDrawer';
import { useMapStore } from '../../store/mapStore';
import './GlobalAiCopilotLauncher.css';

function resolvePageContext(pathname, plannerForm) {
  let currentPage = 'GENERAL';
  let pageType = 'GENERAL';
  let destinationSlug = null;
  let destinationName = plannerForm?.destination || null;
  let tripId = null;

  if (pathname === '/') {
    currentPage = 'HOME';
    pageType = 'HOME';
  } else if (pathname === '/trip-planner') {
    currentPage = 'TRIP_PLANNER';
    pageType = 'TRIP_PLANNER';
  } else if (pathname.startsWith('/my-trip')) {
    currentPage = 'MY_TRIP';
    pageType = 'MY_TRIP';
    const parts = pathname.split('/');
    if (parts[2]) tripId = parts[2];
  } else if (pathname.startsWith('/destinations/')) {
    const parts = pathname.split('/');
    destinationSlug = parts[2] || null;
    if (pathname.endsWith('/explore')) {
      currentPage = 'DESTINATION_EXPLORE';
      pageType = 'DESTINATION_EXPLORE';
    } else {
      currentPage = 'DESTINATION_DETAILS';
      pageType = 'DESTINATION_DETAILS';
    }
    if (destinationSlug) {
      destinationName = destinationSlug.charAt(0).toUpperCase() + destinationSlug.slice(1);
    }
  } else if (pathname === '/map') {
    currentPage = 'MAP';
    pageType = 'MAP';
  } else if (pathname === '/stays') {
    currentPage = 'STAYS';
    pageType = 'STAYS';
  } else if (pathname === '/activities') {
    currentPage = 'ACTIVITIES';
    pageType = 'ACTIVITIES';
  } else if (pathname === '/guides') {
    currentPage = 'GUIDES';
    pageType = 'GUIDES';
  } else if (pathname === '/spiritual') {
    currentPage = 'SPIRITUAL';
    pageType = 'SPIRITUAL';
  } else if (pathname === '/culture') {
    currentPage = 'CULTURE';
    pageType = 'CULTURE';
  }

  return {
    currentRoute: pathname,
    currentPage,
    pageType,
    destinationSlug,
    destinationName,
    tripId,
    plannerForm: plannerForm || null
  };
}

export default function GlobalAiCopilotLauncher() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const plannerForm = useMapStore((state) => state.plannerForm);

  // Expose navigate globally so agentActionExecutor can operate application routes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__DU_NAVIGATE__ = navigate;
    }
    return () => {
      if (typeof window !== 'undefined' && window.__DU_NAVIGATE__ === navigate) {
        window.__DU_NAVIGATE__ = null;
      }
    };
  }, [navigate]);

  const pageContext = useMemo(() => {
    return resolvePageContext(location.pathname, plannerForm);
  }, [location.pathname, plannerForm]);

  // Section 3 & 39: Hide Copilot Launcher on Profile Page, Copilot Workspace, Admin & Partner Dashboards
  const isProfilePage = location.pathname.startsWith('/profile');
  const isCopilotPage = location.pathname.startsWith('/copilot');
  const isPartnerPage = location.pathname.startsWith('/partner');
  const isAdminPage = location.pathname.startsWith('/admin');
  if (isProfilePage || isCopilotPage || isPartnerPage || isAdminPage) {
    return null;
  }

  return (
    <>
      <div className="global-copilot-wrapper" role="region" aria-label="AI Travel Copilot Launcher">
        <button
          className="global-copilot-btn"
          onClick={() => setIsOpen((prev) => !prev)}
          title="AI Travel Copilot"
          aria-label={isOpen ? "Close AI Travel Copilot" : "Open AI Travel Copilot"}
        >
          <div className="global-copilot-btn__icon-wrap">
            {isOpen ? <X size={16} /> : <Sparkles size={16} />}
          </div>
          <span className="global-copilot-btn__label">AI Copilot</span>
          <span className="global-copilot-btn__badge">Verified</span>
          <span className="global-copilot-tooltip">
            AI Travel Copilot · Grounded &amp; Verified
          </span>
        </button>
      </div>

      <AICopilotDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        tripId={pageContext.tripId}
        pageContext={pageContext}
      />
    </>
  );
}
