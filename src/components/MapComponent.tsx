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
import Config from "react-native-config";
import styles from "../styles/MapComponent.styles";


const MAPTILER_KEY = Config.MAPTILER_KEY;

MapLibreGL.setAccessToken(null);


// Free MapTiler styles
const MAP_STYLES = {
  osm: `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`,
  satellite: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`,
  dark: `https://api.maptiler.com/maps/darkmatter/style.json?key=${MAPTILER_KEY}`,
  terrain: `https://api.maptiler.com/maps/outdoor/style.json?key=${MAPTILER_KEY}`,
} as const;

const ICONS = {
  osm: "https://img.icons8.com/?size=100&id=rMF7T4f4fwKw&format=png&color=000000",
  satellite: "https://img.icons8.com/color/48/earth-planet.png",
  dark: "https://img.icons8.com/fluency/48/moon.png",
  terrain: "https://img.icons8.com/color/48/mountain.png",
} as const;



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
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const smoothCoord = (from: Coord, to: Coord): Coord => [
  lerp(from[0], to[0], 0.25), // 25% smoothing
  lerp(from[1], to[1], 0.25),
];

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
  const firstFixDone = useRef(false); 
  const [styleKey, setStyleKey] = useState<MapStyleKey>("osm");
  const [livePath, setLivePath] = useState<Coord[]>([]);
  const [historyPaths, setHistoryPaths] = useState<Coord[][]>([]);
  const [highlightedPath, setHighlightedPath] = useState<Coord[]>([]);
  const [todayPaths, setTodayPaths] = useState<Coord[][]>([]);
  const [start, setStart] = useState<Coord | null>(null);
  const [end, setEnd] = useState<Coord | null>(null);
  const [currentCoord, setCurrentCoord] = useState<Coord | null>(null);
  const [zoom, setZoom] = useState<number>(15);
  const watchId = useRef<number | null>(null);
  const [mapCenterCoord, setMapCenterCoord] = useState<Coord | null>(null);

  const [_heading, setHeading] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"live" | "history">("live");
  const [isFollowing, setIsFollowing] = useState(true);

  const [showMenu, setShowMenu] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const retainScale = useRef(new Animated.Value(1)).current;

  const rippleAnim = useRef(new Animated.Value(0)).current;
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  const [isMoving, setIsMoving] = useState(false);
  const lastCoordRef = useRef<Coord | null>(null);
  const lastUpdate = useRef<number>(0);
  const CAMERA_ANIM = 600;

  const animateRetain = (to: number) => {
    Animated.timing(retainScale, {
      toValue: to,
      duration: 100,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  // -------------TOGGLE MENU-----------------
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

  //-------------- LIVE,COORD,TRACK FIT----------------
  const handleMsg = useCallback(
    (msg: any) => {
      const { type, payload } = msg || {};
      if (type === "modeChange") setStyleKey(payload?.isDarkMode ? "dark" : "osm");

      if (type === "startLive") {
        const [lat, lng] = payload.startLocation;
        const pt: Coord = [lng, lat];

  
        setLivePath([pt]);
        setStart(pt);
        setEnd(null);
        setCurrentCoord(pt);
        setHighlightedPath([]); 

        cameraRef.current?.setCamera({
          centerCoordinate: pt,
          zoomLevel: zoom,
          animationDuration: CAMERA_ANIM,
          animationMode: "easeTo",
        });
      }

      if (type === "coord") {
        const { lat, lng } = payload;
        if (typeof lat === "number" && typeof lng === "number") {
          const pt: Coord = [lng, lat];
          setLivePath((prev) => [...prev, pt]);
          setCurrentCoord(pt);

          cameraRef.current?.setCamera({
            centerCoordinate: pt,
            animationDuration: CAMERA_ANIM,
            animionMode : "easeTo"
          });
        }
      }

      if (type === "stopLive") {
        const { lat, lng } = payload;
        const pt: Coord = [lng, lat];

        setEnd(pt);                 
        setIsFollowing(false); 
        setViewMode("history");

        cameraRef.current?.setCamera({
          centerCoordinate: pt,
          zoomLevel: zoom,
          animationDuration: CAMERA_ANIM,
          animationMode: "easeTo",
        });
      }

      if (type === "displayTrackAndFit") {
        const pts = Array.isArray(payload) ? payload : [];
        if (pts.length < 2) return;

        setViewMode("history");
        setIsFollowing(false);  
        setHighlightedPath(pts);
        setStart(pts[0]);
        setEnd(pts[pts.length - 1]);

        setTimeout(() => {
          try {
            const lngs = pts.map(p => p[0]);
            const lats = pts.map(p => p[1]);

            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);

            const centerLng = (minLng + maxLng) / 2;
            const centerLat = (minLat + maxLat) / 2;

            const dx = Math.abs(maxLng - minLng);
            const dy = Math.abs(maxLat - minLat);
            const maxDiff = Math.max(dx, dy);

            let autoZoom = 16 - Math.log2(maxDiff * 120);
            autoZoom = Math.min(Math.max(autoZoom, 12), 17);

            cameraRef.current?.setCamera({
              centerCoordinate: [centerLng, centerLat],
              zoomLevel: autoZoom,
              animationDuration: CAMERA_ANIM,
              animationMode: "easeTo",
            });
          } catch (err) {
            console.log("Smooth fit error:", err);
          }
        }, 120);
      }


     if (type === "displayAllTracks") {
      const { history = [], today = [] } = payload || {};

      setHistoryPaths(history);   
      setTodayPaths(today);     

      const flat = [...history, ...today].flat();

      if (flat.length >= 2) {
        cameraRef.current?.fitBounds(
          flat[0],
          flat[flat.length - 1],
          120,
          120
        );
      }
    }



      if (type === "displayTodayTrack") {
        const tracks = Array.isArray(payload) ? payload : [];
        setTodayPaths(tracks);

        const flat = tracks.flat();
        if (flat.length >= 2) {
          try {
            cameraRef.current?.fitBounds(flat[0], flat[flat.length - 1], 100, 100);
          } catch {}
        }
      }

      if (type === "setHistoryMode") {
        setViewMode("history");
      }

      if (type === "clear") {
        setHighlightedPath([]);
        setStart(null);
        setEnd(null);
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

// -------------------ripple animation loop (Google-like)
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rippleAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rippleAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [rippleAnim]);

  // -------------📌 GPS Tracking — CLEAN & FIXED----------------
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

        if (!firstFixDone.current) {
          firstFixDone.current = true;
          setIsFollowing(true); 

          cameraRef.current?.setCamera({
            centerCoordinate: coord,
            zoomLevel: zoom,
            animationDuration: CAMERA_ANIM,
            animationMode: "easeTo",
          });

          return;
        }

       if (isFollowing && viewMode === "live" && !isMoving && lastCoordRef.current) {
        const smoothed = smoothCoord(lastCoordRef.current, coord);

        cameraRef.current?.setCamera({
          centerCoordinate: smoothed,
          animationDuration: CAMERA_ANIM,
          animationMode: "easeTo",
        });
      }

      },

      (err) => {
        console.warn("GPS Error:", err);
        setCurrentCoord((prev) => prev || null);
      },

      {
        enableHighAccuracy: true,
        distanceFilter: 1,
        interval: 1500,
        fastestInterval: 800,
      }
    );

    return () => {
      if (watchId.current !== null) Geolocation.clearWatch(watchId.current);
    };
  }, []);
 

  // -------------------Heading (Rotational)----------------
  useEffect(() => {
    let mounted = true;

    const degree_update_rate = 1;

      CompassHeading.start(degree_update_rate, ({ heading }: { heading: number }) => {
      if (!mounted) return;
      setHeading(heading);

      if (isFollowing && viewMode === "live" && isMoving) {
      cameraRef.current?.setCamera({
        bearing: heading,
        animationDuration: CAMERA_ANIM,
        animationMode: "easeTo",
      });
    }
    });

    return () => {
      mounted = false;
      CompassHeading.stop();
    };
  }, [currentCoord, zoom, isMoving]);

  // -----------------Smooth zoom updates (no blinking)-----------------
  useEffect(() => {
    if (!cameraRef.current) return;

    if (isFollowing && currentCoord) {
      // When following: zoom AND center on user
      cameraRef.current.setCamera({
        centerCoordinate: currentCoord,
        zoomLevel: zoom,
        animationDuration: CAMERA_ANIM,
        animationMode: "easeTo",
      });
    } else {
      // Not following: only apply zoom (NO RECENTER)
      cameraRef.current.setCamera({
        zoomLevel: zoom,
        animationDuration: CAMERA_ANIM,
        animationMode: "easeTo",
      });
    }
  }, [zoom, isFollowing, currentCoord]);



  // -----------------Reset Bearing when stopped-----------------
  useEffect(() => {
    if (viewMode === "history") return;
    if (isMoving || !currentCoord) return;

    cameraRef.current?.setCamera({
      centerCoordinate: currentCoord,
      zoomLevel: zoom,
      bearing: 0,
      animationDuration: CAMERA_ANIM,
      animationMode: "easeTo",
    });
  }, [isMoving, currentCoord, zoom]);

  // -----------Pulse Animation
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


    // --------------smoothed live path for rendering (Chaikin)-------------
    const smoothLivePath = React.useMemo(
      () => (livePath.length < 3 ? livePath : smoothPathChaikin(livePath, 2)),
      [livePath]
    );

    // -----------------smoothed highlighted session path--------------
    const smoothHighlightedPath = React.useMemo(
      () => (highlightedPath.length < 3 ? highlightedPath : smoothPathChaikin(highlightedPath, 2)),
      [highlightedPath]
    );

    // -----------------smoothCurve--------------
    const smoothCurve = (pts: Coord[]) => {
      if (!pts || pts.length < 3) return pts;
      return smoothPathChaikin(smoothPathChaikin(pts, 1), 1); // 2-pass smoothing
    };

  // -----------------circleFeature-------------
    const circleFeature: any = currentCoord
      ? {
          type: "Feature",
          properties: {},
          geometry: { type: "Polygon", coordinates: [createCircle(currentCoord, 100)] },
        }
      : null;

  // -----------------RETAIN BUTTON-----------------
   const handleRetainPress = () => {
    const coord = currentCoord || start || end;
    if (!coord) return;

    setViewMode("live");

    cameraRef.current?.setCamera({
      centerCoordinate: coord,
      zoomLevel: 17,
      animationDuration: CAMERA_ANIM,
      animationMode: "easeTo",
      followUserLocation: true,
    });
  };

  // -----------------ZOOM-----------------
  const handleZoomIn = () => {
    setZoom((prev) => prev + 1);
  };

  const handleZoomOut = () => {
    setZoom((prev) => prev - 1);
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
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
        onRegionWillChange={() => {
          setIsFollowing(false);  
        }}            
        onDidFinishRenderingMapFully={() => {
        setHistoryPaths((p) => [...p]);
        setTodayPaths((p) => [...p]);
        setHighlightedPath((p) => [...p]);
        setLivePath((p) => [...p]);
        setStart((s) => (s ? [...s] : null));
        setEnd((e) => (e ? [...e] : null));
      }}
      >
        <MapLibreGL.Camera
        ref={cameraRef}
      />

        {start && (
          <MapLibreGL.MarkerView coordinate={start}
           anchor={{ x: 0.5, y: 1.0 }}>
            <Image source={require("../assets/start.png")} style={{ width: 30, height: 40}} />
          </MapLibreGL.MarkerView>
        )}

        {end && (
          <MapLibreGL.MarkerView coordinate={end}
          anchor={{ x: 0.5, y: 1.0 }}>
            <Image source={require("../assets/stop.png")} style={{ width: 30, height: 40}} />
          </MapLibreGL.MarkerView>
        )}


        {currentCoord !== null && Array.isArray(currentCoord) && (
          <MapLibreGL.MarkerView coordinate={currentCoord}>
            <View style={styles.googleMarkerContainer}>
              <Animated.View
                style={[
                  styles.ripple,
                  {
                    transform: [
                      {
                        scale: pulse1.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 3],
                        }),
                      },
                    ],
                    opacity: pulse1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 0],
                    }),
                  },
                ]}
              />
              {_heading !== null && (
                <View
                  style={[
                    styles.headingCone,
                    { transform: [{ rotate: `${_heading}deg` }] },
                  ]}
                />
              )}
              <View style={styles.googleDotOuter}>
                <View style={styles.googleDotInner} />
              </View>
            </View>
          </MapLibreGL.MarkerView>
        )}

      {viewMode === "live" && circleFeature && (
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


        {smoothLivePath.length > 1 && (
          <MapLibreGL.ShapeSource id="live-track" shape={{
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: smoothLivePath }
          }}>
            <MapLibreGL.LineLayer
              id="live-track-line"
              style={{
                lineColor: "#33BBFF", 
                lineWidth: 3,
                lineJoin: "round",
                lineCap: "round",
              }}
            />
          </MapLibreGL.ShapeSource>
        )}


        {historyPaths.map((trk, index) => {
            if (!Array.isArray(trk) || trk.length < 2) return null;
            const feature = {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: smoothCurve(trk) },
            } as GeoJSON.Feature;

            return (
              <MapLibreGL.ShapeSource key={`hist-${index}`} id={`hist-${index}`} shape={feature}>
                <MapLibreGL.LineLayer
                  id={`hist-layer-${index}`}
                  style={{
                    lineColor: "#00C853", 
                    lineWidth: 4,
                    lineJoin: "round",
                    lineCap: "round",
                  }}
                />
              </MapLibreGL.ShapeSource>
            );
          })}
        
        {todayPaths.map((trk, index) => {
          if (!Array.isArray(trk) || trk.length < 2) return null;
          const feature = {
            type: "Feature" as const,
            properties: {},
            geometry: {
              type: "LineString" as const,
              coordinates: smoothCurve(trk),
            },
          };

          return (
            <MapLibreGL.ShapeSource
              key={`today-${index}`}
              id={`today-${index}`}
              shape={feature}
            >
              <MapLibreGL.LineLayer
                id={`today-layer-${index}`}
                style={{
                  lineColor: "#8e24aa", 
                  lineWidth: 4,
                  lineJoin: "round",
                  lineCap: "round",
                }}
              />
            </MapLibreGL.ShapeSource>
          );
        })}


        {smoothHighlightedPath.length > 1 && (
          <MapLibreGL.ShapeSource id="highlight-track" shape={{
            type: "Feature",
            properties: {},
            geometry: {type: "LineString", coordinates: smoothCurve(smoothHighlightedPath),  
            },
          }}>
            <MapLibreGL.LineLayer
              id="highlight-track-line"
              style={{
                lineColor: "#0051FF", 
                lineWidth: 6,
                lineJoin: "round",
                lineCap: "round",
              }}
            />
          </MapLibreGL.ShapeSource>
        )}

      </MapLibreGL.MapView>

  
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

      {/* Waiting for GPS Popup */}
        {!currentCoord && (
          <View style={{
            position: "absolute",
            bottom: 25,
            left: 0,
            right: 0,
            alignItems: "center",
            zIndex: 999,
          }}>
            <View style={{
              backgroundColor: "rgba(0,0,0,0.75)",
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 20,
            }}>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "500" }}>
                Waiting for GPS...
              </Text>
            </View>
          </View>
        )}
        
      <Animated.View style={[styles.retainWrapper, { transform: [{ scale: retainScale }] }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPressIn={() => animateRetain(0.8)}
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
