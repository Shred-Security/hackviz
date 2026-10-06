import { getCache } from "@vercel/functions";

const TOTAL_KEY = "total";
const SEEN_KEY = "seen";
const BASELINE = 11_034;
const TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year, refreshed on every write
const ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;
const MAX_SEEN = 50_000;

type SeenMap = Record<string, true>;

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

async function readState(cache: ReturnType<typeof getCache>) {
  const [totalRaw, seenRaw] = await Promise.all([cache.get(TOTAL_KEY), cache.get(SEEN_KEY)]);
  const stored = typeof totalRaw === "number" && Number.isFinite(totalRaw) ? Math.max(0, Math.floor(totalRaw)) : 0;
  const total = Math.max(stored, BASELINE);
  const seen = seenRaw && typeof seenRaw === "object" ? (seenRaw as SeenMap) : {};
  return { total, seen, needsSeed: total !== stored };
}

async function writeState(
  cache: ReturnType<typeof getCache>,
  total: number,
  seen: SeenMap,
) {
  await Promise.all([
    cache.set(TOTAL_KEY, total, {
      ttl: TTL_SECONDS,
      tags: ["total-visitors"],
      name: "total-visitors",
    }),
    cache.set(SEEN_KEY, seen, {
      ttl: TTL_SECONDS,
      tags: ["total-visitors"],
      name: "seen-visitors",
    }),
  ]);
}

export async function OPTIONS() {
  return json(null, 204);
}

export async function GET() {
  try {
    const cache = getCache({ namespace: "hackviz-visitors" });
    const { total, seen, needsSeed } = await readState(cache);
    if (needsSeed) {
      await writeState(cache, total, seen);
    }
    return json({ count: total });
  } catch (error) {
    console.error("[visitors] GET failed", error);
    return json({ count: BASELINE });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
    const id = typeof body?.id === "string" ? body.id : "";
    if (!ID_RE.test(id)) {
      return json({ error: "invalid id" }, 400);
    }

    const cache = getCache({ namespace: "hackviz-visitors" });
    const { total, seen } = await readState(cache);

    if (seen[id]) {
      return json({ count: total });
    }

    // Cap the seen map so Runtime Cache stays bounded; still keep the total.
    const nextSeen: SeenMap = { ...seen, [id]: true };
    const ids = Object.keys(nextSeen);
    if (ids.length > MAX_SEEN) {
      for (const oldId of ids.slice(0, ids.length - MAX_SEEN)) {
        delete nextSeen[oldId];
      }
    }

    const nextTotal = total + 1;
    await writeState(cache, nextTotal, nextSeen);
    return json({ count: nextTotal });
  } catch (error) {
    console.error("[visitors] POST failed", error);
    return json({ count: BASELINE }, 500);
  }
}
