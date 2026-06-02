import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import React from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, EmptyState, FadeInView, Loading, ScreenBackground, ScreenTitle, Badge } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import type { Transaction } from "@/types";

export default function TransactionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data } = await supabase.from("fridge_transactions")
        .select("*, fridge_clients(name, company), fridge_rooms(name)")
        .order("created_at", { ascending: false }).limit(50);
      return (data ?? []) as Transaction[];
    },
  });

  if (isLoading) return <ScreenBackground><Loading label="Loading transactions" /></ScreenBackground>;

  return (
    <ScreenBackground>
      <ScrollView keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={Colors.blue} />}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.lg }}>
          <ScreenTitle>Transactions</ScreenTitle>
          <Pressable onPress={() => router.push("/new-transaction")} style={s.addBtn}>
            <Text style={s.addBtnText}>+ New</Text>
          </Pressable>
        </View>

        {data?.length === 0 ? (
          <EmptyState emoji="📦" text="No transactions yet. Log your first product in/out." />
        ) : (
          data?.map((tx, i) => (
            <FadeInView key={tx.id} delay={i * 40}>
              <Card style={{ marginBottom: Spacing.sm, flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
                <View style={[s.typeBadge, { backgroundColor: tx.type === "in" ? Colors.green + "22" : Colors.red + "22" }]}>
                  <Text style={{ color: tx.type === "in" ? Colors.green : Colors.red, fontSize: 13, fontWeight: "900" }}>
                    {tx.type === "in" ? "▼ IN" : "▲ OUT"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.steel, fontWeight: "700", fontSize: 14 }}>{tx.fridge_clients?.name}</Text>
                  <Text style={{ color: Colors.dim, fontSize: 12, marginTop: 2 }}>
                    {tx.product_type} · {tx.fridge_rooms?.name} · {format(new Date(tx.date), "MMM dd, yyyy")}
                  </Text>
                </View>
                <Text style={{ color: tx.type === "in" ? Colors.green : Colors.red, fontWeight: "900", fontSize: 16 }}>
                  {tx.type === "in" ? "+" : "−"}{tx.tonnes}t
                </Text>
              </Card>
            </FadeInView>
          ))
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  addBtn: { backgroundColor: Colors.blue, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  addBtnText: { color: Colors.white, fontWeight: "800", fontSize: 13 },
  typeBadge: { width: 50, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
});
