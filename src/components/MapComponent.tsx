// components/MapComponent.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Easing,
} from "react-native";
import MapLibreGL from "@maplibre/maplibre-react-native";
import Geolocation from "@react-native-community/geolocation";
import CompassHeading from "react-native-compass-heading";


MapLibreGL.setAccessToken(null);

// Free MapTiler styles
const MAP_STYLES = {
  osm: "https://api.maptiler.com/maps/streets/style.json?key=I0C6jP3xRJoB6S3NWCnh",
  satellite: "https://api.maptiler.com/maps/hybrid/style.json?key=I0C6jP3xRJoB6S3NWCnh",
  dark: "https://api.maptiler.com/maps/darkmatter/style.json?key=I0C6jP3xRJoB6S3NWCnh",
  terrain: "https://api.maptiler.com/maps/outdoor/style.json?key=I0C6jP3xRJoB6S3NWCnh",
} as const;

const ICONS = {
  osm: "https://img.icons8.com/?size=100&id=rMF7T4f4fwKw&format=png&color=000000",
  satellite: "https://img.icons8.com/color/48/earth-planet.png",
  dark: "https://img.icons8.com/fluency/48/moon.png",
  terrain: "https://img.icons8.com/color/48/mountain.png",
} as const;

const START_PIN_ICON = "https://img.icons8.com/fluency/48/marker.png";
const END_PIN_ICON = "https://img.icons8.com/color/48/marker.png";

type MapStyleKey = keyof typeof MAP_STYLES;
type Coord = [number, number];

type Props = {
  onMapReady: () => void;
  refForward?: React.RefObject<any>;
  onMessage?: (data: any) => void;
};

const getBorderColor = (key: MapStyleKey) => {
  switch (key) {
    case "dark":
      return "#fff";
    case "satellite":
      return "#007bff";
    case "terrain":
      return "#22aa22";
    default:
      return "#000";
  }
};

// helpers
const EARTH_RADIUS = 6371000;
const createCircle = (center: Coord, radiusMeters: number, steps = 60): Coord[] => {
  const [lng, lat] = center;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const dByR = radiusMeters / EARTH_RADIUS;
  const coords: Coord[] = [];

  for (let i = 0; i <= steps; i++) {
    const brng = (i * 2 * Math.PI) / steps;
    const lat2 = Math.asin(
      Math.sin(latRad) * Math.cos(dByR) +
        Math.cos(latRad) * Math.sin(dByR) * Math.cos(brng)
    );
    const lng2 =
      lngRad +
      Math.atan2(
        Math.sin(brng) * Math.sin(dByR) * Math.cos(latRad),
        Math.cos(dByR) - Math.sin(latRad) * Math.sin(lat2)
      );

    coords.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }

  return coords;
};

const distanceBetween = (a: Coord, b: Coord): number => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1Rad = toRad(a[1]);
  const lat2Rad = toRad(b[1]);

  const aHarv =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(dLng / 2) ** 2;

  return EARTH_RADIUS * 2 * Math.atan2(Math.sqrt(aHarv), Math.sqrt(1 - aHarv));
};

const smoothPathChaikin = (pts: Coord[], iterations = 2): Coord[] => {
  if (pts.length < 3) return pts;
  let result = pts;
  for (let it = 0; it < iterations; it++) {
    const newPts: Coord[] = [];
    newPts.push(result[0]);
    for (let i = 0; i < result.length - 1; i++) {
      const [x1, y1] = result[i];
      const [x2, y2] = result[i + 1];
      newPts.push(
        [0.75 * x1 + 0.25 * x2, 0.75 * y1 + 0.25 * y2],
        [0.25 * x1 + 0.75 * x2, 0.25 * y1 + 0.75 * y2]
      );
    }
    newPts.push(result[result.length - 1]);
    result = newPts;
  }
  return result;
};

const MapComponent: React.FC<Props> = ({ onMapReady, refForward, onMessage }) => {
  const cameraRef = useRef<any>(null);

  const [styleKey, setStyleKey] = useState<MapStyleKey>("osm");
  const [path, setPath] = useState<Coord[]>([]);
  const [allHistoryTracks, setAllHistoryTracks] = useState<Coord[][]>([]);
  const [start, setStart] = useState<Coord | null>(null);
  const [end, setEnd] = useState<Coord | null>(null);
  const [currentCoord, setCurrentCoord] = useState<Coord | null>(null);
  const [zoom, setZoom] = useState<number>(15);
  const watchId = useRef<number | null>(null);

  const [_heading, setHeading] = useState<number | null>(null);

  const [showMenu, setShowMenu] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const retainScale = useRef(new Animated.Value(1)).current;

  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  const [isMoving, setIsMoving] = useState(false);
  const lastCoordRef = useRef<Coord | null>(null);

  const animateRetain = (to: number) => {
    Animated.timing(retainScale, {
      toValue: to,
      duration: 120,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const toggleMenu = () => {
    const opening = !showMenu;
    setShowMenu(opening);

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: opening ? 1 : 0,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: opening ? 1 : 0,
        duration: 250,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleMsg = useCallback(
    (msg: any) => {
      const { type, payload } = msg || {};
      if (type === "modeChange") setStyleKey(payload?.isDarkMode ? "dark" : "osm");

      if (type === "startLive") {
        const [lat, lng] = payload.startLocation;
        const pt: Coord = [lng, lat];
        setPath([pt]);
        setStart(pt);
        setEnd(null);
        setCurrentCoord(pt);

        cameraRef.current?.setCamera({
          centerCoordinate: pt,
          zoomLevel: zoom,
          animationDuration: 500,
        });
      }

      if (type === "coord") {
        const { lat, lng } = payload;
        if (typeof lat === "number" && typeof lng === "number") {
          const pt: Coord = [lng, lat];
          setPath((prev) => [...prev, pt]);
          setCurrentCoord(pt);

          cameraRef.current?.setCamera({
            centerCoordinate: pt,
            animationDuration: 350,
          });
        }
      }

      if (type === "displayTrackAndFit") {
        const pts = Array.isArray(payload) ? payload : [];
        if (pts.length < 2) return;

        setPath(pts);
        setStart(pts[0]);
        setEnd(pts[pts.length - 1]);
        setCurrentCoord(pts[pts.length - 1]);

        setTimeout(() => {
          try {
            cameraRef.current?.fitBounds(pts[0], pts[pts.length - 1], 80, 80);
          } catch {}
        }, 250);
      }
      if (type === "displayAllTracks") {
        const tracks = Array.isArray(payload) ? payload : [];

        const smoothened = tracks.map((track: Coord[]) =>
          track.length < 3 ? track : smoothPathChaikin(track, 2)
        );

        setAllHistoryTracks(smoothened);

        // Fit map to whole data if possible
        const flat = smoothened.flat();
        if (flat.length >= 2) {
          try {
            cameraRef.current?.fitBounds(flat[0], flat[flat.length - 1], 120, 120);
          } catch {}
        }
      }

      if (type === "clear") {
        setPath([]);
        setStart(null);
        setEnd(null);
        setCurrentCoord(null);
      }

      onMessage?.(msg);
    },
    [onMessage, zoom]
  );

  useEffect(() => {
    if (refForward) {
      refForward.current = {
        postMessage: (json: string) => {
          try {
            handleMsg(JSON.parse(json));
          } catch {}
        },
      };
    }
  }, [handleMsg, refForward]);

  // GPS Tracking
  useEffect(() => {
    watchId.current = Geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed } = pos.coords;
        const coord: Coord = [longitude, latitude];
        setCurrentCoord(coord);

        const last = lastCoordRef.current;
        const gpsSpeed = typeof speed === "number" ? speed : 0;
        const moving =
          gpsSpeed > 1 || (last && distanceBetween(last, coord) > 3);

        lastCoordRef.current = coord;
        setIsMoving(Boolean(moving));

        cameraRef.current?.setCamera({
          centerCoordinate: coord,
          zoomLevel: zoom,
          animationDuration: 600,
        });
      },
      (err) => console.warn("GPS Error:", err),
      {
        enableHighAccuracy: true,
        distanceFilter: 1,
        interval: 2000,
        fastestInterval: 1000,
      }
    );

    return () => {
      if (watchId.current !== null) Geolocation.clearWatch(watchId.current);
    };
  }, [zoom]);

  // Heading (Rotational)
  useEffect(() => {
  let mounted = true;

  const degree_update_rate = 1;

    CompassHeading.start(degree_update_rate, ({ heading }: { heading: number }) => {
    if (!mounted) return;
    setHeading(heading);

    if (isMoving && currentCoord) {
      cameraRef.current?.setCamera({
        centerCoordinate: currentCoord,
        zoomLevel: zoom,
        bearing: heading,
        animationDuration: 300,
      });
    }
  });

  return () => {
    mounted = false;
    CompassHeading.stop();
  };
}, [currentCoord, zoom, isMoving]);


  // Reset Bearing when stopped
  useEffect(() => {
    if (isMoving || !currentCoord) return;
    cameraRef.current?.setCamera({
      centerCoordinate: currentCoord,
      zoomLevel: zoom,
      bearing: 0,
      animationDuration: 400,
    });
  }, [isMoving, currentCoord, zoom]);

  // Pulse Animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse1, {
          toValue: 1,
          duration: 1600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse1, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(pulse2, {
          toValue: 1,
          duration: 1600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse2, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse1, pulse2]);

  const lineFeature: any =
    path.length > 1
      ? {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: path },
        }
      : null;

  const smoothPath = React.useMemo(
    () => (path.length < 3 ? path : smoothPathChaikin(path, 2)),
    [path]
  );

  const smoothLineFeature: any =
    smoothPath.length > 1
      ? {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: smoothPath },
        }
      : null;

  const circleFeature: any = currentCoord
    ? {
        type: "Feature",
        properties: {},
        geometry: { type: "Polygon", coordinates: [createCircle(currentCoord, 100)] },
      }
    : null;

  const handleRetainPress = () => {
    const coord = currentCoord || start;
    if (!coord) return;

    cameraRef.current?.setCamera({
      centerCoordinate: coord,
      zoomLevel: zoom,
      animationDuration: 500,
    });
  };

  const handleZoomIn = () => {
    const z = zoom + 1;
    setZoom(z);
    cameraRef.current?.setCamera({ zoomLevel: z, animationDuration: 250 });
  };

  const handleZoomOut = () => {
    const z = zoom - 1;
    setZoom(z);
    cameraRef.current?.setCamera({ zoomLevel: z, animationDuration: 250 });
  };

  const borderTheme = { borderColor: getBorderColor(styleKey) };

  return (
    <View style={{ flex: 1 }}>
      <MapLibreGL.MapView
        style={StyleSheet.absoluteFillObject}
        mapStyle={MAP_STYLES[styleKey]}
        onDidFinishLoadingMap={onMapReady}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={true}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          zoomLevel={zoom}
          followUserLocation={false}
        />

        {start && (
          <MapLibreGL.PointAnnotation id="s" coordinate={start}>
            <View style={[styles.marker, styles.startMarker]} />
            <Image source={{ uri: START_PIN_ICON }} style={styles.startEndIcon} />
          </MapLibreGL.PointAnnotation>
        )}

        {end && (
          <MapLibreGL.PointAnnotation id="e" coordinate={end}>
            <View style={[styles.marker, styles.endMarker]} />
            <Image source={{ uri: END_PIN_ICON }} style={styles.startEndIcon} />
          </MapLibreGL.PointAnnotation>
        )}

        {currentCoord && (
          <MapLibreGL.PointAnnotation id="live" coordinate={currentCoord}>
            <View style={styles.liveMarkerWrapper}>
              <Animated.View
                style={[styles.pulseCircle, {
                  transform: [{ scale: pulse1.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
                  opacity: pulse1.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
                }]}
              />
              <Animated.View
                style={[styles.pulseCircle, {
                  transform: [{ scale: pulse2.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] }) }],
                  opacity: pulse2.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
                }]}
              />

              <View style={styles.directionArrow} />
              {_heading !== null && (
                <View
                  style={[styles.directionArrow, styles.directionArrowOverlay, { transform: [{ rotate: `${_heading}deg` }] }]}
                />
              )}

              <View style={styles.liveMarkerOuter}>
                <View style={styles.liveMarkerInner} />
              </View>
            </View>
          </MapLibreGL.PointAnnotation>
        )}

        {circleFeature && (
          <MapLibreGL.ShapeSource id="liveCircle" shape={circleFeature}>
            <MapLibreGL.FillLayer
              id="liveCircleFill"
              style={{
                fillColor: "rgba(33,174,230,0.25)",
                fillOutlineColor: "rgba(33,174,230,0.8)",
              }}
            />
          </MapLibreGL.ShapeSource>
        )}

        {lineFeature && (
          <MapLibreGL.ShapeSource id="path" shape={lineFeature}>
            <MapLibreGL.LineLayer
              id="pathLine"
              style={{
                lineColor: "#ff6b00",
                lineWidth: 5,
                lineJoin: "round",
                lineCap: "round",
              }}
            />
          </MapLibreGL.ShapeSource>
        )}

        {smoothLineFeature && (
          <MapLibreGL.ShapeSource id="pathSmooth" shape={smoothLineFeature}>
            <MapLibreGL.LineLayer
              id="pathLineSmooth"
              style={{
                lineColor: "#0080ff",
                lineWidth: 4,
                lineJoin: "round",
                lineCap: "round",
              }}
            />
          </MapLibreGL.ShapeSource>
        )}
      </MapLibreGL.MapView>
          {allHistoryTracks.map((trk, index) => {
            if (!Array.isArray(trk) || trk.length < 2) return null;

            const feature = {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: trk
              }
            } as GeoJSON.Feature; // 👈 add this cast

            return (
              <MapLibreGL.ShapeSource
                key={`hist-${index}`}
                id={`hist-${index}`}
                shape={feature}
              >
                <MapLibreGL.LineLayer
                  id={`hist-layer-${index}`}
                  style={{
                    lineColor: "#888",
                    lineWidth: 3,
                    lineJoin: "round",
                    lineCap: "round",
                  }}
                />
              </MapLibreGL.ShapeSource>
            );
          })}


      {/* UI Buttons */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          onPress={toggleMenu}
          style={[styles.mainBtn, borderTheme]}
          activeOpacity={0.8}
        >
          <Image source={{ uri: ICONS[styleKey] }} style={styles.mainIcon} />
        </TouchableOpacity>

        {showMenu && (
          <Animated.View style={[
            styles.menuBox,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 5],
                  }),
                },
              ],
            },
          ]}>
            {(Object.keys(MAP_STYLES) as MapStyleKey[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.menuItem,
                  type === styleKey && styles.menuActive,
                  { borderColor: "#000" },
                ]}
                onPress={() => {
                  setStyleKey(type);
                  setShowMenu(false);
                }}
              >
                <Text style={styles.menuLabel}>{type.toUpperCase()}</Text>
                <View
                  style={[
                    styles.menuIconWrapper,
                    { borderColor: getBorderColor(type) },
                  ]}
                >
                  <Image source={{ uri: ICONS[type] }} style={styles.menuIcon} />
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
      </View>

      <Animated.View style={[styles.retainWrapper, { transform: [{ scale: retainScale }] }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPressIn={() => animateRetain(0.96)}
          onPressOut={() => animateRetain(1)}
          onPress={handleRetainPress}
          style={[styles.retainButton, borderTheme]}
        >
          <Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/1828/1828178.png" }} style={styles.retainIcon} />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.zoomContainer}>
        <TouchableOpacity style={[styles.zoomBtn, borderTheme]} onPress={handleZoomIn}>
          <Text style={styles.zoomText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.zoomBtn, borderTheme]} onPress={handleZoomOut}>
          <Text style={styles.zoomText}>−</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MapComponent;

/* =================== STYLES =================== */
const styles = StyleSheet.create({
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
  mainIcon: { width: 26, height: 26, resizeMode: "contain" },
  menuBox: { marginTop: 10, elevation: 8 },
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
  menuActive: { backgroundColor: "rgba(255,255,255,1)" },
  menuLabel: { fontSize: 13, fontWeight: "600", color: "#000", marginRight: 10 },
  menuIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1.5,
  },
  menuIcon: { width: 32, height: 32, borderRadius: 16, resizeMode: "cover" },

  retainWrapper: { position: "absolute", bottom: 30, right: 10, zIndex: 999 },
  retainButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  retainIcon: { width: 24, height: 24, resizeMode: "contain" },

  marker: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#fff" },
  startMarker: { backgroundColor: "#28a745" },
  endMarker: { backgroundColor: "#dc3545" },

  liveMarkerWrapper: { alignItems: "center", justifyContent: "center" },
  pulseCircle: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,123,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(0,123,255,0.5)",
  },
  directionArrow: {
    width: 0,
    height: 0,
    marginBottom: 2,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#007bff",
  },
  directionArrowOverlay: { position: "absolute" },
  liveMarkerOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(0,123,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,123,255,0.15)",
    shadowColor: "#007bff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  liveMarkerInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#007bff" },

  startEndIcon: { width: 32, height: 32, resizeMode: "contain", marginTop: -10 },

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
  zoomText: { fontSize: 22, fontWeight: "700", color: "#000" },
});
