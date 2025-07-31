'use client';

import { useParams } from 'next/navigation';
import { useActivity, ActivityRecord } from '../../../context/ActivityContext';
import { useMemo } from 'react';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export default function ProfilePage() {
  const { name } = useParams();
  const decodedName = decodeURIComponent(name as string);
  const { activities } = useActivity();

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-based

  const yearMonth = `${year}-${(month + 1).toString().padStart(2, '0')}`; // 'YYYY-MM'

  const userActivities = activities[decodedName] || [];

  // กรองกิจกรรมของเดือนนี้
  const monthActivities = userActivities.filter((a) => a.date.startsWith(yearMonth));

  // สร้าง map: date -> total money sent วันนั้น
  const dailyPayments: Record<string, number> = {};

  for (const act of monthActivities) {
    if (act.type === 'payment' && act.amount) {
      if (!dailyPayments[act.date]) dailyPayments[act.date] = 0;
      dailyPayments[act.date] += act.amount;
    }
  }

  // นับวัน checkin และ leave
  const checkinDates = new Set<string>();
  let leaveCount = 0;

  for (const act of monthActivities) {
    if (act.type === 'checkin') checkinDates.add(act.date);
    else if (act.type === 'leave') leaveCount++;
  }

  // สร้างอาร์เรย์วันของเดือน
  const daysInMonth = getDaysInMonth(year, month);
  const datesArray = Array.from({ length: daysInMonth }, (_, i) => {
    const day = (i + 1).toString().padStart(2, '0');
    return `${yearMonth}-${day}`;
  });

  // รวมยอดเงินทั้งหมดในเดือน
  const totalPayment = Object.values(dailyPayments).reduce((a, b) => a + b, 0);

  return (
    <div
      className="p-6 max-w-xl mx-auto bg-white rounded shadow min-h-screen"
      style={{ color: 'oklch(0.379 0.146 265.522)' }}
    >
      <h1 className="text-3xl font-bold mb-6 text-center">โปรไฟล์: {decodedName}</h1>

      <div className="space-y-4 text-lg mb-6">
        <p>📅 เดือน: {yearMonth}</p>
        <p>✅ ลงชื่อเข้ากิจกรรมไปแล้ว: <span className="font-semibold">{checkinDates.size} วัน</span></p>
        <p>📅 ลาไป: <span className="font-semibold">{leaveCount} วัน</span></p>
        <p>💰 ส่งเงินรวมทั้งหมด: <span className="font-semibold">{totalPayment.toLocaleString()} บาท</span></p>
      </div>

      <h2 className="text-xl font-semibold mb-2">รายละเอียดการส่งเงินประจำวัน</h2>

      <table className="w-full border border-blue-300 text-center">
        <thead>
          <tr className="bg-blue-200">
            <th className="border border-blue-300 px-2 py-1">วันที่</th>
            <th className="border border-blue-300 px-2 py-1">ยอดเงินส่ง (บาท)</th>
          </tr>
        </thead>
        <tbody>
          {datesArray.map((date) => {
            const day = date.slice(-2);
            const amount = dailyPayments[date] || 0;
            return (
              <tr key={date} className="odd:bg-blue-50">
                <td className="border border-blue-300 px-2 py-1">{day}</td>
                <td className="border border-blue-300 px-2 py-1">{amount > 0 ? amount.toLocaleString() : '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
