import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/theme";

export default function AuthLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }} />;
}
