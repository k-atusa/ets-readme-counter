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

/**
 * 날짜 문자열(YYYY-MM-DD)을 KST 자정(UTC+9) 기준으로 Date 객체로 변환합니다.
 * @param dateString YYYY-MM-DD 형식의 날짜 문자열
 */
function parseDateAsUTC(dateString: string): Date {
  return new Date(`${dateString}T00:00:00+09:00`);
}

/**
 * 입대일로부터 특정 개월 수가 지난 후의 진급일(해당 월 1일)을 KST 자정 기준으로 계산합니다.
 * @param startDate 입대일
 * @param months 입대일로부터 지난 개월 수
 */
function getPromotionDate(startDate: string, months: number): Date {
  const start = parseDateAsUTC(startDate);
  const promotionYear = start.getUTCFullYear() + Math.floor((start.getUTCMonth() + months) / 12);
  const promotionMonth = (start.getUTCMonth() + months) % 12;
  // KST 1일 00:00:00 에 해당하는 UTC 시간으로 설정
  const result = new Date(Date.UTC(promotionYear, promotionMonth, 1, -9));
  return result;
}

/**
 * Date 객체를 YYYY-MM-01 형식의 문자열로 변환합니다.
 * UTC 날짜를 기준으로 연도와 월을 추출하여 항상 1일로 표시합니다.
 * @param date 변환할 Date 객체
 */
function toYYYYMM01(date: Date): string {
  // KST 기준으로 날짜를 계산하기 위해 9시간(ms)을 더함
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const year = kstDate.getUTCFullYear();
  const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
  const day = '01';
  return `${year}-${month}-${day}`;
}

function calculateProgress(current: Date, start: Date, end: Date): number {
  if (current.getTime() >= end.getTime()) return 100;
  if (current.getTime() <= start.getTime()) return 0;
  const totalDuration = end.getTime() - start.getTime();
  const elapsedDuration = current.getTime() - start.getTime();
  return Math.min((elapsedDuration / totalDuration) * 100, 100);
}

export function calculateServiceInfo(startDate: string, endDate: string) {
  const start = parseDateAsUTC(startDate);
  const end = parseDateAsUTC(endDate);
  const current = new Date(); // 현재 UTC 시간

  const totalService = end.getTime() - start.getTime();
  const currentService = Math.max(0, current.getTime() - start.getTime());
  
  const isDischarged = currentService >= totalService;

  let dDay;
  if (isDischarged) {
    // 전역일 KST 자정(UTC 전날 15:00)을 기준으로 D-Day 계산
    const dischargeDayStartKST = new Date(end.getTime());
    const currentDayStartKST = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 0, 0, 0, 0);
    dDay = `+${Math.floor((currentDayStartKST.getTime() - dischargeDayStartKST.getTime()) / (1000 * 60 * 60 * 24)) + 1}`;
  } else {
    // 전역일 KST 자정(UTC 전날 15:00)을 기준으로 D-Day 계산
    const endOfDay = new Date(end.getTime());
    endOfDay.setUTCHours(23, 59, 59, 999);
    dDay = `-${Math.ceil((endOfDay.getTime() - current.getTime()) / (1000 * 60 * 60 * 24))}`;
  }

  const totalProgress = Math.min((currentService / totalService) * 100, 100);
  
  let elapsedMonths = (current.getUTCFullYear() - start.getUTCFullYear()) * 12 + (current.getUTCMonth() - start.getUTCMonth());
  // 현재 날짜의 '일'이 입대일의 '일'보다 작으면 아직 한 달이 다 차지 않은 것으로 간주
  if (current.getUTCDate() < start.getUTCDate()) {
    elapsedMonths--;
  }

  const currentPayGrade = PAY_GRADES.slice().reverse().find(pg => elapsedMonths >= pg.period) || PAY_GRADES[0];
  const currentRankInfo = RANKS.slice().reverse().find(r => elapsedMonths >= r.period) || RANKS[0];

  const nextPayGrade = PAY_GRADES.find(pg => pg.period > currentPayGrade.period);
  
  const nextRankInfo = RANKS.find(r => r.period > currentRankInfo.period);

  const startOfCurrentHobong = getPromotionDate(startDate, currentPayGrade.period);
  const endOfHobongPeriod = nextPayGrade ? getPromotionDate(startDate, nextPayGrade.period) : end;
  const progressToNextHobong = isDischarged
    ? 100
    : calculateProgress(current, startOfCurrentHobong, endOfHobongPeriod);

  const startOfCurrentRank = currentRankInfo.period === 0
    ? start // 이병의 시작일은 입대일 당일
    : getPromotionDate(startDate, currentRankInfo.period);
  const endOfRankPeriod = nextRankInfo ? getPromotionDate(startDate, nextRankInfo.period) : end;
  const progressToNextRank = isDischarged
    ? 100
    : calculateProgress(current, startOfCurrentRank, endOfRankPeriod);

  return {
    dDay,
    currentRank: isDischarged ? "민간인" : currentRankInfo.name,
    currentHobong: isDischarged ? "" : `${currentPayGrade.grade}호봉`,
    dischargeDate: endDate,
    totalProgress,
    
    nextHobongDate: nextPayGrade && !isDischarged ? toYYYYMM01(endOfHobongPeriod) : endDate,
    nextHobongName: nextPayGrade && !isDischarged ? `${nextPayGrade.rank} ${nextPayGrade.grade}호봉` : "민간인",
    progressToNextHobong: Math.max(0, progressToNextHobong),

    nextRankDate: nextRankInfo && !isDischarged ? toYYYYMM01(endOfRankPeriod) : endDate,
    nextRankName: nextRankInfo && !isDischarged ? nextRankInfo.name : "민간인",
    progressToNextRank: Math.max(0, progressToNextRank),
  };
}