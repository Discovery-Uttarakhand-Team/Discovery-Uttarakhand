import React, { useState, useMemo, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import StayCard from '../components/StayCard';
import CategoryHero from '../components/CategoryHero';
import Pagination from '../components/common/Pagination';
import { useStays } from '../hooks/useStays';

const ITEMS_PER_PAGE = 12;

const Stays = () => {
  const { stays, loading, error } = useStays();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [maxBudget, setMaxBudget] = useState('');
  const [minRating, setMinRating] = useState('0');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCity, selectedCategory, maxBudget, minRating]);

  // Extract unique cities and categories dynamically from data safely
  const cities = useMemo(() => {
    const set = new Set();
    stays.forEach(s => {
      if (s.city) set.add(s.city);
      else if (s.district) set.add(s.district);
    });
    return ['All', ...Array.from(set).sort()];
  }, [stays]);

  const categories = useMemo(() => {
    const set = new Set();
    stays.forEach(s => {
      const cat = s.category || s.type;
      if (cat) set.add(cat);
    });
    return ['All', ...Array.from(set).sort()];
  }, [stays]);

  const filteredStays = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return stays.filter(stay => {
      const name = (stay.name || '').toLowerCase();
      const city = (stay.city || '').toLowerCase();
      const district = (stay.district || '').toLowerCase();
      const desc = (stay.shortDescription || stay.description || '').toLowerCase();
      const loc = typeof stay.location === 'string' ? stay.location.toLowerCase() : '';

      const matchSearch = !q || name.includes(q) || city.includes(q) || district.includes(q) || loc.includes(q) || desc.includes(q);
      const matchCity = selectedCity === 'All' || stay.city === selectedCity || stay.district === selectedCity;
      const matchCategory = selectedCategory === 'All' || stay.category === selectedCategory || stay.type === selectedCategory;
      const matchBudget = maxBudget === '' || (stay.pricePerNight != null && stay.pricePerNight <= parseInt(maxBudget, 10));
      const matchRating = minRating === '0' || (stay.rating != null && stay.rating >= parseFloat(minRating));

      return matchSearch && matchCity && matchCategory && matchBudget && matchRating;
    });
  }, [stays, searchQuery, selectedCity, selectedCategory, maxBudget, minRating]);

  const totalPages = Math.ceil(filteredStays.length / ITEMS_PER_PAGE);

  const paginatedStays = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStays.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStays, currentPage]);

  return (
    <div className="min-h-screen flex flex-col pt-32">
      <Navbar />
      
      <main className="flex-grow flex flex-col">
        <CategoryHero 
          title="Stay in the Mountains"
          subtitle="From cozy homestays to mountain escapes."
          description="Find your perfect retreat in Uttarakhand."
          bgImage="https://images.unsplash.com/photo-1542157675-99d949ad5f23?q=80&w=2000&auto=format&fit=crop"
        />
        
        <section className="pb-12 px-4 md:px-8 max-w-[1440px] mx-auto w-full">
          {/* Filters */}
          <div className="bg-beige/30 p-6 md:p-8 rounded-[2rem] border border-border-light mb-12 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-bold text-text-dark mb-2">Search</label>
                <input 
                  type="text" 
                  placeholder="Name or location..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="p-3 rounded-xl border border-border-light focus:outline-none focus:border-forest-green"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-bold text-text-dark mb-2">City</label>
                <select 
                  value={selectedCity} 
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="p-3 rounded-xl border border-border-light focus:outline-none focus:border-forest-green"
                >
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-bold text-text-dark mb-2">Category</label>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="p-3 rounded-xl border border-border-light focus:outline-none focus:border-forest-green"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-bold text-text-dark mb-2">Max Price/Night</label>
                <input 
                  type="number" 
                  placeholder="e.g. 5000" 
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  className="p-3 rounded-xl border border-border-light focus:outline-none focus:border-forest-green"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-bold text-text-dark mb-2">Min Rating</label>
                <select 
                  value={minRating} 
                  onChange={(e) => setMinRating(e.target.value)}
                  className="p-3 rounded-xl border border-border-light focus:outline-none focus:border-forest-green"
                >
                  <option value="0">Any Rating</option>
                  <option value="4.0">4.0 & above</option>
                  <option value="4.5">4.5 & above</option>
                  <option value="4.8">4.8 & above</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
               <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCity('All');
                    setSelectedCategory('All');
                    setMaxBudget('');
                    setMinRating('0');
                  }}
                  className="text-sm font-bold text-earth-brown hover:text-text-dark transition-colors"
                >
                  Reset Filters
                </button>
            </div>
          </div>
          
          {/* Results */}
          <div id="stays-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 scroll-mt-24">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-text text-lg font-bold">Loading stays...</p>
              </div>
            ) : error ? (
              <div className="col-span-full text-center py-12">
                <p className="text-red-500 text-lg font-bold">{error}</p>
              </div>
            ) : paginatedStays.length > 0 ? (
              paginatedStays.map(stay => (
                <StayCard key={stay.id || stay._id} stay={stay} />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-border-light shadow-sm">
                <div className="w-20 h-20 bg-beige rounded-full flex items-center justify-center text-earth-brown mb-4">
                  <i className="ri-hotel-line text-3xl"></i>
                </div>
                <h3 className="text-xl font-bold text-text-dark mb-2">No Stays Found</h3>
                <p className="text-muted-text text-center max-w-md">
                  {selectedCategory === 'KMVN Tourist Rest House' 
                    ? "We couldn't find any official KMVN rest houses matching your search. Try adjusting the city or budget." 
                    : "No stays found matching your criteria. Try adjusting your filters to see more results."}
                </p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCity('All');
                    setSelectedCategory('All');
                    setMaxBudget('');
                    setMinRating('0');
                  }}
                  className="mt-6 btn-primary px-6 py-2 rounded-full font-bold"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && !error && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              scrollTargetId="stays-grid"
            />
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Stays;
