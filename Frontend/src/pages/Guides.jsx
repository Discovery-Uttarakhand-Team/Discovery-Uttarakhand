import React, { useState, useMemo, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GuideCard from '../components/GuideCard';
import Pagination from '../components/common/Pagination';
import { useGuides } from '../hooks/useGuides';

const ITEMS_PER_PAGE = 12;
const categories = ['All', 'Adventure', 'Culture', 'Photography', 'Spiritual', 'Local Food'];

const Guides = () => {
  const { guides, loading, error } = useGuides();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery]);

  const filteredGuides = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    const cat = activeCategory.toLowerCase();

    return guides.filter(guide => {
      const name = (guide.name || '').toLowerCase();
      const location = (guide.location || '').toLowerCase();
      const districts = Array.isArray(guide.districts) ? guide.districts.join(' ').toLowerCase() : '';
      const specialties = Array.isArray(guide.specialties) ? guide.specialties.join(' ').toLowerCase() : (guide.speciality || '').toLowerCase();

      const matchCategory = activeCategory === 'All' || 
        specialties.includes(cat) || 
        districts.includes(cat) ||
        (cat === 'spiritual' && (specialties.includes('religious') || specialties.includes('pilgrimage') || specialties.includes('char dham'))) ||
        (cat === 'adventure' && (specialties.includes('trekking') || specialties.includes('safari') || specialties.includes('adventure'))) ||
        (cat === 'culture' && (specialties.includes('heritage') || specialties.includes('tour manager'))) ||
        (cat === 'photography' && specialties.includes('photo'));

      const matchSearch = !q ||
        name.includes(q) ||
        location.includes(q) ||
        districts.includes(q) ||
        specialties.includes(q);
      
      return matchCategory && matchSearch;
    });
  }, [guides, activeCategory, searchQuery]);

  const totalPages = Math.ceil(filteredGuides.length / ITEMS_PER_PAGE);

  const paginatedGuides = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredGuides.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredGuides, currentPage]);

  return (
    <div className="min-h-screen flex flex-col pt-32">
      <Navbar />
      
      <main className="flex-grow flex flex-col items-center px-4 md:px-8 max-w-[1440px] mx-auto w-full pb-16">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <p className="text-sm font-bold tracking-widest text-forest-green mb-2 uppercase">
            Meet Local Guides
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-text-dark mb-4">
            Meet Local Guides
          </h1>
          <p className="text-muted-text text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Explore Uttarakhand with someone who knows it.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="w-full max-w-4xl mb-12 flex flex-col items-center gap-6">
          <div className="w-full relative">
            <input 
              type="text" 
              placeholder="Search guides by name, city or speciality..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-4 pl-12 rounded-2xl border-2 border-beige bg-warm-white text-text-dark focus:outline-none focus:border-forest-green shadow-sm text-lg placeholder:text-muted-text/60 transition-colors"
            />
            <svg className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-muted-text/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                  activeCategory === category
                    ? 'bg-forest-green text-white shadow-md'
                    : 'bg-beige text-text-dark hover:bg-forest-green/10 hover:text-forest-green'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Guide Grid */}
        <div id="guides-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-12 scroll-mt-24">
          {loading ? (
            <div className="col-span-full text-center py-20 bg-warm-white rounded-[2rem] border border-beige">
              <p className="text-xl text-muted-text font-bold mb-2">Loading guides...</p>
            </div>
          ) : error ? (
            <div className="col-span-full text-center py-20 bg-warm-white rounded-[2rem] border border-beige">
              <p className="text-xl text-red-500 font-bold mb-2">{error}</p>
            </div>
          ) : paginatedGuides.length > 0 ? (
            paginatedGuides.map(guide => (
              <GuideCard key={guide.id || guide._id} guide={guide} />
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-warm-white rounded-[2rem] border border-beige">
              <p className="text-xl text-muted-text font-medium mb-2">No guides found matching your search.</p>
              <button 
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                className="text-forest-green font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && (
          <div className="w-full mb-16">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              scrollTargetId="guides-grid"
            />
          </div>
        )}

        {/* CTA Section */}
        <div className="w-full bg-forest-green text-white rounded-[3rem] p-10 md:p-16 text-center shadow-lg flex flex-col items-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 max-w-2xl">
            Your Uttarakhand story starts with a local.
          </h2>
          <p className="text-lg md:text-xl text-white/90 font-medium max-w-2xl mb-8">
            Travel deeper. Discover more. Experience Uttarakhand with someone who calls it home.
          </p>
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-white text-forest-green hover:bg-beige font-bold py-4 px-8 rounded-full text-lg transition-colors shadow-sm"
          >
            FIND YOUR GUIDE
          </button>
        </div>

      </main>
      <Footer />
    </div>
  );
};

export default Guides;
