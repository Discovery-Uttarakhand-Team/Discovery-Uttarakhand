/**
 * Discovery Uttarakhand — Web3 Service
 * Manages interactions with PartnerVerification.sol and VehicleRegistry.sol smart contracts
 * via ethers.js with contract-controlled versioning, nonce serialization, and resilient failure handling.
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeListingIdHash, computeSaltedVehicleHash, computeSaltedPermitDigest } from './cryptoService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to compiled contract artifacts
const PARTNER_ARTIFACT_PATH = path.resolve(__dirname, '../../contracts/artifacts/src/PartnerVerification.sol/PartnerVerification.json');
const VEHICLE_ARTIFACT_PATH = path.resolve(__dirname, '../../contracts/artifacts/src/VehicleRegistry.sol/VehicleRegistry.json');

// Status enums matching Solidity contracts
export const OnChainVerificationStatus = {
  NONE: 0,
  ACTIVE: 1,
  SUSPENDED: 2,
  REVOKED: 3
};

export const OnChainPermitStatus = {
  NONE: 0,
  VALID: 1,
  SUSPENDED: 2,
  REVOKED: 3
};

const STATUS_NAME_MAP = ['NONE', 'ACTIVE', 'SUSPENDED', 'REVOKED'];
const PERMIT_STATUS_NAME_MAP = ['NONE', 'VALID', 'SUSPENDED', 'REVOKED'];

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.partnerVerificationContract = null;
    this.vehicleRegistryContract = null;
    this.initialized = false;
    this.initPromise = null;
  }

  /**
   * Load ABI from compiled artifact
   */
  loadArtifact(artifactPath) {
    if (fs.existsSync(artifactPath)) {
      const data = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      return data.abi;
    }
    return null;
  }

  /**
   * Initialize provider, signer, and contract bindings
   */
  async initialize() {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const rpcUrl = process.env.WEB3_RPC_URL || 'http://127.0.0.1:8545';
      const privateKey = process.env.WEB3_ADMIN_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Default Hardhat Account 0

      try {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        // Optional quick connectivity check
        await this.provider.getBlockNumber();
        const rawWallet = new ethers.Wallet(privateKey, this.provider);
        this.signer = new ethers.NonceManager(rawWallet);

        const partnerAbi = this.loadArtifact(PARTNER_ARTIFACT_PATH);
        const vehicleAbi = this.loadArtifact(VEHICLE_ARTIFACT_PATH);

        const partnerAddress = process.env.WEB3_PARTNER_VERIFICATION_ADDRESS;
        const vehicleAddress = process.env.WEB3_VEHICLE_REGISTRY_ADDRESS;

        if (partnerAbi && partnerAddress) {
          this.partnerVerificationContract = new ethers.Contract(partnerAddress, partnerAbi, this.signer);
        }
        if (vehicleAbi && vehicleAddress) {
          this.vehicleRegistryContract = new ethers.Contract(vehicleAddress, vehicleAbi, this.signer);
        }

        this.initialized = true;
      } catch (err) {
        // Log warning but do not crash application startup
        // Failure semantics: syncStatus becomes FAILED on attempt
        console.warn('[Web3Service] Provider unavailable during startup:', err.message);
      }
    })();

    return this.initPromise;
  }

  /**
   * Allows injecting test contract instances directly (used in automated integration tests)
   */
  setContractsForTesting(partnerContract, vehicleContract, provider, signer) {
    this.partnerVerificationContract = partnerContract;
    this.vehicleRegistryContract = vehicleContract;
    this.provider = provider;
    this.signer = signer;
    this.initialized = true;
  }

  /**
   * Attests a partner listing on-chain via the single canonical write path.
   * Contract derives and increments the version number.
   */
  async attestListing(listingId, verificationHash) {
    await this.initialize();
    if (!this.partnerVerificationContract) {
      throw new Error('PartnerVerification smart contract is not initialized or unreachable');
    }

    const listingIdHash = computeListingIdHash(listingId);

    // Call single canonical write path on contract
    const tx = await this.partnerVerificationContract.attestListing(listingIdHash, verificationHash);
    const receipt = await tx.wait();

    // Query block header to extract exact EVM blockTimestamp
    const block = await this.provider.getBlock(receipt.blockNumber);
    const blockTimestamp = block ? block.timestamp : Math.floor(Date.now() / 1000);

    // Read contract state to retrieve contract-derived version
    const record = await this.partnerVerificationContract.getVerification(listingIdHash);
    const version = Number(record.version);

    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      blockTimestamp: blockTimestamp,
      contractAddress: await this.partnerVerificationContract.getAddress(),
      attestedVersion: version,
      onChainStatus: 'ACTIVE',
      verifierAddress: await this.signer.getAddress()
    };
  }

  /**
   * Sets status on-chain (SUSPENDED or REVOKED)
   */
  async setListingStatus(listingId, newStatusName) {
    await this.initialize();
    if (!this.partnerVerificationContract) {
      throw new Error('PartnerVerification smart contract is not initialized or unreachable');
    }

    const listingIdHash = computeListingIdHash(listingId);
    const statusEnumVal = OnChainVerificationStatus[newStatusName];

    if (statusEnumVal === undefined || statusEnumVal === 0) {
      throw new Error(`Invalid status transition to ${newStatusName}`);
    }

    const tx = await this.partnerVerificationContract.setStatus(listingIdHash, statusEnumVal);
    const receipt = await tx.wait();
    const block = await this.provider.getBlock(receipt.blockNumber);

    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      blockTimestamp: block ? block.timestamp : Math.floor(Date.now() / 1000),
      onChainStatus: newStatusName
    };
  }

  /**
   * Live read-only verification query for a listing
   */
  async verifyListing(listingId, expectedHash) {
    await this.initialize();
    if (!this.partnerVerificationContract) {
      return { isAvailable: false, error: 'Web3 RPC provider unavailable' };
    }

    const listingIdHash = computeListingIdHash(listingId);
    const [isActive, currentVersion] = await this.partnerVerificationContract.isListingActive(listingIdHash, expectedHash);
    const record = await this.partnerVerificationContract.getVerification(listingIdHash);

    const onChainStatusName = STATUS_NAME_MAP[Number(record.status)] || 'NONE';

    return {
      isAvailable: true,
      isActive,
      currentVersion: Number(currentVersion),
      verificationHash: record.verificationHash,
      verifierAddress: record.verifier,
      blockTimestamp: Number(record.blockTimestamp),
      onChainStatus: onChainStatusName
    };
  }

  /**
   * Explicit historical version getter
   */
  async getHistoricalHash(listingId, version) {
    await this.initialize();
    if (!this.partnerVerificationContract) return null;

    const listingIdHash = computeListingIdHash(listingId);
    return await this.partnerVerificationContract.getHistoricalHash(listingIdHash, version);
  }

  /**
   * Registers commercial tourist vehicle permit on-chain using salted privacy hashes
   */
  async registerVehiclePermit(vehicleNumber, vehicleSalt, permitType, district, validUntilTimestamp, permitSalt) {
    await this.initialize();
    if (!this.vehicleRegistryContract) {
      throw new Error('VehicleRegistry smart contract is not initialized or unreachable');
    }

    const vehicleHash = computeSaltedVehicleHash(vehicleNumber, vehicleSalt);
    const permitDigest = computeSaltedPermitDigest(permitType, district, validUntilTimestamp, permitSalt);

    const validUntilSec = typeof validUntilTimestamp === 'number' 
      ? validUntilTimestamp 
      : Math.floor(new Date(validUntilTimestamp).getTime() / 1000);

    const tx = await this.vehicleRegistryContract.registerVehiclePermit(vehicleHash, permitDigest, validUntilSec);
    const receipt = await tx.wait();
    const block = await this.provider.getBlock(receipt.blockNumber);

    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      blockTimestamp: block ? block.timestamp : Math.floor(Date.now() / 1000),
      contractAddress: await this.vehicleRegistryContract.getAddress(),
      vehicleHash,
      permitDigest,
      status: 'VALID'
    };
  }

  /**
   * Deterministic read-time validity check for commercial vehicle permit
   */
  async verifyVehiclePermit(vehicleNumber, vehicleSalt, permitType, district, validUntilTimestamp, permitSalt) {
    await this.initialize();
    if (!this.vehicleRegistryContract) {
      return { isAvailable: false, error: 'Web3 RPC provider unavailable' };
    }

    const vehicleHash = computeSaltedVehicleHash(vehicleNumber, vehicleSalt);
    const expectedDigest = computeSaltedPermitDigest(permitType, district, validUntilTimestamp, permitSalt);

    const [isValid, actualStatusNum, isExpired] = await this.vehicleRegistryContract.isPermitValid(vehicleHash, expectedDigest);
    const permitRecord = await this.vehicleRegistryContract.getPermit(vehicleHash);

    return {
      isAvailable: true,
      isValid,
      isExpired,
      onChainStatus: PERMIT_STATUS_NAME_MAP[Number(actualStatusNum)] || 'NONE',
      issuedAt: Number(permitRecord.issuedAt),
      expiresAt: Number(permitRecord.expiresAt),
      verifiedBy: permitRecord.verifiedBy
    };
  }
}

// Export singleton instance
export const web3Service = new Web3Service();
export default web3Service;
