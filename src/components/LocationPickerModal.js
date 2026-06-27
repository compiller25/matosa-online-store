import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, View,
} from "react-native";
import { WebView } from "react-native-webview";
import { DELIVERY_ZONES, OUTSIDE_ZONE, detectZone } from "../utils/deliveryZones";
import { getTheme } from "../theme/theme";
import { useTranslation } from "../utils/i18n";

export default function LocationPickerModal({
  visible, onClose, onSelect, mode, language, initialLocation,
}) {
  const t = getTheme(mode);
  const tr = useTranslation(language);
  const webViewRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState(null);
  const [findingAddress, setFindingAddress] = useState(false);
  const [detectedZone, setDetectedZone] = useState(null);

  const initialLat = initialLocation?.lat || -6.7924;
  const initialLon = initialLocation?.lon || 39.2083;

  // Build zone polygons JS for Leaflet
  const zonesJs = DELIVERY_ZONES.map((z) => {
    const latlngs = z.coords.map(([la, lo]) => `[${la},${lo}]`).join(",");
    return `L.polygon([${latlngs}], {color:"${z.color}",fillColor:"${z.color}",fillOpacity:0.15,weight:2}).bindTooltip("${z.name}",{permanent:false}).addTo(map);`;
  }).join("\n");

  const mapHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>body{margin:0;padding:0;}#map{height:100vh;width:100vw;}.leaflet-control-attribution{display:none!important;}</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map',{zoomControl:false}).setView([${initialLat},${initialLon}],14);
  L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
  ${zonesJs}
  function postCoords(){
    var c=map.getCenter();
    var p=JSON.stringify({lat:c.lat,lon:c.lng});
    if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(p);
    else window.parent.postMessage(p,"*");
  }
  map.on('moveend',postCoords);
  setTimeout(postCoords,500);
  window.moveTo=function(lat,lon){map.setView([lat,lon],16);};
</script>
</body>
</html>`;

  const lookupTimer = useRef(null);
  const lastLookupTime = useRef(0);

  const processData = (raw) => {
    try {
      const data = JSON.parse(raw);
      if (data.lat && data.lon) {
        setCoords(data);
        setDetectedZone(detectZone(data.lat, data.lon));
        if (lookupTimer.current) clearTimeout(lookupTimer.current);
        lookupTimer.current = setTimeout(() => {
          const now = Date.now();
          if (now - lastLookupTime.current > 1000) {
            lastLookupTime.current = now;
            lookupAddress(data.lat, data.lon);
          }
        }, 1000);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (visible && initialLocation?.lat && initialLocation?.lon) {
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`window.moveTo(${initialLocation.lat},${initialLocation.lon})`);
      }, 1000);
    }
  }, [visible]);

  useEffect(() => {
    if (Platform.OS === "web") {
      const listener = (e) => { if (typeof e.data === "string") processData(e.data); };
      window.addEventListener("message", listener);
      return () => window.removeEventListener("message", listener);
    }
  }, []);

  const lookupAddress = async (lat, lon) => {
    setFindingAddress(true);
    try {
      if (Platform.OS === "web") {
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
        const data = await res.json();
        const parts = [data.locality, data.city, data.principalSubdivision].filter(Boolean);
        setAddress(parts.length ? parts.join(", ") : `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      } else {
        const res = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        if (res?.length) {
          const g = res[0];
          const readable = [g.name, g.street, g.district, g.city].filter(Boolean).join(", ");
          setAddress(readable || `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        }
      }
    } catch {
      setAddress(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    } finally {
      setFindingAddress(false);
    }
  };

  const handleConfirm = () => {
    if (coords) {
      const link = `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lon}#map=17/${coords.lat}/${coords.lon}`;
      onSelect({ address, mapsLink: link, coords, zone: detectedZone });
      onClose();
    }
  };

  const useCurrentLocation = async () => {
    try {
      setFindingAddress(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setFindingAddress(false); return; }
      let loc;
      try { loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High, timeout: 10000 }); }
      catch { loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }); }
      if (loc) {
        webViewRef.current?.injectJavaScript(`window.moveTo(${loc.coords.latitude},${loc.coords.longitude})`);
        setCoords({ lat: loc.coords.latitude, lon: loc.coords.longitude });
        setDetectedZone(detectZone(loc.coords.latitude, loc.coords.longitude));
        lookupAddress(loc.coords.latitude, loc.coords.longitude);
      }
    } catch (e) { console.log("Location error:", e); }
    finally { setFindingAddress(false); }
  };

  const zoneColor = detectedZone?.color ?? (detectedZone?.key === "outside" ? "#EF4444" : "#6B7280");
  const zoneName = detectedZone
    ? (language === "sw" ? (detectedZone.nameSw ?? detectedZone.name) : detectedZone.name)
    : null;
  const zoneFee = detectedZone?.feeTZS;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
        <View style={[styles.header, { borderBottomColor: t.colors.border }]}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color={t.colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: t.colors.text }]}>{tr("deliveryAddress")}</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.mapWrap}>
          {Platform.OS === "web" ? (
            <iframe srcDoc={mapHtml} style={{ width: "100%", height: "100%", border: "none" }} title="Location Picker" />
          ) : (
            <WebView
              ref={webViewRef}
              originWhitelist={["*"]}
              source={{ html: mapHtml }}
              onMessage={(e) => processData(e.nativeEvent.data)}
              onLoadEnd={() => setLoading(false)}
              style={styles.map}
            />
          )}

          <View style={styles.pinContainer} pointerEvents="none">
            <View style={styles.pinShadow} />
            <Ionicons name="location" size={48} color={t.colors.primary} />
          </View>

          {loading && (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={t.colors.primary} />
            </View>
          )}

          <Pressable onPress={useCurrentLocation} style={[styles.myLocBtn, { backgroundColor: t.colors.card }]}>
            <Ionicons name="locate" size={24} color={t.colors.primary} />
          </Pressable>
        </View>

        <View style={[styles.bottomCard, { backgroundColor: t.colors.card }]}>
          {/* Zone detection badge */}
          {detectedZone && (
            <View style={[styles.zoneBadge, { backgroundColor: (detectedZone.color ?? "#EF4444") + "20", borderColor: (detectedZone.color ?? "#EF4444") + "40" }]}>
              <Ionicons name="map-outline" size={14} color={detectedZone.color ?? "#EF4444"} />
              <Text style={[styles.zoneName, { color: detectedZone.color ?? "#EF4444" }]}>{zoneName}</Text>
              <Text style={[styles.zoneFee, { color: detectedZone.color ?? "#EF4444" }]}>
                {detectedZone.key === "outside"
                  ? tr("zoneOutsideNote")
                  : zoneFee === 0
                    ? tr("free")
                    : `${Number(zoneFee).toLocaleString()} TZS`}
              </Text>
            </View>
          )}

          <View style={styles.addressRow}>
            <Ionicons name="navigate-circle" size={20} color={t.colors.primary} />
            <Text
              style={[styles.addressText, { color: t.colors.text }, findingAddress && { opacity: 0.5 }]}
              numberOfLines={2}
            >
              {findingAddress ? tr("gettingLocation") : address || "..."}
            </Text>
          </View>

          <Pressable
            onPress={handleConfirm}
            disabled={findingAddress || !coords}
            style={({ pressed }) => [
              styles.confirmBtn(t),
              (findingAddress || !coords) && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.confirmText}>{tr("saveProfile")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: "700" },
  closeBtn: { padding: 4 },
  mapWrap: { flex: 1, position: "relative" },
  map: { flex: 1 },
  loader: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.5)", justifyContent: "center", alignItems: "center" },
  pinContainer: { position: "absolute", top: "50%", left: "50%", marginLeft: -24, marginTop: -48, alignItems: "center", justifyContent: "center" },
  pinShadow: { position: "absolute", bottom: 2, width: 8, height: 4, borderRadius: 4, backgroundColor: "rgba(0,0,0,0.2)" },
  myLocBtn: { position: "absolute", right: 20, bottom: 20, width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  bottomCard: { padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  zoneBadge: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 12, borderWidth: 1, marginBottom: 14, flexWrap: "wrap" },
  zoneName: { fontWeight: "700", fontSize: 13 },
  zoneFee: { fontWeight: "600", fontSize: 12, marginLeft: "auto" },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  addressText: { flex: 1, fontSize: 15, fontWeight: "600" },
  confirmBtn: (t) => ({ backgroundColor: t.colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: "center" }),
  confirmText: { color: "#FFF", fontWeight: "800", fontSize: 16 },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
