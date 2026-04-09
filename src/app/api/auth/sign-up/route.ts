import { NextResponse } from "next/server";

import { signUpAction } from "@/actions/Auth/signUp/logic";
import { signUpSchema } from "@/actions/Auth/signUp/schema";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload." },
        { status: 400 },
      );
    }

    const result = await signUpAction(parsed.data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    const session = await getSession();
    session.user = result.data;
    await session.save();

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to complete sign-up right now." },
      { status: 500 },
    );
  }
}
