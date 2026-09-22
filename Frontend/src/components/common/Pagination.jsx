import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Discovery Uttarakhand - Universal Pagination Component
 * 
 * - Responsive, accessible smart pagination with ellipsis
 * - Matches forest green / cream / white aesthetic
 * - Smooth scroll-to-top on page change
 * - Graceful handling when totalPages <= 1 (renders null)
 */
const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  scrollToTop = true,
  targetId = null,
  scrollTargetId = null,
  className = ''
}) => {
  if (!totalPages || totalPages <= 1) return null;

  const handlePageClick = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    if (onPageChange) {
      onPageChange(page);
    }
    if (scrollToTop) {
      const scrollId = scrollTargetId || targetId;
      if (scrollId) {
        const el = document.getElementById(scrollId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
      window.scrollTo({ top: 350, behavior: 'smooth' });
    }
  };

  // Smart page number algorithm with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Always include page 1
    pages.push(1);

    if (currentPage > 4) {
      pages.push('ellipsis-start');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 3) {
      pages.push('ellipsis-end');
    }

    // Always include last page
    pages.push(totalPages);

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      aria-label="Pagination Navigation"
      className={`flex items-center justify-center gap-1.5 sm:gap-2 my-10 select-none ${className}`}
    >
      {/* Previous Button */}
      <button
        type="button"
        aria-label="Previous page"
        disabled={currentPage <= 1}
        onClick={() => handlePageClick(currentPage - 1)}
        className="flex items-center gap-1 px-3 sm:px-4 h-10 rounded-full bg-white border border-border-light text-text-dark text-xs sm:text-sm font-bold shadow-xs hover:bg-beige/40 hover:border-forest-green/40 transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-border-light"
      >
        <ChevronLeft size={16} strokeWidth={2.5} />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {pageNumbers.map((page, idx) => {
          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
            return (
              <span
                key={`${page}-${idx}`}
                className="w-8 h-10 flex items-center justify-center text-muted-text font-bold text-sm"
              >
                …
              </span>
            );
          }

          const isActive = page === currentPage;

          return (
            <button
              key={page}
              type="button"
              aria-label={`Page ${page}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => handlePageClick(page)}
              className={`min-w-10 h-10 px-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center ${
                isActive
                  ? 'bg-forest-green text-white shadow-sm border border-forest-green'
                  : 'bg-white border border-border-light text-text-dark hover:bg-forest-green/10 hover:text-forest-green hover:border-forest-green/30'
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      <button
        type="button"
        aria-label="Next page"
        disabled={currentPage >= totalPages}
        onClick={() => handlePageClick(currentPage + 1)}
        className="flex items-center gap-1 px-3 sm:px-4 h-10 rounded-full bg-white border border-border-light text-text-dark text-xs sm:text-sm font-bold shadow-xs hover:bg-beige/40 hover:border-forest-green/40 transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-border-light"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight size={16} strokeWidth={2.5} />
      </button>
    </nav>
  );
};

export default Pagination;
