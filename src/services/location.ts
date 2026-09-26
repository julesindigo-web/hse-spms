// GPS §16: Geolocation API + threshold akurasi 50m (configurable) + fallback tercatat.
export interface GpsFix { lat: number; lng: number; accuracy_m: number; captured_at: string; mocked?: boolean }

export async function captureGps(timeoutMs = 12000): Promise<GpsFix> {
  if (!('geolocation' in navigator)) {
    return { lat: 0, lng: 0, accuracy_m: 9999, captured_at: new Date().toISOString(), mocked: true };
  }
  return new Promise(resolve => {
    const done = (p: any, mocked = false) => resolve({
      lat: p.coords.latitude, lng: p.coords.longitude,
      accuracy_m: Math.round(p.coords.accuracy ?? 9999),
      captured_at: new Date().toISOString(), mocked
    });
    navigator.geolocation.getCurrentPosition(
      p => done(p),
      () => resolve({ lat: 0, lng: 0, accuracy_m: 9999, captured_at: new Date().toISOString(), mocked: true }),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 }
    );
    setTimeout(() => resolve({ lat: 0, lng: 0, accuracy_m: 9999, captured_at: new Date().toISOString(), mocked: true }), timeoutMs + 1000);
  });
}

export function gpsBadge(g: GpsFix | undefined): string {
  if (!g || (g.lat === 0 && g.lng === 0)) return 'GPS tidak tersedia — diisi manual/di lokasi (catat di deskripsi)';
  if (g.accuracy_m > 50) return `Akurasi ${g.accuracy_m}m (>50m) — anggap perkiraan, jangan jadi bukti mutlak (§16)`;
  return `±${g.accuracy_m}m`;
}
