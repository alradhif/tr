

import type { PackageDuration } from '../context/PackageContext';

function parseDateParts(dateString: string): { year: number; month: number; day: number } | null {
  if (!dateString || typeof dateString !== 'string') return null;
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function daysInMonth(year: number, month: number): number {
  
  return new Date(year, month, 0).getDate();
}

export function calculateRenewalDate(
  startDateString: string,
  durationType: PackageDuration | string,
): string | null {
  if (!startDateString) return null;

  const parts = parseDateParts(startDateString);
  if (!parts) return null;

  const { year: origYear, month: origMonth, day: origDay } = parts;

  let targetYear = origYear;
  let targetMonth = origMonth;

  if (durationType === 'شهري') {
    
    targetMonth = origMonth + 1;
    if (targetMonth > 12) {
      targetMonth = 1;
      targetYear += 1;
    }
  } else {
    
    targetYear = origYear + 1;
    
  }

  
  
  const maxDay = daysInMonth(targetYear, targetMonth);
  const targetDay = Math.min(origDay, maxDay);

  
  return `${targetYear}-${pad2(targetMonth)}-${pad2(targetDay)}`;
}

export function formatDateArabic(dateString: string): string {
  const parts = parseDateParts(dateString);
  if (!parts) return dateString;
  const { year, month, day } = parts;
  return `${pad2(day)} / ${pad2(month)} / ${year}`;
}
