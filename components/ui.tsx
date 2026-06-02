import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Colors, Radius, Spacing } from "@/constants/theme";

export function Field({ label, ...props }: { label?: string } & TextInputProps) {
  return (
    <View style={{ marginBottom: Spacing.md }}>
      {label ? <Text style={s.fieldLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={Colors.dim}
        {...props}
        style={[s.input, props.multiline ? { height: 80, textAlignVertical: "top" } : null, props.style]}
      />
    </View>
  );
}

export function Card({ children, style, accent }: { children: React.ReactNode; style?: ViewStyle; accent?: string }) {
  return (
    <View style={[s.card, accent ? { borderLeftWidth: 3, borderLeftColor: accent } : null, style]}>
      {children}
    </View>
  );
}

export function BlueButton({ label, onPress, loading, disabled, style }: { label: string; onPress: () => void; loading?: boolean; disabled?: boolean; style?: ViewStyle }) {
  const d = disabled || loading;
  return (
    <Pressable
      onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress(); }}
      disabled={d}
      style={({ pressed }) => [s.blueBtn, d && { opacity: 0.45 }, pressed && !d && { opacity: 0.85, transform: [{ scale: 0.98 }] }, style]}
    >
      {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={s.blueBtnText}>{label}</Text>}
    </Pressable>
  );
}

export function GhostButton({ label, onPress, style }: { label: string; onPress: () => void; style?: ViewStyle }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.ghostBtn, pressed && { opacity: 0.7 }, style]}>
      <Text style={s.ghostBtnText}>{label}</Text>
    </Pressable>
  );
}

export function ScreenBackground({ children }: { children: React.ReactNode }) {
  return <LinearGradient colors={[Colors.dark, Colors.bg]} style={{ flex: 1 }}>{children}</LinearGradient>;
}

export function ScreenTitle({ children, subtitle }: { children: string; subtitle?: string }) {
  return (
    <View style={{ marginBottom: Spacing.lg }}>
      <Text style={s.screenTitle}>{children}</Text>
      {subtitle ? <Text style={s.screenSub}>{subtitle}</Text> : null}
    </View>
  );
}

export function Loading({ label }: { label?: string }) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
      <ActivityIndicator size="large" color={Colors.blue} />
      {label ? <Text style={{ color: Colors.dim, marginTop: 12, fontSize: 13 }}>{label}</Text> : null}
    </View>
  );
}

export function EmptyState({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={{ alignItems: "center", padding: 40 }}>
      <Text style={{ fontSize: 40, marginBottom: 12 }}>{emoji}</Text>
      <Text style={{ color: Colors.dim, fontSize: 14, textAlign: "center" }}>{text}</Text>
    </View>
  );
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[s.badge, { borderColor: color }]}>
      <Text style={[s.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function FadeInView({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: any }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>{children}</Animated.View>;
}

export function AnimatedCounter({ value, style, prefix = "", suffix = "" }: { value: number; style?: any; prefix?: string; suffix?: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = React.useState(0);
  useEffect(() => {
    const listener = anim.addListener(({ value: v }) => setDisplay(Math.floor(v)));
    Animated.timing(anim, { toValue: value, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => anim.removeListener(listener);
  }, [value]);
  return <Text style={style}>{prefix}{display.toLocaleString()}{suffix}</Text>;
}

const s = StyleSheet.create({
  fieldLabel: { color: Colors.dim, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  input: { backgroundColor: Colors.elevated, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, color: Colors.steel, fontSize: 15 },
  card: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.lg },
  blueBtn: { backgroundColor: Colors.blue, borderRadius: Radius.md, paddingVertical: 14, alignItems: "center" },
  blueBtnText: { color: Colors.white, fontWeight: "800", fontSize: 15, textTransform: "uppercase", letterSpacing: 1 },
  ghostBtn: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingVertical: 12, alignItems: "center" },
  ghostBtnText: { color: Colors.dim, fontWeight: "700", fontSize: 13 },
  screenTitle: { color: Colors.steel, fontSize: 24, fontWeight: "900", textTransform: "uppercase", letterSpacing: 2 },
  screenSub: { color: Colors.dim, fontSize: 13, marginTop: 4 },
  badge: { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start" },
  badgeText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
});
