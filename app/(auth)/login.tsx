import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Snowflake } from "lucide-react-native";
import { Field, BlueButton } from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) { setError("Enter email and password"); return; }
    setLoading(true); setError("");
    const err = await signIn(email, password);
    setLoading(false);
    if (err) setError(err);
  };

  return (
    <LinearGradient colors={[Colors.dark, Colors.bg, "#050D1A"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: "center", marginBottom: Spacing.xl }}>
            <Snowflake color={Colors.cyan} size={64} strokeWidth={1.5} />
            <Text style={s.title}>FRIDGE</Text>
            <Text style={s.subtitle}>Cold Storage Manager</Text>
          </View>
          <View style={s.card}>
            <View style={[s.stripe, { backgroundColor: Colors.blue }]} />
            <View style={{ padding: Spacing.xl }}>
              <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="admin@fridge.com" />
              <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
              {error ? <Text style={s.err}>{error}</Text> : null}
              <BlueButton label="Sign In" onPress={submit} loading={loading} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: "center", padding: Spacing.xl },
  title: { color: Colors.steel, fontSize: 36, fontWeight: "900", letterSpacing: 6, marginTop: Spacing.lg },
  subtitle: { color: Colors.dim, fontSize: 14, letterSpacing: 2, marginTop: 4 },
  card: { backgroundColor: Colors.card, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" },
  stripe: { height: 4 },
  err: { color: Colors.red, fontSize: 13, marginBottom: Spacing.md, fontWeight: "600" },
});
