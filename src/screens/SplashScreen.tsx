import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  Animated,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";

const { width } = Dimensions.get("window");

type SplashNav = NativeStackNavigationProp<RootStackParamList, "Splash">;

const SplashScreen = () => {
  const navigation = useNavigation<SplashNav>();

  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Start animations in parallel
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      }),

      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 1400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Redirect after animation completes
      setTimeout(() => {
        navigation.replace("Login");
      }, 800);
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo with zoom effect */}
      <Animated.Image
        source={require("../assets/CompanyLogo.png")}
        style={[
          styles.logo,
          { transform: [{ scale: scaleAnim }] },
        ]}
      />

      {/* Text fade-in + slide-up */}
      <Animated.Text
        style={[
          styles.title,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateAnim }],
          },
        ]}
      >
        Welcome to Deduce Drive Tracker
      </Animated.Text>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: width * 0.45,
    height: width * 0.45,
    resizeMode: "contain",
  },
  title: {
    marginTop: 20,
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 0.5,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    width: "80%", 
  },
});
