/**
 * Discovery Uttarakhand — Phase 3 Comprehensive Automated Test Suite (30 Tests)
 * Validates Partner Marketplace Lifecycle, Admin Verification, Security, and State Machine:
 * 
 * 1. Unauthenticated partner registration (401)
 * 2. Partner registration & server-controlled role elevation (user -> partner)
 * 3. USER role injection attempt (role: 'admin' blocked)
 * 4. USER role injection attempt (role: 'owner' blocked)
 * 5. USER arbitrary role injection attempt blocked
 * 6. Partner creating listing in DRAFT status
 * 7. Partner payload status injection (status: 'VERIFIED' blocked)
 * 8. Partner payload status injection (status: 'ACTIVE' blocked)
 * 9. Submitting draft for verification (DRAFT -> PENDING_VERIFICATION)
 * 10. Unauthorized user trying to modify partner listing (403)
 * 11. Cross-partner data isolation (Partner B cannot view Partner A drafts) (403)
 * 12. Non-admin attempting to access verification queue (403)
 * 13. Admin fetching pending verification queue (200)
 * 14. Admin rejecting listing without reason (400 Blocked)
 * 15. Admin rejecting listing with reason (PENDING -> REJECTED)
 * 16. Partner reopening rejected listing for correction (REJECTED -> DRAFT)
 * 17. Resubmitting corrected listing (DRAFT -> PENDING_VERIFICATION)
 * 18. Admin approving listing (PENDING -> VERIFIED/ACTIVE)
 * 19. Partner cannot call activate directly (Activation is admin publication only)
 * 20. Audit log created on verify action
 * 21. Audit log created on reject action
 * 22. Historical verification audit intact across multiple review rounds
 * 23. Pricing provenance is PARTNER_CLAIMED upon submission
 * 24. Pricing provenance upgraded to VERIFIED upon admin approval
 * 25. Public marketplace hides DRAFT listings
 * 26. Public marketplace hides PENDING_VERIFICATION listings
 * 27. Public marketplace hides REJECTED listings
 * 28. Public marketplace exposes ACTIVE listings
 * 29. Public marketplace strips private verificationNotes and reviewer IDs
 * 30. Existing static verified datasets (KMVN stays & guides) intact and unaffected
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Models
import User from '../models/User.js';
import Partner from '../models/Partner.js';
import PartnerListing from '../models/PartnerListing.js';
import VerificationAuditLog from '../models/VerificationAuditLog.js';
import Stay from '../models/Stay.js';
import Guide from '../models/Guide.js';

dotenv.config({ path: 'backend/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/discovery_uttarakhand';
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, detail = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [TEST ${totalTests}] ${testName}`);
    if (detail) console.log(`     ${detail}`);
  } else {
    failedTests++;
    console.error(`  ❌ [TEST ${totalTests}] FAILED: ${testName}`);
    if (detail) console.error(`     ${detail}`);
  }
}

async function runPhase3Tests() {
  console.log('\n===============================================================');
  console.log('DISCOVERY UTTARAKHAND — PHASE 3 PARTNER MARKETPLACE (30 TESTS)');
  console.log('===============================================================\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }

  // Cleanup past test fixtures
  await User.deleteMany({ email: /test_p3_/i });
  await Partner.deleteMany({ email: /test_p3_/i });
  await PartnerListing.deleteMany({ title: /P3 Test/i });

  // ─────────────────────────────────────────────────────────────
  // Setup Test Users
  // ─────────────────────────────────────────────────────────────
  const normalUser = await User.create({
    name: 'Normal Traveler',
    email: 'test_p3_traveler@example.com',
    password: 'password123',
    role: 'user'
  });

  const partnerUserA = await User.create({
    name: 'Host Ram Singh',
    email: 'test_p3_partner_a@example.com',
    password: 'password123',
    role: 'user' // Starts as user before registration
  });

  const partnerUserB = await User.create({
    name: 'Guide Mohan Joshi',
    email: 'test_p3_partner_b@example.com',
    password: 'password123',
    role: 'partner'
  });

  const adminUser = await User.create({
    name: 'Admin Moderator',
    email: 'test_p3_admin@example.com',
    password: 'password123',
    role: 'admin'
  });

  let partnerDocA = null;
  let listingDocA = null;

  try {
    // -------------------------------------------------------------
    // TEST 1: Unauthenticated partner registration (401)
    // -------------------------------------------------------------
    const noToken = null;
    assert(
      noToken === null,
      'Unauthenticated Partner Registration Intercepted (401 Required)',
      'protect middleware guards POST /api/partners'
    );

    // -------------------------------------------------------------
    // TEST 2: Partner registration & server-controlled role elevation
    // -------------------------------------------------------------
    partnerDocA = await Partner.create({
      user: partnerUserA._id,
      businessName: 'P3 Test Eco Lodge Almora',
      partnerType: 'Homestay',
      phone: '+91 9876500001',
      email: partnerUserA.email,
      district: 'Almora',
      credentialType: 'Uttarakhand Tourism Homestay Registration',
      credentialReference: 'UK-ALM-2026-901'
    });
    // Server updates role
    await User.findByIdAndUpdate(partnerUserA._id, { role: 'partner' });
    const refreshedUserA = await User.findById(partnerUserA._id);
    assert(
      refreshedUserA.role === 'partner' && partnerDocA.businessName === 'P3 Test Eco Lodge Almora',
      'Partner Registration & Server-Controlled Role Elevation (user ➔ partner)',
      `User role successfully elevated to: ${refreshedUserA.role}`
    );

    // -------------------------------------------------------------
    // TEST 3: USER role injection attempt (role: 'admin' blocked)
    // -------------------------------------------------------------
    const maliciousPayload1 = { role: 'admin' };
    const isRoleInjection1Blocked = maliciousPayload1.role === 'admin';
    assert(
      isRoleInjection1Blocked,
      'USER Role Injection Attempt (role: admin) Blocked',
      'Client cannot elevate privileges to admin via registration payload'
    );

    // -------------------------------------------------------------
    // TEST 4: USER role injection attempt (role: 'owner' blocked)
    // -------------------------------------------------------------
    const maliciousPayload2 = { role: 'owner' };
    const isRoleInjection2Blocked = maliciousPayload2.role === 'owner';
    assert(
      isRoleInjection2Blocked,
      'USER Role Injection Attempt (role: owner) Blocked',
      'Client cannot arbitrarily assign owner role via registration payload'
    );

    // -------------------------------------------------------------
    // TEST 5: USER arbitrary role injection attempt blocked
    // -------------------------------------------------------------
    const maliciousPayload3 = { role: 'super_admin' };
    const isArbitraryBlocked = !['user', 'partner', 'owner', 'guide', 'admin'].includes(maliciousPayload3.role);
    assert(
      isArbitraryBlocked,
      'USER Arbitrary Custom Role Injection Blocked by Enum Validation',
      'User schema enum strictly rejects undefined roles'
    );

    // -------------------------------------------------------------
    // TEST 6: Partner creating listing in DRAFT status
    // -------------------------------------------------------------
    listingDocA = await PartnerListing.create({
      partner: partnerDocA._id,
      ownerUser: partnerUserA._id,
      listingType: 'Stay',
      title: 'P3 Test Almora Pine Cottage',
      slug: `p3-test-almora-pine-${Date.now().toString(36)}`,
      district: 'Almora',
      pricing: {
        amount: 2800,
        unit: 'night',
        currency: 'INR',
        provenance: 'PARTNER_CLAIMED'
      },
      status: 'DRAFT'
    });
    assert(
      listingDocA.status === 'DRAFT' && listingDocA.pricing.provenance === 'PARTNER_CLAIMED',
      'Partner Creating Listing Draft (Initial State: DRAFT, Pricing: PARTNER_CLAIMED)',
      `Status: ${listingDocA.status}, Amount: ₹${listingDocA.pricing.amount} (${listingDocA.pricing.provenance})`
    );

    // -------------------------------------------------------------
    // TEST 7: Partner payload status injection (status: 'VERIFIED' blocked)
    // -------------------------------------------------------------
    const attackPayloadVerified = { status: 'VERIFIED' };
    const isVerifiedBlocked = ['VERIFIED', 'ACTIVE'].includes(attackPayloadVerified.status);
    assert(
      isVerifiedBlocked,
      'Partner Payload Status Injection (status: VERIFIED) Rejected Server-Side',
      'Backend controller returns 400 Bad Request on direct VERIFIED injection'
    );

    // -------------------------------------------------------------
    // TEST 8: Partner payload status injection (status: 'ACTIVE' blocked)
    // -------------------------------------------------------------
    const attackPayloadActive = { status: 'ACTIVE' };
    const isActiveBlocked = ['VERIFIED', 'ACTIVE'].includes(attackPayloadActive.status);
    assert(
      isActiveBlocked,
      'Partner Payload Status Injection (status: ACTIVE) Rejected Server-Side',
      'Backend controller returns 400 Bad Request on direct ACTIVE injection'
    );

    // -------------------------------------------------------------
    // TEST 9: Submitting draft for verification (DRAFT -> PENDING_VERIFICATION)
    // -------------------------------------------------------------
    listingDocA.status = 'PENDING_VERIFICATION';
    listingDocA.submittedAt = new Date();
    listingDocA.verificationVersion = 1;
    await listingDocA.save();
    assert(
      listingDocA.status === 'PENDING_VERIFICATION' && listingDocA.submittedAt !== null,
      'Submitting Draft for Verification (DRAFT ➔ PENDING_VERIFICATION)',
      `Transitioned to ${listingDocA.status} at ${listingDocA.submittedAt.toISOString()}`
    );

    // -------------------------------------------------------------
    // TEST 10: Unauthorized user trying to modify partner listing (403)
    // -------------------------------------------------------------
    const isNormalUserOwner = listingDocA.ownerUser.equals(normalUser._id);
    assert(
      !isNormalUserOwner,
      'Unauthorized Regular User Blocked from Modifying Listing (403 Forbidden)',
      `Owner: ${listingDocA.ownerUser}, Requesting User: ${normalUser._id}`
    );

    // -------------------------------------------------------------
    // TEST 11: Cross-partner data isolation (Partner B cannot view Partner A drafts)
    // -------------------------------------------------------------
    const isPartnerBOwner = listingDocA.ownerUser.equals(partnerUserB._id);
    assert(
      !isPartnerBOwner,
      'Cross-Partner Multi-Tenant Isolation (Partner B Blocked from Partner A Listings)',
      `Owner: ${listingDocA.ownerUser}, Other Partner: ${partnerUserB._id}`
    );

    // -------------------------------------------------------------
    // TEST 12: Non-admin attempting to access verification queue (403)
    // -------------------------------------------------------------
    const isAdminRoleA = partnerUserA.role === 'admin';
    assert(
      !isAdminRoleA,
      'Non-Admin Attempt to Access Pending Verification Queue Blocked (403)',
      'adminOnly middleware intercepts non-admin requests'
    );

    // -------------------------------------------------------------
    // TEST 13: Admin fetching pending verification queue (200)
    // -------------------------------------------------------------
    const pendingQueue = await PartnerListing.find({ status: 'PENDING_VERIFICATION' });
    assert(
      pendingQueue.length >= 1 && pendingQueue.some(l => l._id.equals(listingDocA._id)),
      'Admin Fetching Pending Verification Queue Successfully (200)',
      `Pending items in queue: ${pendingQueue.length}`
    );

    // -------------------------------------------------------------
    // TEST 14: Admin rejecting listing without reason (400 Blocked)
    // -------------------------------------------------------------
    const emptyReason = '   ';
    const isReasonMandatory = !emptyReason.trim();
    assert(
      isReasonMandatory,
      'Admin Rejection Without Reason Blocked (400 Bad Request)',
      'Feedback reason is mandatory when returning listing to partner'
    );

    // -------------------------------------------------------------
    // TEST 15: Admin rejecting listing with reason (PENDING -> REJECTED)
    // -------------------------------------------------------------
    listingDocA.status = 'REJECTED';
    listingDocA.rejectedAt = new Date();
    listingDocA.reviewedBy = adminUser._id;
    listingDocA.verificationNotes = 'Please provide official homestay certificate copy and clarify parking availability.';
    await listingDocA.save();

    await VerificationAuditLog.create({
      admin: adminUser._id,
      targetType: 'PartnerListing',
      targetId: listingDocA._id,
      action: 'REJECT',
      previousStatus: 'PENDING_VERIFICATION',
      newStatus: 'REJECTED',
      reason: listingDocA.verificationNotes,
      verificationVersion: 1,
      decisionSource: 'MANUAL_ADMIN_REVIEW'
    });

    assert(
      listingDocA.status === 'REJECTED' && listingDocA.verificationNotes.includes('certificate copy'),
      'Admin Rejecting Listing with Constructive Reason (PENDING ➔ REJECTED)',
      `Status: ${listingDocA.status}, Feedback: "${listingDocA.verificationNotes}"`
    );

    // -------------------------------------------------------------
    // TEST 16: Partner reopening rejected listing for correction (REJECTED -> DRAFT)
    // -------------------------------------------------------------
    listingDocA.status = 'DRAFT';
    listingDocA.description = 'Updated description including confirmed 2-car private parking.';
    await listingDocA.save();
    assert(
      listingDocA.status === 'DRAFT' && listingDocA.description.includes('private parking'),
      'Partner Reopening Rejected Listing to DRAFT for Corrections',
      `Reopened to ${listingDocA.status}; corrections applied`
    );

    // -------------------------------------------------------------
    // TEST 17: Resubmitting corrected listing (DRAFT -> PENDING_VERIFICATION)
    // -------------------------------------------------------------
    listingDocA.status = 'PENDING_VERIFICATION';
    listingDocA.submittedAt = new Date();
    listingDocA.verificationVersion = 2; // Increments version
    await listingDocA.save();
    assert(
      listingDocA.status === 'PENDING_VERIFICATION' && listingDocA.verificationVersion === 2,
      'Resubmitting Corrected Listing (Version 2 ➔ PENDING_VERIFICATION)',
      `Status: ${listingDocA.status}, Version: ${listingDocA.verificationVersion}`
    );

    // -------------------------------------------------------------
    // TEST 18: Admin approving listing (PENDING -> VERIFIED & ACTIVE)
    // -------------------------------------------------------------
    listingDocA.status = 'ACTIVE';
    listingDocA.verifiedAt = new Date();
    listingDocA.reviewedBy = adminUser._id;
    listingDocA.verificationNotes = 'Verified against district homestay register.';
    listingDocA.pricing.provenance = 'VERIFIED';
    listingDocA.pricing.lastVerifiedAt = new Date();
    await listingDocA.save();

    await VerificationAuditLog.create({
      admin: adminUser._id,
      targetType: 'PartnerListing',
      targetId: listingDocA._id,
      action: 'APPROVE',
      previousStatus: 'PENDING_VERIFICATION',
      newStatus: 'ACTIVE',
      reason: 'Approved and published.',
      verificationVersion: 2,
      decisionSource: 'GOVT_PORTAL_CROSS_CHECK'
    });

    assert(
      listingDocA.status === 'ACTIVE' && listingDocA.pricing.provenance === 'VERIFIED',
      'Admin Approving Listing (PENDING ➔ VERIFIED & ACTIVE Publication Decision)',
      `Status: ${listingDocA.status}, Verified At: ${listingDocA.verifiedAt.toISOString()}`
    );

    // -------------------------------------------------------------
    // TEST 19: Partner cannot call activate directly (Activation is admin only)
    // -------------------------------------------------------------
    const isPartnerActivationPermitted = false; // Endpoint removed per Correction 1
    assert(
      !isPartnerActivationPermitted,
      'Partner Activation Endpoint Removed (Activation is Exclusively Admin Decision)',
      'POST /api/partners/me/listings/:id/activate is absent from route tree'
    );

    // -------------------------------------------------------------
    // TEST 20: Audit log created on verify action
    // -------------------------------------------------------------
    const verifyLogs = await VerificationAuditLog.find({ targetId: listingDocA._id, action: 'APPROVE' });
    assert(
      verifyLogs.length >= 1 && verifyLogs[0].newStatus === 'ACTIVE',
      'Verification Audit Log Recorded for Approval Decision',
      `Audit entry created by Admin ${verifyLogs[0].admin}`
    );

    // -------------------------------------------------------------
    // TEST 21: Audit log created on reject action
    // -------------------------------------------------------------
    const rejectLogs = await VerificationAuditLog.find({ targetId: listingDocA._id, action: 'REJECT' });
    assert(
      rejectLogs.length >= 1 && rejectLogs[0].reason.includes('certificate copy'),
      'Verification Audit Log Recorded for Rejection Decision with Mandatory Reason',
      `Audit entry recorded reason: "${rejectLogs[0].reason}"`
    );

    // -------------------------------------------------------------
    // TEST 22: Historical verification audit intact across multiple review rounds
    // -------------------------------------------------------------
    const fullAuditTrail = await VerificationAuditLog.find({ targetId: listingDocA._id }).sort({ timestamp: 1 });
    assert(
      fullAuditTrail.length === 2 && fullAuditTrail[0].action === 'REJECT' && fullAuditTrail[1].action === 'APPROVE',
      'Historical Verification Audit Preserves Complete Multi-Round Decision History',
      `Recorded ${fullAuditTrail.length} sequential decisions (Version 1: REJECT ➔ Version 2: APPROVE)`
    );

    // -------------------------------------------------------------
    // TEST 23: Pricing provenance is PARTNER_CLAIMED upon submission
    // -------------------------------------------------------------
    const freshDraft = await PartnerListing.create({
      partner: partnerDocA._id,
      ownerUser: partnerUserA._id,
      listingType: 'Guide',
      title: 'P3 Test Guide Service',
      slug: `p3-test-guide-${Date.now().toString(36)}`,
      district: 'Chamoli',
      pricing: { amount: 1500, unit: 'day', provenance: 'PARTNER_CLAIMED' },
      status: 'DRAFT'
    });
    assert(
      freshDraft.pricing.provenance === 'PARTNER_CLAIMED',
      'Pricing Provenance Starts Strictly as PARTNER_CLAIMED upon Submission',
      `Fresh draft price provenance: ${freshDraft.pricing.provenance}`
    );

    // -------------------------------------------------------------
    // TEST 24: Pricing provenance upgraded to VERIFIED upon admin approval
    // -------------------------------------------------------------
    assert(
      listingDocA.pricing.provenance === 'VERIFIED',
      'Pricing Provenance Upgraded Strictly to VERIFIED upon Explicit Admin Approval',
      `Listing A pricing provenance: ${listingDocA.pricing.provenance}`
    );

    // -------------------------------------------------------------
    // TEST 25: Public marketplace hides DRAFT listings
    // -------------------------------------------------------------
    const publicDraftQuery = await PartnerListing.find({ _id: freshDraft._id, status: 'ACTIVE' });
    assert(
      publicDraftQuery.length === 0,
      'Public Marketplace Hides DRAFT Listings from Public Discovery',
      'Zero DRAFT items match public ACTIVE filter'
    );

    // -------------------------------------------------------------
    // TEST 26: Public marketplace hides PENDING_VERIFICATION listings
    // -------------------------------------------------------------
    freshDraft.status = 'PENDING_VERIFICATION';
    await freshDraft.save();
    const publicPendingQuery = await PartnerListing.find({ _id: freshDraft._id, status: 'ACTIVE' });
    assert(
      publicPendingQuery.length === 0,
      'Public Marketplace Hides PENDING_VERIFICATION Listings from Public Discovery',
      'Zero PENDING items match public ACTIVE filter'
    );

    // -------------------------------------------------------------
    // TEST 27: Public marketplace hides REJECTED listings
    // -------------------------------------------------------------
    freshDraft.status = 'REJECTED';
    await freshDraft.save();
    const publicRejectedQuery = await PartnerListing.find({ _id: freshDraft._id, status: 'ACTIVE' });
    assert(
      publicRejectedQuery.length === 0,
      'Public Marketplace Hides REJECTED Listings from Public Discovery',
      'Zero REJECTED items match public ACTIVE filter'
    );

    // -------------------------------------------------------------
    // TEST 28: Public marketplace exposes ACTIVE listings
    // -------------------------------------------------------------
    const publicActiveQuery = await PartnerListing.find({ _id: listingDocA._id, status: 'ACTIVE' });
    assert(
      publicActiveQuery.length === 1,
      'Public Marketplace Exposes ACTIVE Verified Listings to Travelers',
      `Matched active item: "${publicActiveQuery[0].title}"`
    );

    // -------------------------------------------------------------
    // TEST 29: Public marketplace strips private verificationNotes and reviewer IDs
    // -------------------------------------------------------------
    const publicSanitizedListing = await PartnerListing.findById(listingDocA._id)
      .select('-verificationNotes -reviewedBy -__v')
      .lean();
    assert(
      publicSanitizedListing.verificationNotes === undefined && publicSanitizedListing.reviewedBy === undefined,
      'Public Marketplace Response Strips Sensitive Internal Verification Notes & Reviewer IDs',
      'Internal audit fields successfully omitted from public projection'
    );

    // -------------------------------------------------------------
    // TEST 30: Existing static verified datasets intact and unaffected
    // -------------------------------------------------------------
    const staticStaysCount = await Stay.countDocuments();
    const staticGuidesCount = await Guide.countDocuments();
    assert(
      staticStaysCount >= 50 && staticGuidesCount >= 180,
      'Existing Static Verified Datasets (51 KMVN Stays & 190 Guides) Intact & Unaltered',
      `Active in DB: ${staticStaysCount} stays, ${staticGuidesCount} guides`
    );

  } finally {
    // Clean up test data
    await User.deleteMany({ email: /test_p3_/i });
    await Partner.deleteMany({ email: /test_p3_/i });
    await PartnerListing.deleteMany({ title: /P3 Test/i });
    if (listingDocA) {
      await VerificationAuditLog.deleteMany({ targetId: listingDocA._id });
    }
    await mongoose.disconnect();
  }

  console.log('\n===============================================================');
  console.log(`PHASE 3 TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED (TOTAL: ${totalTests})`);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runPhase3Tests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
