import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";

export default function Index() {
  const { token, user, isLoading } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    if (isLoading) return;
    if (!token) router.replace("/(auth)/login");
    else if (user?.role === "patient") router.replace("/(patient)/(tabs)");
    else if (user?.role === "expert") router.replace("/(expert)/(tabs)");
  }, [token, user, isLoading]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface }} testID="splash-loading">
      <ActivityIndicator color={colors.brand} size="large" />
    </View>
  );
}
