import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import React from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedCounter, Card, FadeInView, Loading, ScreenBackground } from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import type { Room } from "@/types";

async function loadDashboard() {
  const [{ data: rooms }, { data: clients }, { data: invoices }, { data: recentTx }] = await Promise.all([
    supabase.from("fridge_rooms").select("*").eq("is_active", true).order("name"),
    supabase.from("fridge_clients").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("fridge_invoices").select("amount, status"),
    supabase.from("fridge_transactions").select("*, fridge_clients(name), fridge_rooms(name)").order("created_at", { ascending: false }).limit(5),
  ]);
  const totalCap = rooms?.reduce((s, r) => s + r.capacity_tonnes, 0) ?? 0;
  const totalUsed = rooms?.reduce((s, r) => s + r.current_tonnes, 0) ?? 0;
  const overdue = invoices?.filter(i => i.status === "overdue").reduce((s, i) => s + i.amount, 0) ?? 0;
  const pendingInv = invoices?.filter(i => i.status === "pending").length ?? 0;
  return { rooms: rooms ?? [], totalCap, totalUsed, clientCount: clients ?? 0, overdue, pendingInv, recentTx: recentTx ?? [] };
}

export default function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch, isRefetching } = useQuery({ queryKey: ["dashboard"], queryFn: loadDashboard });

  if (isLoading) return <ScreenBackground><Loading label="Loading dashboard" /></ScreenBackground>;

  const occupancy = data?.totalCap ? Math.round((data.totalUsed / data.totalCap) * 100) : 0;

  const kpis = [
    { label: "Total Stored", value: data?.totalUsed ?? 0, suffix: "t", color: Colors.blue },
    { label: "Capacity", value: data?.totalCap ?? 0, suffix: "t", color: Colors.cyan },
    { label: "Occupancy", value: occupancy, suffix: "%", color: occupancy > 80 ? Colors.red : Colors.green },
    { label: "Clients", value: data?.clientCount ?? 0, suffix: "", color: Colors.blueLight },
  ];

  return (
    <ScreenBackground>
      <ScrollView keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={Colors.blue} />}
        contentContainerStyle={{ padding: Spacing.lg, paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + 40 }}>

        <FadeInView>
          <Text style={s.welcome}>❄️ Cold Storage</Text>
          <Text style={s.date}>{format(new Date(), "EEEE · MMMM dd yyyy")}</Text>
        </FadeInView>

        {/* KPIs */}
        <View style={s.kpiGrid}>
          {kpis.map((k, i) => (
            <FadeInView key={k.label} delay={100 + i * 80} style={{ width: "48%", flexGrow: 1 }}>
              <Card accent={k.color} style={{ paddingVertical: Spacing.lg }}>
                <Text style={s.kpiLabel}>{k.label}</Text>
                <AnimatedCounter value={k.value} suffix={k.suffix} style={[s.kpiValue, { color: k.color }]} />
              </Card>
            </FadeInView>
          ))}
        </View>

        {/* Room Overview */}
        <FadeInView delay={400}>
          <Text style={s.heading}>Rooms</Text>
          <View style={{ gap: Spacing.sm }}>
            {data?.rooms.map((r: Room) => {
              const pct = r.capacity_tonnes > 0 ? (r.current_tonnes / r.capacity_tonnes) * 100 : 0;
              const barColor = pct > 85 ? Colors.red : pct > 60 ? Colors.yellow : Colors.green;
              return (
                <Pressable key={r.id} onPress={() => router.push({ pathname: "/room-detail", params: { id: r.id } })}>
                  <Card style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: Colors.steel, fontWeight: "700", fontSize: 15 }}>{r.name}</Text>
                      <Text style={{ color: Colors.dim, fontSize: 12, marginTop: 2 }}>
                        {r.current_tonnes.toLocaleString()}t / {r.capacity_tonnes.toLocaleString()}t
                      </Text>
                    </View>
                    <View style={{ width: 80 }}>
                      <View style={s.bar}><View style={[s.barFill, { width: `${pct}%`, backgroundColor: barColor }]} /></View>
                      <Text style={{ color: barColor, fontSize: 11, fontWeight: "800", textAlign: "right", marginTop: 2 }}>{Math.round(pct)}%</Text>
                    </View>
                    {r.current_temp !== null && (
                      <Text style={{ color: Colors.cyan, fontSize: 13, fontWeight: "700", minWidth: 45, textAlign: "right" }}>{r.current_temp}°C</Text>
                    )}
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </FadeInView>

        {/* Recent Transactions */}
        <FadeInView delay={500}>
          <Text style={s.heading}>Recent Activity</Text>
          {data?.recentTx.length === 0 ? (
            <Text style={{ color: Colors.dim, textAlign: "center", marginTop: 20 }}>No transactions yet</Text>
          ) : (
            data?.recentTx.map((tx: any, i: number) => (
              <Card key={tx.id} style={{ marginBottom: Spacing.sm, flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
                <View style={[s.txBadge, { backgroundColor: tx.type === "in" ? Colors.green + "22" : Colors.red + "22" }]}>
                  <Text style={{ color: tx.type === "in" ? Colors.green : Colors.red, fontSize: 12, fontWeight: "900" }}>
                    {tx.type === "in" ? "IN" : "OUT"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.steel, fontWeight: "600", fontSize: 13 }}>{tx.fridge_clients?.name}</Text>
                  <Text style={{ color: Colors.dim, fontSize: 11 }}>{tx.product_type} · {tx.fridge_rooms?.name} · {format(new Date(tx.date), "MMM dd")}</Text>
                </View>
                <Text style={{ color: tx.type === "in" ? Colors.green : Colors.red, fontWeight: "800", fontSize: 14 }}>
                  {tx.type === "in" ? "+" : "−"}{tx.tonnes}t
                </Text>
              </Card>
            ))
          )}
        </FadeInView>

        {/* Quick Actions */}
        <FadeInView delay={600}>
          <View style={{ flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.xl }}>
            <Pressable onPress={() => router.push("/new-transaction")} style={[s.quickBtn, { backgroundColor: Colors.blue }]}>
              <Text style={s.quickBtnText}>+ New Transaction</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/new-client")} style={[s.quickBtn, { backgroundColor: Colors.elevated, borderWidth: 1, borderColor: Colors.border }]}>
              <Text style={[s.quickBtnText, { color: Colors.dim }]}>+ New Client</Text>
            </Pressable>
          </View>
        </FadeInView>
      </ScrollView>
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  welcome: { color: Colors.steel, fontSize: 26, fontWeight: "900", letterSpacing: 1 },
  date: { color: Colors.dim, fontSize: 12, textTransform: "uppercase", letterSpacing: 2, marginTop: 4, marginBottom: Spacing.xl },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.xl },
  kpiLabel: { color: Colors.dim, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  kpiValue: { fontSize: 28, fontWeight: "900", marginTop: 4 },
  heading: { color: Colors.steel, fontSize: 14, fontWeight: "900", textTransform: "uppercase", letterSpacing: 2, marginBottom: Spacing.md, marginTop: Spacing.xl },
  bar: { height: 6, backgroundColor: Colors.elevated, borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
  txBadge: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: "center", justifyContent: "center" },
  quickBtn: { flex: 1, borderRadius: Radius.md, paddingVertical: 14, alignItems: "center" },
  quickBtnText: { color: Colors.white, fontWeight: "800", fontSize: 13, textTransform: "uppercase", letterSpacing: 1 },
});
