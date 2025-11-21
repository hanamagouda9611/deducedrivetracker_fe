// MapViewComponent.tsx
import React, { useCallback, useRef } from "react";
import { WebView } from "react-native-webview";
import MapHTML from "../map/MapHTML";

type Props = {
  onMapReady: () => void;
  refForward?: React.RefObject<WebView>;
  onMessage?: (data: any) => void;
};

const MapViewComponent: React.FC<Props> = ({
  onMapReady,
  refForward,
  onMessage,
}) => {

  // Always call hook first
  const internalRef = useRef<WebView>(null);

  // Then decide which ref to use
  const finalRef = refForward ?? internalRef;

  const handleMsg = useCallback(
    (e: any) => {
      try {
        const msg = JSON.parse(e.nativeEvent.data);

        if (msg?.type === "mapReady") {
          onMapReady();
        }

        onMessage?.(msg);
      } catch {}
    },
    [onMapReady, onMessage]
  );

  return (
    <WebView
      ref={finalRef}
      originWhitelist={["*"]}
      source={{ html: MapHTML }}
      onMessage={handleMsg}
      javaScriptEnabled
      domStorageEnabled
      geolocationEnabled
      style={{ backgroundColor: "transparent" }}
    />
  );
};

export default MapViewComponent;
