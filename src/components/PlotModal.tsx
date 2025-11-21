// components/PlotModal.tsx
import React, { useRef, useEffect } from "react";
import { Modal, Animated, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";

const PlotModal = ({ visible, onClose, onPlot, ploting, theme }: any) => {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fade, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fade]);

  const close = () => {
    Animated.timing(fade, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: "#00000080",
          alignItems: "center",
          justifyContent: "center",
          opacity: fade,
        }}
      >
        <View
          style={{
            backgroundColor: theme.background,
            padding: 20,
            borderRadius: 12,
            width: "85%",
          }}
        >
          <Text
            style={{
              fontWeight: "700",
              fontSize: 18,
              color: theme.text,
              marginBottom: 8,
            }}
          >
            Plot Drive
          </Text>

          <Text style={{ color: theme.text, marginBottom: 16 }}>
            Plot this drive route on the map?
          </Text>

          <View
            style={{ flexDirection: "row", justifyContent: "space-around" }}
          >
            <TouchableOpacity
              onPress={close}
              disabled={ploting}
              style={{
                backgroundColor: "#6c757d",
                padding: 12,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff" }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onPlot}
              disabled={ploting}
              style={{
                backgroundColor: "#007bff",
                padding: 12,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              {ploting && (
                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
              )}
              <Text style={{ color: "#fff" }}>
                {ploting ? "Processing..." : "Plot"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

export default PlotModal;
