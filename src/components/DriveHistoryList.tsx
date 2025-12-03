import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* TYPES */
export type DriveSession = {
  id: number;
  start_time?: string;
  end_time?: string;
  total_km?: number;
  meta_data?: any;
};

type Props = {
  apiBase: string;
  show: boolean;
  onSelectSession: (id: number, mode?: string) => void;
  showToast?: (m: string, t?: "info" | "success" | "error") => void;
};

const EmptySessions = () => (
  <Text style={{ color: "#888", textAlign: "center", marginTop: 10, fontSize: 14 }}>
    No sessions available for selected date.
  </Text>
);

const formatTime = (ts?: string) => {
  if (!ts) return "--";

  // Supports both "YYYY-MM-DD HH:MM:SS" and "YYYY-MM-DDTHH:MM:SS"
  const clean = ts.replace("T", " "); // convert T → space

  const parts = clean.split(" ");
  if (parts.length < 2) return "--";

  const timePart = parts[1]; // "HH:MM:SS"
  const [hrStr, minStr] = timePart.split(":");
  let hr = Number(hrStr);
  const min = minStr;

  const ampm = hr >= 12 ? "PM" : "AM";
  if (hr === 0) hr = 12;
  else if (hr > 12) hr -= 12;

  return `${hr}:${min} ${ampm}`;
};


const DriveHistoryItem = ({
  item,
  expanded,
  onExpand,
  onSelectSession,
}: {
  item: DriveSession;
  expanded: boolean;
  onExpand: () => void;
  onSelectSession: (id: number, mode?: string) => void;
}) => {
  const displayLabel = formatTime(item.start_time);

  return (
    <View style={{ marginBottom: 10 }}>
      <TouchableOpacity
        onPress={onExpand}
        style={{
          padding: 12,
          backgroundColor: "#fff",
          borderRadius: 10,
          borderWidth: 1,
          borderColor: expanded ? "#007bff" : "#ddd",
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontWeight: "600", fontSize: 15 }}>{displayLabel}</Text>
          <Text style={{ fontSize: 14 }}>{item.total_km != null ? Number(item.total_km).toFixed(2) : "--"} km</Text>

        </View>
      </TouchableOpacity>

      {expanded && (
        <View
          style={{
            marginTop: 8,
            padding: 10,
            backgroundColor: "#f5f5f5",
            borderRadius: 8,
          }}
        >
          <Text>Start: {formatTime(item.start_time)}</Text>
          <Text>End: {formatTime(item.end_time)}</Text>
          <Text>Distance: {item.total_km != null ? Number(item.total_km).toFixed(2) : "--"} km</Text>


          <View style={{ flexDirection: "row", marginTop: 10, justifyContent: "space-between" }}>
            <TouchableOpacity
              onPress={() => onSelectSession(item.id, "show")}
              style={{ padding: 8, backgroundColor: "#007bff", borderRadius: 8 }}
            >
              <Text style={{ color: "#fff" }}>Show on Map</Text>
            </TouchableOpacity>
          </View>

        </View>
      )}
    </View>
  );
};

/* MAIN COMPONENT */
const DriveHistoryList: React.FC<Props> = ({ apiBase, show, onSelectSession, showToast }) => {
  const [date, setDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());   // ← store temporary selection
  const [showPicker, setShowPicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<DriveSession[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  /** 🔄 FETCH SESSIONS */
  const fetchSessions = useCallback(
    async (selectedDate: Date) => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) {
          showToast?.("Session expired. Login again.", "error");
          setSessions([]);
          return;
        }

        const dateStr = selectedDate.toISOString().split("T")[0];

        const res = await axios.get(`${apiBase}/drive/by-date`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { date: dateStr },
        });

        const sessionsData = Array.isArray(res.data?.sessions)
          ? res.data.sessions
          : [];

        setSessions(sessionsData);
      } catch (err) {
        console.error("Fetch Sessions error:", err);
        showToast?.("Failed to load sessions", "error");
        setSessions([]);
      } finally {
        setLoading(false);
      }
    },
    [apiBase, showToast]
  );

  /** Load when menu opens */
  useEffect(() => {
    if (show) fetchSessions(date);
  }, [show, date, fetchSessions]);

  return (
    <View style={{ padding: 12, width: "100%" }}>
      
      {/* 📅 SELECT DATE + 🔄 REFRESH BUTTON */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <TouchableOpacity
          onPress={() => {
            setTempDate(date);     // keep original date in case of cancel
            setShowPicker(true);
          }}
          style={{
            marginBottom: 12,
            padding: 10,
            backgroundColor: "#fff",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#ddd",
            flex: 1,
          }}
        >
          <Text style={{ fontSize: 14 }}>
            Select Date: {date.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        {/* 🔄 refresh button */}
        <TouchableOpacity
          onPress={() => fetchSessions(date)}
          style={{
            marginLeft: 6,
            marginBottom: 12,
            width: 40,
            height: 40,
            backgroundColor: "#fff",
            borderRadius: 10,
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#ddd",
          }}
        >
          <Image
            source={{ uri: "https://img.icons8.com/ios-glyphs/30/000000/refresh.png" }}
            style={{ width: 20, height: 20 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onSelectSession(-1, "clear")}
          style={{
            marginLeft: 6,
            marginBottom: 12,
            padding: 10,
            backgroundColor: "#dc3545",
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#fff", textAlign: "center" }}>Clear Selection</Text>
        </TouchableOpacity>
      </View>

      {/* 📅 DATE PICKER (OK / CANCEL handling) */}
      {showPicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selected) => {
            if (event.type === "dismissed") {
              // ❌ Cancel → keep original date
              setShowPicker(false);
              return;
            }

            // ✔ User pressed OK
            if (selected) {
              setShowPicker(false);
              setDate(selected);        // update date
              fetchSessions(selected);  // fetch new data
            }
          }}
        />
      )}

      {loading ? (
        <ActivityIndicator size="small" />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => (
            <DriveHistoryItem
              item={item}
              expanded={expandedId === item.id}
              onExpand={() =>
                setExpandedId(expandedId === item.id ? null : item.id)
              }
              onSelectSession={onSelectSession}
            />
          )}
          ListEmptyComponent={<EmptySessions />}
          style={{ maxHeight: 250 }}
        />
      )}
    </View>
  );
};

export default DriveHistoryList;
