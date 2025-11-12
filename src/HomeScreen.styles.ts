import { StyleSheet, Dimensions } from "react-native";

const { } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  // HEADER
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  icon: { width: 25, height: 25 },

  logoUserContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: { width: 40, height: 40, resizeMode: "contain", marginRight: 10 },
  userInfo: { alignItems: "center" },
  userName: { fontSize: 16, fontWeight: "bold" },
  userId: { fontSize: 12 },

  // FOOTER
  footer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  startButton: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  stopButton: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  // MAP container is flex in screen
  mapContainer: {
    flex: 1,
    width: "100%",
  },

  // MENU
  popupMenu: {
    position: "absolute",
    top: 42,
    left: -15,
    borderRadius: 8,
    padding: 12,
    width: 220,
    zIndex: 999,
  },
  menuTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  menuItem: { marginBottom: 10 },
  menuText: { fontSize: 15, fontWeight: "600" },
  menuSubText: { fontSize: 13 },
});

export default styles;
