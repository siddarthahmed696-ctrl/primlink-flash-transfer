import { supabase } from "@/integrations/supabase/client";

export type TransferHistoryItem = {
  id: string;
  code: string;
  url: string;
  fileCount: number;
  totalSize: number;
  downloadCount: number;
  createdAt: string;
  expiresAt: string;
};

const STORAGE_KEY = "vmy_transfer_history";
const MAX_ITEMS = 25;

function getBaseUrl(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.host;
  if (host.includes("id-preview--") || host.includes("lovableproject.com")) {
    return "https://primlink-flash-transfer.lovable.app";
  }
  return window.location.origin;
}

function readStored(): TransferHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStored(items: TransferHistoryItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

export function saveTransferHistory(item: Omit<TransferHistoryItem, "url">) {
  const next: TransferHistoryItem = {
    ...item,
    url: `${getBaseUrl()}/d/${item.code}`,
  };
  const existing = readStored().filter((x) => x.id !== next.id && x.code !== next.code);
  writeStored([next, ...existing]);
}

export async function loadTransferHistory(): Promise<TransferHistoryItem[]> {
  const stored = readStored();
  if (!stored.length) return [];

  const refreshed = await Promise.all(
    stored.map(async (item) => {
      const { data } = await supabase.rpc("get_transfer_by_code", { _code: item.code } as never);
      const row = (Array.isArray(data) ? data[0] : data) as
        | {
            total_size: number;
            download_count: number;
            created_at: string;
            expires_at: string;
          }
        | null;
      if (!row) return null;
      return {
        ...item,
        totalSize: row.total_size,
        downloadCount: row.download_count,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        url: `${getBaseUrl()}/d/${item.code}`,
      };
    }),
  );

  const valid = refreshed.filter((item): item is TransferHistoryItem => !!item);
  writeStored(valid);
  return valid;
}