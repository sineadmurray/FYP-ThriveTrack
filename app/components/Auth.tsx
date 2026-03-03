import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../theme/ThemeContext";
import type { AppTheme } from "../../theme/themes";

type Mode = "login" | "signup";

export default function Auth() {
  const { theme } = useTheme();
  const s = styles(theme);

  const [mode, setMode] = useState<Mode>("login");
  const isSignup = mode === "signup";

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const cardTitle = useMemo(
    () => (isSignup ? "Create your account" : "Welcome back"),
    [isSignup]
  );

  async function signInWithEmail() {
    if (!email || !password) {
      Alert.alert("Missing details", "Please enter your email and password.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) Alert.alert("Login failed", error.message);
  }

  async function signUpWithEmail() {
    const name = displayName.trim();

    if (!name) {
      Alert.alert("Display name required", "Please enter the name you want to use in the app.");
      return;
    }
    if (!email || !password) {
      Alert.alert("Missing details", "Please enter your email and password.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Password too short", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });

    if (error) {
      setLoading(false);
      Alert.alert("Sign up failed", error.message);
      return;
    }

    const { error: updateErr } = await supabase.auth.updateUser({
      data: { display_name: name },
    });

    setLoading(false);

    if (updateErr) {
      Alert.alert(
        "Account created",
        "Your account was created, but we couldn't save your display name. You can set it in Settings."
      );
    }
  }

  async function forgotPassword() {
    if (!email) {
      Alert.alert("Enter your email first", "Type your email above and then tap “Forgot Password?”.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);

    if (error) Alert.alert("Reset failed", error.message);
    else Alert.alert("Email sent", "Check your inbox for a password reset link.");
  }

  const primaryAction = isSignup ? signUpWithEmail : signInWithEmail;

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={s.container}>
        {/* Logo */}
        <View style={s.logoWrap}>
          <View style={s.logoTile}>
            <Image
              source={require("../../assets/images/ThriveTrack Logo.png")}
              style={s.logoImage}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Card */}
        <View style={s.card}>
          {/* Segmented toggle */}
          <View style={s.segment}>
            <Pressable
              onPress={() => setMode("login")}
              style={[s.segmentBtn, mode === "login" && s.segmentBtnActive]}
            >
              <Text style={[s.segmentText, mode === "login" && s.segmentTextActive]}>
                Log In
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setMode("signup")}
              style={[s.segmentBtn, mode === "signup" && s.segmentBtnActive]}
            >
              <Text style={[s.segmentText, mode === "signup" && s.segmentTextActive]}>
                Sign Up
              </Text>
            </Pressable>
          </View>

          <Text style={s.cardTitle}>{cardTitle}</Text>

          {/* Display name (signup only) */}
          {isSignup && (
            <View style={s.field}>
              <Text style={s.label}>Display Name</Text>
              <View style={s.inputRow}>
                <Ionicons name="person-outline" size={18} color={theme.muted} style={s.icon} />
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="What should we call you?"
                  placeholderTextColor={theme.grow.placeholder}
                  autoCapitalize="words"
                  style={s.input}
                />
              </View>
            </View>
          )}

          {/* Email */}
          <View style={s.field}>
            <Text style={s.label}>Email</Text>
            <View style={s.inputRow}>
              <Ionicons name="mail-outline" size={18} color={theme.muted} style={s.icon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                placeholderTextColor={theme.grow.placeholder}
                autoCapitalize="none"
                keyboardType="email-address"
                style={s.input}
              />
            </View>
          </View>

          {/* Password */}
          <View style={s.field}>
            <Text style={s.label}>Password</Text>
            <View style={s.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={theme.muted} style={s.icon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={theme.grow.placeholder}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={s.input}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} style={s.eyeBtn}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={theme.muted}
                />
              </Pressable>
            </View>

            {!isSignup && (
              <Pressable onPress={forgotPassword} style={s.forgot}>
                <Text style={s.forgotText}>Forgot Password?</Text>
              </Pressable>
            )}
          </View>

          {/* Primary button */}
          <Pressable
            onPress={primaryAction}
            disabled={loading}
            style={[s.primaryBtn, loading && s.primaryBtnDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.primaryBtnText}>{isSignup ? "Sign Up" : "Log In"}</Text>
            )}
          </Pressable>

          <Text style={s.footerText}>
            By continuing, you agree to our <Text style={s.link}>Terms of Service</Text> and{" "}
            <Text style={s.link}>Privacy Policy</Text>.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },
    container: {
      flex: 1,
      paddingHorizontal: 18,
      paddingTop: Platform.OS === "android" ? 40 : 60,
      paddingBottom: 24,
      justifyContent: "center",
    },

    logoWrap: { alignItems: "center", marginBottom: 14 },
    logoTile: {
      width: 96,
      height: 96,
      borderRadius: 18,
      overflow: "hidden",
      backgroundColor: theme.card,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    logoImage: { width: "100%", height: "100%" },

    card: {
      backgroundColor: theme.card,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },

    segment: {
      flexDirection: "row",
      backgroundColor: theme.mode === "dark" ? "#1f1f28" : "#F7F7F7",
      borderRadius: 14,
      padding: 4,
      marginBottom: 12,
    },
    segmentBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: "center",
    },
    segmentBtnActive: { backgroundColor: theme.accent },
    segmentText: { fontWeight: "700", color: theme.subtleText },
    segmentTextActive: { color: "#fff" },

    cardTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 10,
      textAlign: "center",
    },

    field: { marginBottom: 12 },
    label: { fontSize: 12, fontWeight: "700", color: theme.subtleText, marginBottom: 6 },

    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      paddingHorizontal: 12,
      backgroundColor: theme.mode === "dark" ? "#1f1f28" : "#fff",
    },
    icon: { marginRight: 8 },
    input: { flex: 1, paddingVertical: 12, fontSize: 15, color: theme.text },
    eyeBtn: { paddingLeft: 8, paddingVertical: 10 },

    forgot: { alignSelf: "flex-end", marginTop: 8 },
    forgotText: { color: theme.accent, fontWeight: "700", fontSize: 12 },

    primaryBtn: {
      marginTop: 6,
      backgroundColor: theme.accent,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
    },
    primaryBtnDisabled: { opacity: 0.7 },
    primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },

    footerText: {
      marginTop: 12,
      fontSize: 11,
      color: theme.subtleText,
      textAlign: "center",
      lineHeight: 16,
    },
    link: { color: theme.accent, fontWeight: "800" },
  });