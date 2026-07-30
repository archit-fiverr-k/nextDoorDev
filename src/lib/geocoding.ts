export interface Coordinates {
  lat: number;
  lng: number;
  name: string;
  type: "city" | "postcode";
}

/**
 * Normalizes a UK postcode (e.g. "ls16az" -> "LS1 6AZ", "m1 1ad" -> "M1 1AD").
 */
export function normalizePostcode(postcode: string): string {
  const clean = postcode.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (clean.length >= 5 && clean.length <= 7) {
    const incode = clean.slice(-3);
    const outcode = clean.slice(0, clean.length - 3);
    return `${outcode} ${incode}`;
  }
  return postcode.trim().toUpperCase();
}

/**
 * Checks if a string looks like a UK postcode or outcode.
 */
export function isUKPostcode(query: string): boolean {
  const clean = query.replace(/\s+/g, "").toUpperCase();
  const fullRegex = /^[A-Z]{1,2}[0-9][0-9A-Z]?[0-9][A-Z]{2}$/;
  const outcodeRegex = /^[A-Z]{1,2}[0-9][0-9A-Z]?$/;
  return fullRegex.test(clean) || outcodeRegex.test(clean);
}

// Major outcodes coordinates mapping
const OUTCODE_MAP: Record<string, { lat: number; lng: number; name: string }> = {
  // London Outcodes
  EC1: { lat: 51.5234, lng: -0.0988, name: "EC1 (Central London)" },
  EC2: { lat: 51.5185, lng: -0.086, name: "EC2 (Bishopsgate)" },
  WC1: { lat: 51.5222, lng: -0.1197, name: "WC1 (Bloomsbury)" },
  SW1: { lat: 51.4975, lng: -0.1457, name: "SW1 (Westminster)" },
  SW1A: { lat: 51.501, lng: -0.142, name: "SW1A (Buckingham Palace)" },
  SE1: { lat: 51.5012, lng: -0.0911, name: "SE1 (Waterloo)" },
  W1: { lat: 51.5146, lng: -0.1418, name: "W1 (Mayfair)" },
  W1W: { lat: 51.5186, lng: -0.1412, name: "W1W (Fitzrovia)" },
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
  B5: { lat: 52.4725, lng: -1.8942, name: "B5 (Bullring)" },
};

// All UK 2-letter & 1-letter Area Code Fallback Map
const POSTCODE_AREA_MAP: Record<string, { lat: number; lng: number; name: string }> = {
  AB: { lat: 57.1497, lng: -2.0943, name: "Aberdeen" },
  AL: { lat: 51.7527, lng: -0.3394, name: "St Albans" },
  B: { lat: 52.4862, lng: -1.8904, name: "Birmingham" },
  BA: { lat: 51.3811, lng: -2.359, name: "Bath" },
  BB: { lat: 53.7488, lng: -2.4878, name: "Blackburn" },
  BD: { lat: 53.796, lng: -1.7594, name: "Bradford" },
  BH: { lat: 50.7192, lng: -1.8808, name: "Bournemouth" },
  BL: { lat: 53.5769, lng: -2.4282, name: "Bolton" },
  BN: { lat: 50.8225, lng: -0.1372, name: "Brighton" },
  BR: { lat: 51.4039, lng: -0.0198, name: "Bromley" },
  BS: { lat: 51.4545, lng: -2.5879, name: "Bristol" },
  CA: { lat: 54.8925, lng: -2.9329, name: "Carlisle" },
  CB: { lat: 52.2053, lng: 0.1218, name: "Cambridge" },
  CF: { lat: 51.4816, lng: -3.1791, name: "Cardiff" },
  CH: { lat: 53.1905, lng: -2.891, name: "Chester" },
  CM: { lat: 51.7356, lng: 0.4685, name: "Chelmsford" },
  CO: { lat: 51.8892, lng: 0.9042, name: "Colchester" },
  CR: { lat: 51.3762, lng: -0.0982, name: "Croydon" },
  CT: { lat: 51.2802, lng: 1.0789, name: "Canterbury" },
  CV: { lat: 52.4068, lng: -1.5197, name: "Coventry" },
  CW: { lat: 53.0991, lng: -2.4411, name: "Crewe" },
  DA: { lat: 51.4463, lng: 0.2183, name: "Dartford" },
  DD: { lat: 56.462, lng: -2.9707, name: "Dundee" },
  DE: { lat: 52.9225, lng: -1.4746, name: "Derby" },
  DG: { lat: 55.0708, lng: -3.6053, name: "Dumfries" },
  DH: { lat: 54.7761, lng: -1.5733, name: "Durham" },
  DL: { lat: 54.5244, lng: -1.5543, name: "Darlington" },
  DN: { lat: 53.5228, lng: -1.1311, name: "Doncaster" },
  DT: { lat: 50.7147, lng: -2.4377, name: "Dorchester" },
  DY: { lat: 52.5123, lng: -2.0811, name: "Dudley" },
  E: { lat: 51.545, lng: -0.055, name: "East London" },
  EC: { lat: 51.5175, lng: -0.09, name: "East Central London" },
  EH: { lat: 55.9533, lng: -3.1883, name: "Edinburgh" },
  EN: { lat: 51.6538, lng: -0.0799, name: "Enfield" },
  EX: { lat: 50.726, lng: -3.5275, name: "Exeter" },
  FK: { lat: 56.0019, lng: -3.7839, name: "Falkirk" },
  FY: { lat: 53.8175, lng: -3.0357, name: "Blackpool" },
  G: { lat: 55.8642, lng: -4.2518, name: "Glasgow" },
  GL: { lat: 51.8642, lng: -2.238, name: "Gloucester" },
  GU: { lat: 51.2362, lng: -0.5704, name: "Guildford" },
  HA: { lat: 51.5806, lng: -0.3342, name: "Harrow" },
  HD: { lat: 53.6458, lng: -1.785, name: "Huddersfield" },
  HG: { lat: 54.0034, lng: -1.5385, name: "Harrogate" },
  HP: { lat: 51.7523, lng: -0.4692, name: "Hemel Hempstead" },
  HR: { lat: 52.0564, lng: -2.716, name: "Hereford" },
  HU: { lat: 53.7457, lng: -0.3367, name: "Hull" },
  HX: { lat: 53.7248, lng: -1.8601, name: "Halifax" },
  IG: { lat: 51.559, lng: 0.0741, name: "Ilford" },
  IP: { lat: 52.0567, lng: 1.1482, name: "Ipswich" },
  IV: { lat: 57.4778, lng: -4.2247, name: "Inverness" },
  KA: { lat: 55.6111, lng: -4.4958, name: "Kilmarnock" },
  KW: { lat: 58.441, lng: -3.095, name: "Wick" },
  KY: { lat: 56.1132, lng: -3.1595, name: "Kirkcaldy" },
  L: { lat: 53.4084, lng: -2.9916, name: "Liverpool" },
  LA: { lat: 54.0466, lng: -2.8007, name: "Lancaster" },
  LD: { lat: 52.2415, lng: -3.3776, name: "Llandrindod Wells" },
  LE: { lat: 52.6369, lng: -1.1398, name: "Leicester" },
  LL: { lat: 53.3241, lng: -3.8276, name: "Llandudno" },
  LN: { lat: 53.2307, lng: -0.5406, name: "Lincoln" },
  LS: { lat: 53.8008, lng: -1.5491, name: "Leeds" },
  LU: { lat: 51.8787, lng: -0.42, name: "Luton" },
  M: { lat: 53.4808, lng: -2.2426, name: "Manchester" },
  ME: { lat: 51.3889, lng: 0.5058, name: "Medway" },
  MK: { lat: 52.0406, lng: -0.7594, name: "Milton Keynes" },
  ML: { lat: 55.7877, lng: -3.9934, name: "Motherwell" },
  N: { lat: 51.56, lng: -0.11, name: "North London" },
  NE: { lat: 54.9783, lng: -1.6178, name: "Newcastle" },
  NG: { lat: 52.9548, lng: -1.1581, name: "Nottingham" },
  NN: { lat: 52.2405, lng: -0.9027, name: "Northampton" },
  NP: { lat: 51.5842, lng: -2.9977, name: "Newport" },
  NR: { lat: 52.6309, lng: 1.2974, name: "Norwich" },
  NW: { lat: 51.55, lng: -0.2, name: "North West London" },
  OL: { lat: 53.5409, lng: -2.1164, name: "Oldham" },
  OX: { lat: 51.752, lng: -1.2577, name: "Oxford" },
  PA: { lat: 55.8456, lng: -4.4239, name: "Paisley" },
  PE: { lat: 52.5725, lng: -0.2478, name: "Peterborough" },
  PH: { lat: 56.395, lng: -3.4308, name: "Perth" },
  PL: { lat: 50.3755, lng: -4.1427, name: "Plymouth" },
  PO: { lat: 50.8198, lng: -1.088, name: "Portsmouth" },
  PR: { lat: 53.7632, lng: -2.7031, name: "Preston" },
  RG: { lat: 51.4543, lng: -0.9781, name: "Reading" },
  RH: { lat: 51.24, lng: -0.17, name: "Redhill" },
  RM: { lat: 51.5762, lng: 0.1809, name: "Romford" },
  S: { lat: 53.3811, lng: -1.4701, name: "Sheffield" },
  SA: { lat: 51.6214, lng: -3.9436, name: "Swansea" },
  SE: { lat: 51.48, lng: -0.05, name: "South East London" },
  SG: { lat: 51.9038, lng: -0.202, name: "Stevenage" },
  SK: { lat: 53.4106, lng: -2.1575, name: "Stockport" },
  SL: { lat: 51.5105, lng: -0.595, name: "Slough" },
  SM: { lat: 51.3618, lng: -0.1945, name: "Sutton" },
  SN: { lat: 51.5558, lng: -1.7797, name: "Swindon" },
  SO: { lat: 50.9097, lng: -1.4044, name: "Southampton" },
  SP: { lat: 51.0688, lng: -1.7945, name: "Salisbury" },
  SR: { lat: 54.9069, lng: -1.3819, name: "Sunderland" },
  SS: { lat: 51.5459, lng: 0.7077, name: "Southend" },
  ST: { lat: 53.0042, lng: -2.1854, name: "Stoke-on-Trent" },
  SW: { lat: 51.46, lng: -0.16, name: "South West London" },
  SY: { lat: 52.7073, lng: -2.7553, name: "Shrewsbury" },
  TA: { lat: 51.0153, lng: -3.1027, name: "Taunton" },
  TD: { lat: 55.6174, lng: -2.8021, name: "Galashiels" },
  TF: { lat: 52.6776, lng: -2.4497, name: "Telford" },
  TN: { lat: 51.1947, lng: 0.2743, name: "Tonbridge" },
  TQ: { lat: 50.4619, lng: -3.5253, name: "Torquay" },
  TR: { lat: 50.2632, lng: -5.051, name: "Truro" },
  TS: { lat: 54.5742, lng: -1.235, name: "Middlesbrough" },
  TW: { lat: 51.449, lng: -0.337, name: "Twickenham" },
  UB: { lat: 51.5436, lng: -0.477, name: "Uxbridge" },
  W: { lat: 51.51, lng: -0.2, name: "West London" },
  WA: { lat: 53.39, lng: -2.597, name: "Warrington" },
  WC: { lat: 51.515, lng: -0.12, name: "West Central London" },
  WD: { lat: 51.6565, lng: -0.3903, name: "Watford" },
  WF: { lat: 53.6833, lng: -1.4977, name: "Wakefield" },
  WN: { lat: 53.5448, lng: -2.6318, name: "Wigan" },
  WR: { lat: 52.1936, lng: -2.2215, name: "Worcester" },
  WS: { lat: 52.5862, lng: -1.9829, name: "Walsall" },
  WV: { lat: 52.587, lng: -2.1288, name: "Wolverhampton" },
  YO: { lat: 53.9591, lng: -1.0815, name: "York" },
};

// Major cities coordinates mapping
const CITY_MAP: Record<string, { lat: number; lng: number; name: string }> = {
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
  BRADFORD: { lat: 53.796, lng: -1.7594, name: "Bradford" },
  CARDIFF: { lat: 51.4816, lng: -3.1791, name: "Cardiff" },
  BELFAST: { lat: 54.5973, lng: -5.9301, name: "Belfast" },
  NOTTINGHAM: { lat: 52.9548, lng: -1.1581, name: "Nottingham" },
};

/**
 * Resolves a city name, postcode, or outcode to UK coordinates (offline geocoder).
 */
export function geocodeLocation(query: string): Coordinates | null {
  if (!query) return null;
  const clean = query.trim().toUpperCase();
  if (!clean) return null;

  // 1. Postcode outcode extraction (e.g. "LS1 6AZ" -> "LS1", "M1 1AD" -> "M1", "BD1" -> "BD1", "W1D 1AN" -> "W1D")
  const outcodeMatch = clean.match(/^([A-Z]{1,2}[0-9][0-9A-Z]?)/i);
  const outcode = outcodeMatch ? outcodeMatch[1].toUpperCase() : "";

  if (outcode && OUTCODE_MAP[outcode]) {
    return { ...OUTCODE_MAP[outcode], type: "postcode" };
  }

  // 1b. Base Outcode extraction (e.g. "W1D" -> "W1", "EC1V" -> "EC1", "SW1A" -> "SW1")
  const baseOutcodeMatch = outcode.match(/^([A-Z]{1,2}[0-9]+)/i);
  const baseOutcode = baseOutcodeMatch ? baseOutcodeMatch[1].toUpperCase() : "";
  if (baseOutcode && OUTCODE_MAP[baseOutcode]) {
    return {
      ...OUTCODE_MAP[baseOutcode],
      name: `${outcode} (${OUTCODE_MAP[baseOutcode].name})`,
      type: "postcode",
    };
  }

  // 2. Postcode Area Extraction (e.g. "LS1" -> "LS", "BD1" -> "BD", "M1" -> "M", "SW1A" -> "SW")
  const areaMatch = clean.match(/^([A-Z]{1,2})/i);
  const areaCode = areaMatch ? areaMatch[1].toUpperCase() : "";

  if (areaCode && POSTCODE_AREA_MAP[areaCode]) {
    return {
      ...POSTCODE_AREA_MAP[areaCode],
      name: `${outcode || areaCode} (${POSTCODE_AREA_MAP[areaCode].name})`,
      type: "postcode",
    };
  }

  // 3. City name lookup
  const cityKey = clean.replace(/[^A-Z]/g, "");
  if (CITY_MAP[cityKey]) {
    return { ...CITY_MAP[cityKey], type: "city" };
  }

  for (const [key, value] of Object.entries(CITY_MAP)) {
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
