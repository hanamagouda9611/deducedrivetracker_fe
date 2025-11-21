// components/useToast.ts
import { useCallback, useRef, useState } from "react";
import { Animated } from "react-native";

export type ToastObj = { message: string; type: 'success'|'error'|'info'; key: number } | null;

export default function useToast() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [toast, setToast] = useState<ToastObj>(null);

  const showToast = useCallback((message: string, type: 'success'|'error'|'info'='info') => {
    setToast({ message, type, key: Date.now() });
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setToast(null));
      }, 2800);
    });
  }, [fadeAnim]);

  return { toast, showToast, fadeAnim };
}
