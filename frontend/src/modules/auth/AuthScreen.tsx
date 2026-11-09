import { useState } from "react";
import { useSignIn, useSignUp } from "@clerk/expo";
import { ScrollView, Text } from "react-native";
import { Field } from "../../shared/components/Field";
import { Button } from "../../shared/components/Button";
import { ui } from "../../shared/theme";

export function AuthScreen() {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [verify, setVerify] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setBusy(true);
    setError("");

    try {
      if (mode === "signin") {
        if (!signIn) return;

        const cleanIdentifier = identifier.trim();
        if (!cleanIdentifier) {
          throw new Error("Please enter your email or username.");
        }
        if (!password) {
          throw new Error("Please enter your password.");
        }

        const result = await signIn.password({
          identifier: cleanIdentifier,
          password,
        });
        if (result.error) throw result.error;

        if (signIn.status === "complete") {
          const final = await signIn.finalize();
          if (final.error) throw final.error;
        } else {
          throw new Error(
            "Additional verification is required for this account.",
          );
        }
      } else if (verify) {
        if (!signUp) return;

        // 1. Verify OTP code
        const result = await signUp.verifications.verifyEmailCode({
          code: code.trim(),
        });
        if (result.error) throw result.error;

        // 2. Complete sign-up session
        if (signUp.status === "complete" && signUp.createdSessionId) {
          const final = await signUp.finalize();
          if (final.error) throw final.error;
        } else {
          // If status is not complete yet (or createdSessionId was not attached to future resource),
          // log in immediately with the newly verified credentials
          if (signIn) {
            const loginRes = await signIn.password({
              identifier: email.trim() || username.trim(),
              password,
            });
            if (!loginRes.error && signIn.status === "complete") {
              const final = await signIn.finalize();
              if (final.error) throw final.error;
              return;
            }
          }

          if (signUp.missingFields && signUp.missingFields.length > 0) {
            throw new Error(
              `Please provide required info: ${signUp.missingFields.join(", ")}`,
            );
          }
        }
      } else {
        if (!signUp) return;

        const trimmedName = name.trim();
        const trimmedUsername = username.trim().toLowerCase();
        const trimmedEmail = email.trim();

        if (!trimmedUsername) {
          throw new Error("Username is required to create an account.");
        }
        if (trimmedUsername.length < 3) {
          throw new Error("Username must be at least 3 characters long.");
        }
        if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
          throw new Error(
            "Username can only contain letters, numbers, and underscores.",
          );
        }
        if (!trimmedEmail) {
          throw new Error("Email address is required.");
        }
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters long.");
        }

        const parts = trimmedName ? trimmedName.split(" ") : [];
        const firstName = parts[0] || undefined;
        const lastName = parts.slice(1).join(" ") || undefined;

        // 1. Start sign up with email, username, password, and name
        const result = await signUp.password({
          emailAddress: trimmedEmail,
          password,
          username: trimmedUsername,
          ...(firstName ? { firstName } : {}),
          ...(lastName ? { lastName } : {}),
        });
        if (result.error) throw result.error;

        // 2. Send email verification code
        const sent = await signUp.verifications.sendEmailCode();
        if (sent.error) throw sent.error;

        setVerify(true);
      }
    } catch (e) {
      const clerkErr = e as {
        errors?: { message?: string; longMessage?: string }[];
        longMessage?: string;
        message?: string;
      };
      const message =
        clerkErr.errors?.[0]?.longMessage ||
        clerkErr.errors?.[0]?.message ||
        clerkErr.longMessage ||
        (e instanceof Error ? e.message : "Authentication failed. Please retry.");

      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={ui.content}
    >
      <Text style={ui.title}>
        {verify
          ? "Check your inbox"
          : mode === "signin"
            ? "Welcome back."
            : "Your next favourite awaits."}
      </Text>
      <Text style={ui.muted}>
        {verify
          ? "Enter the verification code sent to your email."
          : "Sign in to place orders and view your history."}
      </Text>
      {verify ? (
        <Field
          label="Verification code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
        />
      ) : (
        <>
          {mode === "signin" ? (
            <Field
              label="Email or username"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              autoComplete="username"
              placeholder="e.g. rajverma or raj@example.com"
            />
          ) : (
            <>
              <Field
                label="Full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                placeholder="e.g. Raj Verma"
              />
              <Field
                label="Username (required)"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="e.g. rajverma21"
              />
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholder="e.g. raj@example.com"
              />
            </>
          )}
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            placeholder={
              mode === "signup" ? "At least 8 characters" : "Your password"
            }
          />
        </>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
      <Button
        title={
          busy
            ? "Please wait…"
            : verify
              ? "Verify email"
              : mode === "signin"
                ? "Sign in"
                : "Create account"
        }
        onPress={() => void submit()}
        disabled={busy}
      />
      <Button
        secondary
        title={
          mode === "signin" ? "New here? Create an account" : "Back to sign in"
        }
        disabled={busy}
        onPress={() => {
          if (mode === "signin") {
            setMode("signup");
          } else {
            if (!identifier && (email || username)) {
              setIdentifier(email || username);
            }
            setMode("signin");
          }
          setVerify(false);
          setError("");
        }}
      />
    </ScrollView>
  );
}
