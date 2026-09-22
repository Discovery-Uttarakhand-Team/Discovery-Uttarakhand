import React from 'react';
import { ShieldCheck, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * VerificationBadge
 * Displays trusted blockchain attestation badge with neutral branding.
 */
export default function VerificationBadge({ listingId, web3Sync, size = 'sm', showLink = true }) {
  if (!web3Sync || web3Sync.syncStatus !== 'CONFIRMED' || web3Sync.onChainStatus !== 'ACTIVE') {
    return null;
  }

  const isSmall = size === 'sm';

  const badgeContent = (
    <span 
      className={`inline-flex items-center gap-1 font-bold rounded-full bg-forest-green/10 text-forest-green border border-forest-green/20 ${
        isSmall ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      } transition-colors hover:bg-forest-green/15`}
      title={`Blockchain Attested (Block #${web3Sync.blockNumber || 'EVM'})`}
    >
      <ShieldCheck size={isSmall ? 12 : 14} className="text-forest-green flex-shrink-0" />
      <span>Verified On-Chain</span>
      {web3Sync.blockNumber && (
        <span className="text-muted-text font-medium text-[9px]">
          #{web3Sync.blockNumber}
        </span>
      )}
    </span>
  );

  if (!showLink || !listingId) {
    return badgeContent;
  }

  return (
    <Link 
      to={`/verify/listing/${listingId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 group"
      onClick={(e) => e.stopPropagation()}
    >
      {badgeContent}
      <ExternalLink size={10} className="text-forest-green/70 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}
