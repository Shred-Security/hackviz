const PREFIX = "web3hackviz:";

export type ProgressStatus = "audited" | "mastered" | null;

export function getProgress(slug: string): ProgressStatus {
  try {
    return (localStorage.getItem(PREFIX + slug) as ProgressStatus) ?? null;
  } catch {
    return null;
  }
}

export function setProgress(slug: string, status: ProgressStatus) {
  try {
    if (status === null) {
      localStorage.removeItem(PREFIX + slug);
    } else {
      localStorage.setItem(PREFIX + slug, status);
    }
  } catch {}
}

export function getAllProgress(): Record<string, ProgressStatus> {
  const result: Record<string, ProgressStatus> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX)) {
        const slug = key.slice(PREFIX.length);
        result[slug] = localStorage.getItem(key) as ProgressStatus;
      }
    }
  } catch {}
  return result;
}
