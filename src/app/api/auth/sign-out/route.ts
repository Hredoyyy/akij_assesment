import { NextResponse } from "next/server";

import { getSession } from "@/lib/session";

export async function POST() {
  try {
    const session = await getSession();
    session.destroy();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to sign out right now." },
      { status: 500 },
    );
  }
}
