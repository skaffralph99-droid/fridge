import React from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, BlueButton, GhostButton, ScreenBackground, ScreenTitle } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <ScreenBackground>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40 }}>
        <ScreenTitle>Profile</ScreenTitle>

        <Card style={{ alignItems: "center", paddingVertical: Spacing.xl }}>
          <View style={s.avatar}>
            <Text style={{ fontSize: 32, color: Colors.blue }}>❄️</Text>
          </View>
          <Text style={{ color: Colors.steel, fontSize: 18, fontWeight: "800", marginTop: Spacing.md }}>
            {(user?.user_metadata as any)?.full_name ?? "Admin"}
          </Text>
          <Text style={{ color: Colors.dim, fontSize: 13, marginTop: 4 }}>{user?.email}</Text>
        </Card>

        <Card style={{ marginTop: Spacing.lg }}>
          <Text style={s.heading}>Quick Links</Text>
          <GhostButton label="📋 View Invoices" onPress={() => router.push("/invoices")} style={{ marginBottom: Spacing.sm }} />
          <GhostButton label="📊 Export Data" onPress={() => Alert.alert("Coming Soon", "Export to Excel coming in next update.")} />
        </Card>

        <Card style={{ marginTop: Spacing.lg }}>
          <Text style={s.heading}>Account</Text>
          <Text style={{ color: Colors.dim, fontSize: 13 }}>User ID: {user?.id?.slice(0, 12)}...</Text>
          <Text style={{ color: Colors.dim, fontSize: 13, marginTop: 4 }}>Created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</Text>
        </Card>

        <View style={{ marginTop: Spacing.xl }}>
          <BlueButton label="Sign Out" onPress={handleSignOut} style={{ backgroundColor: Colors.red }} />
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.elevated, borderWidth: 2, borderColor: Colors.blue, alignItems: "center", justifyContent: "center" },
  heading: { color: Colors.dim, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: Spacing.md },
});
