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
  onboardingCompleted: false,
  country: "",
};

interface PrefsApiResponse {
  theme: string;
  start_week_on_monday: boolean;
  compact_cards: boolean;
  show_last_opened: boolean;
  notify_expirations: boolean;
  reminder_days: number;
  reminder_email: boolean;
  reminder_push: boolean;
  onboarding_completed: boolean;
  country: string;
}

interface ApiKeyApiResponse {
  id: string;
  name: string;
  prefix: string;
  secret?: string;
  created_at: string;
  last_used_at: string | null;
}

function toPrefs(raw: PrefsApiResponse): Preferences {
  return {
    theme: (raw.theme as Preferences["theme"]) ?? "light",
    startWeekOnMonday: raw.start_week_on_monday ?? false,
    compactCards: raw.compact_cards ?? false,
    showLastOpened: raw.show_last_opened ?? true,
    notifyExpirations: raw.notify_expirations ?? true,
    reminderDays: raw.reminder_days ?? 7,
    reminderEmail: raw.reminder_email ?? true,
    reminderPush: raw.reminder_push ?? false,
    onboardingCompleted: raw.onboarding_completed ?? false,
    country: raw.country ?? "",
  };
}

function toApiKey(raw: ApiKeyApiResponse): ApiKey {
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

  const { data: prefs = DEFAULTS, isFetched: prefsFetched } = useQuery({
    queryKey: ["preferences"],
    queryFn: async () => {
      try {
        const r = await api.get("/preferences");
        return toPrefs(r.data);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          const r = await api.post("/preferences/init");
          return toPrefs(r.data);
        }
        throw err;
      }
    },
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
      if (patch.onboardingCompleted !== undefined) body.onboarding_completed = patch.onboardingCompleted;
      if (patch.country !== undefined) body.country = patch.country;
      return api.patch("/preferences", body).then((r) => toPrefs(r.data));
    },
    onMutate: (patch) => {
      const prev = qc.getQueryData<Preferences>(["preferences"]);
      qc.setQueryData<Preferences>(["preferences"], (old = DEFAULTS) => ({ ...old, ...patch }));
      return { prev };
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.prev) qc.setQueryData(["preferences"], ctx.prev);
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
    prefsFetched,
    update: updateMutation.mutate,
    apiKeys,
    createApiKey: async (name: string): Promise<ApiKey & { secret: string }> => {
      const raw = await createKeyMutation.mutateAsync(name);
      return { ...toApiKey(raw), secret: raw.secret };
    },
    revokeApiKey: revokeKeyMutation.mutateAsync,
  };
}
