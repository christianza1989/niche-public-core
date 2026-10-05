import { publishDueJobs, schedulerToken } from "@/lib/scheduler";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const expectedToken = schedulerToken();
  if (!expectedToken) {
    return Response.json({ error: "scheduler_not_configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${expectedToken}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await publishDueJobs();
    return Response.json(result, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown scheduler error";
    return Response.json({ error: "scheduler_failed", message }, { status: 500 });
  }
}
