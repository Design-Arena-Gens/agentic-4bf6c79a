import { NextRequest } from "next/server";
import { ChatRequestSchema } from "@/lib/schema";
import { streamWithProvider } from "@/lib/providers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = ChatRequestSchema.safeParse(json);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.format() }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const { messages, settings } = parsed.data;

    const stream = new ReadableStream({
      start(controller) {
        (async () => {
          try {
            await streamWithProvider(
              { messages, settings },
              (chunk: string) => {
                controller.enqueue(new TextEncoder().encode(chunk));
              }
            );
          } catch (e: any) {
            const msg = e?.message ?? "provider error";
            controller.enqueue(new TextEncoder().encode(`\n[error] ${msg}`));
          } finally {
            controller.close();
          }
        })();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "bad request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
