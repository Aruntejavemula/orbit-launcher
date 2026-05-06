import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Reminder, ReminderMethod } from "../types";
import api from "../api";
import { useAuth } from "./AuthContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toReminder(raw: any): Reminder {
  return {
    id: raw.id,
    app_id: raw.app_id,
    remind_days_before: raw.remind_days_before,
    method: raw.method as ReminderMethod,
    active: raw.active,
  };
}

export function useReminders() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: reminders = [] } = useQuery({
    queryKey: ["reminders"],
    queryFn: () => api.get("/reminders").then((r) => r.data.map(toReminder) as Reminder[]),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (body: { app_id: string; remind_days_before: number; method: ReminderMethod }) =>
      api.post("/reminders", body).then((r) => toReminder(r.data)),
    onSuccess: (r) => {
      qc.setQueryData<Reminder[]>(["reminders"], (prev = []) => [...prev, r]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/reminders/${id}`),
    onSuccess: (_, id) => {
      qc.setQueryData<Reminder[]>(["reminders"], (prev = []) => prev.filter((r) => r.id !== id));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch(`/reminders/${id}`, { active }).then((r) => toReminder(r.data)),
    onSuccess: (updated) => {
      qc.setQueryData<Reminder[]>(["reminders"], (prev = []) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
    },
  });

  return {
    reminders,
    addReminder: createMutation.mutateAsync,
    deleteReminder: deleteMutation.mutateAsync,
    toggleReminder: (id: string, active: boolean) => toggleMutation.mutateAsync({ id, active }),
  };
}
