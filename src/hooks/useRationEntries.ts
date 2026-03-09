import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRationEntries(customerId: string) {
  return useQuery({
    queryKey: ["ration_entries", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ration_entries")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
}

export function useAddRationEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: {
      customer_id: string;
      item_name: string;
      quantity: number;
      unit: string;
      price: number;
    }) => {
      const { data, error } = await supabase
        .from("ration_entries")
        .insert(entry)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["ration_entries", vars.customer_id] }),
  });
}

export function useDeleteRationEntry(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ration_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["ration_entries", customerId] }),
  });
}
