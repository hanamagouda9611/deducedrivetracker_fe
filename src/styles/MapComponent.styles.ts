import { StyleSheet } from "react-native";

export default StyleSheet.create({

  /* ------------------- MAP STYLE TOGGLE ------------------- */
  toggleContainer: {
    position: "absolute",
    top: 60,
    right: 10,
    alignItems: "flex-end",
    zIndex: 1,
  },

  mainBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },

  mainIcon: {
    width: 26,
    height: 26,
    resizeMode: "contain",
  },

  menuBox: {
    marginTop: 10,
    elevation: 8,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 22,
    borderWidth: 1.5,
  },

  menuActive: {
    backgroundColor: "rgba(255,255,255,1)",
  },

  menuLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
    marginRight: 10,
  },

  menuIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1.5,
  },

  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    resizeMode: "cover",
  },

  /* ------------------- RETAIN BUTTON ------------------- */
  retainWrapper: {
    position: "absolute",
    bottom: 30,
    right: 10,
    zIndex: 999,
  },

  retainButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },

  retainIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },

  /* ------------------- GOOGLE LIVE LOCATION MARKER ------------------- */
  googleMarkerContainer: {
    width: 54,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    overflow: "visible",
  },

  ripple: {
    position: "absolute",
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#4285F4",
    zIndex: 1,
  },

  headingCone: {
    position: "absolute",
    top: -18,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 24,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "rgba(66,133,244,0.65)",
    opacity: 0.95,
    zIndex: 999, 
  },

  googleDotOuter: {
    width: 18,
    height: 18,
    borderRadius: 12,
    backgroundColor: "#4285F4",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#4285F4",
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,  
  },

  googleDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1A73E8",
    zIndex: 6,
  },

  /* ------------------- ZOOM BUTTONS ------------------- */
  zoomContainer: {
    position: "absolute",
    left: 10,
    top: 10,
    alignItems: "center",
    zIndex: 1,
  },

  zoomBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
    borderWidth: 1.2,
  },

  zoomText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
  },
});
