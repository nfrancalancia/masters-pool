// ESPN IDs that don't have headshots on ESPN CDN — use PGA Tour CDN instead
const PGA_TOUR_FALLBACKS: Record<string, string> = {
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
