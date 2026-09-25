import React from 'react';
import { Pill, Dumbbell, Utensils, QrCode, ArrowRight, HeartPulse } from 'lucide-react';

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[#F9FAFB] flex justify-center p-0 md:p-6 selection:bg-blue-100">
      <div className="w-full max-w-md bg-white md:border border-gray-200 md:rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col relative">
        
        {/* TOP HEADER: Modern & Minimal */}
        <header className="p-8 pb-6 border-b border-gray-100">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-gray-500 text-[13px] font-medium tracking-wide mb-1 uppercase">Profile</h1>
              <div className="text-2xl font-semibold text-gray-900 tracking-tight">คุณมายด์</div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 text-rose-500 mb-1">
                <HeartPulse size={18} strokeWidth={2.5} />
                <span className="text-3xl font-bold font-num tracking-tighter">80</span>
                <span className="text-gray-400 text-sm font-num font-medium">/100</span>
              </div>
              <div className="text-gray-400 text-[11px] font-medium uppercase tracking-wider">Health Status</div>
            </div>
          </div>

          {/* Sleek HP Bar */}
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-5">
            <div className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full w-[80%] transition-all duration-1000 ease-out"></div>
          </div>
          
          {/* Level & EXP: Tech Aesthetic */}
          <div className="flex items-center gap-4">
            <div className="text-[13px] font-semibold text-gray-900 font-num">LV.5</div>
            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full w-[60%]"></div>
            </div>
            <div className="text-[11px] font-medium text-gray-400 font-num tracking-wider">600 XP</div>
          </div>
        </header>

        {/* TODAY'S PLANS */}
        <section className="flex-1 px-8 py-6 bg-[#FAFAFA]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[14px] font-semibold text-gray-900">แผนประจำวัน</h2>
            <span className="text-[12px] font-medium text-gray-500">3 รายการ</span>
          </div>
          
          <div className="space-y-3">
            
            {/* Task 1: Completed */}
            <div className="flex items-center p-4 bg-white border border-gray-200/60 rounded-[16px] opacity-75">
              <div className="w-10 h-10 rounded-full bg-gray-50 text-emerald-500 flex items-center justify-center shrink-0 mr-4 border border-gray-100">
                <Utensils size={18} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-500 line-through decoration-gray-300">อาหารเช้า</div>
                <div className="text-[12px] text-gray-400 font-num mt-0.5">08:00 AM</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-50"></div>
            </div>

            {/* Task 2: Missed (Escalated) */}
            <div className="flex items-center p-4 bg-white border border-rose-100 rounded-[16px] shadow-[0_2px_10px_-4px_rgba(225,29,72,0.1)] relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 ml-1 mr-4">
                <Pill size={18} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">วิตามินซี และ ดี</div>
                <div className="text-[12px] text-rose-500 font-medium font-num mt-0.5 flex items-center gap-1.5">
                  09:00 AM <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-md uppercase tracking-wide">Escalated</span>
                </div>
              </div>
            </div>

            {/* Task 3: Pending */}
            <div className="flex items-center p-4 bg-white border border-gray-200 rounded-[16px] shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 mr-4">
                <Dumbbell size={18} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">วิ่งจ็อกกิ้ง</div>
                <div className="text-[12px] text-gray-500 font-num mt-0.5">18:00 PM</div>
              </div>
              <ArrowRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>

          </div>
        </section>

        {/* LINE PAIRING FOOTER */}
        <footer className="p-6 bg-white border-t border-gray-100">
          <button className="w-full flex items-center justify-center gap-2 bg-[#111827] hover:bg-black text-white py-3.5 rounded-[12px] font-medium text-[14px] transition-all">
            <QrCode size={16} strokeWidth={2} />
            <span>เชื่อมต่อกับบัญชี LINE</span>
          </button>
        </footer>

      </div>
    </main>
  );
}
