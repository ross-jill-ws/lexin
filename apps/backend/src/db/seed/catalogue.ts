/**
 * Curated domain catalogues for the seed. Faker supplies the randomness; these tables supply the
 * realism: which brands make which parts, what their part numbers look like, and what they cost.
 */
import type { Faker } from "@faker-js/faker";
import type { MaterialType, UnitOfMeasure } from "@material-register/shared";

export const PLANTS = [
  { code: "1000", name: "Brisbane" },
  { code: "1100", name: "Gladstone" },
  { code: "1200", name: "Mackay" },
  { code: "2000", name: "Sydney" },
  { code: "2100", name: "Newcastle" },
  { code: "3000", name: "Melbourne" },
  { code: "4000", name: "Perth" },
  { code: "4100", name: "Kalgoorlie" },
] as const;

export const MANUFACTURERS = [
  "SKF",
  "Timken",
  "NSK",
  "FAG",
  "Gates",
  "Parker",
  "Bosch Rexroth",
  "Festo",
  "SMC",
  "Siemens",
  "ABB",
  "Schneider Electric",
  "WEG",
  "ifm",
  "SICK",
  "Loctite",
  "3M",
  "Mobil",
  "Shell",
  "Atlas Copco",
  "BlueScope",
  "InfraBuild",
  "Hilti",
  "Fluke",
  "Norbar",
] as const;

export type ManufacturerName = (typeof MANUFACTURERS)[number];

export type CatalogueItem = {
  manufacturer: ManufacturerName;
  description: string;
  manufacturerPartNumber: string;
};

/** One kind of material: its type, unit, price band, and how to make a plausible item of it. */
export type CategoryTemplate = {
  materialType: MaterialType;
  unitOfMeasure: UnitOfMeasure;
  /** Relative frequency in the register. */
  weight: number;
  price: { min: number; max: number };
  make: (f: Faker) => CatalogueItem;
};

const pick = <T>(f: Faker, items: readonly T[]): T => f.helpers.arrayElement(items);

const BALL_BEARINGS = [
  { code: "6203", bore: 17 },
  { code: "6204", bore: 20 },
  { code: "6205", bore: 25 },
  { code: "6206", bore: 30 },
  { code: "6207", bore: 35 },
  { code: "6208", bore: 40 },
  { code: "6305", bore: 25 },
  { code: "6308", bore: 40 },
] as const;

const BALL_BEARING_SEALS: Record<"SKF" | "FAG" | "NSK" | "Timken", readonly string[]> = {
  SKF: ["-2RS1", "-2Z", ""],
  FAG: ["-2RSR", "-2Z", ""],
  NSK: ["DDU", "ZZ", ""],
  Timken: ["-2RS", "-ZZ", ""],
};

const SPHERICAL_SUFFIX: Record<"SKF" | "FAG" | "Timken", string> = {
  SKF: " E",
  FAG: "-E1",
  Timken: "EJW33",
};

const HOSE_SIZES = [
  { dash: 4, inch: "1/4in" },
  { dash: 6, inch: "3/8in" },
  { dash: 8, inch: "1/2in" },
  { dash: 12, inch: "3/4in" },
  { dash: 16, inch: "1in" },
] as const;

const CONTACTORS = [
  { amps: 9, Siemens: "3RT2016-1AP01", "Schneider Electric": "LC1D09M7", ABB: "AF09-30-10-13" },
  { amps: 18, Siemens: "3RT2026-1AP00", "Schneider Electric": "LC1D18M7", ABB: "AF16-30-10-13" },
  { amps: 32, Siemens: "3RT2028-1AP00", "Schneider Electric": "LC1D32M7", ABB: "AF30-30-00-13" },
  { amps: 65, Siemens: "3RT2045-1AP00", "Schneider Electric": "LC1D65AM7", ABB: "AF65-30-00-13" },
] as const;

const DRIVES = [
  { kw: 4, ABB: "ACS580-01-09A5-4", Siemens: "6SL3210-1KE21-3UF1", WEG: "CFW500B10P0T4" },
  { kw: 7.5, ABB: "ACS580-01-017A-4", Siemens: "6SL3210-1KE21-7UF1", WEG: "CFW500C16P0T4" },
  { kw: 15, ABB: "ACS580-01-033A-4", Siemens: "6SL3210-1KE23-2UF1", WEG: "CFW500D31P0T4" },
  { kw: 30, ABB: "ACS580-01-062A-4", Siemens: "6SL3210-1KE26-0UF1", WEG: "CFW500E58P0T4" },
] as const;

const LOCTITE_PRODUCTS = [
  { code: "222", name: "Threadlocker, low strength" },
  { code: "243", name: "Threadlocker, medium strength" },
  { code: "263", name: "Threadlocker, high strength" },
  { code: "638", name: "Retaining compound, high strength" },
  { code: "515", name: "Gasket maker, flange sealant" },
  { code: "5699", name: "Gasket maker, silicone, grey" },
] as const;

type Oil = { name: string; product: string };

const OILS: Record<"Mobil" | "Shell", readonly Oil[]> = {
  Mobil: [
    { name: "Hydraulic oil, ISO VG 46", product: "DTE 10 Excel 46" },
    { name: "Hydraulic oil, ISO VG 68", product: "DTE 25" },
    { name: "Gear oil, ISO VG 220", product: "Mobilgear 600 XP 220" },
    { name: "Compressor oil, ISO VG 46", product: "Rarus 425" },
  ],
  Shell: [
    { name: "Hydraulic oil, ISO VG 46", product: "Tellus S2 MX 46" },
    { name: "Hydraulic oil, ISO VG 68", product: "Tellus S2 MX 68" },
    { name: "Gear oil, ISO VG 220", product: "Omala S2 GX 220" },
    { name: "Turbine oil, ISO VG 32", product: "Turbo T 32" },
  ],
};

const GREASES = [
  { manufacturer: "Mobil", product: "Mobilux EP 2", name: "Grease, lithium EP, NLGI 2" },
  { manufacturer: "Shell", product: "Gadus S2 V220 2", name: "Grease, lithium EP, NLGI 2" },
  { manufacturer: "SKF", product: "LGHP 2/18", name: "Grease, polyurea, high temperature" },
  { manufacturer: "SKF", product: "LGEP 2/18", name: "Grease, lithium EP, heavy load" },
] as const satisfies readonly { manufacturer: ManufacturerName; product: string; name: string }[];

const STEEL_PLATE_THICKNESS = [6, 8, 10, 12, 16, 20, 25] as const;

export const CATEGORY_TEMPLATES: readonly CategoryTemplate[] = [
  {
    materialType: "SPARE_PART",
    unitOfMeasure: "EA",
    weight: 14,
    price: { min: 8, max: 95 },
    make: (f) => {
      const manufacturer = pick(f, ["SKF", "FAG", "NSK", "Timken"] as const);
      const { code, bore } = pick(f, BALL_BEARINGS);
      const seal = pick(f, BALL_BEARING_SEALS[manufacturer]);
      const sealing = seal === "" ? "open" : /Z/.test(seal) ? "shielded" : "sealed";
      return {
        manufacturer,
        description: `Bearing, deep groove ball, ${bore}mm bore, ${sealing}`,
        manufacturerPartNumber: `${code}${seal}`,
      };
    },
  },
  {
    materialType: "SPARE_PART",
    unitOfMeasure: "EA",
    weight: 6,
    price: { min: 120, max: 1450 },
    make: (f) => {
      const manufacturer = pick(f, ["SKF", "FAG", "Timken"] as const);
      const size = f.number.int({ min: 8, max: 24 });
      const series = pick(f, ["222", "223", "232"]);
      return {
        manufacturer,
        description: `Bearing, spherical roller, ${size * 5}mm bore`,
        manufacturerPartNumber: `${series}${String(size).padStart(2, "0")}${SPHERICAL_SUFFIX[manufacturer]}`,
      };
    },
  },
  {
    materialType: "SPARE_PART",
    unitOfMeasure: "EA",
    weight: 5,
    price: { min: 25, max: 320 },
    make: (f) => {
      const manufacturer = pick(f, ["Timken", "SKF", "NSK"] as const);
      const size = f.number.int({ min: 5, max: 20 });
      const series = pick(f, ["302", "303", "322", "323"]);
      return {
        manufacturer,
        description: `Bearing, tapered roller, ${size * 5}mm bore`,
        manufacturerPartNumber: `${series}${String(size).padStart(2, "0")}`,
      };
    },
  },
  {
    materialType: "SPARE_PART",
    unitOfMeasure: "EA",
    weight: 8,
    price: { min: 14, max: 120 },
    make: (f) => {
      const section = pick(f, ["A", "B", "C"]);
      const inches = f.number.int({ min: 30, max: 140 });
      return {
        manufacturer: "Gates",
        description: `V-belt, classical section ${section}, ${Math.round(inches * 25.4)}mm`,
        manufacturerPartNumber: `${section}${inches}`,
      };
    },
  },
  {
    materialType: "SPARE_PART",
    unitOfMeasure: "EA",
    weight: 3,
    price: { min: 60, max: 480 },
    make: (f) => {
      const pitch = pick(f, [8, 14]);
      const length = f.number.int({ min: 50, max: 400 }) * pitch;
      const width = pick(f, [20, 30, 50, 85]);
      return {
        manufacturer: "Gates",
        description: `Timing belt, PowerGrip GT, ${pitch}mm pitch, ${length}mm x ${width}mm`,
        manufacturerPartNumber: `${pitch}MGT-${length}-${width}`,
      };
    },
  },
  {
    materialType: "SPARE_PART",
    unitOfMeasure: "EA",
    weight: 7,
    price: { min: 6, max: 85 },
    make: (f) => {
      const { dash, inch } = pick(f, HOSE_SIZES);
      const fitting = pick(f, [
        { code: "F5OX", name: "JIC 37° male connector" },
        { code: "C5OX", name: "JIC 37° male 90° elbow" },
        { code: "FF5OX", name: "O-ring face seal male connector" },
      ]);
      return {
        manufacturer: "Parker",
        description: `Fitting, hydraulic, ${fitting.name}, ${inch}`,
        manufacturerPartNumber: `${dash} ${fitting.code}-S`,
      };
    },
  },
  {
    materialType: "SPARE_PART",
    unitOfMeasure: "M",
    weight: 4,
    price: { min: 18, max: 140 },
    make: (f) => {
      const { dash, inch } = pick(f, HOSE_SIZES);
      const hose = pick(f, [
        { code: "471TC", name: "2-wire braid" },
        { code: "451TC", name: "1-wire braid" },
        { code: "787TC", name: "4-spiral" },
      ]);
      return {
        manufacturer: "Parker",
        description: `Hose, hydraulic, ${hose.name}, ${inch}`,
        manufacturerPartNumber: `${hose.code}-${dash}`,
      };
    },
  },
  {
    materialType: "SPARE_PART",
    unitOfMeasure: "EA",
    weight: 5,
    price: { min: 45, max: 420 },
    make: (f) => {
      const manufacturer = pick(f, ["Parker", "Bosch Rexroth"] as const);
      const micron = pick(f, [3, 10, 25]);
      return {
        manufacturer,
        description: `Filter element, hydraulic return, ${micron} micron`,
        manufacturerPartNumber:
          manufacturer === "Parker"
            ? `${f.string.numeric(6)}Q`
            : `R928${f.string.numeric({ length: 6, allowLeadingZeros: true })}`,
      };
    },
  },
  {
    materialType: "SPARE_PART",
    unitOfMeasure: "EA",
    weight: 3,
    price: { min: 380, max: 2600 },
    make: (f) => {
      const spool = pick(f, ["D", "E", "J"]);
      const size = pick(f, [6, 10]);
      return {
        manufacturer: "Bosch Rexroth",
        description: `Valve, directional, solenoid, NG${size}, 24V DC, spool ${spool}`,
        manufacturerPartNumber: `4WE${size}${spool}6X/EG24N9K4`,
      };
    },
  },
  {
    materialType: "SPARE_PART",
    unitOfMeasure: "EA",
    weight: 4,
    price: { min: 140, max: 980 },
    make: (f) => {
      const manufacturer = pick(f, ["Festo", "SMC"] as const);
      const bore = pick(f, [32, 40, 50, 63, 80]);
      const stroke = pick(f, [50, 100, 160, 200, 250]);
      return {
        manufacturer,
        description: `Cylinder, pneumatic, ${bore}mm bore, ${stroke}mm stroke`,
        manufacturerPartNumber:
          manufacturer === "Festo" ? `DSBC-${bore}-${stroke}-PPVA-N3` : `CP96SDB${bore}-${stroke}`,
      };
    },
  },
  {
    materialType: "SPARE_PART",
    unitOfMeasure: "EA",
    weight: 5,
    price: { min: 55, max: 640 },
    make: (f) => {
      const manufacturer = pick(f, ["Siemens", "Schneider Electric", "ABB"] as const);
      const contactor = pick(f, CONTACTORS);
      return {
        manufacturer,
        description: `Contactor, 3-pole, ${contactor.amps}A, 230V AC coil`,
        manufacturerPartNumber: contactor[manufacturer],
      };
    },
  },
  {
    materialType: "SPARE_PART",
    unitOfMeasure: "EA",
    weight: 2,
    price: { min: 1100, max: 9800 },
    make: (f) => {
      const manufacturer = pick(f, ["ABB", "Siemens", "WEG"] as const);
      const drive = pick(f, DRIVES);
      return {
        manufacturer,
        description: `Drive, variable speed, ${drive.kw}kW, 400V`,
        manufacturerPartNumber: drive[manufacturer],
      };
    },
  },
  {
    materialType: "SPARE_PART",
    unitOfMeasure: "EA",
    weight: 2,
    price: { min: 650, max: 7400 },
    make: (f) => {
      const manufacturer = pick(f, ["WEG", "ABB", "Siemens"] as const);
      const kw = pick(f, [2.2, 5.5, 7.5, 11, 18.5, 30]);
      const poles = pick(f, [2, 4, 6]);
      const frame = f.number.int({ min: 90, max: 200 });
      const mpn = {
        WEG: `W22-${frame}L-${poles}P-${kw}KW`,
        ABB: `3GBP${f.string.numeric(6)}-ADG`,
        Siemens: `1LE1003-${f.string.numeric(1)}${pick(f, ["AB", "BB", "CB"])}${f.string.numeric(2)}-2AA4`,
      }[manufacturer];
      return {
        manufacturer,
        description: `Motor, electric, ${kw}kW, ${poles}-pole, 415V, TEFC`,
        manufacturerPartNumber: mpn,
      };
    },
  },
  {
    materialType: "SPARE_PART",
    unitOfMeasure: "EA",
    weight: 4,
    price: { min: 60, max: 340 },
    make: (f) => {
      const manufacturer = pick(f, ["ifm", "SICK"] as const);
      const thread = pick(f, [12, 18, 30]);
      return {
        manufacturer,
        description: `Sensor, inductive proximity, M${thread}, PNP`,
        manufacturerPartNumber:
          manufacturer === "ifm"
            ? `${pick(f, ["IF", "IG", "II"])}${f.string.numeric(4)}`
            : `IME${thread}-${pick(f, ["04", "08", "12"])}BPSZC0S`,
      };
    },
  },
  {
    materialType: "SPARE_PART",
    unitOfMeasure: "EA",
    weight: 3,
    price: { min: 90, max: 760 },
    make: (f) => {
      const part = pick(f, [
        { name: "Element, air filter, compressor intake", prefix: "1613" },
        { name: "Element, oil separator, compressor", prefix: "2901" },
        { name: "Filter, oil, compressor", prefix: "1625" },
      ]);
      return {
        manufacturer: "Atlas Copco",
        description: part.name,
        manufacturerPartNumber: `${part.prefix} ${f.string.numeric(4)} ${pick(f, ["00", "01", "80"])}`,
      };
    },
  },
  {
    materialType: "CONSUMABLE",
    unitOfMeasure: "EA",
    weight: 6,
    price: { min: 12, max: 160 },
    make: (f) => {
      const product = pick(f, LOCTITE_PRODUCTS);
      const size = pick(f, ["10ml", "50ml", "250ml"]);
      return {
        manufacturer: "Loctite",
        description: `${product.name}, ${size}`,
        manufacturerPartNumber: `${product.code}-${size.replace("ml", "")}`,
      };
    },
  },
  {
    materialType: "CONSUMABLE",
    unitOfMeasure: "L",
    weight: 5,
    price: { min: 4, max: 18 },
    make: (f) => {
      const manufacturer = pick(f, ["Mobil", "Shell"] as const);
      const oil = pick(f, OILS[manufacturer]);
      const pack = pick(f, [20, 205]);
      return {
        manufacturer,
        description: `${oil.name}, ${pack}L ${pack === 20 ? "pail" : "drum"}`,
        manufacturerPartNumber: `${oil.product} ${pack}L`,
      };
    },
  },
  {
    materialType: "CONSUMABLE",
    unitOfMeasure: "KG",
    weight: 3,
    price: { min: 9, max: 42 },
    make: (f) => {
      const grease = pick(f, GREASES);
      return {
        manufacturer: grease.manufacturer,
        description: `${grease.name}, 18kg pail`,
        manufacturerPartNumber: grease.product,
      };
    },
  },
  {
    materialType: "CONSUMABLE",
    unitOfMeasure: "BOX",
    weight: 4,
    price: { min: 25, max: 190 },
    make: (f) => {
      const diameter = pick(f, [115, 125, 180]);
      const grit = pick(f, [36, 60, 80, 120]);
      return {
        manufacturer: "3M",
        description: `Disc, fibre, Cubitron II, ${diameter}mm, ${grit}+ grit, box of 25`,
        manufacturerPartNumber: `982C-${diameter}-${grit}`,
      };
    },
  },
  {
    materialType: "CONSUMABLE",
    unitOfMeasure: "PK",
    weight: 3,
    price: { min: 8, max: 75 },
    make: (f) => {
      const item = pick(f, [
        { name: "Earplugs, disposable, corded, pack of 100", mpn: "1110" },
        { name: "Safety glasses, clear lens, anti-fog, pack of 20", mpn: "SF201AF" },
        { name: "Respirator, P2, valved, pack of 10", mpn: "8822" },
        {
          name: "Tape, electrical, vinyl, 19mm, pack of 10",
          mpn: `Super 33+ ${f.number.int({ min: 1, max: 9 })}`,
        },
      ]);
      return { manufacturer: "3M", description: item.name, manufacturerPartNumber: item.mpn };
    },
  },
  {
    materialType: "RAW_MATERIAL",
    unitOfMeasure: "EA",
    weight: 3,
    price: { min: 180, max: 2400 },
    make: (f) => {
      const thickness = pick(f, STEEL_PLATE_THICKNESS);
      const sheet = pick(f, ["2400x1200", "3000x1500", "6000x2400"]);
      return {
        manufacturer: "BlueScope",
        description: `Plate, steel, grade 250, ${thickness}mm, ${sheet}`,
        manufacturerPartNumber: `XLERPLATE-250-${thickness}-${sheet}`,
      };
    },
  },
  {
    materialType: "RAW_MATERIAL",
    unitOfMeasure: "M",
    weight: 3,
    price: { min: 6, max: 95 },
    make: (f) => {
      const shape = pick(f, [
        {
          name: "Flat bar",
          code: "FB",
          size: `${pick(f, [25, 50, 75, 100])}x${pick(f, [6, 8, 10])}`,
        },
        { name: "Equal angle", code: "EA", size: `${pick(f, [50, 65, 75])}x${pick(f, [5, 6, 8])}` },
        { name: "Round bar", code: "RB", size: `${pick(f, [16, 20, 32, 50])}` },
      ]);
      return {
        manufacturer: "InfraBuild",
        description: `${shape.name}, steel, grade 300, ${shape.size}mm`,
        manufacturerPartNumber: `${shape.code}${shape.size.replace("x", "X")}-300`,
      };
    },
  },
  {
    materialType: "TOOL",
    unitOfMeasure: "EA",
    weight: 2,
    price: { min: 320, max: 2900 },
    make: (f) => {
      const tool = pick(f, [
        { manufacturer: "Norbar", name: "Torque wrench, 1/2in drive, 40-200Nm", mpn: "TTi200" },
        { manufacturer: "Norbar", name: "Torque wrench, 3/4in drive, 100-700Nm", mpn: "Model 5R" },
        { manufacturer: "Hilti", name: "Rotary hammer, cordless, SDS-plus", mpn: "TE 30-A36" },
        { manufacturer: "Hilti", name: "Angle grinder, cordless, 125mm", mpn: "AG 6D-22" },
        { manufacturer: "Fluke", name: "Multimeter, digital, true RMS", mpn: "87V" },
        { manufacturer: "Fluke", name: "Clamp meter, true RMS, 1000A", mpn: "376 FC" },
        { manufacturer: "SKF", name: "Bearing heater, induction", mpn: "TIH 030M/230V" },
      ] as const satisfies readonly {
        manufacturer: ManufacturerName;
        name: string;
        mpn: string;
      }[]);
      return {
        manufacturer: tool.manufacturer,
        description: tool.name,
        manufacturerPartNumber: tool.mpn,
      };
    },
  },
];
