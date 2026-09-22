import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowLeft } from 'lucide-react';
import { getGuides } from '../api/guideApi';

const GuideProfilePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchGuide = async () => {
      try {
        setLoading(true);
        const res = await getGuides();
        if (res.success) {
          const foundGuide = res.data.find(g => g.slug === slug);
          if (foundGuide) {
            setGuide(foundGuide);
          } else {
            navigate('/guides', { replace: true });
          }
        } else {
          setError('Unable to load data. Please try again.');
        }
      } catch (err) {
        setError('Unable to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchGuide();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col pt-32">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center">
          <p className="text-xl text-muted-text font-bold">Loading guide profile...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="min-h-screen flex flex-col pt-32">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center">
          <p className="text-xl text-red-500 font-bold">{error || 'Guide Not Found'}</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pt-32">
      <Navbar />
      
      <main className="flex-grow flex flex-col items-center px-4 md:px-8 max-w-[1440px] mx-auto w-full pb-16">
        
        {/* Back Button */}
        <div className="w-full max-w-4xl mb-8">
          <button 
            onClick={() => navigate('/guides')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 hover:text-forest-green font-bold text-xs sm:text-sm border border-slate-200/80 shadow-xs transition-all duration-200 group cursor-pointer"
          >
            <ArrowLeft size={16} className="text-forest-green group-hover:-translate-x-1 transition-transform" />
            <span>Back to Guides</span>
          </button>
        </div>

        {/* Profile Card Main */}
        <div className="w-full max-w-4xl bg-warm-white rounded-[3rem] p-6 md:p-12 shadow-sm border border-beige flex flex-col md:flex-row gap-8 md:gap-12">
          
          {/* Left Column: Image & Quick Stats */}
          <div className="flex flex-col items-center md:items-start shrink-0">
            <img 
              src={guide.profileImage?.url || guide.profileImage || guide.image?.url || guide.image || '/assets/fallback.svg'} 
              alt={guide.name}
              className="w-48 h-56 md:w-64 md:h-72 object-cover rounded-[2rem] bg-beige mb-6 shadow-sm"
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = '/assets/fallback.svg';
              }}
            />
            
            <div className="w-full bg-beige/50 p-6 rounded-[2rem] flex flex-col gap-4">
              <div>
                <p className="text-muted-text text-sm font-bold uppercase tracking-wider mb-1">Daily Rate</p>
                <p className="text-2xl font-bold text-text-dark">₹{guide.pricePerDay?.toLocaleString('en-IN')}</p>
              </div>
              
              <div>
                <p className="text-muted-text text-sm font-bold uppercase tracking-wider mb-1">Rating</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-text-dark">{guide.rating}</span>
                  <span className="text-earth-brown flex text-lg">
                    {Array.from({ length: Math.floor(guide.rating || 0) }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-muted-text text-sm font-bold uppercase tracking-wider mb-1">Experience</p>
                <p className="text-lg font-bold text-text-dark">{guide.experience}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Details & Bio */}
          <div className="flex flex-col flex-grow">
            <div className="mb-8 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold text-text-dark mb-2">{guide.name}</h1>
              <p className="text-xl text-muted-text font-medium flex items-center justify-center md:justify-start gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                {typeof guide.location === 'string' ? `${guide.location}, ` : (guide.district ? `${guide.district}, ` : '')}Uttarakhand
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-bold text-forest-green mb-3">About {guide.name.split(' ')[0]}</h3>
              <p className="text-muted-text leading-relaxed text-lg">{guide.bio}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              <div>
                <h4 className="text-sm font-bold text-muted-text uppercase tracking-wider mb-2">Speciality</h4>
                <p className="text-lg font-bold text-text-dark">{guide.speciality}</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-muted-text uppercase tracking-wider mb-2">Languages Spoken</h4>
                <p className="text-lg font-bold text-text-dark">{guide.languages?.join(', ')}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-auto">
              <button className="flex-1 bg-forest-green hover:bg-forest-green/90 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-colors">
                CONTACT GUIDE
              </button>
              <button className="flex-1 bg-transparent border-2 border-forest-green text-forest-green hover:bg-forest-green/5 font-bold py-4 px-6 rounded-2xl text-lg transition-colors">
                PLAN WITH {guide.name.split(' ')[0].toUpperCase()}
              </button>
            </div>
          </div>

        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default GuideProfilePage;
