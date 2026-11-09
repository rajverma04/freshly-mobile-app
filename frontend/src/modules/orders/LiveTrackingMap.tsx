import { useEffect, useRef, useState } from "react";
import { Image, Linking, Pressable, Text, View } from "react-native";
import { useApi } from "../../shared/api";
import type { LiveTrackingInfo, OrderStatus } from "../../shared/types";
import { colors, ui } from "../../shared/theme";

export function LiveTrackingMap({
  orderId,
  orderStatus,
  destinationAddress,
}: {
  orderId: string;
  orderStatus: OrderStatus;
  destinationAddress?: string;
}) {
  const api = useApi();
  const [info, setInfo] = useState<LiveTrackingInfo | null>(null);
  const [pulse, setPulse] = useState(false);
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;

    async function fetchTracking() {
      try {
        const data = await api<LiveTrackingInfo>(`/orders/${orderId}/track`);
        if (activeRef.current && data) {
          setInfo(data);
        }
      } catch {
        // Silently keep last known tracking or fallback
      }
    }

    void fetchTracking();

    // Poll live rider coordinates every 4 seconds when in delivery
    const interval = setInterval(() => {
      void fetchTracking();
      setPulse((p) => !p);
    }, 4000);

    return () => {
      activeRef.current = false;
      clearInterval(interval);
    };
  }, [orderId, api]);

  function handleCall(phone: string) {
    void Linking.openURL(`tel:${phone}`);
  }

  const progress = info ? Math.max(0, Math.min(100, info.progressPercent)) : 45;
  const eta = info ? info.etaMinutes : 12;
  const distance = info ? info.distanceRemainingKm : 2.1;
  const speed = info ? info.riderLocation.speedKmH : 32;
  const milestone =
    info?.currentMilestone || "Rider is delivering your fresh food 🛵";
  const riderName = info?.rider.name || "Rajesh Kumar";
  const riderVehicle =
    info?.rider.vehicle || "Bajaj Pulsar 150 · KA 01 EQ 4920";
  const riderPhone = info?.rider.phone || "+919876543210";

  return (
    <View
      style={[
        ui.card,
        {
          backgroundColor: "#172017",
          borderColor: "#2E402E",
          padding: 0,
          overflow: "hidden",
          marginVertical: 4,
        },
      ]}
    >
      {/* Top Status Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottomWidth: 1,
          borderColor: "#253325",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#2ECC71",
            }}
          />
          <Text
            style={{
              color: "#A2C49A",
              fontSize: 11,
              fontWeight: "800",
              letterSpacing: 1.2,
            }}
          >
            LIVE GPS TRACKER
          </Text>
        </View>

        <View
          style={{
            backgroundColor: "#263526",
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              color: colors.white,
              fontSize: 11,
              fontWeight: "700",
            }}
          >
            {orderStatus === "DELIVERED" ? "Delivered" : `ETA: ~${eta} mins`}
          </Text>
        </View>
      </View>

      {/* Visual Road & Map Route Canvas */}
      <View
        style={{
          height: 160,
          backgroundColor: "#1B251B",
          position: "relative",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        {/* Road Track Background */}
        <View
          style={{
            height: 18,
            backgroundColor: "#2A3A2A",
            borderRadius: 9,
            position: "relative",
            justifyContent: "center",
          }}
        >
          {/* Dashed Center Road Line */}
          <View
            style={{
              height: 2,
              backgroundColor: "rgba(255,255,255,0.2)",
              marginHorizontal: 8,
            }}
          />

          {/* Active Travelled Polyline (Green) */}
          <View
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${Math.max(5, progress)}%`,
              backgroundColor: colors.primary,
              borderRadius: 9,
            }}
          />

          {/* Moving Delivery Rider Marker */}
          <View
            style={{
              position: "absolute",
              left: `${Math.max(2, Math.min(92, progress))}%`,
              top: -18,
              marginLeft: -16,
              alignItems: "center",
            }}
          >
            {/* Pulsing Radar Ring */}
            <View
              style={{
                position: "absolute",
                top: -3,
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: pulse
                  ? "rgba(46, 204, 113, 0.35)"
                  : "rgba(46, 204, 113, 0.15)",
              }}
            />

            {/* Rider Bike Icon */}
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: colors.primary,
                borderWidth: 2,
                borderColor: colors.white,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <Text style={{ fontSize: 18 }}>🛵</Text>
            </View>
          </View>
        </View>

        {/* Start Point: Restaurant */}
        <View
          style={{
            position: "absolute",
            left: 16,
            bottom: 14,
            alignItems: "flex-start",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 13 }}>🍳</Text>
            <Text
              style={{
                color: "#BAC8B8",
                fontSize: 11,
                fontWeight: "700",
              }}
            >
              Central Kitchen
            </Text>
          </View>
          <Text style={{ color: "#7A8C78", fontSize: 10 }}>
            Indiranagar Hub
          </Text>
        </View>

        {/* End Point: Customer Home */}
        <View
          style={{
            position: "absolute",
            right: 16,
            bottom: 14,
            alignItems: "flex-end",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text
              style={{
                color: "#BAC8B8",
                fontSize: 11,
                fontWeight: "700",
              }}
            >
              Your Location
            </Text>
            <Text style={{ fontSize: 13 }}>🏠</Text>
          </View>
          <Text
            numberOfLines={1}
            style={{
              color: "#7A8C78",
              fontSize: 10,
              maxWidth: 130,
              textAlign: "right",
            }}
          >
            {destinationAddress || "Home Doorstep"}
          </Text>
        </View>
      </View>

      {/* Live Trip Telemetry Bar */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#202C20",
          paddingVertical: 10,
          paddingHorizontal: 16,
          justifyContent: "space-between",
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: "#293A29",
        }}
      >
        <View style={{ alignItems: "center", flex: 1 }}>
          <Text style={{ color: "#8E9E8E", fontSize: 10, fontWeight: "700" }}>
            DISTANCE
          </Text>
          <Text style={{ color: colors.white, fontSize: 14, fontWeight: "800" }}>
            {distance} km away
          </Text>
        </View>

        <View
          style={{
            width: 1,
            backgroundColor: "#2E402E",
            marginVertical: 2,
          }}
        />

        <View style={{ alignItems: "center", flex: 1 }}>
          <Text style={{ color: "#8E9E8E", fontSize: 10, fontWeight: "700" }}>
            SPEED
          </Text>
          <Text style={{ color: colors.white, fontSize: 14, fontWeight: "800" }}>
            {speed} km/h
          </Text>
        </View>

        <View
          style={{
            width: 1,
            backgroundColor: "#2E402E",
            marginVertical: 2,
          }}
        />

        <View style={{ alignItems: "center", flex: 1 }}>
          <Text style={{ color: "#8E9E8E", fontSize: 10, fontWeight: "700" }}>
            EST. TIME
          </Text>
          <Text
            style={{
              color: "#52D68A",
              fontSize: 14,
              fontWeight: "800",
            }}
          >
            {eta} mins
          </Text>
        </View>
      </View>

      {/* Real-time Road Milestone Banner */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 10,
          backgroundColor: "#182318",
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Text style={{ fontSize: 14 }}>📍</Text>
        <Text
          numberOfLines={1}
          style={{
            color: "#D0DCD0",
            fontSize: 12,
            fontWeight: "700",
            flex: 1,
          }}
        >
          {milestone}
        </Text>
      </View>

      {/* Delivery Rider Contact Card */}
      <View
        style={{
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#141C14",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
            }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 2,
              borderColor: colors.primary,
            }}
          />
          <View style={{ gap: 2 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text
                style={{
                  color: colors.white,
                  fontWeight: "800",
                  fontSize: 14,
                }}
              >
                {riderName}
              </Text>
              <View
                style={{
                  backgroundColor: "#2A3A2A",
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    color: "#F1C40F",
                    fontSize: 10,
                    fontWeight: "800",
                  }}
                >
                  ★ 4.9
                </Text>
              </View>
            </View>
            <Text style={{ color: "#8E9E8E", fontSize: 11 }}>
              {riderVehicle}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => handleCall(riderPhone)}
          style={{
            backgroundColor: colors.primary,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 14,
          }}
        >
          <Text style={{ fontSize: 14 }}>📞</Text>
          <Text
            style={{
              color: colors.white,
              fontWeight: "700",
              fontSize: 12,
            }}
          >
            Call Rider
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

