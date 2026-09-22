import React, { useState, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CultureCard from '../components/CultureCard';
import CategoryHero from '../components/CategoryHero';
import Pagination from '../components/common/Pagination';
import { useCulturePlaces } from '../hooks/useCulture';

const ITEMS_PER_PAGE = 12;

const Culture = () => {
  const { places, loading, error } = useCulturePlaces();
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
          title="Uttarakhand Culture"
          subtitle="Discover the traditions, heritage, art and living culture of the Himalayas."
          bgImage="https://images.unsplash.com/photo-1596404987012-4217117df854?q=80&w=2000&auto=format&fit=crop"
        />
        
        <section className="py-12 px-4 md:px-8 max-w-[1440px] mx-auto w-full">
          <div id="culture-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 scroll-mt-24">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-text text-lg font-bold">Loading culture places...</p>
              </div>
            ) : error ? (
              <div className="col-span-full text-center py-12">
                <p className="text-red-500 text-lg font-bold">{error}</p>
              </div>
            ) : paginatedPlaces.length > 0 ? (
              paginatedPlaces.map(item => (
                <CultureCard key={item._id || item.slug} item={item} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-text text-lg">No culture places found.</p>
              </div>
            )}
          </div>

          {!loading && !error && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              scrollTargetId="culture-grid"
            />
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Culture;
