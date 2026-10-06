import { getCache } from "@vercel/functions";

const TOTAL_KEY = "total";
const SEEN_KEY = "seen";
const BASELINE = 11_034;
const TTL_SECONDS = 60 * 60 * 24 * 365;
const ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;
const MAX_SEEN = 50_000;

/**
 * @typedef {Record<string, true>} SeenMap
 */

/**
 * @param {unknown} body
 * @param {number} [status]
 */
function json(body, status = 200) {
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

/**
 * @param {ReturnType<typeof getCache>} cache
 */
async function readState(cache) {
  const [totalRaw, seenRaw] = await Promise.all([cache.get(TOTAL_KEY), cache.get(SEEN_KEY)]);
  const stored =
    typeof totalRaw === "number" && Number.isFinite(totalRaw) ? Math.max(0, Math.floor(totalRaw)) : 0;
  const total = Math.max(stored, BASELINE);
  /** @type {SeenMap} */
  const seen = seenRaw && typeof seenRaw === "object" ? /** @type {SeenMap} */ (seenRaw) : {};
  return { total, seen, needsSeed: total !== stored };
}

/**
 * @param {ReturnType<typeof getCache>} cache
 * @param {number} total
 * @param {SeenMap} seen
 */
async function writeState(cache, total, seen) {
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
  } catch {
    return json({ count: BASELINE });
  }
}

/**
 * @param {Request} request
 */
export async function POST(request) {
  try {
    const body = /** @type {{ id?: unknown } | null} */ (await request.json().catch(() => null));
    const id = typeof body?.id === "string" ? body.id : "";
    if (!ID_RE.test(id)) {
      return json({ error: "invalid id" }, 400);
    }

    const cache = getCache({ namespace: "hackviz-visitors" });
    const { total, seen } = await readState(cache);

    if (seen[id]) {
      return json({ count: total });
    }

    /** @type {SeenMap} */
    const nextSeen = { ...seen, [id]: true };
    const ids = Object.keys(nextSeen);
    if (ids.length > MAX_SEEN) {
      for (const oldId of ids.slice(0, ids.length - MAX_SEEN)) {
        delete nextSeen[oldId];
      }
    }

    const nextTotal = total + 1;
    await writeState(cache, nextTotal, nextSeen);
    return json({ count: nextTotal });
  } catch {
    return json({ count: BASELINE }, 500);
  }
}
