// app/api/activities/route.ts
import { NextResponse } from 'next/server';

// ใช้ global variable เพื่อแก้ปัญหา memory sharing
declare global {
  var activities: any[];
}

// ตรวจสอบว่ามี global activities หรือไม่ ถ้าไม่มีให้สร้างใหม่
if (!global.activities) {
  global.activities = [];
}

// ฟังก์ชันส่งข้อมูลไปยัง Discord
async function sendToDiscord(activity: any) {
  console.log('เริ่มส่งข้อมูลไปยัง Discord...');
  const webhookUrl = 'https://discord.com/api/webhooks/1400046836131299348/j2g_XnSCSQotXrbQsngY4pKFIFL5wMjetjqCShnugMYijMzcts3imUuo-QwAKPkyd3iD';
  
  console.log('Discord webhook URL:', webhookUrl ? 'พบ' : 'ไม่พบ');
  
  if (!webhookUrl) {
    console.log('ไม่พบ Discord webhook URL');
    return;
  }

  try {
    console.log('สร้าง embed message...');
    // สร้าง embed message สำหรับ Discord
    const embed: any = {
      title: `🎯 กิจกรรมใหม่: ${activity.customType || activity.type}`,
      description: `**ผู้ใช้:** ${activity.user}\n**ประเภท:** ${activity.customType || activity.type}\n**วันที่:** ${new Date(activity.date).toLocaleString('th-TH')}`,
      color: getActivityColor(activity.type),
      fields: [],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Check-in App'
      }
    };

    // เพิ่มข้อมูลเพิ่มเติมตามประเภทกิจกรรม
    if (activity.amount) {
      embed.fields.push({
        name: '💰 จำนวนเงิน',
        value: `${activity.amount} บาท`,
        inline: true
      });
    }

    if (activity.customTime) {
      embed.fields.push({
        name: '⏰ เวลา',
        value: activity.customTime,
        inline: true
      });
    }

    if (activity.proofUrl) {
      embed.fields.push({
        name: '📎 หลักฐาน',
        value: activity.proofUrl,
        inline: true
      });
    }

    const payload = {
      embeds: [embed]
    };

    console.log('ส่ง request ไปยัง Discord webhook...');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Discord response status:', response.status);
    console.log('Discord response ok:', response.ok);

    if (response.ok) {
      console.log('ส่งข้อมูลไปยัง Discord สำเร็จ');
    } else {
      const errorText = await response.text();
      console.error('ส่งข้อมูลไปยัง Discord ไม่สำเร็จ:', response.status, errorText);
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการส่งข้อมูลไปยัง Discord:', error);
  }
}

// ฟังก์ชันกำหนดสีตามประเภทกิจกรรม
function getActivityColor(type: string): number {
  switch (type) {
    case 'checkin':
      return 0x00ff00; // สีเขียว
    case 'leave':
      return 0xffa500; // สีส้ม
    case 'payment':
      return 0x0099ff; // สีฟ้า
    case 'custom':
      return 0xff69b4; // สีชมพู
    default:
      return 0x808080; // สีเทา
  }
}

// POST - เพิ่มกิจกรรมใหม่
export async function POST(request: Request) {
  console.log('POST request received');
  console.log('Environment variables:');
  console.log('- DISCORD_WEBHOOK_URL:', process.env.DISCORD_WEBHOOK_URL ? 'พบ' : 'ไม่พบ');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  
  try {
    const data = await request.json();

    // ตรวจสอบข้อมูล
    if (!data.user || !data.type || !data.date) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }

    // เพิ่ม ID และ timestamp
    const newActivity = {
      ...data,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    // บันทึกข้อมูลใน global activities
    global.activities.push(newActivity);

    console.log('บันทึกกิจกรรมสำเร็จ:', newActivity);
    console.log('จำนวนกิจกรรมทั้งหมดใน memory:', global.activities.length);
    console.log('ข้อมูลกิจกรรมทั้งหมด:', JSON.stringify(global.activities, null, 2));

    // ส่งข้อมูลไปยัง Discord (ไม่รอผลลัพธ์)
    sendToDiscord(newActivity).catch(error => {
      console.error('เกิดข้อผิดพลาดในการส่งข้อมูลไปยัง Discord:', error);
    });

    // ไม่ส่งสรุปข้อมูลทันที ให้รอให้ส่งกิจกรรมทั้งหมดเสร็จก่อน
    // ส่งสรุปข้อมูลไปยัง Discord ทุกครั้งที่มีกิจกรรมใหม่
    // try {
    //   console.log('กำลังส่งสรุปข้อมูลไปยัง Discord...');
    //   const summaryResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/summary-discord`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //   });
      
    //   if (summaryResponse.ok) {
    //     console.log('ส่งสรุปข้อมูลไปยัง Discord สำเร็จ');
    //   } else {
    //     console.error('ส่งสรุปข้อมูลไม่สำเร็จ:', summaryResponse.status);
    //   }
    // } catch (error) {
    //   console.error('เกิดข้อผิดพลาดในการส่งสรุปข้อมูล:', error);
    // }

    return NextResponse.json({ message: 'บันทึกกิจกรรมสำเร็จ', activity: newActivity }, { status: 201 });
  } catch (error) {
    console.error('API POST /activities error:', error);
    const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// GET - ดึงข้อมูลกิจกรรมทั้งหมด
export async function GET() {
  try {
    console.log('GET activities, count:', global.activities.length);
    return NextResponse.json(global.activities, { status: 200 });
  } catch (error) {
    console.error('API GET /activities error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
