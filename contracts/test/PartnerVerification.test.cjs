const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Phase 5 Web3 Contracts Unit Test Suite", function () {
  let PartnerVerification, partnerVerification;
  let VehicleRegistry, vehicleRegistry;
  let admin, verifier, partner, tourist, unauthorized;

  const sampleListingIdHash = ethers.keccak256(ethers.toUtf8Bytes("listing_6aa619d87342ed4662e8b388"));
  const sampleVerificationHash1 = ethers.keccak256(ethers.toUtf8Bytes("canonical_payload_version_1"));
  const sampleVerificationHash2 = ethers.keccak256(ethers.toUtf8Bytes("canonical_payload_version_2"));

  const sampleVehicleHash = ethers.keccak256(ethers.toUtf8Bytes("UK04TA1234_salt_abc"));
  const samplePermitDigest = ethers.keccak256(ethers.toUtf8Bytes("GREEN_CARD_digest_xyz"));

  beforeEach(async function () {
    [admin, verifier, partner, tourist, unauthorized] = await ethers.getSigners();

    // Deploy PartnerVerification
    PartnerVerification = await ethers.getContractFactory("PartnerVerification");
    partnerVerification = await PartnerVerification.deploy(admin.address);
    await partnerVerification.waitForDeployment();

    // Grant VERIFIER_ROLE to verifier
    const VERIFIER_ROLE = await partnerVerification.VERIFIER_ROLE();
    await partnerVerification.connect(admin).grantRole(VERIFIER_ROLE, verifier.address);

    // Deploy VehicleRegistry
    VehicleRegistry = await ethers.getContractFactory("VehicleRegistry");
    vehicleRegistry = await VehicleRegistry.deploy(admin.address);
    await vehicleRegistry.waitForDeployment();

    // Grant INSPECTOR_ROLE to verifier
    const INSPECTOR_ROLE = await vehicleRegistry.INSPECTOR_ROLE();
    await vehicleRegistry.connect(admin).grantRole(INSPECTOR_ROLE, verifier.address);
  });

  describe("PartnerVerification.sol", function () {
    it("[TEST 1] Deployer receives DEFAULT_ADMIN_ROLE and VERIFIER_ROLE", async function () {
      const DEFAULT_ADMIN_ROLE = await partnerVerification.DEFAULT_ADMIN_ROLE();
      const VERIFIER_ROLE = await partnerVerification.VERIFIER_ROLE();
      expect(await partnerVerification.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await partnerVerification.hasRole(VERIFIER_ROLE, admin.address)).to.be.true;
      expect(await partnerVerification.hasRole(VERIFIER_ROLE, verifier.address)).to.be.true;
      expect(await partnerVerification.hasRole(VERIFIER_ROLE, unauthorized.address)).to.be.false;
    });

    it("[TEST 2] Authorized verifier records initial attestation", async function () {
      const tx = await partnerVerification.connect(verifier).attestListing(sampleListingIdHash, sampleVerificationHash1);
      const receipt = await tx.wait();

      expect(receipt.status).to.equal(1);
      const record = await partnerVerification.getVerification(sampleListingIdHash);
      expect(record.verificationHash).to.equal(sampleVerificationHash1);
      expect(record.verifier).to.equal(verifier.address);
      expect(record.version).to.equal(1);
      expect(record.status).to.equal(1); // ACTIVE
    });

    it("[TEST 3] Contract-controlled versioning: increments from 0 to 1 on initial attestation", async function () {
      await partnerVerification.connect(verifier).attestListing(sampleListingIdHash, sampleVerificationHash1);
      const record = await partnerVerification.getVerification(sampleListingIdHash);
      expect(record.version).to.equal(1);
    });

    it("[TEST 4] Sequential incrementation: version increments to 2 on re-attestation", async function () {
      await partnerVerification.connect(verifier).attestListing(sampleListingIdHash, sampleVerificationHash1);
      await partnerVerification.connect(verifier).attestListing(sampleListingIdHash, sampleVerificationHash2);

      const record = await partnerVerification.getVerification(sampleListingIdHash);
      expect(record.version).to.equal(2);
      expect(record.verificationHash).to.equal(sampleVerificationHash2);
    });

    it("[TEST 5] Historical hash access: getHistoricalHash preserves version 1 after version 2 attestation", async function () {
      await partnerVerification.connect(verifier).attestListing(sampleListingIdHash, sampleVerificationHash1);
      await partnerVerification.connect(verifier).attestListing(sampleListingIdHash, sampleVerificationHash2);

      expect(await partnerVerification.getHistoricalHash(sampleListingIdHash, 1)).to.equal(sampleVerificationHash1);
      expect(await partnerVerification.getHistoricalHash(sampleListingIdHash, 2)).to.equal(sampleVerificationHash2);
    });

    it("[TEST 6] Live verification query matches tamper-free hash", async function () {
      await partnerVerification.connect(verifier).attestListing(sampleListingIdHash, sampleVerificationHash1);

      const [isActiveValid, ver1] = await partnerVerification.isListingActive(sampleListingIdHash, sampleVerificationHash1);
      expect(isActiveValid).to.be.true;
      expect(ver1).to.equal(1);

      // Tampered hash check
      const tamperedHash = ethers.keccak256(ethers.toUtf8Bytes("tampered_listing_price"));
      const [isActiveTampered, ver2] = await partnerVerification.isListingActive(sampleListingIdHash, tamperedHash);
      expect(isActiveTampered).to.be.false;
      expect(ver2).to.equal(1);
    });

    it("[TEST 7] Allowed status transition: ACTIVE -> SUSPENDED", async function () {
      await partnerVerification.connect(verifier).attestListing(sampleListingIdHash, sampleVerificationHash1);
      await partnerVerification.connect(verifier).setStatus(sampleListingIdHash, 2); // 2: SUSPENDED

      const record = await partnerVerification.getVerification(sampleListingIdHash);
      expect(record.status).to.equal(2);

      // Inactive when suspended
      const [isActive] = await partnerVerification.isListingActive(sampleListingIdHash, sampleVerificationHash1);
      expect(isActive).to.be.false;
    });

    it("[TEST 8] Allowed status transition: SUSPENDED -> ACTIVE", async function () {
      await partnerVerification.connect(verifier).attestListing(sampleListingIdHash, sampleVerificationHash1);
      await partnerVerification.connect(verifier).setStatus(sampleListingIdHash, 2); // SUSPENDED
      await partnerVerification.connect(verifier).setStatus(sampleListingIdHash, 1); // ACTIVE

      const record = await partnerVerification.getVerification(sampleListingIdHash);
      expect(record.status).to.equal(1);
    });

    it("[TEST 9] Allowed status transition: ACTIVE -> REVOKED", async function () {
      await partnerVerification.connect(verifier).attestListing(sampleListingIdHash, sampleVerificationHash1);
      await partnerVerification.connect(verifier).setStatus(sampleListingIdHash, 3); // 3: REVOKED

      const record = await partnerVerification.getVerification(sampleListingIdHash);
      expect(record.status).to.equal(3);
    });

    it("[TEST 10] Disallowed status transition to NONE or self-transition reverts", async function () {
      await partnerVerification.connect(verifier).attestListing(sampleListingIdHash, sampleVerificationHash1);

      // Transition to NONE (0)
      await expect(
        partnerVerification.connect(verifier).setStatus(sampleListingIdHash, 0)
      ).to.be.revertedWithCustomError(partnerVerification, "InvalidStatusTransition");

      // Self-transition ACTIVE -> ACTIVE
      await expect(
        partnerVerification.connect(verifier).setStatus(sampleListingIdHash, 1)
      ).to.be.revertedWithCustomError(partnerVerification, "InvalidStatusTransition");
    });

    it("[TEST 11] Permanent REVOKED terminal policy: attempts to re-attest or change status on REVOKED listing revert", async function () {
      await partnerVerification.connect(verifier).attestListing(sampleListingIdHash, sampleVerificationHash1);
      await partnerVerification.connect(verifier).setStatus(sampleListingIdHash, 3); // REVOKED

      // Attempt status change
      await expect(
        partnerVerification.connect(verifier).setStatus(sampleListingIdHash, 1)
      ).to.be.revertedWithCustomError(partnerVerification, "ListingRevoked");

      // Attempt re-attestation
      await expect(
        partnerVerification.connect(verifier).attestListing(sampleListingIdHash, sampleVerificationHash2)
      ).to.be.revertedWithCustomError(partnerVerification, "ListingRevoked");
    });

    it("[TEST 12] Unauthorized address blocked from attestListing and setStatus", async function () {
      await expect(
        partnerVerification.connect(unauthorized).attestListing(sampleListingIdHash, sampleVerificationHash1)
      ).to.be.revertedWithCustomError(partnerVerification, "AccessControlUnauthorizedAccount");

      await partnerVerification.connect(verifier).attestListing(sampleListingIdHash, sampleVerificationHash1);

      await expect(
        partnerVerification.connect(unauthorized).setStatus(sampleListingIdHash, 2)
      ).to.be.revertedWithCustomError(partnerVerification, "AccessControlUnauthorizedAccount");
    });
  });

  describe("VehicleRegistry.sol", function () {
    it("[TEST 13] Inspector registers vehicle permit with valid future expiry", async function () {
      const latestBlock = await ethers.provider.getBlock("latest");
      const futureExpiry = latestBlock.timestamp + 86400 * 365; // +1 year

      await vehicleRegistry.connect(verifier).registerVehiclePermit(sampleVehicleHash, samplePermitDigest, futureExpiry);

      const permit = await vehicleRegistry.getPermit(sampleVehicleHash);
      expect(permit.permitDigest).to.equal(samplePermitDigest);
      expect(permit.expiresAt).to.equal(futureExpiry);
      expect(permit.status).to.equal(1); // VALID
    });

    it("[TEST 14] Read-time validity check: valid before expiry", async function () {
      const latestBlock = await ethers.provider.getBlock("latest");
      const futureExpiry = latestBlock.timestamp + 86400 * 30; // +30 days

      await vehicleRegistry.connect(verifier).registerVehiclePermit(sampleVehicleHash, samplePermitDigest, futureExpiry);

      const [isValid, actualStatus, isExpired] = await vehicleRegistry.isPermitValid(sampleVehicleHash, samplePermitDigest);
      expect(isValid).to.be.true;
      expect(actualStatus).to.equal(1);
      expect(isExpired).to.equal(false);
    });

    it("[TEST 15] Read-time expiration check: invalid and expired after timestamp passes expiresAt", async function () {
      const latestBlock = await ethers.provider.getBlock("latest");
      const shortExpiry = latestBlock.timestamp + 10; // +10 seconds

      await vehicleRegistry.connect(verifier).registerVehiclePermit(sampleVehicleHash, samplePermitDigest, shortExpiry);

      // Advance blockchain time past expiry
      await ethers.provider.send("evm_increaseTime", [20]);
      await ethers.provider.send("evm_mine");

      const [isValid, actualStatus, isExpired] = await vehicleRegistry.isPermitValid(sampleVehicleHash, samplePermitDigest);
      expect(isValid).to.be.false;
      expect(actualStatus).to.equal(1); // Stored status is VALID, but read-time validity correctly reports expired!
      expect(isExpired).to.be.true;
    });

    it("[TEST 16] Permit suspension and renewal", async function () {
      const latestBlock = await ethers.provider.getBlock("latest");
      const futureExpiry = latestBlock.timestamp + 86400 * 90;

      await vehicleRegistry.connect(verifier).registerVehiclePermit(sampleVehicleHash, samplePermitDigest, futureExpiry);

      // Explicit suspension
      await vehicleRegistry.connect(verifier).setPermitStatus(sampleVehicleHash, 2); // 2: SUSPENDED
      let [isValid] = await vehicleRegistry.isPermitValid(sampleVehicleHash, samplePermitDigest);
      expect(isValid).to.be.false;

      // Renewal / re-registration with renewed permit
      const newPermitDigest = ethers.keccak256(ethers.toUtf8Bytes("RENEWED_GREEN_CARD_digest"));
      const renewedExpiry = latestBlock.timestamp + 86400 * 365;
      await vehicleRegistry.connect(verifier).registerVehiclePermit(sampleVehicleHash, newPermitDigest, renewedExpiry);

      [isValid] = await vehicleRegistry.isPermitValid(sampleVehicleHash, newPermitDigest);
      expect(isValid).to.be.true;
    });
  });
});
