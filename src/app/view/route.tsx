import { calculateServiceInfo } from '@/lib/military';
import { NextRequest } from 'next/server';

export const runtime = 'edge';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const formatDateKorean = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  return `${year}년 ${String(month).padStart(2, '0')}월 ${String(day).padStart(2, '0')}일`;
};

const formatDateDots = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

export const GET = async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startdate');
    const endDate = searchParams.get('enddate');
    const branch = searchParams.get('branch');

    if (!startDate) {
      return new Response('Missing start date', { status: 400 });
    }

    const formattedStartDate = startDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');

    // Determine endDate either from provided enddate (backwards compatible) or from branch mapping
    let formattedEndDate: string | null = null;
    if (endDate) {
      formattedEndDate = endDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
    } else if (branch) {
      const monthsMap: Record<string, number> = {
        army: 18,
        marines: 18,
        navy: 20,
        airforce: 21,
      };
      const months = monthsMap[branch] ?? 18;
      // compute end date as start + months - 1 day (so e.g., start 2025-03-04 + 18 months -> 2026-09-03)
      const [y, m, d] = formattedStartDate.split('-').map(Number);
      const endYear = y + Math.floor((m - 1 + months) / 12);
      const endMonth = ((m - 1 + months) % 12) + 1;
      // subtract 1 day to make end date the day before same-day-of-month
      // Compute KST target same-day midnight epoch, then subtract 1 day (KST) -> format that KST date
      // Simplest: take UTC midnight of target same-day and subtract 1 day, then read UTC Y-M-D (which equals KST date)
      const endDateObj = new Date(Date.UTC(endYear, endMonth - 1, d) - MS_PER_DAY);
      const ey = endDateObj.getUTCFullYear();
      const em = String(endDateObj.getUTCMonth() + 1).padStart(2, '0');
      const ed = String(endDateObj.getUTCDate()).padStart(2, '0');
      formattedEndDate = `${ey}-${em}-${ed}`;
    } else {
      return new Response('Missing end date or branch', { status: 400 });
    }

    const serviceInfo = calculateServiceInfo(formattedStartDate, formattedEndDate);
    const debug = searchParams.get('debug') === '1';
    // compute some raw epoch values for troubleshooting
    const promotionEpoch = (months: number) => {
      const [y, m] = formattedStartDate.split('-').map(Number);
      const totalMonths = (m - 1) + months;
      const py = y + Math.floor(totalMonths / 12);
      const pm = totalMonths % 12;
      // UTC instant representing KST midnight of the 1st of promotion month
      return Date.UTC(py, pm, 1) - (9 * 60 * 60 * 1000);
    };
    const currentUtc = Date.now();
    const currentPromoEpoch = promotionEpoch((serviceInfo.currentHobong ? Number(serviceInfo.currentHobong.replace(/[^0-9]/g, '')) : 0) + (serviceInfo.currentRank === '병장' ? 14 : 0));

    const svg = `
      <svg width="400" height="190" viewBox="0 0 400 190" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>
          .font { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Pretendard', Roboto, Helvetica, Arial, sans-serif; }
          .bg-main { fill: #3A3635; }
          .bg-header { fill: #2C2A29; }
          .text-light { fill: #EAEAEA; font-weight: 600; font-size: 14px; }
          .text-dday { fill: #EAEAEA; font-weight: 600; font-size: 16px; }
          .text-gray { fill: #B0B0B0; font-size: 12px; }
          .text-percent { fill: #B0B0B0; font-size: 11px; }
          .text-title { fill: #EAEAEA; font-weight: 600; font-size: 14px; }
          .text-date { fill: #EAEAEA; font-size: 13px; }
          .progress-bg { fill: #4A4645; }
          .progress-fg { fill: #82C8BD; }
          .icon { fill: #82C8BD; }
          svg { background: #f0f0f0; }
          @media (prefers-color-scheme: dark) {
            svg { background: #131010; }
          }
        </style>

        <rect width="400" height="190" rx="8" class="bg-main"/>
        <rect width="400" height="40" rx="8" ry="8" class="bg-header" />

        <g class="font" transform="translate(20, 25)">
          <path class="icon" d="M10.7071 2.29289C11.0976 1.90237 11.7308 1.90237 12.1213 2.29289L16.4142 6.58579C16.7893 6.96086 17 7.46957 17 8V15C17 16.1046 16.1046 17 15 17H8C6.89543 17 6 16.1046 6 15V8C6 7.46957 6.21071 6.96086 6.58579 6.58579L10.7071 2.29289Z" transform="translate(-5, -14) scale(0.9)"/>
          <text x="20" y="0" class="text-dday">D${serviceInfo.dDay}</text>
          <text x="360" y="0" text-anchor="end" class="text-light">${serviceInfo.currentRank} ${serviceInfo.currentHobong}</text>
        </g>

        <g class="font" transform="translate(20, 65)">
          <text class="text-title">전역</text>
          <text x="360" y="0" text-anchor="end" class="text-date">${formatDateKorean(serviceInfo.dischargeDate)}</text>
          <rect y="10" width="360" height="6" rx="2" class="progress-bg" />
          <rect y="10" width="${(serviceInfo.totalProgress / 100) * 360}" height="6" rx="2" class="progress-fg" />
          <text y="32" class="text-percent">${serviceInfo.totalProgress.toFixed(5)}%</text>
        </g>
        
        <g class="font" transform="translate(20, 125)">
            <text class="text-gray">다음 호봉</text>
            <text x="170" y="0" text-anchor="end" class="text-gray">${formatDateDots(serviceInfo.nextHobongDate)}</text>
            <text y="20" class="text-light">${serviceInfo.nextHobongName}</text>
            <rect y="30" width="170" height="4" rx="2" class="progress-bg" />
            <rect y="30" width="${(serviceInfo.progressToNextHobong / 100) * 170}" height="4" rx="2" class="progress-fg" />
            <text y="50" class="text-percent">${serviceInfo.progressToNextHobong.toFixed(5)}%</text>
        </g>

        <g class="font" transform="translate(210, 125)">
            <text class="text-gray">다음 계급</text>
            <text x="170" y="0" text-anchor="end" class="text-gray">${formatDateDots(serviceInfo.nextRankDate)}</text>
            <text y="20" class="text-light">${serviceInfo.nextRankName}</text>
            <rect y="30" width="170" height="4" rx="2" class="progress-bg" />
            <rect y="30" width="${(serviceInfo.progressToNextRank / 100) * 170}" height="4" rx="2" class="progress-fg" />
            <text y="50" class="text-percent">${serviceInfo.progressToNextRank.toFixed(5)}%</text>
        </g>
      </svg>
    `;

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (e: unknown) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    return new Response(`Failed to generate the image: ${errorMessage}`, {
      status: 500,
    });
  }
};