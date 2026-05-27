/**
 * Call history API helpers.
 * Kept separate from the axios instance so callers import only what they need.
 */

import api from "./axiosInstance";
import type { CallHistory } from "../types/call";

export interface CallHistoryResponse {
  calls: CallHistory[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
  };
}

export async function getCallHistory(
  page = 1,
  limit = 20,
): Promise<CallHistoryResponse> {
  const res = await api.get(`/api/calls/history?page=${page}&limit=${limit}`);
  return res.data;
}

export async function deleteCallHistoryEntry(callId: string): Promise<void> {
  await api.delete(`/api/calls/history/${callId}`);
}

export async function clearCallHistory(): Promise<void> {
  await api.delete("/api/calls/history");
}
