import { useCallback, useEffect, useRef } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AppItem } from "../types";
import { smartLaunch } from "../utils/launch";
import api from "../api";
import { useAuth } from "./AuthContext";
import { toast } from "../components/Toast";
import {
  readAppsCache,
  writeAppsCache,
  readLaunchesCache,
  writeLaunchesCache,
} from "../utils/offlineDataCache";

export interface OpenEvent {
  appId: string;
  ts: number;
}

interface AppApiResponse {
  id: string;
  name: string;
  slug: string;
  color: string;
  url: string;
  category: AppItem["category"];
  plan: AppItem["plan"];
  created_at: string;
  last_opened_at: string | null;
  expires_at: string | null;
  manage_url: string | null;
  icon_key: string | null;
  frequency: string | null;
  pending_unsubscribe_at: string | null;
  monthly_cost: number | null;
  weeklyMinutes?: number;
}

interface LaunchApiResponse {
  app_id: string;
  launched_at: string;
}

function toAppItem(raw: AppApiResponse): AppItem {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    color: raw.color,
    url: raw.url,
    category: raw.category,
    plan: raw.plan,
    createdAt: new Date(raw.created_at).getTime(),
    lastOpened: raw.last_opened_at ? new Date(raw.last_opened_at).getTime() : null,
    expiresAt: raw.expires_at ? new Date(raw.expires_at).getTime() : null,
    manageUrl: raw.manage_url ?? undefined,
    iconKey: raw.icon_key ?? undefined,
    frequency: raw.frequency as AppItem["frequency"],
    pendingUnsubscribeAt: raw.pending_unsubscribe_at
      ? new Date(raw.pending_unsubscribe_at).getTime()
      : null,
    monthlyCost: raw.monthly_cost != null ? Number(raw.monthly_cost) : null,
    weeklyMinutes: raw.weeklyMinutes,
  };
}

function toOpenEvent(raw: LaunchApiResponse): OpenEvent {
  return { appId: raw.app_id, ts: new Date(raw.launched_at).getTime() };
}

export function useApps() {
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();

  const fetchApps = useCallback(async (): Promise<AppItem[]> => {
    try {
      const r = await api.get("/apps");
      const items = r.data.map(toAppItem) as AppItem[];
      writeAppsCache(items);
      return items;
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        const cached = readAppsCache();
        if (cached) return cached;
      }
      throw err;
    }
  }, []);

  const fetchLaunches = useCallback(async (): Promise<OpenEvent[]> => {
    try {
      const r = await api.get("/launches");
      const items = r.data.map(toOpenEvent) as OpenEvent[];
      writeLaunchesCache(items);
      return items;
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        const cached = readLaunchesCache();
        if (cached) return cached;
      }
      throw err;
    }
  }, []);

  const { data: apps = [], isLoading: appsLoading, isError: appsError } = useQuery({
    queryKey: ["apps"],
    queryFn: fetchApps,
    enabled: !!user,
    placeholderData: () => readAppsCache() ?? undefined,
  });

  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ["launches"],
    queryFn: fetchLaunches,
    enabled: !!user,
    placeholderData: () => readLaunchesCache() ?? undefined,
  });

  const appsErrorShown = useRef(false);
  useEffect(() => {
    if (!appsError || appsErrorShown.current) return;
    appsErrorShown.current = true;
    toast("Could not load your apps. Try refreshing the page.", "error");
  }, [appsError]);

  // loading = true while auth resolving OR while queries are fetching
  const loading = authLoading || appsLoading || historyLoading;

  const addMutation = useMutation({
    mutationFn: (data: Omit<AppItem, "id" | "createdAt" | "lastOpened">) =>
      api.post("/apps", {
        name: data.name, slug: data.slug, color: data.color, url: data.url,
        category: data.category, plan: data.plan,
        expires_at: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
        manage_url: data.manageUrl ?? null,
        icon_key: data.iconKey ?? null,
        frequency: data.frequency ?? null,
        monthly_cost: data.monthlyCost ?? null,
      }).then((r) => toAppItem(r.data)),
    onSuccess: (newApp) => {
      qc.setQueryData<AppItem[]>(["apps"], (prev = []) => [newApp, ...prev]);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/apps/${id}`),
    onSuccess: (_, id) => {
      qc.setQueryData<AppItem[]>(["apps"], (prev = []) => prev.filter((a) => a.id !== id));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<AppItem> }) => {
      const body: Record<string, unknown> = {};
      if (patch.name !== undefined) body.name = patch.name;
      if (patch.slug !== undefined) body.slug = patch.slug;
      if (patch.color !== undefined) body.color = patch.color;
      if (patch.url !== undefined) body.url = patch.url;
      if (patch.category !== undefined) body.category = patch.category;
      if (patch.plan !== undefined) body.plan = patch.plan;
      if (patch.expiresAt !== undefined) body.expires_at = patch.expiresAt ? new Date(patch.expiresAt).toISOString() : null;
      if (patch.manageUrl !== undefined) body.manage_url = patch.manageUrl;
      if (patch.iconKey !== undefined) body.icon_key = patch.iconKey;
      if (patch.frequency !== undefined) body.frequency = patch.frequency;
      if (patch.pendingUnsubscribeAt !== undefined)
        body.pending_unsubscribe_at = patch.pendingUnsubscribeAt ? new Date(patch.pendingUnsubscribeAt).toISOString() : null;
      if (patch.monthlyCost !== undefined) body.monthly_cost = patch.monthlyCost ?? null;
      return api.patch(`/apps/${id}`, body).then((r) => toAppItem(r.data));
    },
    onSuccess: (updated) => {
      qc.setQueryData<AppItem[]>(["apps"], (prev = []) =>
        prev.map((a) => (a.id === updated.id ? updated : a))
      );
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (ordered: AppItem[]) =>
      api.post("/apps/reorder", ordered.map((a, i) => ({ id: a.id, order: i }))),
    onError: () => {
      qc.invalidateQueries({ queryKey: ["apps"] });
      toast("Could not save new order. Please try again.", "error");
    },
  });

  const reorder = useCallback(
    (fromId: string, toId: string) => {
      qc.setQueryData<AppItem[]>(["apps"], (prev = []) => {
        if (fromId === toId) return prev;
        const fromIdx = prev.findIndex((a) => a.id === fromId);
        const toIdx = prev.findIndex((a) => a.id === toId);
        if (fromIdx < 0 || toIdx < 0) return prev;
        const next = prev.slice();
        const [moved] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, moved);
        reorderMutation.mutate(next);
        return next;
      });
    },
    [qc, reorderMutation]
  );

  const open = useCallback(
    (id: string) => {
      const ts = Date.now();
      qc.setQueryData<OpenEvent[]>(["launches"], (prev = []) =>
        [{ appId: id, ts }, ...prev].slice(0, 200)
      );
      const postLaunch = () => api.post(`/apps/${id}/launch`).then((r) => {
        const updated = toAppItem(r.data);
        qc.setQueryData<AppItem[]>(["apps"], (prev = []) =>
          prev.map((a) => (a.id === updated.id ? updated : a))
        );
      });
      postLaunch().catch(() => {
        setTimeout(() => postLaunch().catch(console.error), 2000);
      });
    },
    [qc]
  );

  const launch = useCallback(
    (id: string) => {
      open(id);
      const target = apps.find((a) => a.id === id);
      if (target?.url) smartLaunch({ slug: target.slug, url: target.url });
    },
    [apps, open]
  );

  return {
    apps,
    history,
    loading,
    appsLoading,
    addApp: addMutation.mutateAsync,
    removeApp: removeMutation.mutateAsync,
    updateApp: (id: string, patch: Partial<AppItem>) =>
      updateMutation.mutateAsync({ id, patch }),
    reorder,
    open,
    launch,
  };
}
