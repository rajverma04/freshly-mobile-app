import { useAuth } from "@clerk/expo";
import { useCallback } from "react";

const base = process.env.EXPO_PUBLIC_API_URL;

export function useApi() {
  const { getToken } = useAuth();
  return useCallback(
    async <T>(path: string, options: RequestInit = {}): Promise<T> => {
      if (!base) throw new Error("Set EXPO_PUBLIC_API_URL in frontend/.env.");
      const token = await getToken();
      const response = await fetch(`${base}${path}`, {
        ...options,
        signal: AbortSignal.timeout(15000),
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });

      const text = await response.text();
      let data: unknown = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          // Non-JSON response (e.g. plain text 429, 502, proxy error)
          if (!response.ok) {
            throw new Error(
              text || `Request failed with status ${response.status}`,
            );
          }
          throw new Error("Invalid server response format.");
        }
      }

      if (!response.ok) {
        const errorObj = data as { message?: string; error?: string } | null;
        throw new Error(
          errorObj?.message ||
            errorObj?.error ||
            text ||
            `Request failed with status ${response.status}`,
        );
      }

      return data as T;
    },
    [getToken],
  );
}
