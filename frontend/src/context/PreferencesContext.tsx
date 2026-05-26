import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Preferences, ApiKey } from "../types";
import api from "../api";
import { toast } from "../components/Toast";
import { useAuth } from "./AuthContext";
import {
  readBudgetCache,
  resolveMonthlyBudget,
  writeBudgetCache,
} from "../lib/budgetLocalCache";
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
  monthlyBudget: null,
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
  monthly_budget: number | null;
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

function apiHasMonthlyBudgetField(raw: unknown): boolean {
  return typeof raw === "object" && raw !== null && Object.prototype.hasOwnProperty.call(raw, "monthly_budget");
}

function assertPrefsApiResponse(raw: unknown): asserts raw is PrefsApiResponse {
  if (!raw || typeof raw !== "object" || typeof (raw as PrefsApiResponse).theme !== "string") {
    throw new Error("Invalid preferences response from API (expected JSON, not HTML).");
  }
}

function toPrefs(
  raw: PrefsApiResponse,
  userId: string | undefined,
  previous?: Preferences,
): Preferences {
  const hasField = apiHasMonthlyBudgetField(raw);
  const monthlyBudget = hasField
    ? resolveMonthlyBudget(raw, userId, true)
    : (previous?.monthlyBudget ?? readBudgetCache(userId));
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
    monthlyBudget,
    country: raw.country ?? "",
  };
}

function prefsPatchBody(
  patch: Partial<Preferences>,
  includeBudgetOnApi: boolean,
): Record<string, unknown> {
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
  if (includeBudgetOnApi && patch.monthlyBudget !== undefined) {
    body.monthly_budget = patch.monthlyBudget;
  }
  if (patch.country !== undefined) body.country = patch.country;
  return body;
}

function preferencesErrorMessage(err: unknown): string {
  const res = (err as { response?: { status?: number; data?: { detail?: unknown } } })?.response;
  const detail = res?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const msg = detail
      .map((d) => (typeof d === "object" && d && "msg" in d ? String((d as { msg: string }).msg) : ""))
      .filter(Boolean)
      .join("; ");
    if (msg) return msg;
  }
  return "Could not save preferences. Please try again.";
}

function applyBudgetPatch(
  patch: Partial<Preferences>,
  previous: Preferences,
  userId: string | undefined,
  raw: PrefsApiResponse | null,
): Preferences {
  if (patch.monthlyBudget === undefined) {
    return raw ? toPrefs(raw, userId, previous) : previous;
  }
  const requested = patch.monthlyBudget;
  let nextBudget: number | null = requested ?? null;
  if (raw && apiHasMonthlyBudgetField(raw) && raw.monthly_budget != null && raw.monthly_budget > 0) {
    nextBudget = raw.monthly_budget;
  } else if (requested != null && requested > 0) {
    nextBudget = requested;
  }
  writeBudgetCache(userId, nextBudget);
  const base = raw ? toPrefs(raw, userId, previous) : { ...previous };
  return { ...base, monthlyBudget: nextBudget };
}

async function patchPreferences(
  patch: Partial<Preferences>,
  previous: Preferences,
  userId: string | undefined,
  serverSupportsBudget: boolean,
): Promise<{ raw: PrefsApiResponse | null; prefs: Preferences }> {
  if (patch.monthlyBudget !== undefined) {
    writeBudgetCache(userId, patch.monthlyBudget ?? null);
  }

  const otherFields = (Object.keys(patch) as (keyof Preferences)[]).filter(
    (k) => k !== "monthlyBudget" && patch[k] !== undefined,
  );
  const budgetOnly = patch.monthlyBudget !== undefined && otherFields.length === 0;

  if (budgetOnly && !serverSupportsBudget) {
    return { raw: null, prefs: applyBudgetPatch(patch, previous, userId, null) };
  }

  const body = prefsPatchBody(patch, serverSupportsBudget);
  const apply = async () => {
    const r = await api.patch("/preferences", body);
    return r.data as PrefsApiResponse;
  };
  let raw: PrefsApiResponse;
  try {
    raw = await apply();
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status !== 404) throw err;
    await api.post("/preferences/init");
    raw = await apply();
  }

  return { raw, prefs: applyBudgetPatch(patch, previous, userId, raw) };
}

interface PrefsQueryResult {
  prefs: Preferences;
  serverSupportsBudget: boolean;
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
  const prefsQueryKey = ["preferences", user?.id] as const;
  const userId = user?.id;

  const {
    data: prefsQuery,
    isFetched: prefsFetched,
    isError: prefsError,
    error: prefsLoadError,
  } = useQuery({
    queryKey: prefsQueryKey,
    queryFn: async (): Promise<PrefsQueryResult> => {
      const load = async (): Promise<PrefsApiResponse> => {
        const r = await api.get("/preferences");
        return r.data as PrefsApiResponse;
      };
      try {
        const raw = await load();
        assertPrefsApiResponse(raw);
        try { localStorage.setItem("remio_theme", raw.theme); } catch { /* private mode */ }
        const serverSupportsBudget = apiHasMonthlyBudgetField(raw);
        return { prefs: toPrefs(raw, userId), serverSupportsBudget };
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          const r = await api.post("/preferences/init");
          const raw = r.data as PrefsApiResponse;
          assertPrefsApiResponse(raw);
          try { localStorage.setItem("remio_theme", raw.theme); } catch { /* private mode */ }
          const serverSupportsBudget = apiHasMonthlyBudgetField(raw);
          return { prefs: toPrefs(raw, userId), serverSupportsBudget };
        }
        throw err;
      }
    },
    enabled: !!user,
    retry: (failureCount, err) => {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("HTML") || msg.includes("not JSON")) return false;
      return failureCount < 2;
    },
  });

  const prefs = prefsQuery?.prefs ?? DEFAULTS;

  const { data: apiKeys = [] } = useQuery({
    queryKey: ["api-keys"],
    queryFn: () => api.get("/api-keys").then((r) => r.data.map(toApiKey) as ApiKey[]),
    enabled: !!user,
  });

  const updateMutation = useMutation({
    scope: { id: "preferences-update" },
    mutationFn: (patch: Partial<Preferences>) => {
      const cached = qc.getQueryData<PrefsQueryResult>(prefsQueryKey);
      const prev = cached?.prefs ?? DEFAULTS;
      const supports = cached?.serverSupportsBudget ?? false;
      return patchPreferences(patch, prev, userId, supports);
    },
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: prefsQueryKey });
      const cached = qc.getQueryData<PrefsQueryResult>(prefsQueryKey);
      const prev = cached ?? { prefs: DEFAULTS, serverSupportsBudget: false };
      if (patch.monthlyBudget !== undefined) {
        writeBudgetCache(userId, patch.monthlyBudget ?? null);
      }
      qc.setQueryData<PrefsQueryResult>(prefsQueryKey, {
        prefs: { ...prev.prefs, ...patch },
        serverSupportsBudget: prev.serverSupportsBudget,
      });
      return { prev: cached };
    },
    onSuccess: ({ prefs, raw }, variables, context) => {
      const prevCached = context?.prev;
      const prevPrefs = prevCached?.prefs ?? DEFAULTS;
      let next = prefs;
      if (variables.onboardingCompleted) {
        next = { ...next, onboardingCompleted: true };
      }
      if (variables.monthlyBudget === undefined && raw && !apiHasMonthlyBudgetField(raw)) {
        if (prevPrefs.monthlyBudget != null) {
          next = { ...next, monthlyBudget: prevPrefs.monthlyBudget };
        }
      }
      const supports = raw
        ? apiHasMonthlyBudgetField(raw) || (prevCached?.serverSupportsBudget ?? false)
        : (prevCached?.serverSupportsBudget ?? false);
      qc.setQueryData<PrefsQueryResult>(prefsQueryKey, {
        prefs: next,
        serverSupportsBudget: supports,
      });
    },
    onError: async (err, variables, context) => {
      const cached = qc.getQueryData<PrefsQueryResult>(prefsQueryKey);
      const prev = cached?.prefs ?? DEFAULTS;
      const optimistic = context?.prev?.prefs;
      if (variables.monthlyBudget !== undefined) {
        const budget = readBudgetCache(userId) ?? variables.monthlyBudget ?? null;
        const keepOnboarding =
          variables.onboardingCompleted === true
            ? true
            : optimistic?.onboardingCompleted ?? prev.onboardingCompleted;
        qc.setQueryData<PrefsQueryResult>(prefsQueryKey, {
          prefs: {
            ...prev,
            monthlyBudget: budget,
            onboardingCompleted: keepOnboarding,
            ...(variables.theme !== undefined ? { theme: variables.theme } : {}),
          },
          serverSupportsBudget: cached?.serverSupportsBudget ?? false,
        });
      } else if (variables.onboardingCompleted) {
        qc.setQueryData<PrefsQueryResult>(prefsQueryKey, {
          prefs: {
            ...prev,
            onboardingCompleted: optimistic?.onboardingCompleted ?? true,
            ...(variables.theme !== undefined ? { theme: variables.theme } : {}),
          },
          serverSupportsBudget: cached?.serverSupportsBudget ?? false,
        });
      } else {
        await qc.invalidateQueries({ queryKey: prefsQueryKey });
      }
      toast(preferencesErrorMessage(err), "error");
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
    prefsError,
    prefsLoadError,
    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    apiKeys,
    createApiKey: async (name: string): Promise<ApiKey & { secret: string }> => {
      const raw = await createKeyMutation.mutateAsync(name);
      return { ...toApiKey(raw), secret: raw.secret };
    },
    revokeApiKey: revokeKeyMutation.mutateAsync,
  };
}
