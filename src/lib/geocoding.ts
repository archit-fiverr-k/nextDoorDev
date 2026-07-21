interface Coordinates {
  lat: number;
  lng: number;
  name: string;
  type: "city" | "postcode";
}

/**
 * Resolves a city name, postcode, or outcode to UK coordinates (offline geocoder).
 */
export function geocodeLocation(query: string): Coordinates | null {
  const clean = query.trim().toUpperCase();
  if (!clean) return null;

  // Postcode outcode extraction
  const outcodeRegex = /^([A-Z]{1,2}[0-9][0-9A-Z]?)/i;
  const match = clean.match(outcodeRegex);
  const outcode = match ? match[1] : "";

  // Major outcodes coordinates mapping
  const outcodeMap: Record<string, { lat: number; lng: number; name: string }> = {
    // London Outcodes
    EC1: { lat: 51.5234, lng: -0.0988, name: "EC1 (Central London)" },
    EC2: { lat: 51.5185, lng: -0.086, name: "EC2 (Bishopsgate)" },
    WC1: { lat: 51.5222, lng: -0.1197, name: "WC1 (Bloomsbury)" },
    SW1: { lat: 51.4975, lng: -0.1457, name: "SW1 (Westminster)" },
    SW1A: { lat: 51.501, lng: -0.142, name: "SW1A (Buckingham Palace)" },
    SE1: { lat: 51.5012, lng: -0.0911, name: "SE1 (Waterloo)" },
    W1: { lat: 51.5146, lng: -0.1418, name: "W1 (Mayfair)" },
    N1: { lat: 51.5369, lng: -0.103, name: "N1 (Islington)" },
    E1: { lat: 51.5175, lng: -0.0588, name: "E1 (Whitechapel)" },
    NW1: { lat: 51.5311, lng: -0.1426, name: "NW1 (Camden)" },
    // Manchester Outcodes
    M1: { lat: 53.4791, lng: -2.2335, name: "M1 (Manchester Centre)" },
    M2: { lat: 53.4815, lng: -2.2467, name: "M2 (Deansgate)" },
    M3: { lat: 53.4835, lng: -2.253, name: "M3 (Salford)" },
    M15: { lat: 53.4688, lng: -2.2541, name: "M15 (Hulme)" },
    // Leeds Outcodes
    LS1: { lat: 53.7974, lng: -1.5434, name: "LS1 (Leeds Centre)" },
    LS2: { lat: 53.8015, lng: -1.539, name: "LS2 (Woodhouse)" },
    LS3: { lat: 53.8018, lng: -1.5645, name: "LS3 (Burley)" },
    // Bristol Outcodes
    BS1: { lat: 51.453, lng: -2.597, name: "BS1 (Bristol Centre)" },
    BS2: { lat: 51.458, lng: -2.576, name: "BS2 (Kingsdown)" },
    BS8: { lat: 51.4578, lng: -2.6201, name: "BS8 (Clifton)" },
    // Birmingham Outcodes
    B1: { lat: 52.4795, lng: -1.9025, name: "B1 (Birmingham Centre)" },
    B2: { lat: 52.4789, lng: -1.8967, name: "B2 (New Street)" },
  };

  if (outcode && outcodeMap[outcode]) {
    return { ...outcodeMap[outcode], type: "postcode" };
  }

  // Major cities coordinates mapping
  const cityMap: Record<string, { lat: number; lng: number; name: string }> = {
    LONDON: { lat: 51.5074, lng: -0.1278, name: "London" },
    MANCHESTER: { lat: 53.4808, lng: -2.2426, name: "Manchester" },
    LEEDS: { lat: 53.8008, lng: -1.5491, name: "Leeds" },
    BRISTOL: { lat: 51.4545, lng: -2.5879, name: "Bristol" },
    BIRMINGHAM: { lat: 52.4862, lng: -1.8904, name: "Birmingham" },
    LIVERPOOL: { lat: 53.4084, lng: -2.9916, name: "Liverpool" },
    NEWCASTLE: { lat: 54.9783, lng: -1.6178, name: "Newcastle" },
    SHEFFIELD: { lat: 53.3811, lng: -1.4701, name: "Sheffield" },
    GLASGOW: { lat: 55.8642, lng: -4.2518, name: "Glasgow" },
    EDINBURGH: { lat: 55.9533, lng: -3.1883, name: "Edinburgh" },
  };

  const cityKey = clean.replace(/[^A-Z]/g, "");
  if (cityMap[cityKey]) {
    return { ...cityMap[cityKey], type: "city" };
  }

  // Handle minor variations
  for (const [key, value] of Object.entries(cityMap)) {
    if (key.includes(cityKey) || cityKey.includes(key)) {
      return { ...value, type: "city" };
    }
  }

  return null;
}

/**
 * Calculates the distance between two coordinates in miles using the Haversine formula.
 */
export function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Radius of Earth in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
