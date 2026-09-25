export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { messagingApi } from '@line/bot-sdk';
import prisma from '@/lib/prisma';

const { MessagingApiClient } = messagingApi;
const client = new MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
});

export async function GET(req: Request) {
  // 1. Verify CRON Secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const currentHours = now.getHours().toString().padStart(2, '0');
    const currentMinutes = now.getMinutes().toString().padStart(2, '0');
    const timeString = `${currentHours}:${currentMinutes}`;
    const dayOfWeek = now.getDay().toString(); // "0" (Sun) to "6" (Sat)

    // --- STEP 1: ค้นหาแผนที่ถึงเวลาแจ้งเตือน ณ ตอนนี้ ---
    const activePlans = await prisma.plan.findMany({
      where: {
        isActive: true,
        time: timeString,
        daysOfWeek: { contains: dayOfWeek }
      },
      include: { user: { include: { lineGroups: { where: { isActive: true } } } } }
    });

    for (const plan of activePlans) {
      if (plan.user.lineGroups.length === 0) continue; // ไม่มีกลุ่มให้ส่ง

      // สร้างประวัติของวันนี้ (PlanLog)
      const log = await prisma.planLog.create({
        data: {
          planId: plan.id,
          scheduledDate: now,
          status: 'PENDING',
          notifiedAt: now
        }
      });

      // ส่งข้อความไปทุกกลุ่มที่เชื่อมต่อไว้ (ปกติควรมีกลุ่มเดียว)
      for (const group of plan.user.lineGroups) {
        if (!group.lineGroupId) continue;
        
        await client.pushMessage({
          to: group.lineGroupId,
          messages: [{
            type: 'template',
            altText: `ถึงเวลา: ${plan.title}`,
            template: {
              type: 'buttons',
              title: 'ถึงเวลาแล้ว!',
              text: `กรุณาทำ: ${plan.title}`,
              actions: [
                {
                  type: 'postback',
                  label: 'ยืนยันว่าทำแล้ว',
                  data: `action=confirm&logId=${log.id}`,
                  displayText: `ทำ ${plan.title} เรียบร้อยแล้ว`
                }
              ]
            }
          }]
        });
      }
    }

    // --- STEP 2: ค้นหารายการที่ "เลยเวลาผ่อนผัน (Grace Period)" ---
    // กินยา = 15 นาที, อื่นๆ = 60 นาที
    const pendingLogs = await prisma.planLog.findMany({
      where: { status: 'PENDING' },
      include: { plan: { include: { user: { include: { lineGroups: true } } } } }
    });

    for (const log of pendingLogs) {
      const scheduledTime = new Date(log.scheduledDate).getTime();
      const diffMinutes = Math.floor((now.getTime() - scheduledTime) / 60000);
      
      const isMedicationEscalated = log.plan.type === 'MEDICATION' && diffMinutes >= 15;
      const isOtherEscalated = log.plan.type !== 'MEDICATION' && diffMinutes >= 60;

      if (isMedicationEscalated || isOtherEscalated) {
        // อัปเดตสถานะเป็น MISSED และหัก HP
        await prisma.planLog.update({
          where: { id: log.id },
          data: { status: 'MISSED', escalatedAt: now }
        });

        // หัก HP (เช่น -10)
        await prisma.user.update({
          where: { id: log.plan.userId },
          data: { hp: { decrement: 10 } }
        });

        // ส่งข้อความเรียก Guardian (สมมติว่าทุกคนในกลุ่มช่วยเตือน)
        for (const group of log.plan.user.lineGroups) {
          if (!group.lineGroupId) continue;
          
          await client.pushMessage({
            to: group.lineGroupId,
            messages: [{
              type: 'text',
              text: `🚨 [แจ้งเตือนฉุกเฉิน] คุณ ${log.plan.user.name} ยังไม่ได้ทำรายการ "${log.plan.title}" ตามเวลาที่กำหนด! รบกวนคนใกล้ชิดช่วยตรวจสอบด้วยครับ`
            }]
          });
        }
      }
    }

    return NextResponse.json({ status: 'success', sent: activePlans.length }, { status: 200 });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
