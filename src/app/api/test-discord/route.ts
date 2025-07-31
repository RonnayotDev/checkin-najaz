// app/api/test-discord/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  const webhookUrl = 'https://discord.com/api/webhooks/1400046836131299348/j2g_XnSCSQotXrbQsngY4pKFIFL5wMjetjqCShnugMYijMzcts3imUuo-QwAKPkyd3iD';
  
  console.log('ทดสอบ Discord webhook...');
  console.log('Webhook URL:', webhookUrl ? 'พบ' : 'ไม่พบ');

  if (!webhookUrl) {
    return NextResponse.json({ error: 'ไม่พบ Discord webhook URL' }, { status: 400 });
  }

  try {
    const payload = {
      content: '🧪 ทดสอบการเชื่อมต่อ Discord webhook',
      embeds: [{
        title: '✅ การทดสอบสำเร็จ',
        description: 'Discord webhook ทำงานได้ปกติ',
        color: 0x00ff00,
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Check-in App Test'
        }
      }]
    };

    console.log('ส่ง test payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Test response status:', response.status);

    if (response.ok) {
      return NextResponse.json({ message: 'ทดสอบ Discord webhook สำเร็จ' });
    } else {
      const errorText = await response.text();
      console.error('Test failed:', response.status, errorText);
      return NextResponse.json({ error: `ทดสอบไม่สำเร็จ: ${response.status} - ${errorText}` }, { status: 500 });
    }
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({ error: `เกิดข้อผิดพลาด: ${error}` }, { status: 500 });
  }
} 