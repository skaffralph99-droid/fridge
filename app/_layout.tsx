import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/context/AuthContext";
import { Colors } from "@/constants/theme";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, gcTime: 300_000, retry: 1, refetchOnWindowFocus: false } },
});

export default function RootLayout() {
  useEffect(() => { SplashScreen.hideAsync(); }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerStyle: { backgroundColor: Colors.dark }, headerTintColor: Colors.blue, headerTitleStyle: { color: Colors.steel, fontWeight: "800" }, contentStyle: { backgroundColor: Colors.bg }, animation: "slide_from_right" }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="room-detail" options={{ title: "Room Details" }} />
            <Stack.Screen name="client-detail" options={{ title: "Client Details" }} />
            <Stack.Screen name="new-transaction" options={{ title: "New Transaction", presentation: "modal", animation: "slide_from_bottom" }} />
            <Stack.Screen name="new-client" options={{ title: "New Client", presentation: "modal", animation: "slide_from_bottom" }} />
            <Stack.Screen name="invoices" options={{ title: "Invoices" }} />
          </Stack>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
