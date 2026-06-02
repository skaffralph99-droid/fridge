import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import React from "react";
import { Alert, Linking, Pressable, RefreshControl, ScrollView, Text, View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, FadeInView, Loading, ScreenBackground, Badge } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { Stack } from "expo-router";

export default function ClientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const [{ data: client }, { data: inventory }, { data: invoices }, { data: txns }] = await Promise.all([
        supabase.from("fridge_clients").select("*").eq("id", id).single(),
        supabase.from("fridge_inventory").select("*, fridge_rooms(name)").eq("client_id", id).gt("tonnes", 0),
        supabase.from("fridge_invoices").select("*").eq("client_id", id).order("created_at", { ascending: false }).limit(5),
        supabase.from("fridge_transactions").select("*, fridge_rooms(name)").eq("client_id", id).order("created_at", { ascending: false }).limit(10),
      ]);
      const totalStored = inventory?.reduce((s, i) => s + i.tonnes, 0) ?? 0;
      const totalOwed = invoices?.filter(i => i.status !== "paid").reduce((s, i) => s + i.amount - i.paid_amount, 0) ?? 0;
      return { client, inventory: inventory ?? [], invoices: invoices ?? [], txns: txns ?? [], totalStored, totalOwed };
    },
    enabled: !!id,
  });

  if (isLoading) return <ScreenBackground><Loading /></ScreenBackground>;
  const c = data?.client;
  if (!c) return <ScreenBackground><Text style={{ color: Colors.dim, padding: 20 }}>Client not found</Text></ScreenBackground>;

  const callWhatsApp = () => { if (c.whatsapp || c.phone) Linking.openURL(`https://wa.me/${(c.whatsapp || c.phone)?.replace(/[^0-9]/g, "")}`); };

  return (
    <ScreenBackground>
      <Stack.Screen options={{ title: c.name }} />
      <ScrollView keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={Colors.blue} />}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40 }}>

        <FadeInView>
          <Card>
            <Text style={{ color: Colors.steel, fontSize: 20, fontWeight: "900" }}>{c.name}</Text>
            {c.company && <Text style={{ color: Colors.dim, fontSize: 14, marginTop: 2 }}>{c.company}</Text>}
            <View style={{ flexDirection: "row", gap: 20, marginTop: Spacing.lg }}>
              <View><Text style={{ color: Colors.dim, fontSize: 11 }}>Stored</Text><Text style={{ color: Colors.blue, fontWeight: "900", fontSize: 18 }}>{data?.totalStored}t</Text></View>
              <View><Text style={{ color: Colors.dim, fontSize: 11 }}>Rate</Text><Text style={{ color: Colors.green, fontWeight: "700", fontSize: 18 }}>${c.rate_per_tonne}/t</Text></View>
              <View><Text style={{ color: Colors.dim, fontSize: 11 }}>Owed</Text><Text style={{ color: data?.totalOwed ? Colors.red : Colors.green, fontWeight: "700", fontSize: 18 }}>${data?.totalOwed?.toFixed(0) ?? 0}</Text></View>
            </View>
            <View style={{ flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.lg }}>
              {(c.phone || c.whatsapp) && (
                <Pressable onPress={callWhatsApp} style={s.waBtn}>
                  <Text style={{ color: Colors.white, fontWeight: "700" }}>💬 WhatsApp</Text>
                </Pressable>
              )}
              {c.phone && (
                <Pressable onPress={() => Linking.openURL(`tel:${c.phone}`)} style={s.callBtn}>
                  <Text style={{ color: Colors.blue, fontWeight: "700" }}>📞 Call</Text>
                </Pressable>
              )}
            </View>
          </Card>
        </FadeInView>

        <FadeInView delay={100}>
          <Text style={s.heading}>Currently Stored</Text>
          {data?.inventory.length === 0 ? (
            <Text style={{ color: Colors.dim }}>Nothing stored currently</Text>
          ) : (
            data?.inventory.map((inv: any) => (
              <Card key={inv.id} style={{ marginBottom: Spacing.sm, flexDirection: "row", justifyContent: "space-between" }}>
                <View>
                  <Text style={{ color: Colors.steel, fontWeight: "700" }}>{inv.product_type}</Text>
                  <Text style={{ color: Colors.dim, fontSize: 12 }}>{inv.fridge_rooms?.name} · since {format(new Date(inv.date_in), "MMM dd")}</Text>
                </View>
                <Text style={{ color: Colors.blue, fontWeight: "900" }}>{inv.tonnes}t</Text>
              </Card>
            ))
          )}
        </FadeInView>

        <FadeInView delay={200}>
          <Text style={s.heading}>Transaction History</Text>
          {data?.txns.map((tx: any) => (
            <Card key={tx.id} style={{ marginBottom: Spacing.sm, flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
              <Badge label={tx.type} color={tx.type === "in" ? Colors.green : Colors.red} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: Colors.steel, fontSize: 13 }}>{tx.product_type} · {tx.fridge_rooms?.name}</Text>
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
  heading: { color: Colors.steel, fontSize: 14, fontWeight: "900", textTransform: "uppercase", letterSpacing: 2, marginTop: Spacing.xl, marginBottom: Spacing.md },
  waBtn: { backgroundColor: "#25D366", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, flex: 1, alignItems: "center" },
  callBtn: { borderWidth: 1, borderColor: Colors.blue, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, flex: 1, alignItems: "center" },
});
