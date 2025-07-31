'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Activity {
  id: string;
  user: string;
  type: string;
  date: string;
  amount?: number;
  customType?: string;
  customTime?: string;
  createdAt: string;
}

interface UserSummary {
  user: string;
  leaveCount: number;
  paymentCount: number;
  customActivities: string[];
  totalAmount: number;
  leaveDates: string[];
  paymentDates: string[];
  lastActivity: string;
}

export default function AdminPanel() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [userSummaries, setUserSummaries] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ฟังก์ชันสร้างสรุปข้อมูลผู้ใช้
  const generateUserSummaries = (activitiesData: Activity[]) => {
    const userMap = new Map<string, UserSummary>();

    activitiesData.forEach(activity => {
      if (!userMap.has(activity.user)) {
        userMap.set(activity.user, {
          user: activity.user,
          leaveCount: 0,
          paymentCount: 0,
          customActivities: [],
          totalAmount: 0,
          leaveDates: [],
          paymentDates: [],
          lastActivity: activity.createdAt
        });
      }

      const userSummary = userMap.get(activity.user)!;
      
      switch (activity.type) {
        case 'leave':
          userSummary.leaveCount++;
          userSummary.leaveDates.push(new Date(activity.date).toLocaleDateString('th-TH'));
          break;
        case 'payment':
          userSummary.paymentCount++;
          userSummary.totalAmount += activity.amount || 0;
          userSummary.paymentDates.push(new Date(activity.date).toLocaleDateString('th-TH'));
          break;
        case 'custom':
          const activityName = `${activity.customType} ${activity.customTime}`;
          // ตรวจสอบว่าไม่ซ้ำกัน
          if (!userSummary.customActivities.includes(activityName)) {
            userSummary.customActivities.push(activityName);
          }
          break;
      }

      if (new Date(activity.createdAt) > new Date(userSummary.lastActivity)) {
        userSummary.lastActivity = activity.createdAt;
      }
    });

    setUserSummaries(Array.from(userMap.values()));
  };

  // ดึงข้อมูลกิจกรรมทั้งหมด
  const fetchActivities = async () => {
    try {
      // ดึงข้อมูลจาก global activities
      const response = await fetch('/api/activities');
      const activitiesData = await response.json();
      setActivities(activitiesData);
      generateUserSummaries(activitiesData);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  // ทดสอบ Discord Webhook
  const testDiscordWebhook = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/test-discord');
      alert('ทดสอบ Discord Webhook สำเร็จ!');
    } catch (error) {
      alert('ทดสอบ Discord Webhook ไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  // ส่งสรุปข้อมูลไป Discord
  const sendSummaryToDiscord = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/summary-discord');
      alert('ส่งสรุปข้อมูลไป Discord สำเร็จ!');
    } catch (error) {
      alert('ส่งสรุปข้อมูลไป Discord ไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const totalUsers = userSummaries.length;
  const totalLeaveCount = userSummaries.reduce((sum, user) => sum + user.leaveCount, 0);
  const totalPaymentCount = userSummaries.reduce((sum, user) => sum + user.paymentCount, 0);
  const totalCustomCount = userSummaries.reduce((sum, user) => sum + user.customActivities.length, 0);
  const totalAmount = userSummaries.reduce((sum, user) => sum + user.totalAmount, 0);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-8 text-center">Admin Panel</h1>
        
        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={testDiscordWebhook}
            disabled={isLoading}
            className="bg-blue-500 text-white p-3 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            🧪 ทดสอบ Discord Webhook
          </button>
          
          <button
            onClick={sendSummaryToDiscord}
            disabled={isLoading}
            className="bg-green-500 text-white p-3 rounded hover:bg-green-600 disabled:opacity-50"
          >
            📊 ส่งสรุปข้อมูลไป Discord
          </button>
          
          <button
            onClick={fetchActivities}
            disabled={isLoading}
            className="bg-purple-500 text-white p-3 rounded hover:bg-purple-600 disabled:opacity-50"
          >
            📊 สรุปข้อมูลทั้งหมด
          </button>
          
          <button
            onClick={fetchActivities}
            disabled={isLoading}
            className="bg-orange-500 text-white p-3 rounded hover:bg-orange-600 disabled:opacity-50"
          >
            🔄 รีเฟรช
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-black mb-2">👥 จำนวนผู้ใช้</h3>
            <p className="text-3xl font-bold text-black">{totalUsers}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-black mb-2">📅 ลา</h3>
            <p className="text-3xl font-bold text-black">{totalLeaveCount}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-black mb-2">💰 ส่งเงิน</h3>
            <p className="text-3xl font-bold text-black">{totalPaymentCount}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-black mb-2">🎉 กิจกรรมพิเศษ</h3>
            <p className="text-3xl font-bold text-black">{totalCustomCount}</p>
          </div>
        </div>

        {/* User Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-black mb-6">👤 รายละเอียดผู้ใช้แต่ละคน</h2>
          
          {userSummaries.map((user, index) => (
            <div key={index} className="border-b border-gray-200 pb-6 mb-6 last:border-b-0">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-black mb-2">{user.user}</h3>
                  <p className="text-sm text-black">
                    กิจกรรมล่าสุด: {new Date(user.lastActivity).toLocaleString('th-TH')}
                  </p>
                </div>
                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm">
                  ดูรายละเอียด
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-black font-medium">📅 ลา: {user.leaveCount} ครั้ง</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-black font-medium">💰 ส่งเงิน: {user.paymentCount} ครั้ง</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-black font-medium">💵 ยอดรวม: {user.totalAmount.toLocaleString()} บาท</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-black font-medium">🎉 กิจกรรมพิเศษ: {user.customActivities.length} ครั้ง</p>
                </div>
              </div>
              
              {/* Detailed Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {user.leaveDates.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-black mb-2">📅 วันที่ลา:</h4>
                    <div className="space-y-1">
                      {user.leaveDates.map((date, idx) => (
                        <p key={idx} className="text-sm text-black">{date}</p>
                      ))}
                    </div>
                  </div>
                )}
                
                {user.paymentDates.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-black mb-2">💰 วันที่ส่งเงิน:</h4>
                    <div className="space-y-1">
                      {user.paymentDates.map((date, idx) => (
                        <p key={idx} className="text-sm text-black">{date}</p>
                      ))}
                    </div>
                  </div>
                )}
                
                {user.customActivities.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-black mb-2">🎉 กิจกรรมพิเศษ:</h4>
                    <div className="flex flex-col gap-1">
                      {user.customActivities.map((activity, idx) => (
                        <span key={idx} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                          {activity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
