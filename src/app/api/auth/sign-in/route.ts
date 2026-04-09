import { NextResponse } from "next/server";

import { signInAction } from "@/actions/Auth/signIn/logic";
import { signInSchema } from "@/actions/Auth/signIn/schema";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signInSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload." },
        { status: 400 },
      );
    }

    const result = await signInAction(parsed.data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const session = await getSession();
    session.user = result.data;
    await session.save();

    return NextResponse.json({ success: true, data: result.data });
  } catch {
    return NextResponse.json(
      { error: "Unable to sign in right now." },
      { status: 500 },
    );
  }
}
