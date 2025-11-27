import { NextRequest } from "next/server";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execAsync = promisify(exec);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isVercel() {
  return process.env.VERCEL === "1";
}

export async function POST(req: NextRequest) {
  if (isVercel()) {
    return new Response(JSON.stringify({ error: "Shell tool disabled on Vercel" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const { cmd, cwd, allowedRoot } = await req.json();
    if (typeof cmd !== "string" || typeof allowedRoot !== "string") {
      return new Response(JSON.stringify({ error: "Invalid params" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const root = path.resolve(allowedRoot || ".");
    const working = path.resolve(cwd || root);
    if (!working.startsWith(root)) {
      return new Response(JSON.stringify({ error: "cwd outside allowedRoot" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    const { stdout, stderr } = await execAsync(cmd, { cwd: working, timeout: 30_000, maxBuffer: 2_000_000 });
    return Response.json({ stdout, stderr });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "command error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
