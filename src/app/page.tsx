'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';

const Home = () => {
  const [startDate, setStartDate] = useState({ year: '', month: '', day: '' });
  const [endDate, setEndDate] = useState({ year: '', month: '', day: '' });
  const [branch, setBranch] = useState('army');
  const [lang, setLang] = useState<'kr' | 'en'>('kr');
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
    const langQuery = lang === 'en' ? '&lang=en' : '';
    router.push(`/view?startdate=${formattedStartDate}&branch=${encodeURIComponent(branch)}${langQuery}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="p-8 rounded-xl shadow-2xl w-full max-w-md" style={{ backgroundColor: '#3A3635', color: 'white' }}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-white">{lang === 'en' ? 'Create ETS Counter' : '전역일 카운터 생성'}</h1>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              aria-label="Korean"
              onClick={() => setLang('kr')}
              className={`px-2 py-1 rounded bg-transparent transition-all ${lang === 'kr' ? 'border-2 border-[#82C8BD]' : 'border-2 border-transparent'}`}
            >
              🇰🇷
            </button>
            <button
              type="button"
              aria-label="English"
              onClick={() => setLang('en')}
              className={`px-2 py-1 rounded bg-transparent transition-all ${lang === 'en' ? 'border-2 border-[#82C8BD]' : 'border-2 border-transparent'}`}
            >
              🇺🇸
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div >
            <label htmlFor="startDate" className="block text-sm font-medium text-white mb-2">
              {lang === 'en' ? 'Enlist Date' : '입대일'}
            </label>
            <div className="flex space-x-2">
              <input
                type="text" name="year" placeholder="YYYY" maxLength={4} value={startDate.year}
                onChange={(e) => handleDateChange(e, setStartDate, startMonthRef)}
                className="w-1/3 px-3 py-2 border rounded-md text-white focus:outline-none"
                autoComplete='off'
                required
                style={{ backgroundColor: '#4A4645', color: 'white', borderColor: '#6B6665' }}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#82C8BD'; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = '#6B6665'; }}
              />
              <input
                type="text" name="month" placeholder="MM" maxLength={2} value={startDate.month}
                onChange={(e) => handleDateChange(e, setStartDate, startDayRef)}
                ref={startMonthRef}
                className="w-1/3 px-3 py-2 bg-gray-700 border rounded-md text-white focus:outline-none"
                autoComplete='off'
                required
                style={{ backgroundColor: '#4A4645', color: 'white', borderColor: '#6B6665' }}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#82C8BD'; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = '#6B6665'; }}
              />
              <input
                type="text" name="day" placeholder="DD" maxLength={2} value={startDate.day}
                onChange={(e) => handleDateChange(e, setStartDate, endYearRef)}
                ref={startDayRef}
                className="w-1/3 px-3 py-2 bg-gray-700 border rounded-md text-white focus:outline-none"
                autoComplete='off'
                required
                style={{ backgroundColor: '#4A4645', color: 'white', borderColor: '#6B6665' }}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#82C8BD'; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = '#6B6665'; }}
              />
            </div>
          </div>
          <div>
            <label htmlFor="branch" className="block text-sm font-medium text-white mb-2">
              {lang === 'en' ? 'Branch' : '군별'}
            </label>
            <div>
              <select
                id="branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:outline-none"
                style={{ backgroundColor: '#4A4645', color: 'white', borderColor: '#6B6665' }}
                onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = '#82C8BD'; }}
                onBlur={(e) => { (e.target as HTMLSelectElement).style.borderColor = '#6B6665'; }}
              >
                <option value="army">{lang === 'en' ? 'Army (18 months)' : '육군 (18개월)'}</option>
                <option value="marines">{lang === 'en' ? 'Marines (18 months)' : '해병대 (18개월)'}</option>
                <option value="navy">{lang === 'en' ? 'Navy (20 months)' : '해군 (20개월)'}</option>
                <option value="airforce">{lang === 'en' ? 'Air Force (21 months)' : '공군 (21개월)'}</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-gray-800 font-bold py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-300"
            style={{ backgroundColor: '#82C8BD' }}
          >
            {lang === 'en' ? 'Generate' : '생성하기'}
          </button>
        </form>
        <div className="mt-8 text-sm text-gray-400">
          <p className="text-center">
            {lang === 'en' ? ' You can embed the generated URL as an image in your GitHub README.' : '생성된 URL을 GitHub README 등에 이미지로 삽입하여 사용할 수 있습니다.'}
          </p>
        </div>
      </div>
    </main>

  );
};

export default Home;
