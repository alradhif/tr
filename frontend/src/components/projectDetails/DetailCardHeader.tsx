import React from 'react';

export interface DetailCardHeaderProps {
  title: string;
  icon: React.ReactNode;
}

const DetailCardHeader: React.FC<DetailCardHeaderProps> = ({ title, icon }) => (
  <div className="project-detail__section-heading" dir="rtl">
    <h2>{title}</h2>
    <span className="project-detail__section-icon" aria-hidden="true">{icon}</span>
  </div>
);

export default DetailCardHeader;
