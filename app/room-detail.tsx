import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import React from "react";
import { RefreshControl, ScrollView, Text, View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, FadeInView, Loading, ScreenBackground, Badge } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { Stack } from "expo-router";

export default function RoomDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["room", id],
    queryFn: async () => {
      const [{ data: room }, { data: inventory }, { data: txns }] = await Promise.all([
        supabase.from("fridge_rooms").select("*").eq("id", id).single(),
        supabase.from("fridge_inventory").select("*, fridge_clients(name)").eq("room_id", id).gt("tonnes", 0),
        supabase.from("fridge_transactions").select("*, fridge_clients(name)").eq("room_id", id).order("created_at", { ascending: false }).limit(10),
      ]);
      return { room, inventory: inventory ?? [], txns: txns ?? [] };
    },
    enabled: !!id,
  });

  if (isLoading) return <ScreenBackground><Loading /></ScreenBackground>;

  const room = data?.room;
  if (!room) return <ScreenBackground><Text style={{ color: Colors.dim, padding: 20 }}>Room not found</Text></ScreenBackground>;

  const pct = room.capacity_tonnes > 0 ? (room.current_tonnes / room.capacity_tonnes) * 100 : 0;
  const barColor = pct > 85 ? Colors.red : pct > 60 ? Colors.yellow : Colors.green;

  return (
    <ScreenBackground>
      <Stack.Screen options={{ title: room.name }} />
      <ScrollView keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={Colors.blue} />}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40 }}>

        <FadeInView>
          <Card>
            <Text style={{ color: Colors.steel, fontSize: 22, fontWeight: "900" }}>{room.name}</Text>
            <View style={[s.bar, { marginTop: Spacing.md }]}><View style={[s.barFill, { width: `${pct}%`, backgroundColor: barColor }]} /></View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
              <Text style={{ color: Colors.dim, fontSize: 13 }}>{room.current_tonnes.toLocaleString()}t / {room.capacity_tonnes.toLocaleString()}t</Text>
              <Text style={{ color: barColor, fontWeight: "800" }}>{Math.round(pct)}%</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 20, marginTop: Spacing.lg }}>
              <View><Text style={{ color: Colors.dim, fontSize: 11 }}>Target</Text><Text style={{ color: Colors.cyan, fontWeight: "700" }}>{room.target_temp}°C</Text></View>
              <View><Text style={{ color: Colors.dim, fontSize: 11 }}>Current</Text><Text style={{ color: Colors.cyan, fontWeight: "700" }}>{room.current_temp ?? "—"}°C</Text></View>
              <View><Text style={{ color: Colors.dim, fontSize: 11 }}>Free</Text><Text style={{ color: Colors.green, fontWeight: "700" }}>{(room.capacity_tonnes - room.current_tonnes).toLocaleString()}t</Text></View>
            </View>
          </Card>
        </FadeInView>

        <FadeInView delay={100}>
          <Text style={s.heading}>What's Stored</Text>
          {data?.inventory.length === 0 ? (
            <Text style={{ color: Colors.dim, textAlign: "center", marginTop: 20 }}>Room is empty</Text>
          ) : (
            data?.inventory.map((inv: any) => (
              <Card key={inv.id} style={{ marginBottom: Spacing.sm, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={{ color: Colors.steel, fontWeight: "700" }}>{inv.fridge_clients?.name}</Text>
                  <Text style={{ color: Colors.dim, fontSize: 12 }}>{inv.product_type} · since {format(new Date(inv.date_in), "MMM dd")}</Text>
                </View>
                <Text style={{ color: Colors.blue, fontWeight: "900", fontSize: 16 }}>{inv.tonnes}t</Text>
              </Card>
            ))
          )}
        </FadeInView>

        <FadeInView delay={200}>
          <Text style={s.heading}>Recent Activity</Text>
          {data?.txns.map((tx: any) => (
            <Card key={tx.id} style={{ marginBottom: Spacing.sm, flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
              <Badge label={tx.type === "in" ? "IN" : "OUT"} color={tx.type === "in" ? Colors.green : Colors.red} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: Colors.steel, fontSize: 13 }}>{tx.fridge_clients?.name} · {tx.product_type}</Text>
                <Text style={{ color: Colors.dim, fontSize: 11 }}>{format(new Date(tx.date), "MMM dd, yyyy")}</Text>
              </View>
              <Text style={{ color: tx.type === "in" ? Colors.green : Colors.red, fontWeight: "800" }}>{tx.type === "in" ? "+" : "−"}{tx.tonnes}t</Text>
            </Card>
          ))}
        </FadeInView>
      </ScrollView>
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  bar: { height: 12, backgroundColor: Colors.elevated, borderRadius: 6, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 6 },
  heading: { color: Colors.steel, fontSize: 14, fontWeight: "900", textTransform: "uppercase", letterSpacing: 2, marginTop: Spacing.xl, marginBottom: Spacing.md },
});
