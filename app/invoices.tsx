import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import React from "react";
import { RefreshControl, ScrollView, Text, View, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, FadeInView, EmptyState, Loading, ScreenBackground, ScreenTitle, Badge } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { Stack } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

export default function InvoicesScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data } = await supabase.from("fridge_invoices").select("*, fridge_clients(name, company)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const markPaid = async (id: string) => {
    await supabase.from("fridge_invoices").update({ status: "paid", paid_date: new Date().toISOString().split("T")[0] }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["invoices"] });
  };

  if (isLoading) return <ScreenBackground><Loading /></ScreenBackground>;

  const statusColor: Record<string, string> = { paid: Colors.green, pending: Colors.yellow, overdue: Colors.red, partial: Colors.orange };

  return (
    <ScreenBackground>
      <Stack.Screen options={{ title: "Invoices" }} />
      <ScrollView keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={Colors.blue} />}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40 }}>
        <ScreenTitle subtitle={`${data?.length ?? 0} invoices`}>Invoices</ScreenTitle>

        {data?.length === 0 ? (
          <EmptyState emoji="🧾" text="No invoices yet" />
        ) : (
          data?.map((inv: any, i: number) => (
            <FadeInView key={inv.id} delay={i * 40}>
              <Card style={{ marginBottom: Spacing.sm }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: Colors.steel, fontWeight: "700" }}>{inv.fridge_clients?.name}</Text>
                    <Text style={{ color: Colors.dim, fontSize: 12 }}>
                      {format(new Date(inv.period_start), "MMM dd")} – {format(new Date(inv.period_end), "MMM dd, yyyy")}
                    </Text>
                    <Text style={{ color: Colors.dim, fontSize: 12 }}>{inv.total_tonnes}t × ${inv.rate}/t</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: Colors.steel, fontWeight: "900", fontSize: 18 }}>${inv.amount.toFixed(0)}</Text>
                    <Badge label={inv.status} color={statusColor[inv.status] ?? Colors.dim} />
                  </View>
                </View>
                {inv.status !== "paid" && (
                  <Pressable onPress={() => Alert.alert("Mark as Paid?", `$${inv.amount} from ${inv.fridge_clients?.name}`, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Mark Paid", onPress: () => markPaid(inv.id) },
                  ])} style={{ marginTop: Spacing.md, borderWidth: 1, borderColor: Colors.green, borderRadius: 8, paddingVertical: 8, alignItems: "center" }}>
                    <Text style={{ color: Colors.green, fontWeight: "700" }}>✓ Mark as Paid</Text>
                  </Pressable>
                )}
              </Card>
            </FadeInView>
          ))
        )}
      </ScrollView>
    </ScreenBackground>
  );
}
