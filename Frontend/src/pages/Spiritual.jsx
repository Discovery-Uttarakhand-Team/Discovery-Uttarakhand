import React, { useState, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SpiritualCard from '../components/SpiritualCard';
import CategoryHero from '../components/CategoryHero';
import Pagination from '../components/common/Pagination';
import { useSpiritualPlaces } from '../hooks/useSpiritual';

const ITEMS_PER_PAGE = 12;

const Spiritual = () => {
  const { places, loading, error } = useSpiritualPlaces();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(places.length / ITEMS_PER_PAGE);

  const paginatedPlaces = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return places.slice(start, start + ITEMS_PER_PAGE);
  }, [places, currentPage]);

  return (
    <div className="min-h-screen flex flex-col pt-32">
      <Navbar />
      
      <main className="flex-grow flex flex-col">
        <CategoryHero 
          title="Spiritual & Sacred Uttarakhand"
          subtitle="Explore the sacred places, ancient temples and spiritual journeys of the Himalayas."
          bgImage="https://images.unsplash.com/photo-1627882672776-8803eb6dfb92?q=80&w=2000&auto=format&fit=crop"
        />
        
        <section className="py-12 px-4 md:px-8 max-w-[1440px] mx-auto w-full">
          <div id="spiritual-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 scroll-mt-24">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-text text-lg font-bold">Loading spiritual places...</p>
              </div>
            ) : error ? (
              <div className="col-span-full text-center py-12">
                <p className="text-red-500 text-lg font-bold">{error}</p>
              </div>
            ) : paginatedPlaces.length > 0 ? (
              paginatedPlaces.map(item => (
                <SpiritualCard key={item._id || item.slug} item={item} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-text text-lg">No spiritual places found.</p>
              </div>
            )}
          </div>

          {!loading && !error && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              scrollTargetId="spiritual-grid"
            />
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Spiritual;
