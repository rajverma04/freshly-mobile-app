import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export async function setStorageItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.warn(`[storage] Could not save "${key}":`, error);
  }
}

export async function getStorageItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    }
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.warn(`[storage] Could not read "${key}":`, error);
    return null;
  }
}

export async function removeStorageItem(key: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.warn(`[storage] Could not remove "${key}":`, error);
  }
}

