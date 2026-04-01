import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../lib/theme';
import { TYPE, SPACE } from '../../constants/theme';

interface EnvData {
  city: string;
  temp: number;
  weatherCode: number;
  uvIndex: number;
  aqi: number;
}

function weatherLabel(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Cloudy';
  if (code <= 49) return 'Foggy';
  if (code <= 59) return 'Drizzle';
  if (code <= 69) return 'Rain';
  if (code <= 79) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 86) return 'Snow';
  if (code <= 99) return 'Storms';
  return '';
}

function uvLabel(uv: number): string {
  if (uv <= 2) return 'Low';
  if (uv <= 5) return 'Moderate';
  if (uv <= 7) return 'High';
  if (uv <= 10) return 'Very High';
  return 'Extreme';
}

function uvColor(uv: number, colors: any): string {
  if (uv <= 2) return colors.systemGreen;
  if (uv <= 5) return colors.systemYellow;
  if (uv <= 7) return colors.systemOrange;
  return colors.systemRed;
}

function aqiLabel(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy';
  return 'Poor';
}

function aqiColor(aqi: number, colors: any): string {
  if (aqi <= 50) return colors.systemGreen;
  if (aqi <= 100) return colors.systemYellow;
  if (aqi <= 150) return colors.systemOrange;
  return colors.systemRed;
}

export function EnvironmentBar() {
  const { colors } = useTheme();
  const [data, setData] = useState<EnvData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetch_env() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = loc.coords;

        // Reverse geocode for city name
        const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
        const city = geo?.city || geo?.subregion || 'Unknown';

        // Fetch weather + UV from Open-Meteo
        const weatherRes = await globalThis.fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=uv_index_max&timezone=auto&forecast_days=1`
        );
        const weatherJson = await weatherRes.json();

        // Fetch air quality from Open-Meteo
        const aqiRes = await globalThis.fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi`
        );
        const aqiJson = await aqiRes.json();

        if (cancelled) return;

        setData({
          city,
          temp: Math.round(weatherJson.current?.temperature_2m ?? 0),
          weatherCode: weatherJson.current?.weather_code ?? 0,
          uvIndex: Math.round(weatherJson.daily?.uv_index_max?.[0] ?? 0),
          aqi: Math.round(aqiJson.current?.us_aqi ?? 0),
        });
      } catch {
        // Silently fail — this is supplementary info
      }
    }

    fetch_env();
    return () => { cancelled = true; };
  }, []);

  if (!data) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.quaternarySystemFill }]}>
      {/* Location */}
      <View style={styles.item}>
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.secondaryLabel} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <Path d="M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
        </Svg>
        <Text style={[styles.text, { color: colors.secondaryLabel }]}>{data.city}</Text>
      </View>

      <Text style={[styles.dot, { color: colors.tertiaryLabel }]}>·</Text>

      {/* Weather */}
      <Text style={[styles.text, { color: colors.secondaryLabel }]}>
        {data.temp}° {weatherLabel(data.weatherCode)}
      </Text>

      <Text style={[styles.dot, { color: colors.tertiaryLabel }]}>·</Text>

      {/* UV Index */}
      <Text style={[styles.text, { color: uvColor(data.uvIndex, colors) }]}>
        UV {data.uvIndex} {uvLabel(data.uvIndex)}
      </Text>

      <Text style={[styles.dot, { color: colors.tertiaryLabel }]}>·</Text>

      {/* AQI */}
      <Text style={[styles.text, { color: aqiColor(data.aqi, colors) }]}>
        AQI {data.aqi} {aqiLabel(data.aqi)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACE.xl,
    marginBottom: SPACE.lg,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    borderRadius: 10,
    flexWrap: 'wrap',
    gap: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    ...TYPE.caption2,
    fontFamily: 'Outfit-Medium',
    fontWeight: '500',
  },
  dot: {
    fontSize: 10,
  },
});
