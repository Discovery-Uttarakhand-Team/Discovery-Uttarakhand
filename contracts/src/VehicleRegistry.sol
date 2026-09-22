// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title VehicleRegistry
 * @notice Verifies tourist transport permits (e.g. Green Cards, hill permits) using salted privacy hashes.
 * @dev Enforces read-time expiration checks and administrative status control.
 */
contract VehicleRegistry is AccessControl {
    bytes32 public constant INSPECTOR_ROLE = keccak256("INSPECTOR_ROLE");

    enum PermitStatus { NONE, VALID, SUSPENDED, REVOKED }

    struct VehiclePermitRecord {
        bytes32 permitDigest;    // keccak256(permitType, district, validUntil, permitSalt)
        uint64 issuedAt;
        uint64 expiresAt;
        PermitStatus status;
        address verifiedBy;
    }

    // vehicleHash (salted) => VehiclePermitRecord
    mapping(bytes32 => VehiclePermitRecord) private permits;

    event VehiclePermitRecorded(bytes32 indexed vehicleHash, bytes32 permitDigest, uint64 expiresAt, address indexed inspector);
    event VehiclePermitStatusChanged(bytes32 indexed vehicleHash, PermitStatus status, address indexed inspector);

    error PermitAlreadyExpired();
    error PermitNotFound();
    error InvalidStatusTransition();
    error PermitRevoked();

    constructor(address initialAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(INSPECTOR_ROLE, initialAdmin);
    }

    function registerVehiclePermit(
        bytes32 vehicleHash,
        bytes32 permitDigest,
        uint64 expiresAt
    ) external onlyRole(INSPECTOR_ROLE) {
        if (expiresAt <= block.timestamp) revert PermitAlreadyExpired();
        if (permits[vehicleHash].status == PermitStatus.REVOKED) revert PermitRevoked();
        
        permits[vehicleHash] = VehiclePermitRecord({
            permitDigest: permitDigest,
            issuedAt: uint64(block.timestamp),
            expiresAt: expiresAt,
            status: PermitStatus.VALID,
            verifiedBy: msg.sender
        });

        emit VehiclePermitRecorded(vehicleHash, permitDigest, expiresAt, msg.sender);
    }

    function setPermitStatus(
        bytes32 vehicleHash,
        PermitStatus newStatus
    ) external onlyRole(INSPECTOR_ROLE) {
        VehiclePermitRecord storage permit = permits[vehicleHash];
        if (permit.status == PermitStatus.NONE) revert PermitNotFound();
        if (permit.status == PermitStatus.REVOKED) revert PermitRevoked();
        if (newStatus == PermitStatus.NONE || newStatus == permit.status) revert InvalidStatusTransition();

        permit.status = newStatus;
        emit VehiclePermitStatusChanged(vehicleHash, newStatus, msg.sender);
    }

    /**
     * @notice Deterministic read-time validity check.
     * @dev Permits past expiresAt are immediately reported as invalid without waiting for state mutations.
     */
    function isPermitValid(bytes32 vehicleHash, bytes32 expectedDigest) external view returns (
        bool isValid,
        PermitStatus actualStatus,
        bool isExpired
    ) {
        VehiclePermitRecord memory p = permits[vehicleHash];
        if (p.status == PermitStatus.NONE) {
            return (false, PermitStatus.NONE, false);
        }
        
        isExpired = (block.timestamp > p.expiresAt);
        actualStatus = p.status;
        
        isValid = (p.status == PermitStatus.VALID && !isExpired && p.permitDigest == expectedDigest);
    }

    function getPermit(bytes32 vehicleHash) external view returns (
        bytes32 permitDigest,
        uint64 issuedAt,
        uint64 expiresAt,
        PermitStatus status,
        address verifiedBy
    ) {
        VehiclePermitRecord memory p = permits[vehicleHash];
        return (p.permitDigest, p.issuedAt, p.expiresAt, p.status, p.verifiedBy);
    }
}
