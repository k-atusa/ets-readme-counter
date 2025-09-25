export type Rank = {
  name: string;
  period: number;
};

export const RANKS: Rank[] = [
  { name: '이병', period: 0 },
  { name: '일병', period: 3 },
  { name: '상병', period: 9 },
  { name: '병장', period: 15 },
];

export type PayGrade = {
  rank: string;
  grade: number;
  period: number;
};

export const PAY_GRADES: PayGrade[] = [
  { rank: '이병', grade: 1, period: 0 },
  { rank: '이병', grade: 2, period: 1 },
  { rank: '이병', grade: 3, period: 2 },
  { rank: '일병', grade: 1, period: 3 },
  { rank: '일병', grade: 2, period: 4 },
  { rank: '일병', grade: 3, period: 5 },
  { rank: '일병', grade: 4, period: 6 },
  { rank: '일병', grade: 5, period: 7 },
  { rank: '일병', grade: 6, period: 8 },
  { rank: '상병', grade: 1, period: 9 },
  { rank: '상병', grade: 2, period: 10 },
  { rank: '상병', grade: 3, period: 11 },
  { rank: '상병', grade: 4, period: 12 },
  { rank: '상병', grade: 5, period: 13 },
  { rank: '상병', grade: 6, period: 14 },
  { rank: '병장', grade: 1, period: 15 },
  { rank: '병장', grade: 2, period: 16 },
  { rank: '병장', grade: 3, period: 17 },
  { rank: '병장', grade: 4, period: 18 },
];


const KST_OFFSET = 9 * 60 * 60 * 1000;

function parseYMD(dateString: string) {
  const [y, m, d] = dateString.split('-').map(Number);
  return { year: y, monthIndex: m - 1, day: d };
}

function getCurrentKST(): Date {
  // Use Date.now() (UTC ms) and add KST offset to get the current KST wall-clock epoch.
  return new Date(Date.now() + KST_OFFSET);
}

function parseDateAsKST(dateString: string): Date {
  // Return a Date whose epoch corresponds to midnight at KST for the given Y-M-D.
  const { year, monthIndex, day } = parseYMD(dateString);
  const utcMsForKstMidnight = Date.UTC(year, monthIndex, day) - KST_OFFSET;
  return new Date(utcMsForKstMidnight);
}

function getPromotionDate(startDate: string, months: number): Date {
  // Compute the KST-midnight moment for the 1st day of (startMonth + months)
  const { year, monthIndex } = parseYMD(startDate);
  const targetUtcMsForKstMidnight = Date.UTC(year, monthIndex + months, 1) - KST_OFFSET;
  return new Date(targetUtcMsForKstMidnight);
}

function toYYYYMMDD(date: Date): string {
  // The Date objects used throughout represent KST-midnight instants.
  // To format the KST date correctly regardless of runtime timezone,
  // shift the epoch by KST_OFFSET and read the UTC fields.
  const kst = new Date(date.getTime() + KST_OFFSET);
  const year = kst.getUTCFullYear();
  const month = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kst.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateServiceInfo(startDate: string, endDate: string) {
  const start = parseDateAsKST(startDate);
  const end = parseDateAsKST(endDate);
  const current = getCurrentKST();

  const totalService = end.getTime() - start.getTime();
  const currentService = Math.max(0, current.getTime() - start.getTime());
  
  const isDischarged = currentService >= totalService;

  let dDay;
  if (isDischarged) {
    dDay = `+${Math.floor((current.getTime() - end.getTime()) / (1000 * 60 * 60 * 24)) + 1}`;
  } else {
    dDay = `-${Math.ceil((end.getTime() - current.getTime()) / (1000 * 60 * 60 * 24))}`;
  }

  const totalProgress = Math.min((currentService / totalService) * 100, 100);
  
  const elapsedMonths = (current.getFullYear() - start.getFullYear()) * 12 + (current.getMonth() - start.getMonth());

  const currentPayGrade = PAY_GRADES.slice().reverse().find(pg => elapsedMonths >= pg.period) || PAY_GRADES[0];
  const currentRankInfo = RANKS.slice().reverse().find(r => elapsedMonths >= r.period) || RANKS[0];

  const nextPayGrade = PAY_GRADES.find(pg => pg.period > currentPayGrade.period);
  
  const nextRankInfo = RANKS.find(r => r.period > currentRankInfo.period);

  let progressToNextHobong = 100;
  const startOfCurrentHobong = getPromotionDate(startDate, currentPayGrade.period);
  if (nextPayGrade && !isDischarged) {
    const startOfNextHobong = getPromotionDate(startDate, nextPayGrade.period);
    const totalDuration = startOfNextHobong.getTime() - startOfCurrentHobong.getTime();
    const elapsedDuration = current.getTime() - startOfCurrentHobong.getTime();
    progressToNextHobong = Math.min((elapsedDuration / totalDuration) * 100, 100);
  } else if (!isDischarged) {
    const totalDuration = end.getTime() - startOfCurrentHobong.getTime();
    const elapsedDuration = current.getTime() - startOfCurrentHobong.getTime();
    progressToNextHobong = Math.min((elapsedDuration / totalDuration) * 100, 100);
  }

  let progressToNextRank = 100;
  const startOfCurrentRank = getPromotionDate(startDate, currentRankInfo.period);
  if (nextRankInfo && !isDischarged) {
    const startOfNextRank = getPromotionDate(startDate, nextRankInfo.period);
    const totalDuration = startOfNextRank.getTime() - startOfCurrentRank.getTime();
    const elapsedDuration = current.getTime() - startOfCurrentRank.getTime();
    progressToNextRank = Math.min((elapsedDuration / totalDuration) * 100, 100);
  } else if (!isDischarged) {
    const totalDuration = end.getTime() - startOfCurrentRank.getTime();
    const elapsedDuration = current.getTime() - startOfCurrentRank.getTime();
    progressToNextRank = Math.min((elapsedDuration / totalDuration) * 100, 100);
  }

  return {
    dDay,
    currentRank: isDischarged ? "민간인" : currentRankInfo.name,
    currentHobong: isDischarged ? "" : `${currentPayGrade.grade}호봉`,
    dischargeDate: endDate,
    totalProgress,
    
    nextHobongDate: nextPayGrade && !isDischarged ? toYYYYMMDD(getPromotionDate(startDate, nextPayGrade.period)) : endDate,
    nextHobongName: nextPayGrade && !isDischarged ? `${nextPayGrade.rank} ${nextPayGrade.grade}호봉` : "민간인",
    progressToNextHobong: Math.max(0, progressToNextHobong),

    nextRankDate: nextRankInfo && !isDischarged ? toYYYYMMDD(getPromotionDate(startDate, nextRankInfo.period)) : endDate,
    nextRankName: nextRankInfo && !isDischarged ? nextRankInfo.name : "민간인",
    progressToNextRank: Math.max(0, progressToNextRank),
  };
}