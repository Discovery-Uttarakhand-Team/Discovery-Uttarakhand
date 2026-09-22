// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title PartnerVerification
 * @notice Canonical attestation registry for verified tourism partners in Discovery Uttarakhand.
 * @dev Enforces contract-controlled versioning, version overflow protection,
 *      strict state machine transitions, permanent revocation, and historical version access.
 */
contract PartnerVerification is AccessControl {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    enum VerificationStatus { NONE, ACTIVE, SUSPENDED, REVOKED }

    struct VerificationRecord {
        bytes32 verificationHash; // SHA-256 digest of salted canonical listing snapshot
        address verifier;         // Platform Admin signer
        uint64 blockTimestamp;    // EVM block timestamp
        uint16 version;           // Contract-derived sequential version
        VerificationStatus status;// ACTIVE, SUSPENDED, REVOKED
    }

    // listingIdHash => Current Verification Record
    mapping(bytes32 => VerificationRecord) private records;

    // listingIdHash => version => historical VerificationHash
    mapping(bytes32 => mapping(uint16 => bytes32)) private historicalHashes;

    event ListingAttested(
        bytes32 indexed listingIdHash, 
        bytes32 verificationHash, 
        uint16 version, 
        address indexed verifier,
        uint64 timestamp
    );
    event ListingStatusChanged(
        bytes32 indexed listingIdHash, 
        VerificationStatus previousStatus, 
        VerificationStatus newStatus, 
        address indexed admin,
        uint64 timestamp
    );

    error InvalidHash();
    error ListingRevoked();
    error RecordNotFound();
    error VersionOverflow();
    error InvalidStatusTransition();

    constructor(address initialAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(VERIFIER_ROLE, initialAdmin);
    }

    /**
     * @notice Single canonical write path for initial attestation and re-verifications.
     * @dev Version is strictly derived and incremented by the contract.
     *      Includes uint16 overflow protection.
     *      REVOKED listings are permanently sealed and cannot be attested.
     */
    function attestListing(
        bytes32 listingIdHash,
        bytes32 verificationHash
    ) external onlyRole(VERIFIER_ROLE) returns (uint16 newVersion) {
        if (verificationHash == bytes32(0)) revert InvalidHash();

        VerificationRecord storage record = records[listingIdHash];
        if (record.status == VerificationStatus.REVOKED) revert ListingRevoked();

        // 1. Version Overflow Protection
        if (record.version == type(uint16).max) {
            revert VersionOverflow();
        }

        // 2. Contract-Controlled Incrementation
        newVersion = record.version + 1;
        
        record.verificationHash = verificationHash;
        record.verifier = msg.sender;
        record.blockTimestamp = uint64(block.timestamp);
        record.version = newVersion;
        record.status = VerificationStatus.ACTIVE;

        // 3. Historical Record Store
        historicalHashes[listingIdHash][newVersion] = verificationHash;

        emit ListingAttested(listingIdHash, verificationHash, newVersion, msg.sender, uint64(block.timestamp));
        return newVersion;
    }

    /**
     * @notice Administrative status transition with strict state machine validation.
     * @dev Allowed transitions:
     *      - ACTIVE    -> SUSPENDED
     *      - ACTIVE    -> REVOKED
     *      - SUSPENDED -> ACTIVE
     *      - SUSPENDED -> REVOKED
     *      Disallowed transitions:
     *      - Setting to NONE (not allowed)
     *      - Setting to same status (not allowed)
     *      - Transitions from NONE or REVOKED (reverted)
     */
    function setStatus(
        bytes32 listingIdHash,
        VerificationStatus newStatus
    ) external onlyRole(VERIFIER_ROLE) {
        VerificationRecord storage record = records[listingIdHash];
        if (record.status == VerificationStatus.NONE) revert RecordNotFound();
        if (record.status == VerificationStatus.REVOKED) revert ListingRevoked();
        if (newStatus == VerificationStatus.NONE || newStatus == record.status) {
            revert InvalidStatusTransition();
        }

        VerificationStatus previous = record.status;

        // Validate allowed transitions
        bool isValidTransition = 
            (previous == VerificationStatus.ACTIVE && (newStatus == VerificationStatus.SUSPENDED || newStatus == VerificationStatus.REVOKED)) ||
            (previous == VerificationStatus.SUSPENDED && (newStatus == VerificationStatus.ACTIVE || newStatus == VerificationStatus.REVOKED));

        if (!isValidTransition) {
            revert InvalidStatusTransition();
        }

        record.status = newStatus;

        emit ListingStatusChanged(listingIdHash, previous, newStatus, msg.sender, uint64(block.timestamp));
    }

    /**
     * @notice Live verification query with tamper verification.
     */
    function isListingActive(
        bytes32 listingIdHash, 
        bytes32 expectedHash
    ) external view returns (bool isActive, uint16 currentVersion) {
        VerificationRecord memory record = records[listingIdHash];
        isActive = (record.status == VerificationStatus.ACTIVE && record.verificationHash == expectedHash);
        currentVersion = record.version;
    }

    /**
     * @notice Read current verification record.
     */
    function getVerification(bytes32 listingIdHash) external view returns (
        bytes32 verificationHash,
        address verifier,
        uint64 blockTimestamp,
        uint16 version,
        VerificationStatus status
    ) {
        VerificationRecord memory r = records[listingIdHash];
        return (r.verificationHash, r.verifier, r.blockTimestamp, r.version, r.status);
    }

    /**
     * @notice Explicit historical version getter for auditability.
     */
    function getHistoricalHash(bytes32 listingIdHash, uint16 version) external view returns (bytes32) {
        return historicalHashes[listingIdHash][version];
    }
}
