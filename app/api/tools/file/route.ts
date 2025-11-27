import { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isVercel() {
  return process.env.VERCEL === "1";
}

export async function POST(req: NextRequest) {
  if (isVercel()) {
    return new Response(JSON.stringify({ error: "File tool disabled on Vercel" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const { filepath, allowedRoot } = await req.json();
    if (typeof filepath !== "string" || typeof allowedRoot !== "string") {
      return new Response(JSON.stringify({ error: "Invalid params" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const resolvedRoot = path.resolve(allowedRoot || ".");
    const resolved = path.resolve(filepath);
    if (!resolved.startsWith(resolvedRoot)) {
      return new Response(JSON.stringify({ error: "Path outside allowedRoot" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    const stat = await fs.stat(resolved);
    if (stat.isDirectory()) {
      const entries = await fs.readdir(resolved, { withFileTypes: true });
      return Response.json({
        type: "directory",
        entries: entries.map((e) => ({
          name: e.name,
          type: e.isDirectory() ? "dir" : "file",
        })),
      });
    }
    const data = await fs.readFile(resolved, "utf8");
    return Response.json({ type: "file", content: data });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
