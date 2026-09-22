import React, { useState, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CategoryHero from '../components/CategoryHero';
import Pagination from '../components/common/Pagination';
import { useActivities } from '../hooks/useActivities';
import ActivityCard from '../components/ActivityCard';

const ITEMS_PER_PAGE = 12;

const Activities = () => {
  const { activities, loading, error } = useActivities();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(activities.length / ITEMS_PER_PAGE);

  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return activities.slice(start, start + ITEMS_PER_PAGE);
  }, [activities, currentPage]);

  return (
    <div className="min-h-screen flex flex-col pt-32">
      <Navbar />
      
      <main className="flex-grow flex flex-col">
        <CategoryHero 
          title="Adventure & Activities"
          subtitle="Experience the thrill of the Himalayas."
          bgImage="https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=2000&auto=format&fit=crop"
        />
        
        <section className="py-12 px-4 md:px-8 max-w-[1440px] mx-auto w-full">
          <div id="activities-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 scroll-mt-24">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-text text-lg font-bold">Loading activities...</p>
              </div>
            ) : error ? (
              <div className="col-span-full text-center py-12">
                <p className="text-red-500 text-lg font-bold">{error}</p>
              </div>
            ) : paginatedActivities.length > 0 ? (
              paginatedActivities.map(item => (
                <ActivityCard key={item._id || item.slug} item={item} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-text text-lg">No activities found.</p>
              </div>
            )}
          </div>

          {!loading && !error && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              scrollTargetId="activities-grid"
            />
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Activities;
