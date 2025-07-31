// app/api/summary-discord/route.ts
import { NextResponse } from 'next/server';

// ใช้ global variable เพื่อแก้ปัญหา memory sharing
declare global {
  var activities: any[];
}

// ตรวจสอบว่ามี global activities หรือไม่ ถ้าไม่มีให้สร้างใหม่
if (!global.activities) {
  global.activities = [];
}

// ฟังก์ชันสร้างสรุปข้อมูลผู้ใช้
function generateUserSummaries(activitiesData: any[]) {
  const userMap = new Map();

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

    const userSummary = userMap.get(activity.user);
    
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

  return Array.from(userMap.values());
}

// ฟังก์ชันสร้างตารางสรุป
function createSummaryTable(userSummaries: any[]) {
  let table = '```\n';
  table += '📊 สรุปข้อมูลกิจกรรมทั้งหมด\n';
  table += '═'.repeat(80) + '\n';
  table += 'ชื่อผู้ใช้ ลา ส่งเงิน กิจกรรมพิเศษยอดรวม(บาท)\n';
  table += '─'.repeat(80) + '\n';

  userSummaries.forEach(user => {
    const leaveCount = user.leaveCount || 0;
    const paymentCount = user.paymentCount || 0;
    const customCount = user.customActivities.length || 0;
    const totalAmount = user.totalAmount || 0;
    
    table += `${user.user} ${leaveCount} ${paymentCount} ${customCount} ${totalAmount}\n`;
  });

  table += '═'.repeat(80) + '\n';
  table += '```';
  return table;
}

// ฟังก์ชันสร้างรายละเอียดวันที่
function createDetailedDates(userSummaries: any[]) {
  let details = '```\n';
  details += '📅 รายละเอียดวันที่\n';
  details += '═'.repeat(80) + '\n';

  userSummaries.forEach(user => {
    details += `👤 ${user.user}\n`;
    
    if (user.leaveDates.length > 0) {
      details += `  📅 ลา: ${user.leaveDates.join(', ')}\n`;
    }
    
    if (user.paymentDates.length > 0) {
      details += `  💰 ส่งเงิน: ${user.paymentDates.join(', ')}\n`;
    }

    if (user.customActivities.length > 0) {
      details += `  🎉 กิจกรรมพิเศษ:\n`; // New line after header
      user.customActivities.forEach(activity => {
        details += `    ${activity}\n`; // Each activity on a new line with indentation
      });
    }
    
    details += '\n';
  });

  details += '```';
  return details;
}

// POST - ส่งสรุปข้อมูลไปยัง Discord
export async function POST() {
  console.log('ส่งสรุปข้อมูลไปยัง Discord...');
  const webhookUrl = 'https://discord.com/api/webhooks/1400046836131299348/j2g_XnSCSQotXrbQsngY4pKFIFL5wMjetjqCShnugMYijMzcts3imUuo-QwAKPkyd3iD';
  
  console.log('Webhook URL:', webhookUrl ? 'พบ' : 'ไม่พบ');
  
  if (!webhookUrl) {
    return NextResponse.json({ error: 'ไม่พบ Discord webhook URL' }, { status: 400 });
  }

  try {
    // ดึงข้อมูลกิจกรรมจาก global activities
    const activities = global.activities || [];
    
    console.log('จำนวนกิจกรรมที่ดึงได้:', activities.length);
    console.log('ข้อมูลกิจกรรมทั้งหมด:', JSON.stringify(activities, null, 2));
    
    // ตรวจสอบกิจกรรม custom
    const customActivities = activities.filter(a => a.type === 'custom');
    console.log('กิจกรรม custom ที่พบ:', customActivities.length);
    console.log('รายละเอียดกิจกรรม custom:', JSON.stringify(customActivities, null, 2));
    
    if (activities.length === 0) {
      return NextResponse.json({ error: 'ไม่มีข้อมูลกิจกรรม' }, { status: 400 });
    }

    // สร้างสรุปข้อมูลผู้ใช้
    const userSummaries = generateUserSummaries(activities);
    console.log('User Summaries:', JSON.stringify(userSummaries, null, 2));

    // สร้างตารางสรุป
    const summaryTable = createSummaryTable(userSummaries);
    console.log('Summary Table:', summaryTable);

    // สร้างรายละเอียดวันที่
    const detailedDates = createDetailedDates(userSummaries);
    console.log('Detailed Dates:', detailedDates);

    // สร้าง embed สำหรับ Discord
    const embed = {
      title: '📊 สรุปข้อมูลกิจกรรมทั้งหมด',
      description: `**จำนวนผู้ใช้:** ${userSummaries.length} คน\n**วันที่อัพเดท:** ${new Date().toLocaleDateString('th-TH')}`,
      color: 0x0099ff,
      fields: [
        {
          name: '📈 สรุปยอดรวม',
          value: `📅 ลา: ${userSummaries.reduce((sum, u) => sum + u.leaveCount, 0)} ครั้ง\n💰 ส่งเงิน: ${userSummaries.reduce((sum, u) => sum + u.paymentCount, 0)} ครั้ง\n🎉 กิจกรรมพิเศษ: ${userSummaries.reduce((sum, u) => sum + u.customActivities.length, 0)} ครั้ง\n💵 ยอดรวม: ${userSummaries.reduce((sum, u) => sum + u.totalAmount, 0)} บาท`,
          inline: false
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Check-in App Summary'
      }
    };

    // ส่งข้อมูลไปยัง Discord
    const payload = {
      embeds: [embed],
      content: `${summaryTable}\n\n${detailedDates}`
    };

    console.log('ส่งสรุปข้อมูลไปยัง Discord...');
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
      console.log('ส่งสรุปข้อมูลไปยัง Discord สำเร็จ');
      return NextResponse.json({ message: 'ส่งสรุปข้อมูลสำเร็จ' });
    } else {
      const errorText = await response.text();
      console.error('ส่งสรุปข้อมูลไม่สำเร็จ:', response.status, errorText);
      return NextResponse.json({ error: 'ส่งสรุปข้อมูลไม่สำเร็จ' }, { status: 500 });
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการส่งสรุปข้อมูล:', error);
    return NextResponse.json({ error: `เกิดข้อผิดพลาด: ${error}` }, { status: 500 });
  }
} 