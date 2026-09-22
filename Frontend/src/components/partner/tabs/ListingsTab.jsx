import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Layers, 
  Edit3, 
  Trash2, 
  Clock, 
  Tag, 
  ShieldCheck, 
  AlertCircle, 
  Send, 
  ImageIcon,
  Car,
  Home,
  Compass,
  MapPin,
  Bike,
  Mountain
} from 'lucide-react';

const categoryIcons = {
  rentals: Car,
  bike_rental: Bike,
  scooty_rental: Bike,
  car_rental: Car,
  stays: Home,
  guides: Compass,
  activities: Mountain,
};

const categoryLabels = {
  stays: 'Stay / Homestay',
  bike_rental: 'Bike Rental',
  scooty_rental: 'Scooty Rental',
  car_rental: 'Car Rental',
  rentals: 'Vehicle Rental',
  guides: 'Guide',
  activities: 'Activity',
};

const ListingsTab = ({ 
  listings = [], 
  onAddListing, 
  onEditListing, 
  onManagePricing, 
  onManageAvailability, 
  onDeleteListing,
  onSubmitVerification,
  isDeleting
}) => {
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredListings = listings.filter((item) => {
    let matchesCategory = true;
    if (filterCategory !== 'all') {
      if (filterCategory === 'bike_rental') {
        matchesCategory = item.category === 'bike_rental' || (item.category === 'rentals' && item.specifications?.vehicleType?.toLowerCase() === 'bike');
      } else if (filterCategory === 'scooty_rental') {
        matchesCategory = item.category === 'scooty_rental' || (item.category === 'rentals' && item.specifications?.vehicleType?.toLowerCase() === 'scooty');
      } else if (filterCategory === 'car_rental') {
        matchesCategory = item.category === 'car_rental' || (item.category === 'rentals' && ['car', 'suv', 'tempo traveller'].includes(item.specifications?.vehicleType?.toLowerCase()));
      } else {
        matchesCategory = item.category === filterCategory;
      }
    }

    const matchesSearch = 
      !searchQuery ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.specifications?.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.specifications?.registrationNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.city?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusBadge = (status, isActive) => {
    if (status === 'ACTIVE' || (status === 'VERIFIED' && isActive)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <ShieldCheck size={12} /> Active / Live
        </span>
      );
    }
    if (status === 'PENDING_VERIFICATION') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <AlertCircle size={12} /> Pending Review
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          Rejected
        </span>
      );
    }
    if (status === 'SUSPENDED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
          Archived / Suspended
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
        Draft
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Search & Category Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, model, registration no., city..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm bg-white focus:outline-none focus:border-forest-green focus:ring-1 focus:ring-forest-green transition-all"
          />
        </div>

        {/* Add Listing Button */}
        <button
          onClick={onAddListing}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-forest-green hover:bg-forest-green/90 text-white text-xs md:text-sm font-semibold shadow-sm transition-all"
        >
          <Plus size={16} />
          Add New Listing
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Listings' },
          { id: 'stays', label: 'Stays / Homestays' },
          { id: 'bike_rental', label: 'Bikes' },
          { id: 'scooty_rental', label: 'Scooties' },
          { id: 'car_rental', label: 'Cars' },
          { id: 'guides', label: 'Guides' },
          { id: 'activities', label: 'Activities' },
        ].map((pill) => (
          <button
            key={pill.id}
            onClick={() => setFilterCategory(pill.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filterCategory === pill.id
                ? 'bg-forest-green text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Listings List / Grid */}
      {filteredListings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-4 text-gray-400">
            <Layers size={24} />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Listings Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            {searchQuery
              ? 'No listings match your search criteria. Try a different query or clear filters.'
              : 'You have not added any listings in this category yet. Click Add New Listing to list your service or property.'}
          </p>
          <button
            onClick={onAddListing}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-green text-white text-xs font-semibold shadow-xs"
          >
            <Plus size={16} />
            Add First Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((item) => {
            const coverPhoto = 
              (item.photos && item.photos.length > 0 ? item.photos[0] : null) || 
              (item.images && item.images.length > 0 ? (typeof item.images[0] === 'string' ? item.images[0] : item.images[0]?.url) : null);
            
            const CategoryIcon = categoryIcons[item.category] || Layers;
            const priceDay = item.pricingDetails?.pricePerDay || item.pricing?.amount || item.pricing?.price || 0;
            const priceHour = item.pricingDetails?.pricePerHour || 0;
            const pricingUnit = item.pricing?.unit || (item.listingType === 'Stay' ? 'night' : item.listingType === 'Activity' ? 'person' : 'day');

            const totalPhotosCount = (item.photos?.length || 0) + (item.images?.length || 0);

            return (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
              >
                {/* Image Banner */}
                <div className="relative h-44 bg-gray-100 overflow-hidden group">
                  {coverPhoto ? (
                    <img
                      src={coverPhoto}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                      <ImageIcon size={32} />
                      <span className="text-[11px] mt-1 font-medium">No photos uploaded</span>
                    </div>
                  )}

                  {/* Top Status & Category Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-xs flex items-center gap-1">
                      <CategoryIcon size={12} />
                      {categoryLabels[item.category] || item.category}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    {getStatusBadge(item.status, item.isActive)}
                  </div>

                  {totalPhotosCount > 1 && (
                    <div className="absolute bottom-2 right-3 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-medium backdrop-blur-xs">
                      +{totalPhotosCount - 1} more photos
                    </div>
                  )}
                </div>

                {/* Content Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-gray-900 line-clamp-1">
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <MapPin size={12} className="text-gray-400" />
                      <span className="truncate">{item.city || item.district || 'Uttarakhand'}</span>
                      {item.specifications?.registrationNumber && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[11px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                            {item.specifications.registrationNumber}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Specifications snippet */}
                    {item.specifications && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] text-gray-600">
                        {item.specifications.model && (
                          <span className="px-2 py-0.5 rounded bg-gray-50 border border-gray-200">
                            {item.specifications.model}
                          </span>
                        )}
                        {item.specifications.propertyType && (
                          <span className="px-2 py-0.5 rounded bg-gray-50 border border-gray-200">
                            {item.specifications.propertyType}
                          </span>
                        )}
                        {item.specifications.activityType && (
                          <span className="px-2 py-0.5 rounded bg-gray-50 border border-gray-200">
                            {item.specifications.activityType}
                          </span>
                        )}
                        {item.specifications.engineCapacity && (
                          <span className="px-2 py-0.5 rounded bg-gray-50 border border-gray-200">
                            {item.specifications.engineCapacity}
                          </span>
                        )}
                        {item.specifications.fuelType && (
                          <span className="px-2 py-0.5 rounded bg-gray-50 border border-gray-200">
                            {item.specifications.fuelType}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Pricing & Units Grid */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500">Rate</div>
                      <div className="text-base font-extrabold text-gray-900">
                        ₹{priceDay.toLocaleString('en-IN')}
                        <span className="text-xs text-gray-500 font-normal">/{pricingUnit}</span>
                      </div>
                      {priceHour > 0 && (
                        <div className="text-[10px] text-gray-400">
                          ₹{priceHour}/hr
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-gray-500">Inventory</div>
                      <div className="text-sm font-bold text-gray-900">
                        <span className="text-emerald-700">
                          {item.availabilityDetails?.availableUnits ?? 1}
                        </span>
                        <span className="text-gray-400 text-xs"> / {item.availabilityDetails?.totalUnits ?? 1}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 capitalize">
                        {item.availabilityDetails?.statusReason || 'Available'}
                      </div>
                    </div>
                  </div>

                  {/* Pricing Provenance Indicator */}
                  <div className="text-[11px] flex items-center justify-between text-gray-500 pt-1">
                    <span>Pricing Status:</span>
                    <span className={`font-semibold ${
                      item.pricing?.provenance === 'VERIFIED'
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }`}>
                      {item.pricing?.provenance || 'PARTNER_CLAIMED'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center gap-1.5 border-t border-gray-100">
                    <button
                      onClick={() => onEditListing(item)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors"
                      title="Edit specifications, photos, and info"
                    >
                      <Edit3 size={13} />
                      Edit
                    </button>

                    <button
                      onClick={() => onManagePricing(item)}
                      className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors"
                      title="Adjust pricing matrix"
                    >
                      <Tag size={13} />
                      Price
                    </button>

                    <button
                      onClick={() => onManageAvailability(item)}
                      className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors"
                      title="Adjust fleet availability & blocked dates"
                    >
                      <Clock size={13} />
                      Units
                    </button>

                    {item.status === 'DRAFT' && (
                      <button
                        onClick={() => onSubmitVerification(item._id)}
                        className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold text-emerald-800 transition-colors"
                        title="Submit to Platform Admin for verification"
                      >
                        <Send size={13} />
                        Verify
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteListing(item._id, item.title)}
                      disabled={isDeleting}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-rose-50 hover:border-rose-200 text-gray-500 hover:text-rose-600 transition-colors"
                      title="Archive or Delete Listing"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ListingsTab;
