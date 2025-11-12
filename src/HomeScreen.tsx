import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StatusBar,
  TouchableOpacity,
  Switch,
  FlatList,
  Platform,
  Modal,
  Animated,
  Easing,
  PermissionsAndroid,
} from "react-native";
import { WebView } from "react-native-webview";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import styles from "./HomeScreen.styles";
import MapHTML from "./MapHTML";
import Geolocation from "@react-native-community/geolocation";

type LatLng = { lat: number; lng: number };
type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const [tracking, setTracking] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [driveData, setDriveData] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [_currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const webViewRef = useRef<WebView | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const API_URL = "https://jsonplaceholder.typicode.com/users";

  const postMessageToMap = useCallback((obj: any) => {
    if (webViewRef.current) webViewRef.current.postMessage(JSON.stringify(obj));
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<LatLng | null> => {
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setCurrentLocation(loc);
          resolve(loc);
        },
        (error) => {
          console.error("Error getting location:", error);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, []);

  const requestLocationPermission = useCallback(async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "App needs access to your location for tracking.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }, []);

  const initMap = useCallback(async () => {
    const loc = await getCurrentLocation();
    if (!loc) return;
    postMessageToMap({
      type: "init",
      payload: {
        currentLocation: loc,
        buffRadius: 100,
        theme: isDarkMode ? "dark" : "light",
      },
    });
  }, [getCurrentLocation, isDarkMode, postMessageToMap]);

  const sendCoordinate = useCallback(
    (c: LatLng) => {
      postMessageToMap({
        type: "coord",
        payload: { lat: c.lat, lng: c.lng, timestamp: Date.now() },
      });
    },
    [postMessageToMap]
  );

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    postMessageToMap({ type: "stopLive" });
    setTracking(false);
  }, [postMessageToMap]);

  const startTracking = useCallback(async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    setTracking(true);
    postMessageToMap({ type: "startLive" });

    const loc = await getCurrentLocation();
    if (loc) sendCoordinate(loc);

    watchIdRef.current = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        sendCoordinate({ lat: latitude, lng: longitude });
      },
      (error) => console.error("Location error:", error),
      { enableHighAccuracy: true, distanceFilter: 1, interval: 1000, fastestInterval: 500 }
    );
  }, [getCurrentLocation, postMessageToMap, requestLocationPermission, sendCoordinate]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      postMessageToMap({ type: "modeChange", payload: { isDarkMode: newMode } });
      return newMode;
    });
  }, [postMessageToMap]);

  const toggleMenu = () => setMenuVisible((s) => !s);

  const showLogoutModal = () => {
    setLogoutModalVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  };

  const handleLogout = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start(() => {
      setLogoutModalVisible(false);
      if (tracking) stopTracking();

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Login" }],
        })
      );
    });
  }, [navigation, stopTracking, tracking, fadeAnim]);

  useEffect(() => {
    const fetchDriveDetails = async () => {
      try {
        const res = await axios.get(API_URL);
        const data = res.data.map((item: any, i: number) => ({
          id: item.id,
          date: new Date(2025, 10, i + 1).toDateString(),
          distance: (Math.random() * 150).toFixed(1),
          avgSpeed: (40 + Math.random() * 30).toFixed(1),
        }));
        setDriveData(data);
      } catch (error) {
        console.error("Error fetching drive details:", error);
      }
    };
    fetchDriveDetails();
    initMap();
    return () => stopTracking();
  }, [initMap, stopTracking]);

  const theme = isDarkMode
    ? { background: "#111217", text: "#fff", header: "#1b1f23", footer: "#1b1f23", glassBorder: "rgba(255,255,255,0.08)" }
    : { background: "#f4f6fb", text: "#0b1a2b", header: "#007aff", footer: "#007aff", glassBorder: "rgba(0,0,0,0.06)" };

  const onWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.type === "mapReady") initMap();
    } catch {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.header} />

      {/* HEADER */}
      <View
          style={[
            styles.header,
            {
              backgroundColor: theme.header,
              paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 20 : 40,
              paddingHorizontal: 10,
              height: Platform.OS === "android" ? 100 : 140, 
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            },
          ]}
        >
        <View>
          <TouchableOpacity onPress={toggleMenu}>
            <Image
              source={{
                uri: menuVisible
                  ? "https://img.icons8.com/ios-filled/50/ffffff/delete-sign.png"
                  : "https://img.icons8.com/ios-filled/50/ffffff/menu--v1.png",
              }}
              style={styles.icon}
            />
          </TouchableOpacity>

          {menuVisible && (
            <View style={[styles.popupMenu, { backgroundColor: isDarkMode ? "#1b1f23" : "#fff", borderColor: theme.glassBorder, borderWidth: 1 }]}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>Menu</Text>

              {/* Dark Mode */}
              <View style={[styles.menuItem, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                <Text style={[styles.menuText, { color: theme.text }]}>Dark Mode</Text>
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleDarkMode}
                  thumbColor={isDarkMode ? "#007AFF" : "#f4f3f4"}
                  trackColor={{ false: "#767577", true: "#81b0ff" }}
                />
              </View>

              {/* Calendar */}
              <View style={[styles.menuItem, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                <Text style={[styles.menuText, { color: theme.text }]}>Calendar</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                  <Image
                    source={{
                      uri: isDarkMode
                        ? "https://img.icons8.com/ios-filled/50/ffffff/calendar.png"
                        : "https://img.icons8.com/ios-filled/50/000000/calendar.png",
                    }}
                    style={{ width: 24, height: 24 }}
                  />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    themeVariant={isDarkMode ? "dark" : "light"}
                    onChange={(event, date) => {
                      setShowDatePicker(false);
                      if (date) setSelectedDate(date);
                    }}
                  />
                )}
              </View>

              {/* Drive Details */}
              <View style={styles.menuItem}>
                <Text style={[styles.menuText, { color: theme.text }]}>Drive Details</Text>
                <FlatList
                  data={driveData}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <Text style={[styles.menuSubText, { color: theme.text, opacity: 0.85, paddingVertical: 4 }]}>
                      {item.date} — {item.distance} km @ {item.avgSpeed} km/h
                    </Text>
                  )}
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.logoUserContainer}>
          <Image source={require("../assets/CompanyLogo.png")} style={styles.logo} />
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: "#fff" }]}>John Doe</Text>
            <Text style={[styles.userId, { color: "#d0e6ff" }]}>ID: 12345</Text>
          </View>
        </View>

        <TouchableOpacity onPress={showLogoutModal}>
          <Image source={{ uri: "https://img.icons8.com/ios-filled/50/ffffff/logout-rounded.png" }} style={styles.icon} />
        </TouchableOpacity>
      </View>

      {/* MAP */}
      <View style={{ flex: 1, width: "100%" }}>
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html: MapHTML }}
          style={{ flex: 1, backgroundColor: "transparent" }}
          onMessage={onWebViewMessage}
          onLoadEnd={onWebViewMessage}
          javaScriptEnabled
          domStorageEnabled
          geolocationEnabled 
        />
      </View>

      {/* FOOTER */}
      <View style={[styles.footer, { backgroundColor: theme.footer }]}>
        <TouchableOpacity
          style={[styles.stopButton, { backgroundColor: !tracking ? "#6c757d" : "#dc3545" }]}
          onPress={stopTracking}
          disabled={!tracking}
        >
          <Text style={styles.buttonText}>Stop</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: tracking ? "#6c757d" : "#28a745" }]}
          onPress={startTracking}
          disabled={tracking}
        >
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
      </View>

      {/* LOGOUT MODAL */}
      <Modal visible={logoutModalVisible} transparent animationType="fade">
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "#00000080",
            alignItems: "center",
            justifyContent: "center",
            opacity: fadeAnim,
          }}
        >
          <View
            style={{
              backgroundColor: isDarkMode ? "#1b1f23" : "#fff",
              padding: 25,
              borderRadius: 16,
              width: "80%",
              shadowColor: "#000",
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 6,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: theme.text,
                marginBottom: 15,
                textAlign: "center",
              }}
            >
              Confirm Logout
            </Text>
            <Text style={{ color: theme.text, textAlign: "center", marginBottom: 25 }}>
              Are you sure you want to logout?
            </Text>

            <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
              <TouchableOpacity
                style={{
                  backgroundColor: "#6c757d",
                  paddingVertical: 10,
                  paddingHorizontal: 25,
                  borderRadius: 10,
                }}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: "#dc3545",
                  paddingVertical: 10,
                  paddingHorizontal: 25,
                  borderRadius: 10,
                }}
                onPress={handleLogout}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
};

export default HomeScreen;
