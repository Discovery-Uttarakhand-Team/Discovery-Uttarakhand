/**
 * Discovery Uttarakhand — Partner / Business Owner Dashboard Complete Test Suite
 * Validates all 20 business rules, multi-tenant isolation, lifecycle states,
 * earnings, expenses, analytics, and reviews.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Partner from '../models/Partner.js';
import PartnerListing from '../models/PartnerListing.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import PartnerExpense from '../models/PartnerExpense.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_generated_secret';
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] #${totalTests}: ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] #${totalTests}: ${message}`);
    failedTests++;
  }
}

const createAuthHeader = (user) => {
  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

async function runDashboardSuite() {
  console.log('============================================================');
  console.log('PARTNER / BUSINESS OWNER DASHBOARD COMPREHENSIVE TEST SUITE');
  console.log('============================================================\n');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/discovery_uttarakhand');

  // Clean up any old test records
  const testEmails = [
    'test_partner_a@discovery.local',
    'test_partner_b@discovery.local',
    'test_admin_dash@discovery.local',
    'test_tourist_dash@discovery.local'
  ];

  await User.deleteMany({ email: { $in: testEmails } });
  await Partner.deleteMany({ email: { $in: testEmails } });
  await PartnerListing.deleteMany({ title: { $regex: /^(Test Partner A|Test Partner B)/ } });
  await PartnerExpense.deleteMany({ description: { $regex: /^Test Expense/ } });

  // 1. Create Test Users & Partner Profiles
  const partnerAUser = await User.create({
    name: 'Partner A (Joshimath Homestay)',
    email: 'test_partner_a@discovery.local',
    password: 'password123',
    role: 'partner'
  });

  const partnerBUser = await User.create({
    name: 'Partner B (Rishikesh Bikes)',
    email: 'test_partner_b@discovery.local',
    password: 'password123',
    role: 'partner'
  });

  const adminUser = await User.create({
    name: 'Platform Admin',
    email: 'test_admin_dash@discovery.local',
    password: 'password123',
    role: 'admin'
  });

  const touristUser = await User.create({
    name: 'Tourist Rider',
    email: 'test_tourist_dash@discovery.local',
    password: 'password123',
    role: 'user'
  });

  const partnerA = await Partner.create({
    user: partnerAUser._id,
    businessName: 'Joshimath Alpine Retreat',
    ownerUser: partnerAUser._id,
    email: partnerAUser.email,
    phone: '+91 9876543210',
    district: 'Chamoli',
    partnerType: 'Homestay',
    status: 'APPROVED',
    isVerified: true
  });

  const partnerB = await Partner.create({
    user: partnerBUser._id,
    businessName: 'Rishikesh Royal Enfield Rentals',
    ownerUser: partnerBUser._id,
    email: partnerBUser.email,
    phone: '+91 9876543211',
    district: 'Dehradun',
    partnerType: 'VehicleRental',
    status: 'APPROVED',
    isVerified: true
  });

  const headersA = createAuthHeader(partnerAUser);
  const headersB = createAuthHeader(partnerBUser);
  const headersAdmin = createAuthHeader(adminUser);
  const headersTourist = createAuthHeader(touristUser);

  console.log('--- TEST GROUP 1: LISTING LIFECYCLE & STATE MACHINE ---');

  // Test 1: Direct listing creation saves status as DRAFT when submitForVerification is false
  const createDraftRes = await fetch(`${BASE_URL}/api/partner/listings`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      listingType: 'Stay',
      category: 'stays',
      title: 'Test Partner A Draft Homestay',
      district: 'Chamoli',
      city: 'Joshimath',
      pricing: { amount: 2500, unit: 'night' },
      pricingDetails: { pricePerDay: 2500 },
      submitForVerification: false
    })
  });
  const draftData = await createDraftRes.json();
  const draftListing = draftData.data;
  assert(
    createDraftRes.status === 201 && draftListing?.status === 'DRAFT',
    'Rule 1: Listing created with submitForVerification=false is saved as DRAFT'
  );

  // Test 2: Direct listing creation saves status as PENDING_VERIFICATION when submitForVerification is true
  const createPendingRes = await fetch(`${BASE_URL}/api/partner/listings`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      listingType: 'Stay',
      category: 'stays',
      title: 'Test Partner A Alpine Suite',
      district: 'Chamoli',
      city: 'Joshimath',
      pricing: { amount: 3500, unit: 'night' },
      pricingDetails: { pricePerDay: 3500 },
      submitForVerification: true
    })
  });
  const pendingData = await createPendingRes.json();
  const pendingListing = pendingData.data;
  assert(
    createPendingRes.status === 201 && pendingListing?.status === 'PENDING_VERIFICATION',
    'Rule 2: Listing created with submitForVerification=true is saved as PENDING_VERIFICATION'
  );

  // Test 3: Partner cannot directly set status to 'ACTIVE' or 'VERIFIED' in create/update payloads
  const spoofActiveRes = await fetch(`${BASE_URL}/api/partner/listings`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      listingType: 'Stay',
      category: 'stays',
      title: 'Test Partner A Spoofed Active',
      district: 'Chamoli',
      city: 'Joshimath',
      status: 'ACTIVE',
      pricing: { amount: 4000, unit: 'night' },
      pricingDetails: { pricePerDay: 4000 },
      submitForVerification: false
    })
  });
  const spoofData = await spoofActiveRes.json();
  assert(
    spoofActiveRes.status === 400 || (spoofData.data?.status !== 'ACTIVE' && spoofData.data?.status === 'DRAFT'),
    'Rule 3: Partner cannot spoof status to ACTIVE on creation (server enforces state machine)'
  );

  // Test 4: Partner can submit an existing DRAFT for verification
  const submitRes = await fetch(`${BASE_URL}/api/partner/listings/${draftListing._id}/submit`, {
    method: 'POST',
    headers: headersA
  });
  const submitData = await submitRes.json();
  assert(
    submitRes.status === 200 && submitData.data?.status === 'PENDING_VERIFICATION',
    'Rule 4: Partner can submit DRAFT listing for platform verification'
  );

  // Test 5: Admin can verify a listing, promoting it to VERIFIED / ACTIVE
  const verifyRes = await fetch(`${BASE_URL}/api/admin/listings/${pendingListing._id}/verify`, {
    method: 'POST',
    headers: headersAdmin,
    body: JSON.stringify({
      notes: 'All safety and property documents checked'
    })
  });
  const verifyData = await verifyRes.json();
  assert(
    verifyRes.status === 200 && (verifyData.data?.status === 'ACTIVE' || verifyData.data?.status === 'VERIFIED'),
    'Rule 5: Platform Admin approval promotes listing to VERIFIED / ACTIVE status'
  );

  // Test 6: Admin can reject a listing with verification notes
  const rejectRes = await fetch(`${BASE_URL}/api/admin/listings/${draftListing._id}/reject`, {
    method: 'POST',
    headers: headersAdmin,
    body: JSON.stringify({
      reason: 'Please upload clearer facade photos'
    })
  });
  const rejectData = await rejectRes.json();
  assert(
    rejectRes.status === 200 && rejectData.data?.status === 'REJECTED' && rejectData.data?.verificationNotes === 'Please upload clearer facade photos',
    'Rule 6: Platform Admin rejection sets status to REJECTED with notes'
  );

  console.log('\n--- TEST GROUP 2: MULTI-TENANT ISOLATION ---');

  // Create listing for Partner B
  const bListingRes = await fetch(`${BASE_URL}/api/partner/listings`, {
    method: 'POST',
    headers: headersB,
    body: JSON.stringify({
      listingType: 'Rental',
      category: 'bike_rental',
      title: 'Test Partner B Himalayan 450 Rental',
      district: 'Dehradun',
      city: 'Rishikesh',
      pricing: { amount: 1800, unit: 'day' },
      pricingDetails: { pricePerDay: 1800 },
      specifications: { vehicleType: 'Bike', model: 'Himalayan 450' },
      submitForVerification: true
    })
  });
  const bListingData = await bListingRes.json();
  const bListing = bListingData.data;

  // Make B's listing active via direct DB update for booking tests
  await PartnerListing.findByIdAndUpdate(bListing._id, { status: 'ACTIVE', isActive: true });

  // Test 7: Partner A listing query only returns Partner A listings (multi-tenant isolation)
  const listARes = await fetch(`${BASE_URL}/api/partner/listings`, { headers: headersA });
  const listAData = await listARes.json();
  const hasOnlyAListings = listAData.data.every(l => String(l.ownerUser) === String(partnerAUser._id));
  assert(
    hasOnlyAListings && listAData.data.length >= 2,
    'Rule 7: Partner A listings query contains ONLY listings owned by Partner A'
  );

  // Test 8: Partner A CANNOT update Partner B listing (must return 404 or 403)
  const crossEditRes = await fetch(`${BASE_URL}/api/partner/listings/${bListing._id}`, {
    method: 'PUT',
    headers: headersA,
    body: JSON.stringify({ title: 'Hacked by Partner A' })
  });
  assert(
    crossEditRes.status === 404 || crossEditRes.status === 403,
    'Rule 8: Multi-tenant security prevents Partner A from modifying Partner B listing'
  );

  // Test 9: Partner A CANNOT delete Partner B listing
  const crossDeleteRes = await fetch(`${BASE_URL}/api/partner/listings/${bListing._id}`, {
    method: 'DELETE',
    headers: headersA
  });
  assert(
    crossDeleteRes.status === 404 || crossDeleteRes.status === 403,
    'Rule 9: Multi-tenant security prevents Partner A from deleting Partner B listing'
  );

  console.log('\n--- TEST GROUP 3: PRICING, PROVENANCE & AVAILABILITY ---');

  // Test 10: Partner updating pricing sets provenance to PARTNER_CLAIMED
  const priceUpdateRes = await fetch(`${BASE_URL}/api/partner/listings/${pendingListing._id}/pricing`, {
    method: 'PUT',
    headers: headersA,
    body: JSON.stringify({
      pricePerDay: 4200,
      pricePerHour: 200,
      securityDeposit: 1000
    })
  });
  const priceUpdateData = await priceUpdateRes.json();
  assert(
    priceUpdateRes.status === 200 &&
    priceUpdateData.data?.pricing?.amount === 4200 &&
    priceUpdateData.data?.pricing?.provenance === 'PARTNER_CLAIMED',
    'Rule 10: Partner pricing update saves correctly and tags provenance PARTNER_CLAIMED'
  );

  // Test 11: Partner updating fleet availability updates availableUnits and totalUnits
  const availUpdateRes = await fetch(`${BASE_URL}/api/partner/listings/${pendingListing._id}/availability`, {
    method: 'PUT',
    headers: headersA,
    body: JSON.stringify({
      totalUnits: 5,
      availableUnits: 3,
      statusReason: 'Available'
    })
  });
  const availData = await availUpdateRes.json();
  assert(
    availUpdateRes.status === 200 &&
    availData.data?.availabilityDetails?.totalUnits === 5 &&
    availData.data?.availabilityDetails?.availableUnits === 3,
    'Rule 11: Partner availability update correctly manages fleet inventory'
  );

  console.log('\n--- TEST GROUP 4: BOOKINGS & REVENUE METRICS ---');

  // Create test booking for Partner A's active listing
  const bookingA = await Booking.create({
    user: touristUser._id,
    type: 'partner_listing',
    partnerListing: pendingListing._id,
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000 * 2),
    totalAmount: 8400,
    amount: 8400,
    pricingSnapshot: {
      amount: 8400,
      subtotal: 8400,
      total: 8400,
      provenance: 'VERIFIED'
    },
    status: 'CONFIRMED',
    paymentStatus: 'paid'
  });

  // Create test booking for Partner B's listing
  const bookingB = await Booking.create({
    user: touristUser._id,
    type: 'partner_listing',
    partnerListing: bListing._id,
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000 * 1),
    totalAmount: 1800,
    amount: 1800,
    pricingSnapshot: {
      amount: 1800,
      subtotal: 1800,
      total: 1800,
      provenance: 'VERIFIED'
    },
    status: 'CONFIRMED',
    paymentStatus: 'paid'
  });

  // Test 12: Partner A bookings query only returns bookings for Partner A listings
  const bookingsARes = await fetch(`${BASE_URL}/api/partner/bookings`, { headers: headersA });
  const bookingsAData = await bookingsARes.json();
  const allBelongToA = bookingsAData.data.every(b => String(b.partnerListing?._id || b.partnerListing) === String(pendingListing._id));
  const doesNotContainB = !bookingsAData.data.some(b => String(b._id) === String(bookingB._id));
  assert(
    allBelongToA && doesNotContainB,
    'Rule 12: Partner A bookings list is strictly isolated from Partner B bookings'
  );

  // Test 13: Partner A can transition booking status (CONFIRMED -> COMPLETED)
  const completeBookingRes = await fetch(`${BASE_URL}/api/partner/bookings/${bookingA._id}/status`, {
    method: 'PATCH',
    headers: headersA,
    body: JSON.stringify({ status: 'completed' })
  });
  const completeBookingData = await completeBookingRes.json();
  assert(
    completeBookingRes.status === 200 &&
    (completeBookingData.data?.status === 'COMPLETED' || completeBookingData.data?.status === 'completed'),
    'Rule 13: Partner can mark active tourist reservation as completed'
  );

  // Test 14: Partner A CANNOT modify booking belonging to Partner B's listing
  const crossBookingRes = await fetch(`${BASE_URL}/api/partner/bookings/${bookingB._id}/status`, {
    method: 'PATCH',
    headers: headersA,
    body: JSON.stringify({ status: 'cancelled' })
  });
  assert(
    crossBookingRes.status === 404 || crossBookingRes.status === 403,
    'Rule 14: Partner A cannot modify status of booking on Partner B listing'
  );

  // Test 15: Partner Dashboard KPI endpoint returns real computed metrics
  const dashARes = await fetch(`${BASE_URL}/api/partner/dashboard`, { headers: headersA });
  const dashAData = await dashARes.json();
  const totalListings = dashAData.data?.totalListingsCount ?? dashAData.data?.listingsSummary?.total;
  assert(
    dashARes.status === 200 &&
    totalListings >= 2 &&
    dashAData.data?.totalBookingsCount >= 1 &&
    dashAData.data?.totalRevenue >= 8400,
    'Rule 15: Partner Dashboard returns accurate aggregated KPIs from real database records'
  );

  // Test 16: Partner Earnings endpoint correctly applies 10% platform fee and computes net earnings
  const earningsRes = await fetch(`${BASE_URL}/api/partner/earnings`, { headers: headersA });
  const earningsData = await earningsRes.json();
  const expectedGross = 8400;
  const expectedFee = Math.round(8400 * 0.10);
  const expectedNet = expectedGross - expectedFee;
  assert(
    earningsRes.status === 200 &&
    earningsData.data?.grossRevenue >= expectedGross &&
    earningsData.data?.platformFee >= expectedFee &&
    earningsData.data?.netPartnerEarnings >= expectedNet,
    'Rule 16: Earnings computation enforces 10% platform fee and net partner payout'
  );

  // Test 17: Partner Analytics endpoint returns category breakdown and top listings
  const analyticsRes = await fetch(`${BASE_URL}/api/partner/analytics`, { headers: headersA });
  const analyticsData = await analyticsRes.json();
  assert(
    analyticsRes.status === 200 &&
    Array.isArray(analyticsData.data?.categoryBreakdown) &&
    analyticsData.data?.topListings?.length >= 1,
    'Rule 17: Analytics returns structured categoryBreakdown array and topListings'
  );

  console.log('\n--- TEST GROUP 5: EXPENSES & REVIEWS ---');

  // Test 18: Partner can log business operating expense
  const expenseRes = await fetch(`${BASE_URL}/api/partner/expenses`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      category: 'Maintenance',
      description: 'Test Expense - Winter Room Heater repair',
      amount: 1200,
      listingId: pendingListing._id
    })
  });
  const expenseData = await expenseRes.json();
  const expense = expenseData.data;
  assert(
    expenseRes.status === 201 &&
    expense?.amount === 1200 &&
    expense?.category === 'Maintenance',
    'Rule 18: Partner can log operational business expense'
  );

  // Test 19: Partner B cannot view or delete Partner A's expense
  const crossExpenseDeleteRes = await fetch(`${BASE_URL}/api/partner/expenses/${expense._id}`, {
    method: 'DELETE',
    headers: headersB
  });
  assert(
    crossExpenseDeleteRes.status === 404 || crossExpenseDeleteRes.status === 403,
    'Rule 19: Partner B cannot delete or access Partner A operational expense'
  );

  // Test 20: Partner can reply to customer review on their listing
  const reviewA = await Review.create({
    user: touristUser._id,
    targetType: 'PartnerListing',
    target: pendingListing._id,
    rating: 5,
    comment: 'Wonderful stay at Joshimath, warm hospitality!',
    status: 'approved'
  });

  const replyReviewRes = await fetch(`${BASE_URL}/api/partner/reviews/${reviewA._id}/reply`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      replyText: 'Thank you for staying with us! We hope to see you again soon.'
    })
  });
  const replyReviewData = await replyReviewRes.json();
  assert(
    replyReviewRes.status === 200 &&
    replyReviewData.data?.reply?.text === 'Thank you for staying with us! We hope to see you again soon.' &&
    replyReviewData.data?.reply?.repliedAt != null,
    'Rule 20: Partner can post official business reply to tourist review'
  );

  // Final cleanup
  await User.deleteMany({ email: { $in: testEmails } });
  await Partner.deleteMany({ email: { $in: testEmails } });
  await PartnerListing.deleteMany({ _id: { $in: [draftListing._id, pendingListing._id, spoofData?.data?._id, bListing._id].filter(Boolean) } });
  await Booking.deleteMany({ _id: { $in: [bookingA._id, bookingB._id] } });
  await Review.deleteMany({ _id: reviewA._id });
  await PartnerExpense.deleteMany({ _id: expense._id });

  console.log('\n============================================================');
  console.log(`TEST SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  if (failedTests > 0) {
    console.error(`FAILED: ${failedTests} test(s) failed.`);
    process.exit(1);
  } else {
    console.log('SUCCESS: ALL 20 PARTNER DASHBOARD SPECIFICATIONS VERIFIED!');
    process.exit(0);
  }
}

runDashboardSuite().catch((err) => {
  console.error('Test Suite encountered unhandled error:', err);
  process.exit(1);
});
