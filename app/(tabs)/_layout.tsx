import { Redirect, Tabs } from "expo-router";
import { LayoutDashboard, Warehouse, ArrowLeftRight, Users, User } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/theme";
import { Loading } from "@/components/ui";

export default function TabLayout() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs screenOptions={{
      headerStyle: { backgroundColor: Colors.dark },
      headerTitleStyle: { color: Colors.steel, fontWeight: "800", letterSpacing: 1 },
      headerTintColor: Colors.blue,
      tabBarStyle: { backgroundColor: Colors.dark, borderTopColor: Colors.border, borderTopWidth: 1, height: 85, paddingBottom: 20 },
      tabBarActiveTintColor: Colors.blue,
      tabBarInactiveTintColor: Colors.dim,
      tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
      tabBarHideOnKeyboard: true,
    }}>
      <Tabs.Screen name="index" options={{ title: "Dashboard", tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }} />
      <Tabs.Screen name="rooms" options={{ title: "Rooms", tabBarIcon: ({ color, size }) => <Warehouse color={color} size={size} /> }} />
      <Tabs.Screen name="transactions" options={{ title: "In/Out", tabBarIcon: ({ color, size }) => <ArrowLeftRight color={color} size={size} /> }} />
      <Tabs.Screen name="clients" options={{ title: "Clients", tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
    </Tabs>
  );
}
