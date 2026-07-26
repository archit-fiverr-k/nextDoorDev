import { NextResponse } from "next/server";
import { sendUpcomingAppointmentRemindersAction } from "@/actions/appointments";

export const revalidate = 0;

export async function GET() {
  try {
    const result = await sendUpcomingAppointmentRemindersAction();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ Reminder cron endpoint error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await sendUpcomingAppointmentRemindersAction();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ Reminder cron endpoint error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
