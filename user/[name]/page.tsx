'use client';

import React, { useParams } from 'next/navigation';
import { useState } from 'react';
import axios from 'axios';

// Type definitions for JSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: any;
      span: any;
      button: any;
      input: any;
      label: any;
      h1: any;
      h2: any;
      h3: any;
      h4: any;
      p: any;
      br: any;
    }
  }
}

// Toast Component
const Toast = ({ message, type, isVisible, onClose }: { message: string; type: 'success' | 'error'; isVisible: boolean; onClose: () => void }) => {
  if (!isVisible) return null;

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const icon = type === 'success' ? '✅' : '❌';

  return (
    <div className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2`}>
      <span>{icon}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white hover:text-gray-200">
        ✕
      </button>
    </div>
  );
};

export default function UserPage() {
  const { name } = useParams();
  const decodedName = decodeURIComponent(name as string);

  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error', isVisible: false });
  
  // State สำหรับ checkbox ต่างๆ
  const [airdrop15, setAirdrop15] = useState(false);
  const [airdrop19, setAirdrop19] = useState(false);
  const [airdrop21, setAirdrop21] = useState(false);
  const [airdrop00, setAirdrop00] = useState(false);
  const [bank2130, setBank2130] = useState(false);
  const [bank2230, setBank2230] = useState(false);
  const [airdropColor20, setAirdropColor20] = useState(false);
  const [airdropColor22, setAirdropColor22] = useState(false);

  // ใช้วันที่ปัจจุบันเป็น ISO string
  const currentDate = new Date().toISOString();

  // ฟังก์ชันแสดง toast
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  // ฟังก์ชันส่งข้อมูลกิจกรรม
  const sendActivity = async (type: string, extra?: { amount?: number; proofUrl?: string; customType?: string; customTime?: string }) => {
    setIsSending(true);
    try {
      const payload: any = {
        user: decodedName,
        type,
        date: currentDate,
        ...extra,
      };
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await axios.post(`${baseUrl}/api/activities`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      // ไม่แสดง alert ที่นี่แล้ว
      return response; // Return the response for logging
    } catch (error) {
      const errorMessage = axios.isAxiosError(error) && error.response?.data?.error
        ? error.response.data.error
        : 'เกิดข้อผิดพลาดในการบันทึกกิจกรรม';
      showToast(errorMessage, 'error');
      return null; // Return null on error
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMoney = async () => {
    if (!amount || isNaN(Number(amount))) {
      showToast('กรุณากรอกจำนวนเงินให้ถูกต้อง', 'error');
      return;
    }
    
    try {
      await sendActivity('payment', { amount: Number(amount) });
      setAmount('');
      showToast('ส่งยอดเงินสำเร็จ', 'success');
    } catch (error) {
      showToast('เกิดข้อผิดพลาดในการส่งยอดเงิน', 'error');
    }
  };

  const handleLeave = async () => {
    try {
      await sendActivity('leave');
      showToast('บันทึกการลาสำเร็จ', 'success');
    } catch (error) {
      showToast('เกิดข้อผิดพลาดในการบันทึกการลา', 'error');
    }
  };

  // ฟังก์ชันส่งกิจกรรม checkbox ที่เลือกไว้
  const sendSelectedActivities = async () => {
    setIsSending(true);
    
    try {
      const selectedActivities: { type: string; time: string }[] = [];
      
      if (airdrop15) {
        selectedActivities.push({ type: 'Airdrop', time: '15.00' });
      }
      if (airdrop19) {
        selectedActivities.push({ type: 'Airdrop', time: '19.00' });
      }
      if (airdrop21) {
        selectedActivities.push({ type: 'Airdrop', time: '21.00' });
      }
      if (airdrop00) {
        selectedActivities.push({ type: 'Airdrop', time: '00.00' });
      }
      if (bank2130) {
        selectedActivities.push({ type: 'งัดธนาคาร', time: '21.30' });
      }
      if (bank2230) {
        selectedActivities.push({ type: 'งัดธนาคาร', time: '22.30' });
      }
      if (airdropColor20) {
        selectedActivities.push({ type: 'Airdrop Color', time: '20.00' });
      }
      if (airdropColor22) {
        selectedActivities.push({ type: 'Airdrop Color', time: '22.00' });
      }

      if (selectedActivities.length === 0) {
        showToast('กรุณาเลือกกิจกรรมอย่างน้อย 1 รายการ', 'error');
        setIsSending(false);
        return;
      }

      // ส่งกิจกรรมที่เลือกทั้งหมด
      for (const activity of selectedActivities) {
        console.log('กำลังส่งกิจกรรม:', activity);
        const response = await sendActivity('custom', { 
          customType: activity.type,
          customTime: activity.time,
          amount: 0
        });
        console.log('ผลลัพธ์การส่งกิจกรรม:', response);
        // รอสักครู่ระหว่างการส่งแต่ละกิจกรรม
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // รอสักครู่ก่อนส่งสรุปข้อมูล
      await new Promise(resolve => setTimeout(resolve, 2000));

      // ส่งสรุปข้อมูลหลังจากส่งกิจกรรมทั้งหมดเสร็จ
      try {
        console.log('กำลังส่งสรุปข้อมูลไปยัง Discord...');
        const summaryResponse = await axios.post('/api/summary-discord');
        console.log('ส่งสรุปข้อมูลสำเร็จ:', summaryResponse.data);
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการส่งสรุปข้อมูล:', error);
      }

      // รีเซ็ต checkbox ทั้งหมด
      setAirdrop15(false);
      setAirdrop19(false);
      setAirdrop21(false);
      setAirdrop00(false);
      setBank2130(false);
      setBank2230(false);
      setAirdropColor20(false);
      setAirdropColor22(false);

      // แสดง toast หลังจากส่งกิจกรรมทั้งหมดเสร็จ
      showToast(`ส่งข้อมูลกิจกรรม ${selectedActivities.length} รายการสำเร็จ`, 'success');
    } catch (error) {
      showToast('เกิดข้อผิดพลาดในการส่งข้อมูล', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-blue-50 min-h-screen">
      {/* Toast Notification */}
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />

      <h2 className="text-2xl font-bold text-blue-800 text-center mb-6">👋 ยินดีต้อนรับ {decodedName}</h2>

      <button
        disabled={isSending}
        className="w-full bg-yellow-500 text-white p-3 rounded hover:bg-yellow-600 mb-6"
        onClick={handleLeave}
      >
        📅 ลา
      </button>

      {/* Checkbox Activities */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">🎯 กิจกรรมพิเศษ</h3>
        
        {/* Airdrop Section */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">🚀 Airdrop</h4>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={airdrop15}
                onChange={(e) => setAirdrop15(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-black">15.00</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={airdrop19}
                onChange={(e) => setAirdrop19(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-black">19.00</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={airdrop21}
                onChange={(e) => setAirdrop21(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-black">21.00</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={airdrop00}
                onChange={(e) => setAirdrop00(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-black">00.00</span>
            </label>
          </div>
        </div>

        {/* งัดธนาคาร Section */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">🏦 งัดธนาคาร</h4>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={bank2130}
                onChange={(e) => setBank2130(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-black">21.30</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={bank2230}
                onChange={(e) => setBank2230(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-black">22.30</span>
            </label>
          </div>
        </div>

        {/* Airdrop Color Section */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">🎨 Airdrop Color</h4>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={airdropColor20}
                onChange={(e) => setAirdropColor20(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-black">20.00</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={airdropColor22}
                onChange={(e) => setAirdropColor22(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-black">22.00</span>
            </label>
          </div>
        </div>

        {/* ปุ่มส่งข้อมูลกิจกรรม */}
        <button
          disabled={isSending}
          className="w-full bg-purple-500 text-white p-3 rounded hover:bg-purple-600 mt-4"
          onClick={sendSelectedActivities}
        >
          {isSending ? 'กำลังส่งข้อมูล...' : '📤 ส่งข้อมูลกิจกรรม'}
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <label className="block mb-2 text-blue-900 font-medium">💰 ส่งยอดเงินประจำวัน (บาท)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border border-blue-300 rounded p-2 mb-4 text-black"
          placeholder="กรอกจำนวนเงิน"
        />
        <button
          disabled={isSending}
          className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600"
          onClick={handleSendMoney}
        >
          🚀 ส่งยอดเงิน
        </button>
      </div>
    </div>
  );
}
