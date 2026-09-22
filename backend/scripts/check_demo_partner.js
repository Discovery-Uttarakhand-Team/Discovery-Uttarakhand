import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Partner from '../models/Partner.js';
import PartnerListing from '../models/PartnerListing.js';

dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/discovery_uttarakhand');

  // Check if demo partner exists
  let partnerUser = await User.findOne({ email: 'partner@discovery.com' });
  if (!partnerUser) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('partner123', salt);
    partnerUser = await User.create({
      name: 'Ramesh Singh (Himalayan Stays & Rentals)',
      email: 'partner@discovery.com',
      password: hashedPassword,
      role: 'partner',
      phone: '+91 9876543210'
    });
    console.log('Created demo partner user: partner@discovery.com / partner123');
  } else {
    // Ensure role is partner
    if (partnerUser.role !== 'partner') {
      partnerUser.role = 'partner';
      await partnerUser.save();
    }
  }

  // Ensure Partner profile exists
  let partnerProfile = await Partner.findOne({ user: partnerUser._id });
  if (!partnerProfile) {
    partnerProfile = await Partner.create({
      user: partnerUser._id,
      ownerUser: partnerUser._id,
      businessName: 'Himalayan Stays & Mountain Fleet',
      legalBusinessName: 'Himalayan Hospitality & Rentals Pvt Ltd',
      partnerType: 'Homestay',
      phone: '+91 9876543210',
      email: 'partner@discovery.com',
      district: 'Chamoli',
      city: 'Joshimath',
      locality: 'Upper Bazaar',
      address: 'Main Badrinath Highway, Near Ropeway',
      status: 'APPROVED',
      isVerified: true
    });
    console.log('Created demo partner profile');
  }

  // Check if listings exist
  const listingCount = await PartnerListing.countDocuments({ ownerUser: partnerUser._id });
  if (listingCount === 0) {
    // Create 2 sample listings
    await PartnerListing.create({
      partner: partnerProfile._id,
      ownerUser: partnerUser._id,
      listingType: 'Stay',
      category: 'stays',
      title: 'Alpine Pine Wood Homestay & Cafe',
      slug: 'alpine-pine-wood-homestay-cafe',
      district: 'Chamoli',
      city: 'Joshimath',
      locality: 'Upper Bazaar',
      address: 'Near Auli Ropeway Station',
      description: 'Cozy wooden mountain cottages with panoramic views of Nanda Devi and snow-capped Himalayan ranges.',
      amenities: ['Free WiFi', 'Mountain View', 'Geyser / Hot Water', 'Bonfire', 'In-house Kitchen', 'Power Backup'],
      capacity: { maxGuests: 3, bedrooms: 1, bathrooms: 1 },
      specifications: { propertyType: 'Alpine Homestay', checkInTime: '12:00 PM', checkOutTime: '11:00 AM' },
      pricingDetails: { pricePerDay: 2800, securityDeposit: 0, cancellationPolicy: 'Flexible (Full refund up to 24h before)' },
      pricing: { amount: 2800, unit: 'night', currency: 'INR', provenance: 'VERIFIED' },
      availabilityDetails: { totalUnits: 4, availableUnits: 3, statusReason: 'Available' },
      status: 'ACTIVE',
      isActive: true,
      photos: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'
      ],
      images: [
        { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', alt: 'Pine Wood Homestay' }
      ]
    });

    await PartnerListing.create({
      partner: partnerProfile._id,
      ownerUser: partnerUser._id,
      listingType: 'Rental',
      category: 'bike_rental',
      title: 'Royal Enfield Himalayan 450 (Expedition Edition)',
      slug: 'royal-enfield-himalayan-450-expedition',
      district: 'Chamoli',
      city: 'Joshimath',
      locality: 'Upper Bazaar',
      address: 'Near Joshimath Bus Stand',
      description: 'Brand new Royal Enfield Himalayan 450cc with panniers, dual-channel ABS and tubeless spoked wheels for Mana Pass / Badrinath.',
      specifications: {
        vehicleType: 'Bike',
        brand: 'Royal Enfield',
        model: 'Himalayan 450',
        year: 2024,
        engineCapacity: '452cc',
        fuelType: 'Petrol',
        transmission: 'Manual',
        seatingCapacity: 2,
        registrationNumber: 'UK07-AX-4520',
        features: ['2 ISI Helmets', 'Luggage Carrier', 'Mobile Mount with Fast Charger']
      },
      pricingDetails: { pricePerDay: 1800, securityDeposit: 2000, cancellationPolicy: 'Flexible (Full refund up to 24h before)' },
      pricing: { amount: 1800, unit: 'day', currency: 'INR', provenance: 'VERIFIED' },
      availabilityDetails: { totalUnits: 3, availableUnits: 2, statusReason: 'Available' },
      status: 'ACTIVE',
      isActive: true,
      photos: [
        'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800'
      ],
      images: [
        { url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800', alt: 'Royal Enfield Himalayan 450' }
      ]
    });
    console.log('Created sample active listings for demo partner');
  }

  console.log('\n=== DEMO PARTNER CREDENTIALS ===');
  console.log('Email: partner@discovery.com');
  console.log('Password: partner123');
  console.log('Dashboard URL: http://localhost:5173/partner');
  console.log('Role: partner');
  console.log('=================================\n');

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
