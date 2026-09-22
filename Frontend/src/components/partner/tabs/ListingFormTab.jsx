import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  Trash2, 
  Check, 
  Star, 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  ShieldAlert,
  Car,
  Home,
  Compass,
  MapPin,
  Tag,
  DollarSign,
  Bike,
  Mountain,
  Users,
  Clock,
  CheckSquare
} from 'lucide-react';
import { uploadPartnerImages } from '../../../api/partnerApi';

const businessCategories = [
  { id: 'stays', name: 'Hotel / Homestay', icon: Home, type: 'Stay', unit: 'night', defaultVehicle: '' },
  { id: 'bike_rental', name: 'Bike Rental', icon: Bike, type: 'Rental', unit: 'day', defaultVehicle: 'Bike' },
  { id: 'scooty_rental', name: 'Scooty Rental', icon: Bike, type: 'Rental', unit: 'day', defaultVehicle: 'Scooty' },
  { id: 'car_rental', name: 'Car / Taxi Rental', icon: Car, type: 'Rental', unit: 'day', defaultVehicle: 'Car' },
  { id: 'guides', name: 'Local Guide', icon: Compass, type: 'Guide', unit: 'day', defaultVehicle: '' },
  { id: 'activities', name: 'Activity / Experience', icon: Mountain, type: 'Activity', unit: 'person', defaultVehicle: '' }
];

const uttarakhandDistricts = [
  'Almora', 'Bageshwar', 'Chamoli', 'Champawat', 'Dehradun', 
  'Haridwar', 'Nainital', 'Pauri Garhwal', 'Pithoragarh', 
  'Rudraprayag', 'Tehri Garhwal', 'Udham Singh Nagar', 'Uttarkashi'
];

const stayAmenitiesList = [
  'Free WiFi', 'Mountain View', 'Geyser / Hot Water', 'Bonfire', 
  'Power Backup', 'Free Parking', 'In-house Kitchen', 'Room Heater', 
  'Pet Friendly', 'Balcony', 'EV Charging'
];

const guideLanguagesList = [
  'Hindi', 'English', 'Garhwali', 'Kumaoni', 'Bengali', 'Punjabi', 'Gujarati'
];

const guideSpecializationsList = [
  'Trekking & Alpine Routes', 'Char Dham & Spiritual Heritage', 
  'Wildlife & Bird Watching', 'Local Culture & Village Walks', 
  'Adventure & Rock Climbing', 'Landscape Photography'
];

const activityTypesList = [
  'White Water River Rafting', 'Tandem Paragliding', 'Bungee Jumping & Giant Swing', 
  'Alpine Camping & Stargazing', 'Snow Skiing & Snowboarding', 'Zipline Adventure', 
  'Rock Climbing & Rappelling', 'Guided Himalayan Day Trek'
];

const ListingFormTab = ({ 
  initialData = null, 
  onSave, 
  onCancel, 
  isSubmitting 
}) => {
  const isEditing = Boolean(initialData?._id);

  // Normalize initial category
  const getInitialCategory = () => {
    if (!initialData) return 'stays';
    if (initialData.category === 'bike_rental') return 'bike_rental';
    if (initialData.category === 'scooty_rental') return 'scooty_rental';
    if (initialData.category === 'car_rental') return 'car_rental';
    if (initialData.category === 'rentals') {
      const vType = (initialData.specifications?.vehicleType || '').toLowerCase();
      if (vType === 'bike') return 'bike_rental';
      if (vType === 'scooty') return 'scooty_rental';
      return 'car_rental';
    }
    if (initialData.category === 'guides' || initialData.listingType === 'Guide') return 'guides';
    if (initialData.category === 'activities' || initialData.listingType === 'Activity') return 'activities';
    return 'stays';
  };

  const [category, setCategory] = useState(getInitialCategory);
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [district, setDistrict] = useState(initialData?.district || 'Dehradun');
  const [city, setCity] = useState(initialData?.city || '');
  const [locality, setLocality] = useState(initialData?.locality || '');
  const [address, setAddress] = useState(initialData?.location?.address || initialData?.address || '');
  const [latitude, setLatitude] = useState(initialData?.location?.coordinates?.[1] || initialData?.latitude || '');
  const [longitude, setLongitude] = useState(initialData?.location?.coordinates?.[0] || initialData?.longitude || '');

  // Vehicle Specifications
  const [vehicleSpecs, setVehicleSpecs] = useState({
    vehicleType: initialData?.specifications?.vehicleType || (category === 'scooty_rental' ? 'Scooty' : category === 'bike_rental' ? 'Bike' : 'Car'),
    brand: initialData?.specifications?.brand || '',
    model: initialData?.specifications?.model || '',
    year: initialData?.specifications?.year || new Date().getFullYear(),
    engineCapacity: initialData?.specifications?.engineCapacity || '',
    fuelType: initialData?.specifications?.fuelType || 'Petrol',
    transmission: initialData?.specifications?.transmission || 'Manual',
    seatingCapacity: initialData?.specifications?.seatingCapacity || (category === 'car_rental' ? 5 : 2),
    registrationNumber: initialData?.specifications?.registrationNumber || '',
    pickupLocation: initialData?.specifications?.pickupLocation || '',
    inclusions: initialData?.specifications?.features ? initialData.specifications.features.join(', ') : '2 ISI Helmets, Luggage Carrier'
  });

  // Stay Specifications
  const [staySpecs, setStaySpecs] = useState({
    propertyType: initialData?.specifications?.propertyType || 'Alpine Homestay',
    maxGuests: initialData?.capacity?.maxGuests || 2,
    bedrooms: initialData?.capacity?.bedrooms || 1,
    bathrooms: initialData?.capacity?.bathrooms || 1,
    checkInTime: initialData?.specifications?.checkInTime || '12:00 PM',
    checkOutTime: initialData?.specifications?.checkOutTime || '11:00 AM',
    amenities: initialData?.amenities || ['Free WiFi', 'Mountain View', 'Geyser / Hot Water']
  });

  // Guide Specifications
  const [guideSpecs, setGuideSpecs] = useState({
    experienceYears: initialData?.specifications?.experienceYears || 5,
    licenseNumber: initialData?.specifications?.registrationNumber || '',
    languages: initialData?.specifications?.languages || ['Hindi', 'English', 'Garhwali'],
    specializations: initialData?.specifications?.specializations || ['Trekking & Alpine Routes', 'Char Dham & Spiritual Heritage'],
    maxGroupSize: initialData?.capacity?.maxGuests || 8
  });

  // Activity Specifications
  const [activitySpecs, setActivitySpecs] = useState({
    activityType: initialData?.specifications?.activityType || 'White Water River Rafting',
    duration: initialData?.specifications?.duration || '3 Hours',
    difficulty: initialData?.specifications?.difficulty || 'Moderate',
    minAge: initialData?.specifications?.minAge || 12,
    maxGroupSize: initialData?.capacity?.maxGuests || 10,
    meetingPoint: initialData?.specifications?.pickupLocation || '',
    safetyGear: initialData?.specifications?.safetyGear || 'Life jackets, Helmets, Safety Kayaker escort'
  });

  // Photos
  const getInitialPhotos = () => {
    if (initialData?.photos && initialData.photos.length > 0) return initialData.photos;
    if (initialData?.images && initialData.images.length > 0) {
      return initialData.images.map(img => typeof img === 'string' ? img : img.url).filter(Boolean);
    }
    return [];
  };

  const [photos, setPhotos] = useState(getInitialPhotos);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Pricing Details
  const [pricingDetails, setPricingDetails] = useState({
    pricePerDay: initialData?.pricingDetails?.pricePerDay || initialData?.pricing?.amount || initialData?.pricing?.price || 1500,
    pricePerHour: initialData?.pricingDetails?.pricePerHour || 0,
    pricePerWeek: initialData?.pricingDetails?.pricePerWeek || 0,
    securityDeposit: initialData?.pricingDetails?.securityDeposit || 0,
    extraCharges: initialData?.pricingDetails?.extraCharges || '',
    cancellationPolicy: initialData?.pricingDetails?.cancellationPolicy || 'Flexible (Full refund up to 24h before)',
  });

  // Availability Details
  const [availabilityDetails, setAvailabilityDetails] = useState({
    totalUnits: initialData?.availabilityDetails?.totalUnits || 1,
    availableUnits: initialData?.availabilityDetails?.availableUnits || 1,
    statusReason: initialData?.availabilityDetails?.statusReason || 'Available',
  });

  const [formError, setFormError] = useState('');

  // Update vehicleType when category changes
  const handleCategoryChange = (catId) => {
    setCategory(catId);
    if (catId === 'bike_rental') {
      setVehicleSpecs(prev => ({ ...prev, vehicleType: 'Bike', seatingCapacity: 2 }));
    } else if (catId === 'scooty_rental') {
      setVehicleSpecs(prev => ({ ...prev, vehicleType: 'Scooty', seatingCapacity: 2 }));
    } else if (catId === 'car_rental') {
      setVehicleSpecs(prev => ({ ...prev, vehicleType: 'Car', seatingCapacity: 5 }));
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (photos.length + files.length > 10) {
      setUploadError('You can upload a maximum of 10 photos per listing.');
      return;
    }

    setIsUploadingPhotos(true);
    setUploadError('');

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      const res = await uploadPartnerImages(formData);
      if (res.success) {
        const newUrls = Array.isArray(res.urls) 
          ? res.urls 
          : Array.isArray(res.data) 
            ? res.data.map(d => typeof d === 'string' ? d : d.url).filter(Boolean)
            : [];
        if (newUrls.length > 0) {
          setPhotos((prev) => [...prev, ...newUrls]);
        } else {
          setUploadError('No image URLs returned from server.');
        }
      } else {
        setUploadError(res.message || 'Failed to upload images to Cloudinary.');
      }
    } catch (err) {
      setUploadError(err.message || 'Network error while uploading photos.');
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const setCoverPhoto = (index) => {
    setPhotos((prev) => {
      const updated = [...prev];
      const selected = updated.splice(index, 1)[0];
      return [selected, ...updated];
    });
  };

  const toggleStayAmenity = (item) => {
    setStaySpecs(prev => {
      const exists = prev.amenities.includes(item);
      return {
        ...prev,
        amenities: exists ? prev.amenities.filter(a => a !== item) : [...prev.amenities, item]
      };
    });
  };

  const toggleGuideLanguage = (lang) => {
    setGuideSpecs(prev => {
      const exists = prev.languages.includes(lang);
      return {
        ...prev,
        languages: exists ? prev.languages.filter(l => l !== lang) : [...prev.languages, lang]
      };
    });
  };

  const toggleGuideSpecialization = (spec) => {
    setGuideSpecs(prev => {
      const exists = prev.specializations.includes(spec);
      return {
        ...prev,
        specializations: exists ? prev.specializations.filter(s => s !== spec) : [...prev.specializations, spec]
      };
    });
  };

  const handleSubmit = (submitForVerification = false) => {
    setFormError('');

    if (!title.trim()) {
      setFormError('Please enter a listing title.');
      return;
    }
    if (!city.trim()) {
      setFormError('Please enter the operating city/town in Uttarakhand (e.g. Joshimath, Rishikesh, Nainital).');
      return;
    }
    if (!pricingDetails.pricePerDay || Number(pricingDetails.pricePerDay) <= 0) {
      setFormError('Please specify a valid daily / nightly rate (greater than ₹0).');
      return;
    }

    const currentCatObj = businessCategories.find(c => c.id === category) || businessCategories[0];
    const resolvedType = currentCatObj.type;

    // Build specifications according to category
    let finalSpecifications = {};
    let finalCapacity = {};
    let finalAmenities = [];

    if (category === 'stays') {
      finalCapacity = {
        maxGuests: Number(staySpecs.maxGuests) || 2,
        bedrooms: Number(staySpecs.bedrooms) || 1,
        bathrooms: Number(staySpecs.bathrooms) || 1
      };
      finalAmenities = staySpecs.amenities;
      finalSpecifications = {
        propertyType: staySpecs.propertyType,
        checkInTime: staySpecs.checkInTime,
        checkOutTime: staySpecs.checkOutTime
      };
    } else if (category === 'bike_rental' || category === 'scooty_rental' || category === 'car_rental') {
      finalSpecifications = {
        vehicleType: vehicleSpecs.vehicleType,
        brand: vehicleSpecs.brand.trim(),
        model: vehicleSpecs.model.trim(),
        year: Number(vehicleSpecs.year) || new Date().getFullYear(),
        engineCapacity: vehicleSpecs.engineCapacity.trim(),
        fuelType: vehicleSpecs.fuelType,
        transmission: vehicleSpecs.transmission,
        seatingCapacity: Number(vehicleSpecs.seatingCapacity) || 2,
        registrationNumber: vehicleSpecs.registrationNumber.trim(),
        pickupLocation: vehicleSpecs.pickupLocation.trim() || address.trim(),
        features: vehicleSpecs.inclusions
          ? vehicleSpecs.inclusions.split(',').map(f => f.trim()).filter(Boolean)
          : []
      };
    } else if (category === 'guides') {
      finalCapacity = {
        maxGuests: Number(guideSpecs.maxGroupSize) || 8
      };
      finalSpecifications = {
        experienceYears: Number(guideSpecs.experienceYears) || 1,
        registrationNumber: guideSpecs.licenseNumber.trim(),
        languages: guideSpecs.languages,
        specializations: guideSpecs.specializations
      };
    } else if (category === 'activities') {
      finalCapacity = {
        maxGuests: Number(activitySpecs.maxGroupSize) || 10
      };
      finalSpecifications = {
        activityType: activitySpecs.activityType,
        duration: activitySpecs.duration,
        difficulty: activitySpecs.difficulty,
        minAge: Number(activitySpecs.minAge) || 10,
        pickupLocation: activitySpecs.meetingPoint.trim() || address.trim(),
        safetyGear: activitySpecs.safetyGear.trim()
      };
    }

    const payload = {
      listingType: resolvedType,
      category,
      title: title.trim(),
      description: description.trim(),
      district: district.trim(),
      city: city.trim(),
      locality: locality.trim(),
      destinationSlug: (city || locality || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      address: address.trim(),
      location: (latitude && longitude) ? {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
        address: address.trim()
      } : (address ? { address: address.trim() } : null),
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      capacity: finalCapacity,
      amenities: finalAmenities,
      specifications: finalSpecifications,
      photos,
      images: photos.map((p) => (typeof p === 'string' ? { url: p, alt: title.trim() } : p)),
      pricing: {
        amount: Number(pricingDetails.pricePerDay),
        unit: currentCatObj.unit,
        currency: 'INR',
      },
      pricingDetails: {
        pricePerDay: Number(pricingDetails.pricePerDay),
        pricePerHour: Number(pricingDetails.pricePerHour) || 0,
        pricePerWeek: Number(pricingDetails.pricePerWeek) || 0,
        securityDeposit: Number(pricingDetails.securityDeposit) || 0,
        extraCharges: pricingDetails.extraCharges.trim(),
        cancellationPolicy: pricingDetails.cancellationPolicy,
      },
      availabilityDetails: {
        totalUnits: Number(availabilityDetails.totalUnits) || 1,
        availableUnits: Math.min(
          Number(availabilityDetails.availableUnits) || 1,
          Number(availabilityDetails.totalUnits) || 1
        ),
        statusReason: availabilityDetails.statusReason,
      },
      submitForVerification,
    };

    onSave(payload);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Back Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Listings
        </button>
        <div className="text-xs text-gray-500 font-medium">
          {isEditing ? 'Editing Listing: ' + (initialData?.title || '') : 'New Partner Listing Wizard'}
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{formError}</span>
        </div>
      )}

      {/* SECTION 1: Category Selection */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-forest-green">
            1. Select Tourism Business Category
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Choose the business service you operate in Uttarakhand
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {businessCategories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = category === cat.id;
            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between h-24 ${
                  isSelected
                    ? 'border-forest-green bg-forest-green/5 text-forest-green ring-2 ring-forest-green/20'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50/50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isSelected ? 'bg-forest-green text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  <Icon size={16} />
                </div>
                <span className="text-xs font-bold leading-tight mt-1">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Basic Information & Location */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-forest-green">
          2. Basic Information & Location
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Listing Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                category === 'stays'
                  ? 'e.g. Riverside Alpine Homestay & Cafe'
                  : category === 'bike_rental'
                    ? 'e.g. Royal Enfield Himalayan 450 (2024 Model)'
                    : category === 'scooty_rental'
                      ? 'e.g. Honda Activa 6G - Well Maintained'
                      : category === 'car_rental'
                        ? 'e.g. Toyota Innova Crysta 7-Seater with Driver'
                        : category === 'guides'
                          ? 'e.g. Certified High-Altitude Trek & Char Dham Guide'
                          : 'e.g. Shivpuri White Water Rafting (16 KM Expedition)'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm focus:outline-none focus:border-forest-green"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Uttarakhand District *
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm bg-white focus:outline-none focus:border-forest-green"
              required
            >
              {uttarakhandDistricts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              City / Town / Hub *
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Joshimath, Rishikesh, Mussoorie, Ranikhet, Nainital"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm focus:outline-none focus:border-forest-green"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Locality / Area
            </label>
            <input
              type="text"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              placeholder="e.g. Tapovan, Upper Bazaar, Mall Road, Auli Slope"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm focus:outline-none focus:border-forest-green"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Exact Address / Pickup Point
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Near Laxman Jhula Bridge or Main Badrinath Highway"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm focus:outline-none focus:border-forest-green"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Latitude (Optional)
            </label>
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="e.g. 30.134"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm focus:outline-none focus:border-forest-green"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Longitude (Optional)
            </label>
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="e.g. 78.324"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm focus:outline-none focus:border-forest-green"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Detailed Description & Highlights
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe vehicle condition, room ambiance, inclusions, guide expertise, or safety precautions..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm focus:outline-none focus:border-forest-green"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: Dynamic Category Specifications */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-forest-green flex items-center justify-between">
          <span>3. Category Specifications</span>
          <span className="text-xs font-medium text-gray-500 capitalize">
            {businessCategories.find(c => c.id === category)?.name}
          </span>
        </h3>

        {/* 3A: Hotel / Homestay Specs */}
        {category === 'stays' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Property Type
                </label>
                <select
                  value={staySpecs.propertyType}
                  onChange={(e) => setStaySpecs({ ...staySpecs, propertyType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm bg-white"
                >
                  <option value="Alpine Homestay">Alpine Homestay</option>
                  <option value="Boutique Hotel">Boutique Hotel</option>
                  <option value="Mountain Resort">Mountain Resort</option>
                  <option value="Riverside Camp">Riverside Camp / Cottage</option>
                  <option value="Hostel Dorm">Backpackers Hostel</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Max Guests Per Room
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={staySpecs.maxGuests}
                  onChange={(e) => setStaySpecs({ ...staySpecs, maxGuests: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bedrooms / Bathrooms
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Beds"
                    value={staySpecs.bedrooms}
                    onChange={(e) => setStaySpecs({ ...staySpecs, bedrooms: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Baths"
                    value={staySpecs.bathrooms}
                    onChange={(e) => setStaySpecs({ ...staySpecs, bathrooms: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Check-in Time
                </label>
                <input
                  type="text"
                  value={staySpecs.checkInTime}
                  onChange={(e) => setStaySpecs({ ...staySpecs, checkInTime: e.target.value })}
                  placeholder="e.g. 12:00 PM"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Check-out Time
                </label>
                <input
                  type="text"
                  value={staySpecs.checkOutTime}
                  onChange={(e) => setStaySpecs({ ...staySpecs, checkOutTime: e.target.value })}
                  placeholder="e.g. 11:00 AM"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                />
              </div>
            </div>

            {/* Stay Amenities Multi-select */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Available Amenities
              </label>
              <div className="flex flex-wrap gap-2">
                {stayAmenitiesList.map((amenity) => {
                  const isChecked = staySpecs.amenities.includes(amenity);
                  return (
                    <button
                      type="button"
                      key={amenity}
                      onClick={() => toggleStayAmenity(amenity)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-forest-green text-white shadow-xs'
                          : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {isChecked && <Check size={12} />}
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 3B: Vehicle Rentals (Bike, Scooty, Car) */}
        {(category === 'bike_rental' || category === 'scooty_rental' || category === 'car_rental') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Vehicle Type
              </label>
              <select
                value={vehicleSpecs.vehicleType}
                onChange={(e) => setVehicleSpecs({ ...vehicleSpecs, vehicleType: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm bg-white"
              >
                <option value="Bike">Motorcycle / Cruiser</option>
                <option value="Scooty">Scooty / Moped</option>
                <option value="Car">Sedan / Hatchback Car</option>
                <option value="SUV">SUV 4x4 / MUV</option>
                <option value="Tempo Traveller">Tempo Traveller (Minibus)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Brand / Manufacturer
              </label>
              <input
                type="text"
                value={vehicleSpecs.brand}
                onChange={(e) => setVehicleSpecs({ ...vehicleSpecs, brand: e.target.value })}
                placeholder="e.g. Royal Enfield, Honda, Maruti, Toyota"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Model Name
              </label>
              <input
                type="text"
                value={vehicleSpecs.model}
                onChange={(e) => setVehicleSpecs({ ...vehicleSpecs, model: e.target.value })}
                placeholder="e.g. Himalayan 450, Activa 6G, Innova Crysta"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Registration / Plate #
              </label>
              <input
                type="text"
                value={vehicleSpecs.registrationNumber}
                onChange={(e) => setVehicleSpecs({ ...vehicleSpecs, registrationNumber: e.target.value })}
                placeholder="e.g. UK07-AX-1234 (For verification)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Displacement / Engine (CC)
              </label>
              <input
                type="text"
                value={vehicleSpecs.engineCapacity}
                onChange={(e) => setVehicleSpecs({ ...vehicleSpecs, engineCapacity: e.target.value })}
                placeholder="e.g. 452cc or 110cc"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Fuel Type
              </label>
              <select
                value={vehicleSpecs.fuelType}
                onChange={(e) => setVehicleSpecs({ ...vehicleSpecs, fuelType: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm bg-white"
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric (EV)</option>
                <option value="CNG">CNG</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Transmission
              </label>
              <select
                value={vehicleSpecs.transmission}
                onChange={(e) => setVehicleSpecs({ ...vehicleSpecs, transmission: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm bg-white"
              >
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Seating Capacity
              </label>
              <input
                type="number"
                min="1"
                max="25"
                value={vehicleSpecs.seatingCapacity}
                onChange={(e) => setVehicleSpecs({ ...vehicleSpecs, seatingCapacity: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Included Accessories
              </label>
              <input
                type="text"
                value={vehicleSpecs.inclusions}
                onChange={(e) => setVehicleSpecs({ ...vehicleSpecs, inclusions: e.target.value })}
                placeholder="2 Helmets, Mobile Holder, Luggage Carrier"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm"
              />
            </div>
          </div>
        )}

        {/* 3C: Local Tour Guide */}
        {category === 'guides' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Years of Guiding Experience
                </label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={guideSpecs.experienceYears}
                  onChange={(e) => setGuideSpecs({ ...guideSpecs, experienceYears: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Uttarakhand Tourism Badge / License #
                </label>
                <input
                  type="text"
                  value={guideSpecs.licenseNumber}
                  onChange={(e) => setGuideSpecs({ ...guideSpecs, licenseNumber: e.target.value })}
                  placeholder="e.g. UTDB-G-2024-589"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Max Group Size Accommodated
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={guideSpecs.maxGroupSize}
                  onChange={(e) => setGuideSpecs({ ...guideSpecs, maxGroupSize: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm"
                />
              </div>
            </div>

            {/* Languages */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Languages Spoken Fluently
              </label>
              <div className="flex flex-wrap gap-2">
                {guideLanguagesList.map((lang) => {
                  const isChecked = guideSpecs.languages.includes(lang);
                  return (
                    <button
                      type="button"
                      key={lang}
                      onClick={() => toggleGuideLanguage(lang)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-forest-green text-white shadow-xs'
                          : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {isChecked && <Check size={12} />}
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Specializations */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Specialized Terrain & Knowledge
              </label>
              <div className="flex flex-wrap gap-2">
                {guideSpecializationsList.map((spec) => {
                  const isChecked = guideSpecs.specializations.includes(spec);
                  return (
                    <button
                      type="button"
                      key={spec}
                      onClick={() => toggleGuideSpecialization(spec)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-forest-green text-white shadow-xs'
                          : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {isChecked && <Check size={12} />}
                      {spec}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 3D: Activity / Experience */}
        {category === 'activities' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Activity Type
                </label>
                <select
                  value={activitySpecs.activityType}
                  onChange={(e) => setActivitySpecs({ ...activitySpecs, activityType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm bg-white"
                >
                  {activityTypesList.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  value={activitySpecs.duration}
                  onChange={(e) => setActivitySpecs({ ...activitySpecs, duration: e.target.value })}
                  placeholder="e.g. 3 Hours, Half Day, Full Day"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  value={activitySpecs.difficulty}
                  onChange={(e) => setActivitySpecs({ ...activitySpecs, difficulty: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm bg-white"
                >
                  <option value="Easy / Beginner">Easy / Beginner</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Challenging">Challenging</option>
                  <option value="Extreme / Expert">Extreme / Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Minimum Age Requirement
                </label>
                <input
                  type="number"
                  min="5"
                  max="18"
                  value={activitySpecs.minAge}
                  onChange={(e) => setActivitySpecs({ ...activitySpecs, minAge: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Max Slots / Group Size
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={activitySpecs.maxGroupSize}
                  onChange={(e) => setActivitySpecs({ ...activitySpecs, maxGroupSize: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Launch / Meeting Point
                </label>
                <input
                  type="text"
                  value={activitySpecs.meetingPoint}
                  onChange={(e) => setActivitySpecs({ ...activitySpecs, meetingPoint: e.target.value })}
                  placeholder="e.g. Marine Drive Rishikesh or Auli Chairlift"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Safety Gear & Precautions Provided
              </label>
              <input
                type="text"
                value={activitySpecs.safetyGear}
                onChange={(e) => setActivitySpecs({ ...activitySpecs, safetyGear: e.target.value })}
                placeholder="e.g. ISI certified helmets, life jackets, rescue kayak backup, certified instructors"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: Cloudinary Multi-Image Upload */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-forest-green">
              4. Photos & Media (Cloudinary Multi-Upload)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Upload real, high-resolution photographs. First image will be the primary cover photo.
            </p>
          </div>
          <span className="text-xs font-semibold text-gray-500">
            {photos.length} / 10 photos
          </span>
        </div>

        {uploadError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{uploadError}</span>
          </div>
        )}

        <label className={`block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
          isUploadingPhotos
            ? 'border-forest-green/50 bg-forest-green/5 cursor-wait'
            : 'border-gray-300 hover:border-forest-green hover:bg-gray-50/50'
        }`}>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handlePhotoUpload}
            disabled={isUploadingPhotos}
            className="hidden"
          />
          <div className="flex flex-col items-center">
            {isUploadingPhotos ? (
              <>
                <Loader2 size={32} className="animate-spin text-forest-green mb-2" />
                <span className="text-xs font-bold text-forest-green">Uploading photos to Cloudinary CDN...</span>
                <span className="text-[11px] text-gray-500 mt-0.5">Optimizing formats and storing securely</span>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-forest-green/10 text-forest-green flex items-center justify-center mb-2">
                  <UploadCloud size={24} />
                </div>
                <span className="text-xs font-bold text-gray-800">
                  Click or Drag & Drop Images Here
                </span>
                <span className="text-[11px] text-gray-500 mt-1">
                  Supports JPG, PNG, WEBP up to 10MB each (Maximum 10 photos)
                </span>
              </>
            )}
          </div>
        </label>

        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
            {photos.map((url, idx) => (
              <div
                key={idx}
                className="group relative rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-100 shadow-xs"
              >
                <img src={url} alt={`Listing upload ${idx + 1}`} className="w-full h-full object-cover" />
                
                {idx === 0 && (
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-forest-green text-white text-[10px] font-bold shadow-xs flex items-center gap-0.5">
                    <Star size={10} fill="white" /> Cover
                  </span>
                )}

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {idx !== 0 && (
                    <button
                      type="button"
                      onClick={() => setCoverPhoto(idx)}
                      title="Set as cover photo"
                      className="p-1.5 rounded-lg bg-white/90 text-gray-800 hover:bg-white text-xs font-semibold transition-transform active:scale-95"
                    >
                      <Star size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    title="Remove photo"
                    className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold transition-transform active:scale-95"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 5: Pricing Matrix */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-forest-green">
            5. Pricing Matrix & Security Deposit
          </h3>
          <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
            <ShieldAlert size={14} />
            <span>
              All partner price adjustments are saved with provenance <strong>PARTNER_CLAIMED</strong> until reviewed by platform admin.
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {category === 'stays' ? 'Rate Per Night (₹) *' : category === 'activities' ? 'Rate Per Person (₹) *' : 'Rate Per Day (₹) *'}
            </label>
            <input
              type="number"
              min="0"
              value={pricingDetails.pricePerDay}
              onChange={(e) => setPricingDetails({ ...pricingDetails, pricePerDay: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm focus:outline-none focus:border-forest-green font-bold text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Rate Per Hour (₹) [Optional]
            </label>
            <input
              type="number"
              min="0"
              value={pricingDetails.pricePerHour}
              onChange={(e) => setPricingDetails({ ...pricingDetails, pricePerHour: e.target.value })}
              placeholder="0"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm focus:outline-none focus:border-forest-green"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Weekly Rate (₹) [Discounted]
            </label>
            <input
              type="number"
              min="0"
              value={pricingDetails.pricePerWeek}
              onChange={(e) => setPricingDetails({ ...pricingDetails, pricePerWeek: e.target.value })}
              placeholder="0"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm focus:outline-none focus:border-forest-green"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Refundable Security Deposit (₹)
            </label>
            <input
              type="number"
              min="0"
              value={pricingDetails.securityDeposit}
              onChange={(e) => setPricingDetails({ ...pricingDetails, securityDeposit: e.target.value })}
              placeholder="0"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm focus:outline-none focus:border-forest-green"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Extra Charges / Fuel & Gear Rules
            </label>
            <input
              type="text"
              value={pricingDetails.extraCharges}
              onChange={(e) => setPricingDetails({ ...pricingDetails, extraCharges: e.target.value })}
              placeholder="e.g. Extra riding jacket ₹200/day, Fuel not included, 250 km/day limit"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm focus:outline-none focus:border-forest-green"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Cancellation Policy
            </label>
            <select
              value={pricingDetails.cancellationPolicy}
              onChange={(e) => setPricingDetails({ ...pricingDetails, cancellationPolicy: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm bg-white focus:outline-none focus:border-forest-green"
            >
              <option value="Flexible (Full refund up to 24h before)">Flexible (Full refund up to 24h before)</option>
              <option value="Moderate (Full refund up to 3 days before)">Moderate (Full refund up to 3 days before)</option>
              <option value="Strict (50% refund up to 7 days before)">Strict (50% refund up to 7 days before)</option>
              <option value="Non-Refundable">Non-Refundable</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 6: Fleet Inventory & Availability */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-forest-green">
          6. Inventory & Units Available
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Total Units / Rooms / Slots *
            </label>
            <input
              type="number"
              min="1"
              max="200"
              value={availabilityDetails.totalUnits}
              onChange={(e) => setAvailabilityDetails({ ...availabilityDetails, totalUnits: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm focus:outline-none focus:border-forest-green font-bold text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Currently Available *
            </label>
            <input
              type="number"
              min="0"
              max={availabilityDetails.totalUnits}
              value={availabilityDetails.availableUnits}
              onChange={(e) => setAvailabilityDetails({ ...availabilityDetails, availableUnits: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm focus:outline-none focus:border-forest-green font-bold text-emerald-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Operational Status
            </label>
            <select
              value={availabilityDetails.statusReason}
              onChange={(e) => setAvailabilityDetails({ ...availabilityDetails, statusReason: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm bg-white focus:outline-none focus:border-forest-green"
            >
              <option value="Available">Available for booking</option>
              <option value="Maintenance">Maintenance / In Servicing</option>
              <option value="Rented">Currently Rented</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Action Buttons */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs md:text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={isSubmitting || isUploadingPhotos}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs md:text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save as Draft'}
        </button>

        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={isSubmitting || isUploadingPhotos}
          className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-forest-green hover:bg-forest-green/90 text-white text-xs md:text-sm font-semibold shadow-md shadow-forest-green/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Check size={16} />
              <span>Save & Submit for Verification</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ListingFormTab;
