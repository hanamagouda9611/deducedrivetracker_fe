// HomeScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StatusBar,
  TouchableOpacity,
  Image,
  Modal,
  Animated,
  Text,
  Switch,
  Platform,
  PermissionsAndroid,
  BackHandler,
} from "react-native";
// import MapViewComponent from "../components/MapViewComponent";
import MapComponent from "../components/MapComponent";
import DriveHistoryList from "../components/DriveHistoryList";
import PlotModal from "../components/PlotModal";
import ToastComponent from "../components/ToastComponent";
import useToast from "../utils/useToast";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions, useNavigation } from "@react-navigation/native";
// import { calculateDistance } from "../utils/distance";
import Geolocation from "@react-native-community/geolocation";
import axios from "axios";
import styles from "../styles/HomeScreen.styles";

const API_BASE = "https://deduce-drive-tracker-be.onrender.com";

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();

  /** Toast */
  const { toast, showToast, fadeAnim } = useToast();

  /** THEME */
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme = isDarkMode
    ? {
        background: "#121212",
        card: "#1E1E1E",
        text: "#FFFFFF",
        header: "#1F1F1F",
        footer: "#1F1F1F",
        icon: "#FFFFFF",
        buttonStart: "#3BA55D",
        buttonStop: "#D9534F",
        border: "rgba(255,255,255,0.15)",
      }
    : {
        background: "#F4F6FB",
        card: "#FFFFFF",
        text: "#0B1A2B",
        header: "#007AFF",
        footer: "#007AFF",
        icon: "#FFFFFF",
        buttonStart: "#28A745",
        buttonStop: "#DC3545",
        border: "rgba(0,0,0,0.1)",
      };

  /** STATES */
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnim] = useState(() => new Animated.Value(0));
  const [userInfo, setUserInfo] = useState<any>(null);

  const [tracking, setTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const [currentDriveTrack, setCurrentDriveTrack] = useState<any[]>([]);
  const [driveStopped, setDriveStopped] = useState(false);
  const [stopFailed, setStopFailed] = useState(false);

  const [plotModalVisible, setPlotModalVisible] = useState(false);
  const [ploting, _setPloting] = useState(false);
  const [isPlotted, setIsPlotted] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const [todayKm, setTodayKm] = useState("0.0");
  const [totalKm, setTotalKm] = useState("0.0");

  const webRef = useRef<any>(null);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const sessionRef = useRef<number | null>(null);

  /** Send data to Map */
  const postToMap = useCallback(
    (obj: any) => {
      if (webRef.current && isMapReady)
        webRef.current.postMessage(JSON.stringify(obj));
    },
    [isMapReady]
  );

  useEffect(() => {
    if (!isMapReady) return;
    loadAllSessionsOnMap();
    postToMap({
      type: "modeChange",
      payload: { isDarkMode },
    });
  }, [isDarkMode, isMapReady, postToMap]);


  /** ---------------LOAD USER------------------ */
  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await AsyncStorage.getItem("userInfo");
        if (u) {
          setUserInfo(JSON.parse(u));
        } else {
          showToast("Session missing. Login again", "error");
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Login" as never }],
            })
          );
        }
      } catch (err) {
        console.warn(err);
      }
    };
    loadUser();
  }, [navigation, showToast]);

  /** --------------ANDROID BACK BUTTON---------- */
  useEffect(() => {
    const backAction = () => {
      BackHandler.exitApp();
      return true;
    };

    const handler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => handler.remove();
  }, []);

  /** MENU */
  const toggleMenu = () => {
    setMenuVisible((prev) => !prev);
    Animated.timing(menuAnim, {
      toValue: menuVisible ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  /** ----------- MAP READY ---------- */
  const onMapReady = useCallback(() => setIsMapReady(true), []);

  /** -------- DRIVE STATISTICS ---------- */
  const fetchStats = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const resTotal = await axios.get(`${API_BASE}/drive/total-km`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resToday = await axios.get(`${API_BASE}/drive/today-km`, {
        headers: { Authorization: `Bearer ${token}` },
      });

    setTotalKm(Number(resTotal.data.total_km ?? 0).toFixed(2));
    setTodayKm(Number(resToday.data.today_km ?? 0).toFixed(2));
    } catch (err) {
      console.warn("stats error:", err);
    }
  }, []);

  useEffect(() => {
    if (userInfo?.employee_id) fetchStats();
  }, [userInfo, fetchStats]);

  /** --------------- ALL SESSIONS ON MAP -------------- */
  const loadAllSessionsOnMap = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/drive/session/all`);
      const allSessions: any[] = res.data?.sessions || [];

      const allTracks: [number, number][][] = allSessions.map((ses: any) =>
      Array.isArray(ses.points)
        ? ses.points
            .map((p: DrivePoint): [number, number] => {
              const lng = Number(p.longitude ?? p.lng);
              const lat = Number(p.latitude ?? p.lat);
              return [lng, lat];
            })
            .filter(([lng, lat]: [number, number]) => !isNaN(lng) && !isNaN(lat))
        : []
    );
      postToMap({
        type: "displayAllTracks",
        payload: allTracks,
      });

    } catch (err) {
      console.warn("All sessions fetch error:", err);
      showToast("Unable to load all sessions", "error");
    }
  }, [postToMap, showToast]);


/** ----------- SELECT SESSIONS ON MAP -------------- */
  interface DrivePoint {
    latitude?: number | string;
    longitude?: number | string;
    lat?: number | string;
    lng?: number | string;
    [key: string]: any;
  }

const handleSelectSession = useCallback(
  async (sessionId: number, mode?: string) => {
    try {
      const res = await axios.get(`${API_BASE}/drive/session/all`);
      const allSessions: any[] = res.data?.sessions || [];

      if (mode === "clear") {
        postToMap({ type: "clear" });
        showToast("Cleared", "info");
        return;
      }

      const selected = allSessions.find((s) => s.id === sessionId);

      if (!selected) {
        showToast("Session not found", "error");
        return;
      }

      const points: DrivePoint[] = selected.points || [];
      const norm = points
      .map((p: DrivePoint) => {
        const lng = Number(p.longitude ?? p.lng);
        const lat = Number(p.latitude ?? p.lat);

        if (isNaN(lng) || isNaN(lat)) return null;

        return [lng, lat] as [number, number];
      })
      .filter((c): c is [number, number] => Array.isArray(c));


      if (norm.length === 0) {
        showToast("No track points found", "info");
        return;
      }

      postToMap({ type: "setHistoryMode" });

      postToMap({
        type: "displayTrackAndFit",
        payload: norm,
      });

    } catch (err) {
      console.warn("Session fetch error:", err);
      showToast("Unable to fetch sessions", "error");
    }
  },
  [postToMap, showToast]
);


/** -----------LOCATION PERMISSION--------------- */
  const requestLocationPermission = useCallback(async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }, []);


/** --------------START TRACKING-------------- */
  const startTracking = useCallback(async () => {
    if (tracking) return;

    const ok = await requestLocationPermission();
    if (!ok) {
      showToast("Location permission denied", "error");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("accessToken");
      const startRes = await axios.post(
        `${API_BASE}/drive/start`,
        {
          employeeId: userInfo?.employee_id,
          employeeName: userInfo?.employee_name,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCurrentSessionId(startRes.data.session_id);
      sessionRef.current = startRes.data.session_id;
    } catch {
      return showToast("Error starting drive", "error");
    }

    setCurrentDriveTrack([]);
    setTracking(true);
    setDriveStopped(false); 
    setLogoutModalVisible(false);
    setIsPlotted(false);

    showToast("Drive started", "success");

    Geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: Date.now(),
        };
        setCurrentDriveTrack([loc]);
        setTimeout(() => {
        postToMap({
          type: "startLive",
          payload: { startLocation: [loc.lat, loc.lng] },
          });
        }, 300);
      },
      () => showToast("GPS error", "error"),
      { enableHighAccuracy: true }
    );

    watchIdRef.current = Geolocation.watchPosition(
      async (pos) => {
        setLogoutModalVisible(false);
        const p = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: Date.now(),
        };
        setCurrentDriveTrack((prev) => [...prev, p]);
        postToMap({ type: "coord", payload: p });

        if (sessionRef.current) {
          try {
            const token = await AsyncStorage.getItem("accessToken");

            await axios.post(
              `${API_BASE}/drive/add-point?session_id=${sessionRef.current}`,
              {
                latitude: p.lat,
                longitude: p.lng,
                speed: pos.coords.speed ?? 0,
                heading: pos.coords.heading ?? 0,
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
          } catch (err) {
            if (axios.isAxiosError(err)) {
              console.log("Add point failed:", err.response?.data);
            } else {
              console.log("Add point failed (unknown error):", err);
            }
          }
        }
      },
      () => showToast("GPS error", "error"),
      { enableHighAccuracy: true, distanceFilter: 1 }
    );
  }, [postToMap, requestLocationPermission, tracking, showToast, userInfo, currentSessionId]);


  /** --------------------STOP TRACKING-----------------*/
  const stopTracking = useCallback(async () => {
    if (watchIdRef.current != null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (!currentSessionId) {
      showToast("Session missing", "error");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("accessToken");

      await axios.post(
        `${API_BASE}/drive/stop?session_id=${currentSessionId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Stop success
      setTracking(false);
      setDriveStopped(true);
      showToast("Drive stopped", "info");
    } catch (err) {
      setTracking(true);
      setDriveStopped(false);
      showToast("Stop failed, try again", "error");
    }
  }, [currentSessionId, showToast]);



  /** ----------------🛰️ PLOT DRIVE (show ALL sessions in grey)------------------ */
    const handlePlot = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        showToast("Session expired. Login again.", "error");
        return;
      }

      const dateStr = new Date().toISOString().split("T")[0];

      const res = await axios.get(`${API_BASE}/drive/by-date`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { date: dateStr },
      });

      const sessions = Array.isArray(res.data?.sessions) ? res.data.sessions : [];

      const todayTracks: [number, number][][] = sessions.map((ses: any) =>
        Array.isArray(ses.points)
          ? ses.points
              .map((p: any) => [
                Number(p.longitude ?? p.lng),
                Number(p.latitude ?? p.lat),
              ])
              .filter(([lng, lat]: [number, number]) => !isNaN(lng) && !isNaN(lat))
          : []
      );

      // --------------SEND TO MAP------------
      postToMap({
        type: "displayTodayTrack",
        payload: todayTracks,
      });

      showToast("Today's drive displayed", "success");

      setPlotModalVisible(false);
      setDriveStopped(false);
      setTracking(false);
      setStopFailed(false);
      setCurrentDriveTrack([]);
      setCurrentSessionId(null);
      setIsPlotted(true);

    } catch (err) {
      console.log("Plot error:", err);
      showToast("Failed to plot today's drive", "error");
    }
  }, [postToMap, showToast]);



  /**--------------LOGOUT----------------*/
  const handleLogout = async () => {
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("userInfo");
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Login" as never }],
      })
    );
  };

  /** -------------MAP MESSAGE------------- */
  const onWebMessage = useCallback((event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "mapReady") setIsMapReady(true);
    } catch {}
  }, []);

  const menuTranslateY = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-250, 0],
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.header, borderBottomColor: theme.border },
        ]}
      >
        <TouchableOpacity onPress={toggleMenu}>
          <Image
            source={{
              uri: menuVisible
                ? "https://img.icons8.com/ios-filled/50/ffffff/delete-sign.png"
                : "https://img.icons8.com/ios-filled/50/ffffff/menu--v1.png",
            }}
            style={[styles.icon, { tintColor: theme.icon }]}
          />
        </TouchableOpacity>

        <View style={styles.logoUserContainer}>
          <Image
            source={require("../assets/CompanyLogo.png")}
            style={styles.logo}
          />
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.icon }]}>
              {userInfo?.employee_name || "User"}
            </Text>
            <Text style={[styles.userId, { color: theme.icon }]}>
              {userInfo?.employee_id || "--"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {
          if (tracking) {
            showToast("Please stop the drive first", "error");
            return;
          }
          if (driveStopped && !isPlotted) {
            showToast("Please plot the drive first", "error");
            return;
          }
          if (!isPlotted) {
            showToast("Please plot the drive first", "error");
            return;
          }
          setLogoutModalVisible(true);
        }}
        >
        <Image
          source={{
            uri: "https://img.icons8.com/ios-filled/50/ffffff/logout-rounded.png",
          }}
          style={[styles.icon, { tintColor: theme.icon }]}
        />
      </TouchableOpacity>

      </View>

      {/* MENU */}
      {menuVisible && (
        <Animated.View
          style={{
            position: "absolute",
            top: 90,
            left: 10,
            right: 10,
            backgroundColor: theme.card,
            padding: 10,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.border,
            zIndex: 90,
            transform: [{ translateY: menuTranslateY }],
          }}
        >
          <Text style={{ fontWeight: "700", color: theme.text }}>
            Drive Statistics
          </Text>
          <Text style={{ color: theme.text }}>Today: {todayKm} km</Text>
          <Text style={{ color: theme.text }}>Total: {totalKm} km</Text>

          <View style={{height: 1,backgroundColor: "#ccc",marginVertical: 8,}}/>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 12,
            }}
          >
            <Text style={{ color: theme.text }}>Dark Mode</Text>
            <Switch value={isDarkMode} onValueChange={setIsDarkMode} />
          </View>

          <View style={{height: 1,backgroundColor: "#ccc",marginVertical: 8,}}/>
          <DriveHistoryList
            apiBase={API_BASE}
            show={menuVisible}
            onSelectSession={(id, mode) => {
              setMenuVisible(false);       
              handleSelectSession(id, mode);
            }}

            showToast={(m, t) => showToast(m, t)}
          />
        </Animated.View>
      )}

      {/* MAP */}
      <View style={{ flex: 1 }}>
        <MapComponent
          refForward={webRef}
          onMapReady={onMapReady}
          onMessage={onWebMessage}
        />
      </View>

      {/* FOOTER */}
      <View style={[styles.footer, { backgroundColor: theme.footer }]}>
      {driveStopped && !stopFailed ? (
        <TouchableOpacity
          onPress={() => setPlotModalVisible(true)}
          style={[styles.startButton, { backgroundColor: theme.buttonStart }]}
        >
          <Text style={[styles.buttonText, { color: "#fff" }]}>📤 Plot Drive</Text>
        </TouchableOpacity>
      ) : (
        <>
          <TouchableOpacity
            onPress={stopTracking}
            disabled={!tracking}
            style={[styles.stopButton, { backgroundColor: theme.buttonStop }]}
          >
            <Text style={[styles.buttonText, { color: "#fff" }]}>⏹ Stop</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={startTracking}
            disabled={tracking}
            style={[styles.startButton, { backgroundColor: theme.buttonStart }]}
          >
            <Text style={[styles.buttonText, { color: "#fff" }]}>
              {tracking ? "Tracking..." : "▶ Start"}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>


      {/* TOAST */}
      <ToastComponent toast={toast} fadeAnim={fadeAnim} />

      {/* UPLOAD MODAL */}
      <PlotModal
        visible={plotModalVisible}
        ploting={ploting}
        theme={{ background: theme.card, text: theme.text }}
        onClose={() => setPlotModalVisible(false)}
        onPlot={handlePlot}
      />

      {/* LOGOUT MODAL */}
      <Modal visible={logoutModalVisible} transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "#00000080",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: theme.card,
              padding: 20,
              borderRadius: 12,
              width: "75%",
            }}
          >
            <Text
              style={{ fontWeight: "700", fontSize: 18, color: theme.text }}
            >
              Confirm Logout
            </Text>
            <Text style={{ marginTop: 10, color: theme.text }}>
              Are you sure?
            </Text>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                marginTop: 20,
              }}
            >
              <TouchableOpacity
                onPress={() => setLogoutModalVisible(false)}
                style={{
                  padding: 10,
                  backgroundColor: "#6c757d",
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "#fff" }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogout}
                style={{
                  padding: 10,
                  backgroundColor: "#dc3545",
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "#fff" }}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default HomeScreen;
