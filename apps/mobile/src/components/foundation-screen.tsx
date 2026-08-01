import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useReducedMotionPreference } from "../accessibility/use-reduced-motion-preference";
import type { NetworkStatus } from "../network/network-status";
import { getFoundationAccessibility, statusCopy } from "./foundation-state";

export function FoundationScreen({ networkStatus }: Readonly<{ networkStatus: NetworkStatus }>) {
  const reduceMotionEnabled = useReducedMotionPreference();
  const accessibility = getFoundationAccessibility(networkStatus, reduceMotionEnabled);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View
        style={styles.screen}
        accessibilityRole="summary"
        accessibilityHint={accessibility.motionHint}
      >
        <View style={styles.card}>
          <Text style={styles.eyebrow}>FOUNDATION STATUS</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Your vocabulary. Your world.
          </Text>
          <Text style={styles.summary}>
            The mobile experience is being prepared for photos, topics, and personal word
            collections.
          </Text>
          <View
            accessible
            accessibilityLabel={accessibility.statusLabel}
            accessibilityLiveRegion="polite"
            style={styles.status}
          >
            <View style={[styles.dot, networkStatus === "offline" && styles.dotOffline]} />
            <Text style={styles.statusText}>{statusCopy[networkStatus]}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#090b10" },
  screen: { flex: 1, justifyContent: "center", padding: 24 },
  card: {
    gap: 18,
    padding: 28,
    borderWidth: 1,
    borderColor: "#272b36",
    borderRadius: 24,
    backgroundColor: "#10131b",
  },
  eyebrow: { color: "#a9a2ff", fontSize: 12, fontWeight: "700", letterSpacing: 1.5 },
  title: { color: "#f7f8fa", fontSize: 42, fontWeight: "800", letterSpacing: -1.5, lineHeight: 44 },
  summary: { color: "#b9becb", fontSize: 17, lineHeight: 27 },
  status: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#6ee7a8" },
  dotOffline: { backgroundColor: "#f6c86a" },
  statusText: { flex: 1, color: "#d9dce5", fontSize: 16 },
});
