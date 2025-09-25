'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [startDate, setStartDate] = useState({ year: '', month: '', day: '' });
  const [endDate, setEndDate] = useState({ year: '', month: '', day: '' });
  const router = useRouter();

  const startMonthRef = useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;
  const startDayRef = useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;
  const endYearRef = useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;
  const endMonthRef = useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;
  const endDayRef = useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;

  const handleDateChange = (
    e: ChangeEvent<HTMLInputElement>,
    setter: typeof setStartDate,
    nextFieldRef?: React.RefObject<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    if (!/^\d*$/.test(value)) return;

    setter(prev => ({ ...prev, [name]: value }));

    if (value.length === e.target.maxLength) {
      nextFieldRef?.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formattedStartDate = `${startDate.year}${startDate.month.padStart(2, '0')}${startDate.day.padStart(2, '0')}`;
    const formattedEndDate = `${endDate.year}${endDate.month.padStart(2, '0')}${endDate.day.padStart(2, '0')}`;
    router.push(`/view?startdate=${formattedStartDate}&enddate=${formattedEndDate}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4 text-gray-200">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">
          전역일 카운터 생성
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-400 mb-2">
              입대일
            </label>
            <div className="flex space-x-2">
              <input
                type="text" name="year" placeholder="YYYY" maxLength={4} value={startDate.year}
                onChange={(e) => handleDateChange(e, setStartDate, startMonthRef)}
                className="w-1/3 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoComplete='off'
                required
              />
              <input
                type="text" name="month" placeholder="MM" maxLength={2} value={startDate.month}
                onChange={(e) => handleDateChange(e, setStartDate, startDayRef)}
                ref={startMonthRef}
                className="w-1/3 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoComplete='off'
                required
              />
              <input
                type="text" name="day" placeholder="DD" maxLength={2} value={startDate.day}
                onChange={(e) => handleDateChange(e, setStartDate, endYearRef)}
                ref={startDayRef}
                className="w-1/3 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoComplete='off'
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-400 mb-2">
              전역일
            </label>
            <div className="flex space-x-2">
              <input
                type="text" name="year" placeholder="YYYY" maxLength={4} value={endDate.year}
                onChange={(e) => handleDateChange(e, setEndDate, endMonthRef)}
                ref={endYearRef}
                className="w-1/3 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoComplete='off'
                required
              />
              <input
                type="text" name="month" placeholder="MM" maxLength={2} value={endDate.month}
                onChange={(e) => handleDateChange(e, setEndDate, endDayRef)}
                ref={endMonthRef}
                className="w-1/3 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoComplete='off'
                required
              />
              <input
                type="text" name="day" placeholder="DD" maxLength={2} value={endDate.day}
                onChange={(e) => handleDateChange(e, setEndDate)}
                ref={endDayRef}
                className="w-1/3 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoComplete='off'
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-300"
          >
            생성하기
          </button>
        </form>
        <div className="mt-8 text-sm text-gray-500">
          <p className="text-center">
            생성된 URL을 GitHub README 등에 이미지로 삽입하여 사용할 수 있습니다.
          </p>
        </div>
      </div>
    </main>
  );
}
