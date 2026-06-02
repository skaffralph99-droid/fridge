import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, EmptyState, FadeInView, Loading, ScreenBackground, ScreenTitle, Badge } from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import type { Client } from "@/types";

export default function ClientsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data } = await supabase.from("fridge_clients").select("*").order("name");
      return (data ?? []) as Client[];
    },
  });

  const filtered = data?.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase())) ?? [];

  if (isLoading) return <ScreenBackground><Loading label="Loading clients" /></ScreenBackground>;

  const typeIcon: Record<string, string> = { farmer: "🌾", factory: "🏭", distributor: "🚚", other: "📦" };

  return (
    <ScreenBackground>
      <ScrollView keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={Colors.blue} />}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.lg }}>
          <ScreenTitle subtitle={`${data?.length ?? 0} total`}>Clients</ScreenTitle>
          <Pressable onPress={() => router.push("/new-client")} style={s.addBtn}>
            <Text style={s.addBtnText}>+ New</Text>
          </Pressable>
        </View>

        <TextInput placeholder="Search clients..." placeholderTextColor={Colors.dim} value={search} onChangeText={setSearch}
          style={[s.search, { marginBottom: Spacing.lg }]} />

        {filtered.length === 0 ? (
          <EmptyState emoji="👥" text="No clients yet. Add your first client." />
        ) : (
          filtered.map((c, i) => (
            <FadeInView key={c.id} delay={i * 40}>
              <Pressable onPress={() => router.push({ pathname: "/client-detail", params: { id: c.id } })}>
                <Card style={{ marginBottom: Spacing.sm }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
                    <Text style={{ fontSize: 28 }}>{typeIcon[c.client_type] ?? "📦"}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: Colors.steel, fontWeight: "700", fontSize: 15 }}>{c.name}</Text>
                      {c.company && <Text style={{ color: Colors.dim, fontSize: 12, marginTop: 1 }}>{c.company}</Text>}
                      <Text style={{ color: Colors.dim, fontSize: 11, marginTop: 2 }}>
                        ${c.rate_per_tonne}/t · {c.payment_terms} · {c.client_type}
                      </Text>
                    </View>
                    <Badge label={c.is_active ? "Active" : "Inactive"} color={c.is_active ? Colors.green : Colors.dim} />
                  </View>
                </Card>
              </Pressable>
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
  search: { backgroundColor: Colors.elevated, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, color: Colors.steel, fontSize: 15 },
});
