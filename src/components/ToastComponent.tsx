// components/ToastComponent.tsx
import React from "react";
import { Animated, Text } from "react-native";

const TOAST_STYLE = {
  container: {
    position: 'absolute' as 'absolute',
    top: 100,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    zIndex: 9999,
  },
  text: { color: '#fff', fontWeight: '700' as '700' }
};

export default function ToastComponent({ toast, fadeAnim }: { toast: any; fadeAnim: Animated.Value }) {
  if (!toast) return null;
  const bg = toast.type === 'success' ? '#28a745' : toast.type === 'error' ? '#dc3545' : '#007aff';
  return (
    <Animated.View style={[TOAST_STYLE.container, { backgroundColor: bg, opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0,1], outputRange: [-20,0] }) }] }]}>
      <Text style={TOAST_STYLE.text}>{toast.message}</Text>
    </Animated.View>
  );
}
