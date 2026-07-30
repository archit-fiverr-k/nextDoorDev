import fs from "fs";
import path from "path";
import * as xlsx from "xlsx";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================
// TYPES & INTERFACES
// ============================================================

interface RawServiceRow {
  rowIndex: number;
  category: string;
  serviceName: string;
  serviceType: string;
  rawPrice: any;
  bookingButton: string;
  providingStatus?: string;
  notes?: string;
  description?: string;
  eligibility?: string;
  preparation?: string;
  aftercare?: string;
}

interface ValidatedServiceRow {
  rowIndex: number;
  categoryName: string;
  categorySlug: string;
  name: string;
  serviceType: "NHS" | "PRIVATE";
  defaultPrice: number;
  priceLocked: boolean;
  bookingEnabled: boolean;
  description: string | null;
  shortDescription: string | null;
  eligibility: string | null;
  preparation: string | null;
  aftercare: string | null;
  keywords: string[];
  seoTitle: string;
  seoDescription: string;
  schemaName: string;
}

interface SkippedRowLog {
  rowIndex: number;
  serviceName: string;
  reasons: string[];
}

// ============================================================
// HELPERS: NORMALIZATION & STRING CLEANING
// ============================================================

/**
 * Trims whitespace and collapses multiple spaces into a single space.
 * Converts empty/whitespace-only strings to null.
 */
function trimAndClean(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  const str = String(val).replace(/\s+/g, " ").trim();
  return str.length > 0 ? str : null;
}

/**
 * Generates an SEO-friendly URL slug.
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .replace(/\s+/g, "-") // replace spaces with hyphens
    .replace(/-+/g, "-") // remove duplicate hyphens
    .replace(/^-+|-+$/g, ""); // trim hyphens
}

/**
 * Ensures unique slug by appending counter suffixes (-2, -3, etc.)
 */
function getUniqueSlug(baseSlug: string, existingSlugs: Set<string>): string {
  let slug = baseSlug;
  let counter = 2;
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  existingSlugs.add(slug);
  return slug;
}

/**
 * Normalizes boolean inputs (YES, Yes, TRUE, 1, BOOK NOW -> true; NO, False, 0 -> false).
 */
function normalizeBoolean(val: unknown): boolean {
  if (val === null || val === undefined) return true; // Default to enabled
  const clean = String(val).trim().toUpperCase();
  if (["NO", "FALSE", "0", "DISABLED", "NONE"].includes(clean)) {
    return false;
  }
  return true;
}

/**
 * Normalizes service type into "NHS" or "PRIVATE".
 */
function normalizeServiceType(rawType: unknown): "NHS" | "PRIVATE" {
  if (!rawType) return "PRIVATE";
  const str = String(rawType).trim().toUpperCase();
  return str.includes("NHS") ? "NHS" : "PRIVATE";
}

/**
 * Normalizes price strings (e.g. "free", "£15.00", 15) to a clean number.
 */
function normalizePrice(
  rawPrice: unknown,
  serviceType: "NHS" | "PRIVATE"
): { price: number; isValid: boolean } {
  if (serviceType === "NHS") {
    return { price: 0, isValid: true };
  }
  if (rawPrice === null || rawPrice === undefined) {
    return { price: 0, isValid: true };
  }

  const str = String(rawPrice).trim().toLowerCase();
  if (str === "free" || str === "0" || str === "0.00" || str === "£0" || str === "£0.00") {
    return { price: 0, isValid: true };
  }

  const cleaned = str.replace(/[^0-9.]/g, "");
  const parsed = parseFloat(cleaned);

  if (isNaN(parsed) || parsed < 0) {
    return { price: 0, isValid: false };
  }

  return { price: parsed, isValid: true };
}

/**
 * Generates searchable keywords list from service fields.
 */
function generateKeywords(name: string, category: string, description?: string | null): string[] {
  const textSource = `${name} ${category} ${description || ""}`;
  const tokens = textSource
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  const synonyms: string[] = [];
  const lowerName = name.toLowerCase();
  if (lowerName.includes("covid")) synonyms.push("vaccine", "booster", "jab", "corona");
  if (lowerName.includes("flu")) synonyms.push("influenza", "jab", "winter", "seasonal");
  if (lowerName.includes("blood pressure")) synonyms.push("hypertension", "heart", "cardio", "bpm");
  if (lowerName.includes("smoking")) synonyms.push("quit", "tobacco", "nicotine", "nrt");
  if (lowerName.includes("travel"))
    synonyms.push("destination", "holiday", "vaccination", "immunisation");
  if (lowerName.includes("weight"))
    synonyms.push("slimming", "semaglutide", "tirzepatide", "wegovy", "mounjaro");
  if (lowerName.includes("uti")) synonyms.push("urinary", "cystitis", "infection", "antibiotics");

  const combined = Array.from(new Set([...tokens, ...synonyms]));
  return combined.slice(0, 30); // Limit to top 30 keywords
}

// ============================================================
// EXCEL FILE READER
// ============================================================

function findExcelFilePath(): string {
  const possiblePaths = [
    path.join(process.cwd(), "public", "assets", "Pharmacy_checklist_with_descriptions.xlsx"),
    path.join(process.cwd(), "data", "Pharmacy_checklist_with_descriptions.xlsx"),
    "C:\\Users\\archi\\Desktop\\Nav Roll Projects\\Next Door Clinic\\public\\assets\\Pharmacy_checklist_with_descriptions.xlsx",
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  throw new Error(
    `❌ Excel file not found! Checked locations:\n${possiblePaths.map((p) => ` - ${p}`).join("\n")}`
  );
}

function parseExcelFile(filePath: string): RawServiceRow[] {
  console.log(`\n📖 Reading Master Service Catalogue from:\n   ${filePath}`);

  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames.includes("Service Checklist")
    ? "Service Checklist"
    : workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("❌ Excel workbook does not contain any valid worksheet.");
  }

  const sheet = workbook.Sheets[sheetName];
  const rows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  if (rows.length < 2) {
    throw new Error("❌ Excel sheet is empty or lacks header rows.");
  }

  // Detect header row (looking for "Category" or "Service Name")
  let headerIndex = -1;
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const rowStr = JSON.stringify(rows[i] || []).toLowerCase();
    if (rowStr.includes("category") && rowStr.includes("service name")) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    headerIndex = 1; // Default to row index 1
  }

  const headers: string[] = (rows[headerIndex] || []).map((h) => String(h || "").trim());

  // Dynamically map column indices
  const getColIndex = (keywords: string[]): number => {
    return headers.findIndex((h) =>
      keywords.some((kw) => h.toLowerCase().includes(kw.toLowerCase()))
    );
  };

  const colCategory = getColIndex(["category"]);
  const colServiceName = getColIndex(["service name"]);
  const colServiceType = getColIndex(["nhs / private", "nhs", "type"]);
  const colPrice = getColIndex(["price"]);
  const colBooking = getColIndex(["booking"]);
  const colProviding = getColIndex(["providing service", "providing"]);
  const colNotes = getColIndex(["notes", "comments"]);
  const colDescription = getColIndex(["description", "service description"]);
  const colEligibility = getColIndex(["eligibility", "conditions"]);
  const colPreparation = getColIndex(["preparation", "prep"]);
  const colAftercare = getColIndex(["aftercare"]);

  if (colCategory === -1 || colServiceName === -1) {
    throw new Error(
      `❌ Unable to detect required columns ('Category', 'Service Name') in header row ${headerIndex + 1}.`
    );
  }

  const rawRows: RawServiceRow[] = [];

  for (let r = headerIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const category = trimAndClean(row[colCategory]);
    const serviceName = trimAndClean(row[colServiceName]);

    // Skip empty rows where both category & service name are missing
    if (!category && !serviceName) continue;

    rawRows.push({
      rowIndex: r + 1,
      category: category || "",
      serviceName: serviceName || "",
      serviceType: trimAndClean(colServiceType !== -1 ? row[colServiceType] : "") || "PRIVATE",
      rawPrice: colPrice !== -1 ? row[colPrice] : null,
      bookingButton: trimAndClean(colBooking !== -1 ? row[colBooking] : "") || "BOOK NOW",
      providingStatus:
        trimAndClean(colProviding !== -1 ? row[colProviding] : undefined) || undefined,
      notes: trimAndClean(colNotes !== -1 ? row[colNotes] : undefined) || undefined,
      description:
        trimAndClean(colDescription !== -1 ? row[colDescription] : undefined) || undefined,
      eligibility:
        trimAndClean(colEligibility !== -1 ? row[colEligibility] : undefined) || undefined,
      preparation:
        trimAndClean(colPreparation !== -1 ? row[colPreparation] : undefined) || undefined,
      aftercare: trimAndClean(colAftercare !== -1 ? row[colAftercare] : undefined) || undefined,
    });
  }

  console.log(`✅ Loaded ${rawRows.length} raw service rows from spreadsheet.`);
  return rawRows;
}

// ============================================================
// MAIN IMPORT SCRIPT
// ============================================================

async function main() {
  const startTime = Date.now();

  console.log(`
============================================================
  NextDoorClinic - Master Service Catalogue Importer
============================================================`);

  let excelPath: string;
  try {
    excelPath = findExcelFilePath();
  } catch (err: any) {
    console.error(`\n❌ Error: ${err.message}`);
    process.exit(1);
  }

  let rawRows: RawServiceRow[] = [];
  try {
    rawRows = parseExcelFile(excelPath);
  } catch (err: any) {
    console.error(`\n❌ Error reading Excel file: ${err.message}`);
    process.exit(1);
  }

  const skippedLogs: SkippedRowLog[] = [];
  const validatedRows: ValidatedServiceRow[] = [];
  const categoryNamesSet = new Set<string>();

  // ------------------------------------------------------------
  // STEP 1: VALIDATION & NORMALIZATION
  // ------------------------------------------------------------
  console.log(`\n🔍 Validating & Normalizing rows...`);

  for (const raw of rawRows) {
    const errors: string[] = [];

    if (!raw.category) {
      errors.push("Missing Category name");
    }

    if (!raw.serviceName) {
      errors.push("Missing Service Name");
    }

    const serviceType = normalizeServiceType(raw.serviceType);
    const { price, isValid: isPriceValid } = normalizePrice(raw.rawPrice, serviceType);

    if (!isPriceValid) {
      errors.push(`Invalid price format: "${raw.rawPrice}"`);
    }

    if (errors.length > 0) {
      skippedLogs.push({
        rowIndex: raw.rowIndex,
        serviceName: raw.serviceName || "(Unnamed Service)",
        reasons: errors,
      });
      continue;
    }

    const categoryName = raw.category;
    categoryNamesSet.add(categoryName);

    const categorySlug = generateSlug(categoryName);
    const priceLocked = serviceType === "NHS"; // NHS price is locked at £0/default
    const bookingEnabled = normalizeBoolean(raw.bookingButton);

    const fullDescription = raw.description || raw.notes || null;
    const shortDesc = fullDescription ? fullDescription.split("\n")[0].slice(0, 160).trim() : null;

    const keywords = generateKeywords(raw.serviceName, categoryName, fullDescription);
    const seoTitle = `${raw.serviceName} | ${categoryName} | NextDoorClinic`;
    const seoDescription =
      shortDesc || `${raw.serviceName} available at registered pharmacies on NextDoorClinic.`;
    const schemaName = `${raw.serviceName}`;

    validatedRows.push({
      rowIndex: raw.rowIndex,
      categoryName,
      categorySlug,
      name: raw.serviceName,
      serviceType,
      defaultPrice: price,
      priceLocked,
      bookingEnabled,
      description: fullDescription,
      shortDescription: shortDesc,
      eligibility: raw.eligibility || null,
      preparation: raw.preparation || null,
      aftercare: raw.aftercare || null,
      keywords,
      seoTitle,
      seoDescription,
      schemaName,
    });
  }

  console.log(
    `✅ Validation complete. ${validatedRows.length} valid rows to process, ${skippedLogs.length} skipped.`
  );

  // ------------------------------------------------------------
  // STEP 2: CATEGORIES IMPORT (UPSERT)
  // ------------------------------------------------------------
  console.log(`\n📂 Upserting ${categoryNamesSet.size} Service Categories...`);

  const categoryMap = new Map<string, string>(); // categoryName -> categoryId
  let duplicateCategoriesCount = 0;

  for (const catName of Array.from(categoryNamesSet)) {
    const slug = generateSlug(catName);

    const upsertedCat = await prisma.serviceCategory.upsert({
      where: { slug },
      update: {
        name: catName,
      },
      create: {
        name: catName,
        slug,
        description: `${catName} healthcare services at NextDoorClinic`,
      },
    });

    categoryMap.set(catName, upsertedCat.id);
  }

  console.log(`✅ All ${categoryNamesSet.size} categories synchronized successfully.`);

  // ------------------------------------------------------------
  // STEP 3: MASTER SERVICES IMPORT (UPSERT WITH UNIQUE SLUGS)
  // ------------------------------------------------------------
  console.log(`\n🩺 Importing Master Services into database...`);

  // Load all existing master services for instant in-memory lookup
  const existingMasterServices = await prisma.masterService.findMany({
    select: { id: true, slug: true, name: true },
  });

  const existingSlugMap = new Map<string, string>(); // slug -> id
  const existingNameMap = new Map<string, string>(); // lowercase name -> id
  const reservedSlugs = new Set<string>();

  existingMasterServices.forEach((s) => {
    existingSlugMap.set(s.slug, s.id);
    existingNameMap.set(s.name.toLowerCase(), s.id);
    reservedSlugs.add(s.slug);
  });

  let rowsCreated = 0;
  let rowsUpdated = 0;
  let duplicateServicesCount = 0;

  for (const item of validatedRows) {
    const categoryId = categoryMap.get(item.categoryName);
    if (!categoryId) {
      skippedLogs.push({
        rowIndex: item.rowIndex,
        serviceName: item.name,
        reasons: [`Category "${item.categoryName}" could not be resolved`],
      });
      continue;
    }

    const baseSlug = generateSlug(item.name);
    let existingId = existingSlugMap.get(baseSlug) || existingNameMap.get(item.name.toLowerCase());

    let finalSlug = baseSlug;
    if (!existingId) {
      finalSlug = getUniqueSlug(baseSlug, reservedSlugs);
      if (finalSlug !== baseSlug) {
        duplicateServicesCount++;
      }
    }

    const canonicalUrl = `https://nextdoorclinic.com/services/${finalSlug}`;

    const serviceData = {
      categoryId,
      name: item.name,
      serviceType: item.serviceType,
      defaultPrice: new Prisma.Decimal(item.defaultPrice),
      priceLocked: item.priceLocked,
      bookingEnabled: item.bookingEnabled,
      description: item.description,
      shortDescription: item.shortDescription,
      eligibility: item.eligibility,
      preparation: item.preparation,
      aftercare: item.aftercare,
      keywords: item.keywords,
      status: "ACTIVE",
      seoTitle: item.seoTitle,
      seoDescription: item.seoDescription,
      canonicalUrl,
      schemaName: item.schemaName,
    };

    if (existingId) {
      await prisma.masterService.update({
        where: { id: existingId },
        data: serviceData,
      });
      rowsUpdated++;
    } else {
      const created = await prisma.masterService.create({
        data: {
          ...serviceData,
          slug: finalSlug,
        },
      });
      existingSlugMap.set(finalSlug, created.id);
      existingNameMap.set(item.name.toLowerCase(), created.id);
      rowsCreated++;
    }
  }

  const elapsedTimeSec = ((Date.now() - startTime) / 1000).toFixed(2);

  // ------------------------------------------------------------
  // STEP 4: DETAILED IMPORT SUMMARY REPORT
  // ------------------------------------------------------------
  console.log(`
============================================================
               IMPORT SUMMARY & REPORT
============================================================
  Rows Read          : ${rawRows.length}
  Rows Processed     : ${validatedRows.length}
  Rows Created       : ${rowsCreated}
  Rows Updated       : ${rowsUpdated}
  Rows Skipped       : ${skippedLogs.length}
  Validation Errors  : ${skippedLogs.length}
  Categories Synced  : ${categoryNamesSet.size}
  Duplicate Services : ${duplicateServicesCount}
  Elapsed Time       : ${elapsedTimeSec}s
============================================================`);

  if (skippedLogs.length > 0) {
    console.log(`\n⚠️  SKIPPED ROWS DETAILS (${skippedLogs.length} total):`);
    skippedLogs.forEach((log) => {
      console.log(`   - Row #${log.rowIndex} ["${log.serviceName}"]: ${log.reasons.join(", ")}`);
    });
  } else {
    console.log(`\n🎉 Import completed with ZERO errors! All master services are in sync.`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("\n❌ Fatal Error during Master Service Catalogue import:", e);
  await prisma.$disconnect();
  process.exit(1);
});
