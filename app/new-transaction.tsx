import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Card, Field, BlueButton, ScreenBackground } from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Stack } from "expo-router";
import type { Client, Room } from "@/types";

const PRODUCTS = ["Potatoes", "Apples", "Onions", "Wheat", "Meat", "Cheese", "Dairy", "Frozen Goods", "Other"];

export default function NewTransaction() {
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [type, setType] = useState<"in" | "out">("in");
  const [clients, setClients] = useState<Client[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [clientId, setClientId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [product, setProduct] = useState("Potatoes");
  const [tonnes, setTonnes] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("fridge_clients").select("*").eq("is_active", true).order("name").then(({ data }) => { if (data) setClients(data as Client[]); });
    supabase.from("fridge_rooms").select("*").eq("is_active", true).order("name").then(({ data }) => { if (data) setRooms(data as Room[]); });
  }, []);

  const submit = async () => {
    if (!clientId || !roomId || !tonnes) { Alert.alert("Missing", "Select client, room, and tonnage"); return; }
    const t = parseFloat(tonnes);
    if (isNaN(t) || t <= 0) { Alert.alert("Invalid", "Enter a valid tonnage"); return; }

    const room = rooms.find(r => r.id === roomId);
    if (type === "in" && room && room.current_tonnes + t > room.capacity_tonnes) {
      Alert.alert("Over Capacity", `${room.name} only has ${(room.capacity_tonnes - room.current_tonnes).toFixed(1)}t free`);
      return;
    }
    if (type === "out" && room && room.current_tonnes < t) {
      Alert.alert("Not Enough", `${room.name} only has ${room.current_tonnes.toFixed(1)}t stored`);
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("fridge_transactions").insert({
      client_id: clientId, room_id: roomId, type, product_type: product, tonnes: t,
      date: new Date().toISOString().split("T")[0], notes: notes || null, recorded_by: user?.id,
    });

    if (error) { Alert.alert("Error", error.message); setSaving(false); return; }

    // Update room tonnage
    const delta = type === "in" ? t : -t;
    await supabase.from("fridge_rooms").update({ current_tonnes: (room?.current_tonnes ?? 0) + delta }).eq("id", roomId);

    // If IN, add/update inventory record
    if (type === "in") {
      await supabase.from("fridge_inventory").insert({
        client_id: clientId, room_id: roomId, product_type: product, tonnes: t,
        rate_per_tonne: clients.find(c => c.id === clientId)?.rate_per_tonne ?? 45,
      });
    }

    setSaving(false);
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["rooms"] });
    Alert.alert("✅ Done", `${t}t ${product} ${type === "in" ? "added to" : "removed from"} ${room?.name}`);
    router.back();
  };

  return (
    <ScreenBackground>
      <Stack.Screen options={{ title: type === "in" ? "Product In" : "Product Out" }} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}>
        {/* Type toggle */}
        <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.xl }}>
          <Pressable onPress={() => setType("in")} style={[s.typeBtn, type === "in" && { backgroundColor: Colors.green, borderColor: Colors.green }]}>
            <Text style={[s.typeBtnText, type === "in" && { color: Colors.black }]}>▼ Product IN</Text>
          </Pressable>
          <Pressable onPress={() => setType("out")} style={[s.typeBtn, type === "out" && { backgroundColor: Colors.red, borderColor: Colors.red }]}>
            <Text style={[s.typeBtnText, type === "out" && { color: Colors.white }]}>▲ Product OUT</Text>
          </Pressable>
        </View>

        <Card>
          {/* Client picker */}
          <Text style={s.label}>Client</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {clients.map(c => (
                <Pressable key={c.id} onPress={() => setClientId(c.id)}
                  style={[s.chip, clientId === c.id && { backgroundColor: Colors.blue, borderColor: Colors.blue }]}>
                  <Text style={[s.chipText, clientId === c.id && { color: Colors.white }]}>{c.name}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Room picker */}
          <Text style={s.label}>Room</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: Spacing.lg }}>
            {rooms.map(r => {
              const pct = r.capacity_tonnes > 0 ? Math.round((r.current_tonnes / r.capacity_tonnes) * 100) : 0;
              return (
                <Pressable key={r.id} onPress={() => setRoomId(r.id)}
                  style={[s.roomChip, roomId === r.id && { backgroundColor: Colors.blue, borderColor: Colors.blue }]}>
                  <Text style={[{ color: Colors.steel, fontWeight: "700", fontSize: 13 }, roomId === r.id && { color: Colors.white }]}>{r.name}</Text>
                  <Text style={[{ color: Colors.dim, fontSize: 10 }, roomId === r.id && { color: Colors.white + "AA" }]}>{pct}% full</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Product type */}
          <Text style={s.label}>Product</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {PRODUCTS.map(p => (
                <Pressable key={p} onPress={() => setProduct(p)}
                  style={[s.chip, product === p && { backgroundColor: Colors.blue, borderColor: Colors.blue }]}>
                  <Text style={[s.chipText, product === p && { color: Colors.white }]}>{p}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Field label="Tonnes" value={tonnes} onChangeText={setTonnes} keyboardType="decimal-pad" placeholder="e.g. 150" />
          <Field label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Batch number, quality notes..." />

          <BlueButton label={`Log ${type === "in" ? "IN" : "OUT"} — ${tonnes || "0"}t ${product}`} onPress={submit} loading={saving} disabled={!clientId || !roomId || !tonnes} />
        </Card>
      </ScrollView>
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  typeBtn: { flex: 1, borderWidth: 2, borderColor: Colors.border, borderRadius: Radius.md, paddingVertical: 14, alignItems: "center" },
  typeBtnText: { color: Colors.dim, fontWeight: "800", fontSize: 14, textTransform: "uppercase", letterSpacing: 1 },
  label: { color: Colors.dim, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  chip: { backgroundColor: Colors.elevated, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { color: Colors.dim, fontSize: 12, fontWeight: "700" },
  roomChip: { backgroundColor: Colors.elevated, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, alignItems: "center", minWidth: 80 },
});
