export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { messagingApi } from '@line/bot-sdk';
import prisma from '@/lib/prisma';

const { MessagingApiClient } = messagingApi;

// กำหนด Client สำหรับส่งข้อความกลับ
const client = new MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // ตรวจสอบเหตุการณ์ที่ส่งมาจาก LINE
    const events = body.events;
    if (!events || events.length === 0) {
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    for (const event of events) {
      // 1. กรณีผู้ใช้พิมพ์ข้อความ (เช่น พิมพ์รหัสจับคู่)
      if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text.trim();
        const groupId = event.source.groupId || event.source.userId; // ใช้ userId แทนได้ถ้าเขาทักแชทส่วนตัว

        // เช็คคำสั่ง !pair
        if (text.startsWith('!pair ')) {
          const code = text.split(' ')[1];
          
          if (!code || code.length !== 6) {
            await client.replyMessage({
              replyToken: event.replyToken,
              messages: [{ type: 'text', text: '⚠️ รหัสจับคู่ต้องมี 6 หลักครับ' }]
            });
            continue;
          }

          // ค้นหา Group ที่รอการจับคู่ด้วยรหัสนี้
          const lineGroup = await prisma.lineGroup.findUnique({
            where: { pairingCode: code }
          });

          if (!lineGroup) {
            await client.replyMessage({
              replyToken: event.replyToken,
              messages: [{ type: 'text', text: '❌ รหัสจับคู่ไม่ถูกต้อง หรือหมดอายุแล้วครับ' }]
            });
            continue;
          }

          // อัปเดตข้อมูลจับคู่สำเร็จ
          await prisma.lineGroup.update({
            where: { id: lineGroup.id },
            data: { 
              lineGroupId: groupId, 
              pairingCode: null, 
              isActive: true 
            }
          });

          await client.replyMessage({
            replyToken: event.replyToken,
            messages: [{ type: 'text', text: '✅ จับคู่กลุ่มนี้กับระบบ Health Reminder สำเร็จแล้วครับ! ระบบจะส่งการแจ้งเตือนมาที่นี่' }]
          });
        }
      }

      // 2. กรณีผู้ใช้กดยืนยันปุ่ม (Postback)
      if (event.type === 'postback') {
        // data ควรมีลักษณะเช่น "action=confirm&logId=1234"
        const data = new URLSearchParams(event.postback.data);
        const action = data.get('action');
        const logId = data.get('logId');

        if (action === 'confirm' && logId) {
          // ค้นหา PlanLog
          const log = await prisma.planLog.findUnique({ where: { id: logId }, include: { plan: true } });
          
          if (log && log.status === 'PENDING') {
            // อัปเดตสถานะเป็นสำเร็จ
            await prisma.planLog.update({
              where: { id: logId },
              data: { status: 'COMPLETED', confirmedAt: new Date() }
            });

            // เพิ่ม EXP ให้ User
            await prisma.user.update({
              where: { id: log.plan.userId },
              data: { exp: { increment: 20 } }
            });

            await client.replyMessage({
              replyToken: event.replyToken,
              messages: [{ type: 'text', text: `🌟 ยอดเยี่ยมครับ! บันทึกการทำ "${log.plan.title}" เรียบร้อย ได้รับ +20 EXP` }]
            });
          } else if (log && log.status === 'COMPLETED') {
            await client.replyMessage({
              replyToken: event.replyToken,
              messages: [{ type: 'text', text: '✅ รายการนี้ถูกยืนยันไปแล้วครับ' }]
            });
          }
        }
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
