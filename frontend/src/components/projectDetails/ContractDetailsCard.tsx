import React from 'react';
import { projectsAssets } from '@/assets';
import { AssetIcon } from '../ui/AssetIcon';
import DetailCardHeader from './DetailCardHeader';
import type { ContractDetails } from '../../types/projectDetails';

export interface ContractDetailsCardProps {
  details: ContractDetails;
}

const statusStyles: Record<ContractDetails['status'], { label: string }> = {
  active: { label: 'ساري' },
  expired: { label: 'منتهي' },
  pending: { label: 'قيد الانتظار' },
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex min-h-[58px] flex-col gap-[5px] border-b border-[#e7e8eb] p-[10px_12px]">
    <span className="text-[9px] text-[#96989f]">{label}</span>
    <strong className="text-[11px] font-bold text-[#111214]">{children}</strong>
  </div>
);

const ContractDetailsCard: React.FC<ContractDetailsCardProps> = ({ details }) => {
  const status = statusStyles[details.status];

  return (
    <div className="project-detail__card project-detail__contract-card" dir="rtl">
      <DetailCardHeader title="تفاصيل العقد" icon={<AssetIcon src={projectsAssets.contract} size={22} />} />
      <div className="project-detail__contract-grid">
        <Field label="رقم العقد">{details.contractNumber}</Field>
        <Field label="تاريخ التوقيع">{details.signDate}</Field>
        <Field label="الجهة المتعاقد معها">{details.contractor}</Field>
        <Field label="تاريخ البداية">{details.startDate}</Field>
        <Field label="تاريخ النهاية">{details.endDate}</Field>
        <Field label="حالة العقد">
          <span
            className="inline-block w-max rounded-[9px] px-[9px] py-[3px] text-[11px] font-bold"
            style={{ background: '#d1f0e1', color: '#17b26a' }}
          >
            {status.label}
          </span>
        </Field>
      </div>
    </div>
  );
};

export default ContractDetailsCard;
