import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

const LINE_API = 'https://api.line.me/v2/bot/message';
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

async function linePush(to: string, messages: object[]) {
  await fetch(`${LINE_API}/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ to, messages }),
  });
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const currentHours = now.getHours().toString().padStart(2, '0');
    const currentMinutes = now.getMinutes().toString().padStart(2, '0');
    const timeString = `${currentHours}:${currentMinutes}`;
    const dayOfWeek = now.getDay().toString();

    // STEP 1: ส่งการแจ้งเตือนที่ถึงเวลา
    const activePlans = await prisma.plan.findMany({
      where: { isActive: true, time: timeString, daysOfWeek: { contains: dayOfWeek } },
      include: { user: { include: { lineGroups: { where: { isActive: true } } } } },
    });

    for (const plan of activePlans) {
      if (plan.user.lineGroups.length === 0) continue;

      const log = await prisma.planLog.create({
        data: { planId: plan.id, scheduledDate: now, status: 'PENDING', notifiedAt: now },
      });

      for (const group of plan.user.lineGroups) {
        if (!group.lineGroupId) continue;
        await linePush(group.lineGroupId, [
          {
            type: 'template',
            altText: `ถึงเวลา: ${plan.title}`,
            template: {
              type: 'buttons',
              title: 'ถึงเวลาแล้ว!',
              text: `กรุณาทำ: ${plan.title}`,
              actions: [
                {
                  type: 'postback',
                  label: 'ยืนยันว่าทำแล้ว ✅',
                  data: `action=confirm&logId=${log.id}`,
                  displayText: `ทำ ${plan.title} เรียบร้อยแล้ว`,
                },
              ],
            },
          },
        ]);
      }
    }

    // STEP 2: ตรวจจับรายการที่เลยเวลาผ่อนผัน
    const pendingLogs = await prisma.planLog.findMany({
      where: { status: 'PENDING' },
      include: { plan: { include: { user: { include: { lineGroups: true } } } } },
    });

    for (const log of pendingLogs) {
      const diffMinutes = Math.floor((now.getTime() - new Date(log.scheduledDate).getTime()) / 60000);
      const isMedication = log.plan.type === 'MEDICATION';
      const graceMinutes = isMedication ? 15 : 60;

      if (diffMinutes >= graceMinutes) {
        await prisma.planLog.update({ where: { id: log.id }, data: { status: 'MISSED', escalatedAt: now } });
        await prisma.user.update({ where: { id: log.plan.userId }, data: { hp: { decrement: 10 } } });

        for (const group of log.plan.user.lineGroups) {
          if (!group.lineGroupId) continue;
          await linePush(group.lineGroupId, [
            {
              type: 'text',
              text: `🚨 คุณ ${log.plan.user.name} ยังไม่ได้ทำ "${log.plan.title}" รบกวนคนใกล้ชิดช่วยตรวจสอบด้วยครับ`,
            },
          ]);
        }
      }
    }

    return NextResponse.json({ status: 'success', sent: activePlans.length });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
