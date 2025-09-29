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
  { rank: '병장', grade: 5, period: 19 },
  { rank: '병장', grade: 6, period: 20 },
  { rank: '병장', grade: 7, period: 21 },
];

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * YYYY-MM-DD -> KST 자정(UTC epoch) Date 반환
 */
const parseDateAsKST = (dateString: string): Date => {
  const [y, m, d] = dateString.split('-').map(Number);
  // Date.UTC 년,월(0~11),일 에서 KST 자정(epoch)을 얻기 위해 KST offset을 뺌
  const epoch = Date.UTC(y, m - 1, d) - KST_OFFSET_MS;
  return new Date(epoch);
};

/**
 * startDate 문자열(YYYY-MM-DD) 기준으로 months(개월) 지난 달의 1일 KST 자정 Date 반환
 */
const getPromotionDate = (startDate: string, months: number): Date => {
  const [y, m, d] = startDate.split('-').map(Number);
  const startMonthIndex = m - 1;
  // If enlistment is on the 1st day of the month, treat that month as month 1
  // (i.e., promotions are shifted earlier by one month). This matches real
  // cases where someone enlisting on the 1st immediately counts that month.
  const offsetMonths = (d === 1 && months > 0) ? months - 1 : months;
  const totalMonths = startMonthIndex + offsetMonths;
  const promotionYear = y + Math.floor(totalMonths / 12);
  const promotionMonth = totalMonths % 12;
  const epoch = Date.UTC(promotionYear, promotionMonth, 1) - KST_OFFSET_MS;
  return new Date(epoch);
};

/**
 * Date 객체를 YYYY-MM-01 형식의 문자열로 변환 (KST 기준)
 */
const toYYYYMM01 = (date: Date): string => {
  // date is an epoch representing the KST midnight instant (UTC epoch = Date.UTC(y,m,d)-9h)
  // to get the KST calendar fields, shift epoch by +9h then read UTC fields.
  const kstEpoch = date.getTime() + KST_OFFSET_MS;
  const kst = new Date(kstEpoch);
  const year = kst.getUTCFullYear();
  const month = String(kst.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

const calculateProgress = (current: Date, start: Date, end: Date): number => {
  if (current.getTime() >= end.getTime()) return 100;
  if (current.getTime() <= start.getTime()) return 0;
  const totalDuration = end.getTime() - start.getTime();
  const elapsedDuration = current.getTime() - start.getTime();
  // Return higher precision (5 decimal places) to avoid downstream truncation issues
  return Math.min(Number((elapsedDuration / totalDuration * 100).toFixed(5)), 100);
};

export const calculateServiceInfo = (startDate: string, endDate: string) => {
  // All dates are handled in UTC
  const start = parseDateAsKST(startDate);
  const end = parseDateAsKST(endDate);
  const now = new Date(Date.now());

  const totalService = end.getTime() - start.getTime();
  const currentService = Math.max(0, now.getTime() - start.getTime());

  const isDischarged = currentService >= totalService;

  let dDay: string;
  if (isDischarged) {
    const daysAfter = Math.floor((now.getTime() - end.getTime()) / MS_PER_DAY);
    dDay = `+${daysAfter + 1}`;
  } else {
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / MS_PER_DAY);
    dDay = `-${daysLeft}`;
  }

  const totalProgress = Math.min(Number(((currentService / totalService) * 100).toFixed(5)), 100);

  const currentEpoch = now.getTime();

  const promotionEpoch = (months: number) => getPromotionDate(startDate, months).getTime();

  const currentPayGrade = PAY_GRADES.slice().reverse().find(pg => currentEpoch >= promotionEpoch(pg.period)) || PAY_GRADES[0];
  const currentRankInfo = RANKS.slice().reverse().find(r => currentEpoch >= promotionEpoch(r.period)) || RANKS[0];

  // Only consider next promotions that happen before discharge
  const nextPayGrade = PAY_GRADES.find(pg => pg.period > currentPayGrade.period && promotionEpoch(pg.period) < end.getTime());
  const nextRankInfo = RANKS.find(r => r.period > currentRankInfo.period && promotionEpoch(r.period) < end.getTime());

  const startOfCurrentHobong = new Date(promotionEpoch(currentPayGrade.period));
  const endOfHobongPeriod = nextPayGrade ? new Date(promotionEpoch(nextPayGrade.period)) : end;
  const progressToNextHobong = isDischarged
    ? 100
    : calculateProgress(now, startOfCurrentHobong, endOfHobongPeriod);

  const startOfCurrentRank = currentRankInfo.period === 0
    ? start
    : new Date(promotionEpoch(currentRankInfo.period));
  const endOfRankPeriod = nextRankInfo ? new Date(promotionEpoch(nextRankInfo.period)) : end;
  const progressToNextRank = isDischarged
    ? 100
    : calculateProgress(now, startOfCurrentRank, endOfRankPeriod);

  return {
    dDay,
    currentRank: isDischarged ? "민간인" : currentRankInfo.name,
    currentHobong: isDischarged ? "" : `${currentPayGrade.grade}호봉`,
    dischargeDate: endDate,
  totalProgress,

    nextHobongDate: nextPayGrade && !isDischarged ? toYYYYMM01(endOfHobongPeriod) : endDate,
    nextHobongName: nextPayGrade && !isDischarged ? `${nextPayGrade.rank} ${nextPayGrade.grade}호봉` : "민간인",
  progressToNextHobong: Math.max(0, Number(progressToNextHobong.toFixed(5))),

    nextRankDate: nextRankInfo && !isDischarged ? toYYYYMM01(endOfRankPeriod) : endDate,
    nextRankName: nextRankInfo && !isDischarged ? nextRankInfo.name : "민간인",
  progressToNextRank: Math.max(0, Number(progressToNextRank.toFixed(5))),
  };
};