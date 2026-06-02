import { useQuery } from "@tanstack/react-query";
import React from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, FadeInView, Loading, ScreenBackground, ScreenTitle } from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import type { Room } from "@/types";

export default function RoomsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: rooms, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data } = await supabase.from("fridge_rooms").select("*").order("name");
      return (data ?? []) as Room[];
    },
  });

  if (isLoading) return <ScreenBackground><Loading label="Loading rooms" /></ScreenBackground>;

  const totalCap = rooms?.reduce((s, r) => s + r.capacity_tonnes, 0) ?? 0;
  const totalUsed = rooms?.reduce((s, r) => s + r.current_tonnes, 0) ?? 0;

  return (
    <ScreenBackground>
      <ScrollView keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={Colors.blue} />}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40 }}>
        <ScreenTitle subtitle={`${totalUsed.toLocaleString()}t stored of ${totalCap.toLocaleString()}t total`}>Rooms</ScreenTitle>

        {rooms?.map((r, i) => {
          const pct = r.capacity_tonnes > 0 ? (r.current_tonnes / r.capacity_tonnes) * 100 : 0;
          const free = r.capacity_tonnes - r.current_tonnes;
          const barColor = pct > 85 ? Colors.red : pct > 60 ? Colors.yellow : Colors.green;
          return (
            <FadeInView key={r.id} delay={i * 60}>
              <Pressable onPress={() => router.push({ pathname: "/room-detail", params: { id: r.id } })}>
                <Card style={{ marginBottom: Spacing.md }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ color: Colors.steel, fontSize: 18, fontWeight: "900" }}>{r.name}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      {r.current_temp !== null && (
                        <Text style={{ color: Colors.cyan, fontSize: 15, fontWeight: "700" }}>{r.current_temp}°C</Text>
                      )}
                      <Text style={{ color: barColor, fontSize: 15, fontWeight: "800" }}>{Math.round(pct)}%</Text>
                    </View>
                  </View>
                  <View style={[s.bar, { marginTop: Spacing.md }]}>
                    <View style={[s.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
                    <Text style={{ color: Colors.dim, fontSize: 12 }}>{r.current_tonnes.toLocaleString()}t stored</Text>
                    <Text style={{ color: Colors.dim, fontSize: 12 }}>{free.toLocaleString()}t free</Text>
                  </View>
                  <Text style={{ color: Colors.dim, fontSize: 11, marginTop: 4 }}>Capacity: {r.capacity_tonnes.toLocaleString()} tonnes · Target: {r.target_temp}°C</Text>
                </Card>
              </Pressable>
            </FadeInView>
          );
        })}
      </ScrollView>
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  bar: { height: 10, backgroundColor: Colors.elevated, borderRadius: 5, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 5 },
});
