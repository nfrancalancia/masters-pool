// ESPN IDs that don't have headshots on ESPN CDN — use PGA Tour CDN instead
const PGA_TOUR_FALLBACKS: Record<string, string> = {
  "10127": "37455",     // Si Woo Kim
  "9611": "49960",      // Sepp Straka
  "4849550": "55182",   // Tom Kim
  "2201886": "",        // Brandon Holtz (no image available)
};

export function golferImageUrl(espnId: string | null): string {
  if (!espnId) return "";

  const pgaId = PGA_TOUR_FALLBACKS[espnId];
  if (pgaId !== undefined) {
    if (!pgaId) return ""; // No image available
    return `https://pga-tour-res.cloudinary.com/image/upload/c_thumb,g_face,z_0.7,q_auto,dpr_2.0,h_120,w_120/headshots_${pgaId}.png`;
  }

  return `https://a.espncdn.com/i/headshots/golf/players/full/${espnId}.png`;
}
