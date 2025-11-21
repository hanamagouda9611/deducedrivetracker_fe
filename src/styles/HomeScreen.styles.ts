import { StyleSheet, Dimensions } from "react-native";

const { } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  /* ============================
       HEADER (FIXED, CLEAN)
     ============================ */
  header: {
    width: "100%",
    height: 90,                     
    flexDirection: "row",
    alignItems: "flex-end",         
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingBottom: 10,              
    borderBottomWidth: 0.7,
  },

  icon: {
    width: 28,
    height: 28,
  },

  logoUserContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  logo: {
    width: 42,
    height: 42,
    resizeMode: "contain",
    marginRight: 10,
  },

  userInfo: {
    justifyContent: "center",
  },

  userName: {
    fontSize: 16,
    fontWeight: "bold",
  },

  userId: {
    fontSize: 12,
  },

  /* ============================
       FOOTER (FIXED, CLEAN)
     ============================ */
  footer: {
    width: "100%",
    height: 90,                   
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 10,
    borderTopWidth: 0.7,
  },

  startButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 22,
  },

  stopButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 22,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  /* ============================
       MAP CONTAINER
     ============================ */
  mapContainer: {
    flex: 1,
    width: "100%",
  },

  /* ============================
       MENU POPUP
     ============================ */
  popupMenu: {
    position: "absolute",
    top: 110,
    left: 10,
    right: 10,
    borderRadius: 10,
    padding: 12,
    zIndex: 999,
  },

  menuTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },

  menuItem: {
    marginBottom: 10,
  },

  menuText: {
    fontSize: 15,
    fontWeight: "600",
  },

  menuSubText: {
    fontSize: 13,
  },
});

export default styles;
