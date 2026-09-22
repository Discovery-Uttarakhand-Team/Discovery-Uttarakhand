import React, { useState, useMemo, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import RentalCard from '../components/RentalCard';
import CategoryHero from '../components/CategoryHero';
import Pagination from '../components/common/Pagination';
import { useRentals } from '../hooks/useRentals';

const ITEMS_PER_PAGE = 12;

const Rentals = () => {
  const { rentals, loading, error } = useRentals();
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
    rentals.forEach(r => {
      if (r.city) set.add(r.city);
    });
    return ['All', ...Array.from(set).sort()];
  }, [rentals]);

  const categories = useMemo(() => {
    const set = new Set();
    rentals.forEach(r => {
      const type = r.type || r.category;
      if (type) set.add(type);
    });
    return ['All', ...Array.from(set).sort()];
  }, [rentals]);

  const filteredRentals = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return rentals.filter(rental => {
      const name = (rental.name || '').toLowerCase();
      const city = (rental.city || '').toLowerCase();
      const bizName = (rental.businessName || '').toLowerCase();
      const type = (rental.type || rental.category || '').toLowerCase();

      const matchSearch = !q || name.includes(q) || city.includes(q) || bizName.includes(q) || type.includes(q);
      const matchCity = selectedCity === 'All' || rental.city === selectedCity;
      const matchCategory = selectedCategory === 'All' || rental.type === selectedCategory || rental.category === selectedCategory;
      const matchBudget = maxBudget === '' || (rental.pricePerDay != null && rental.pricePerDay <= parseInt(maxBudget, 10));
      const matchRating = minRating === '0' || (rental.rating != null && rental.rating >= parseFloat(minRating));

      return matchSearch && matchCity && matchCategory && matchBudget && matchRating;
    });
  }, [rentals, searchQuery, selectedCity, selectedCategory, maxBudget, minRating]);

  const totalPages = Math.ceil(filteredRentals.length / ITEMS_PER_PAGE);

  const paginatedRentals = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRentals.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRentals, currentPage]);

  return (
    <div className="min-h-screen flex flex-col pt-32">
      <Navbar />
      
      <main className="flex-grow flex flex-col">
        <CategoryHero 
          title="Rent Your Ride"
          subtitle="Your road. Your pace."
          description="Choose your ride and explore Uttarakhand your way."
          bgImage="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2000&auto=format&fit=crop"
        />
        
        {/* Rent Your Ride Section */}
        <section className="pb-12 px-4 md:px-8 max-w-[1440px] mx-auto w-full">
          {/* Filters */}
          <div className="bg-beige/30 p-6 md:p-8 rounded-[2rem] border border-border-light mb-12 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-bold text-text-dark mb-2">Search</label>
                <input 
                  type="text" 
                  placeholder="Vehicle or city..." 
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
                <label className="text-sm font-bold text-text-dark mb-2">Max Price/Day</label>
                <input 
                  type="number" 
                  placeholder="e.g. 1500" 
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
          <div id="rentals-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 scroll-mt-24">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-text text-lg font-bold">Loading rentals...</p>
              </div>
            ) : error ? (
              <div className="col-span-full text-center py-12">
                <p className="text-red-500 text-lg font-bold">{error}</p>
              </div>
            ) : paginatedRentals.length > 0 ? (
              paginatedRentals.map(rental => (
                <RentalCard key={rental.id || rental._id} rental={rental} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-text text-lg">No rentals found matching your criteria.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && !error && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              scrollTargetId="rentals-grid"
            />
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Rentals;
