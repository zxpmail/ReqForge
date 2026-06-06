import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    project: "{{projectName}}",
    timestamp: new Date().toISOString(),
  });
}
