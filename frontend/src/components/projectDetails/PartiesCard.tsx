import React from 'react';
import { projectsAssets } from '@/assets';
import { AssetIcon } from '../ui/AssetIcon';
import DetailCardHeader from './DetailCardHeader';

export interface ProjectParty {
  role: string;
  contact: string;
  tag: 'مورد' | 'العميل';
  initial: string;
}

export interface PartiesCardProps {
  parties: ProjectParty[];
}

const tagStyles: Record<ProjectParty['tag'], { avatarBg: string; tagBg: string; tagColor: string }> = {
  مورد: { avatarBg: '#5bc8b4', tagBg: '#dceeff', tagColor: '#2e90fa' },
  العميل: { avatarBg: '#58a6fb', tagBg: '#d1f0e1', tagColor: '#4fc7a7' },
};

const PartyRow: React.FC<{ party: ProjectParty; isLast: boolean }> = ({ party, isLast }) => {
  const styles = tagStyles[party.tag];
  return (
    <div
      className={`project-detail__party ${isLast ? '' : ''}`}
      dir="rtl"
    >
      <div className="project-detail__party-copy">
        <strong className="text-[12px] font-bold text-[#111214]">{party.role}</strong>
        <span className="text-[10px] text-[#111214]">{party.contact}</span>
      </div>
      <span
        className={`project-detail__party-avatar ${party.tag === 'مورد' ? 'is-supplier' : 'is-client'}`}
        style={{ background: styles.avatarBg }}
      >
        {party.initial}
      </span>
      <span
        className={`project-detail__party-tag ${party.tag === 'مورد' ? 'is-supplier-tag' : 'is-client-tag'}`}
        style={{ background: styles.tagBg, color: styles.tagColor }}
      >
        {party.tag}
      </span>
    </div>
  );
};

const PartiesCard: React.FC<PartiesCardProps> = ({ parties }) => {
  return (
    <div className="project-detail__card project-detail__parties-card" dir="rtl">
      <DetailCardHeader title="أطراف المشروع" icon={<AssetIcon src={projectsAssets.team} size={22} />} />
      <div className="flex flex-col">
        {parties.map((party, index) => (
          <PartyRow key={party.role} party={party} isLast={index === parties.length - 1} />
        ))}
      </div>
    </div>
  );
};

export default PartiesCard;
