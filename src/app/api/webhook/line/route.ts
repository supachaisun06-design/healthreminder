import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

const LINE_API = 'https://api.line.me/v2/bot/message';
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

async function lineReply(replyToken: string, text: string) {
  await fetch(`${LINE_API}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ replyToken, messages: [{ type: 'text', text }] }),
  });
}

async function linePush(to: string, messages: object[]) {
  await fetch(`${LINE_API}/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ to, messages }),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const events = body.events;
    if (!events || events.length === 0) {
      return NextResponse.json({ status: 'ok' });
    }

    for (const event of events) {
      // คำสั่ง !pair
      if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text.trim();
        const groupId = event.source.groupId || event.source.userId;

        if (text.startsWith('!pair ')) {
          const code = text.split(' ')[1];

          if (!code || code.length !== 6) {
            await lineReply(event.replyToken, '⚠️ รหัสจับคู่ต้องมี 6 หลักครับ');
            continue;
          }

          const lineGroup = await prisma.lineGroup.findUnique({ where: { pairingCode: code } });

          if (!lineGroup) {
            await lineReply(event.replyToken, '❌ รหัสจับคู่ไม่ถูกต้อง หรือหมดอายุแล้วครับ');
            continue;
          }

          await prisma.lineGroup.update({
            where: { id: lineGroup.id },
            data: { lineGroupId: groupId, pairingCode: null, isActive: true },
          });

          await lineReply(event.replyToken, '✅ จับคู่กลุ่มนี้กับระบบ Health Reminder สำเร็จแล้วครับ!');
        }
      }

      // ยืนยันงาน (Postback)
      if (event.type === 'postback') {
        const data = new URLSearchParams(event.postback.data);
        const action = data.get('action');
        const logId = data.get('logId');

        if (action === 'confirm' && logId) {
          const log = await prisma.planLog.findUnique({ where: { id: logId }, include: { plan: true } });

          if (log && log.status === 'PENDING') {
            await prisma.planLog.update({ where: { id: logId }, data: { status: 'COMPLETED', confirmedAt: new Date() } });
            await prisma.user.update({ where: { id: log.plan.userId }, data: { exp: { increment: 20 } } });
            await lineReply(event.replyToken, `🌟 ยอดเยี่ยมครับ! ได้รับ +20 EXP`);
          } else if (log?.status === 'COMPLETED') {
            await lineReply(event.replyToken, '✅ รายการนี้ถูกยืนยันไปแล้วครับ');
          }
        }
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
