import React, { useState } from "react";
import { Alert, ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Card, Field, BlueButton, ScreenBackground } from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { Stack } from "expo-router";

const TYPES = ["farmer", "factory", "distributor", "other"];
const TERMS = ["monthly", "seasonal", "lump_sum"];

export default function NewClient() {
  const router = useRouter();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [type, setType] = useState("farmer");
  const [rate, setRate] = useState("45");
  const [terms, setTerms] = useState("monthly");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) { Alert.alert("Required", "Enter client name"); return; }
    setSaving(true);
    const { error } = await supabase.from("fridge_clients").insert({
      name: name.trim(), phone: phone || null, company: company || null,
      whatsapp: whatsapp || phone || null, client_type: type,
      rate_per_tonne: parseFloat(rate) || 45, payment_terms: terms, notes: notes || null,
    });
    setSaving(false);
    if (error) { Alert.alert("Error", error.message); return; }
    qc.invalidateQueries({ queryKey: ["clients"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    Alert.alert("✅ Client Added", name);
    router.back();
  };

  return (
    <ScreenBackground>
      <Stack.Screen options={{ title: "New Client" }} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}>
        <Card>
          <Field label="Name *" value={name} onChangeText={setName} placeholder="e.g. Ahmad Khalil" />
          <Field label="Company" value={company} onChangeText={setCompany} placeholder="e.g. Bekaa Farms" />
          <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="+961 XX XXX XXX" keyboardType="phone-pad" />
          <Field label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} placeholder="Same as phone if empty" keyboardType="phone-pad" />

          <Text style={s.label}>Client Type</Text>
          <View style={{ flexDirection: "row", gap: 6, marginBottom: Spacing.lg }}>
            {TYPES.map(t => (
              <Pressable key={t} onPress={() => setType(t)}
                style={[s.chip, type === t && { backgroundColor: Colors.blue, borderColor: Colors.blue }]}>
                <Text style={[s.chipText, type === t && { color: Colors.white }]}>
                  {t === "farmer" ? "🌾" : t === "factory" ? "🏭" : t === "distributor" ? "🚚" : "📦"} {t}
                </Text>
              </Pressable>
            ))}
          </View>

          <Field label="Rate ($/tonne)" value={rate} onChangeText={setRate} keyboardType="decimal-pad" />

          <Text style={s.label}>Payment Terms</Text>
          <View style={{ flexDirection: "row", gap: 6, marginBottom: Spacing.lg }}>
            {TERMS.map(t => (
              <Pressable key={t} onPress={() => setTerms(t)}
                style={[s.chip, terms === t && { backgroundColor: Colors.blue, borderColor: Colors.blue }]}>
                <Text style={[s.chipText, terms === t && { color: Colors.white }]}>{t.replace("_", " ")}</Text>
              </Pressable>
            ))}
          </View>

          <Field label="Notes" value={notes} onChangeText={setNotes} placeholder="Special arrangements..." multiline />
          <BlueButton label="Add Client" onPress={submit} loading={saving} disabled={!name.trim()} />
        </Card>
      </ScrollView>
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  label: { color: Colors.dim, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  chip: { backgroundColor: Colors.elevated, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { color: Colors.dim, fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
});
