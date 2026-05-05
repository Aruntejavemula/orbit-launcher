import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Preferences, ApiKey } from "../types";
import api from "../api";
import { useAuth } from "./AuthContext";

const DEFAULTS: Preferences = {
  theme: "light",
  startWeekOnMonday: false,
  compactCards: false,
  showLastOpened: true,
  notifyExpirations: true,
  reminderDays: 7,
  reminderEmail: true,
  reminderPush: false,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPrefs(raw: any): Preferences {
  return {
    theme: raw.theme ?? "light",
    startWeekOnMonday: raw.start_week_on_monday ?? false,
    compactCards: raw.compact_cards ?? false,
    showLastOpened: raw.show_last_opened ?? true,
    notifyExpirations: raw.notify_expirations ?? true,
    reminderDays: raw.reminder_days ?? 7,
    reminderEmail: raw.reminder_email ?? true,
    reminderPush: raw.reminder_push ?? false,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toApiKey(raw: any): ApiKey {
  return {
    id: raw.id,
    name: raw.name,
    prefix: raw.prefix,
    secret: raw.secret ?? "",
    createdAt: new Date(raw.created_at).getTime(),
    lastUsed: raw.last_used_at ? new Date(raw.last_used_at).getTime() : null,
  };
}

export function usePrefs() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: prefs = DEFAULTS } = useQuery({
    queryKey: ["preferences"],
    queryFn: () => api.get("/preferences").then((r) => toPrefs(r.data)),
    enabled: !!user,
  });

  const { data: apiKeys = [] } = useQuery({
    queryKey: ["api-keys"],
    queryFn: () => api.get("/api-keys").then((r) => r.data.map(toApiKey) as ApiKey[]),
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: (patch: Partial<Preferences>) => {
      const body: Record<string, unknown> = {};
      if (patch.theme !== undefined) body.theme = patch.theme;
      if (patch.startWeekOnMonday !== undefined) body.start_week_on_monday = patch.startWeekOnMonday;
      if (patch.compactCards !== undefined) body.compact_cards = patch.compactCards;
      if (patch.showLastOpened !== undefined) body.show_last_opened = patch.showLastOpened;
      if (patch.notifyExpirations !== undefined) body.notify_expirations = patch.notifyExpirations;
      if (patch.reminderDays !== undefined) body.reminder_days = patch.reminderDays;
      if (patch.reminderEmail !== undefined) body.reminder_email = patch.reminderEmail;
      if (patch.reminderPush !== undefined) body.reminder_push = patch.reminderPush;
      return api.patch("/preferences", body).then((r) => toPrefs(r.data));
    },
    onSuccess: (updated) => {
      qc.setQueryData(["preferences"], updated);
    },
  });

  const createKeyMutation = useMutation({
    mutationFn: (name: string) => api.post("/api-keys", { name }).then((r) => r.data),
    onSuccess: (raw) => {
      const key = toApiKey(raw);
      qc.setQueryData<ApiKey[]>(["api-keys"], (prev = []) => [key, ...prev]);
    },
  });

  const revokeKeyMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api-keys/${id}`),
    onSuccess: (_, id) => {
      qc.setQueryData<ApiKey[]>(["api-keys"], (prev = []) => prev.filter((k) => k.id !== id));
    },
  });

  return {
    prefs,
    update: updateMutation.mutateAsync,
    apiKeys,
    createApiKey: async (name: string): Promise<ApiKey & { secret: string }> => {
      const raw = await createKeyMutation.mutateAsync(name);
      return { ...toApiKey(raw), secret: raw.secret };
    },
    revokeApiKey: revokeKeyMutation.mutateAsync,
  };
}
