const XLSX = require('xlsx');
const prisma = require('../lib/prisma');

// Maps flexible column headers (from a mom-friendly spreadsheet) to our
// internal field names. Keys are normalized: lowercased, spaces/underscores
// stripped.
const HEADER_MAP = {
  name: 'name',
  productname: 'name',
  itemname: 'name',
  product: 'name',
  barcode: 'barcode',
  upc: 'barcode',
  ean: 'barcode',
  sku: 'sku',
  category: 'category',
  unit: 'unit',
  quantity: 'quantity',
  qty: 'quantity',
  openingquantity: 'quantity',
  initialquantity: 'quantity',
  stock: 'quantity',
  costprice: 'costPrice',
  cost: 'costPrice',
  buyingprice: 'costPrice',
  sellingprice: 'sellingPrice',
  price: 'sellingPrice',
  sellprice: 'sellingPrice',
  reorderlevel: 'reorderLevel',
  reorder: 'reorderLevel',
  minstock: 'reorderLevel',
  description: 'description',
  desc: 'description',
  notes: 'description',
};

function normalizeKey(key) {
  return String(key || '').trim().toLowerCase().replace(/[\s_]+/g, '');
}

function normalizeRow(rawRow) {
  const row = {};
  for (const [key, value] of Object.entries(rawRow)) {
    const mapped = HEADER_MAP[normalizeKey(key)];
    if (mapped) row[mapped] = value;
  }
  return row;
}

function toNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : NaN;
}

function cleanText(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

// POST /api/items/import  (multipart/form-data, field name "file")
async function importItems(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Attach a CSV or Excel file as "file".' });
  }

  let workbook;
  try {
    workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  } catch (err) {
    return res.status(400).json({ error: 'Could not read that file. Please upload a valid CSV or Excel (.xlsx) file.' });
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (rawRows.length === 0) {
    return res.status(400).json({ error: 'The file has no data rows.' });
  }
  if (rawRows.length > 2000) {
    return res.status(400).json({ error: 'Please import 2000 rows or fewer at a time.' });
  }

  const ownerId = req.user.id;
  const errors = []; // { row, reason }
  const validRows = []; // normalized + ready to insert
  const seenBarcodes = new Map(); // barcode -> row number (dedupe within file)
  const seenSkus = new Map();

  rawRows.forEach((rawRow, idx) => {
    const rowNumber = idx + 2; // header is row 1
    const row = normalizeRow(rawRow);

    const name = cleanText(row.name);
    if (!name) {
      errors.push({ row: rowNumber, reason: 'Missing product name' });
      return;
    }

    const barcode = cleanText(row.barcode);
    const sku = cleanText(row.sku);

    if (barcode) {
      if (seenBarcodes.has(barcode)) {
        errors.push({ row: rowNumber, reason: `Duplicate barcode "${barcode}" (also on row ${seenBarcodes.get(barcode)})` });
        return;
      }
      seenBarcodes.set(barcode, rowNumber);
    }
    if (sku) {
      if (seenSkus.has(sku)) {
        errors.push({ row: rowNumber, reason: `Duplicate SKU "${sku}" (also on row ${seenSkus.get(sku)})` });
        return;
      }
      seenSkus.set(sku, rowNumber);
    }

    const quantity = toNumber(row.quantity, 0);
    const costPrice = toNumber(row.costPrice, 0);
    const sellingPrice = toNumber(row.sellingPrice, 0);
    const reorderLevel = toNumber(row.reorderLevel, 0);

    if ([quantity, costPrice, sellingPrice, reorderLevel].some((n) => Number.isNaN(n))) {
      errors.push({ row: rowNumber, reason: 'Quantity/price/reorder level must be numbers' });
      return;
    }
    if (quantity < 0) {
      errors.push({ row: rowNumber, reason: 'Quantity cannot be negative' });
      return;
    }

    validRows.push({
      rowNumber,
      name,
      description: cleanText(row.description),
      barcode,
      sku,
      category: cleanText(row.category),
      unit: cleanText(row.unit) || 'pcs',
      quantity,
      costPrice,
      sellingPrice,
      reorderLevel,
    });
  });

  // Check remaining candidates against what's already in the database.
  if (validRows.length > 0) {
    const barcodesToCheck = validRows.map((r) => r.barcode).filter(Boolean);
    const skusToCheck = validRows.map((r) => r.sku).filter(Boolean);

    const existing = await prisma.item.findMany({
      where: {
        ownerId,
        OR: [
          barcodesToCheck.length ? { barcode: { in: barcodesToCheck } } : undefined,
          skusToCheck.length ? { sku: { in: skusToCheck } } : undefined,
        ].filter(Boolean),
      },
      select: { barcode: true, sku: true },
    });
    const existingBarcodes = new Set(existing.map((e) => e.barcode).filter(Boolean));
    const existingSkus = new Set(existing.map((e) => e.sku).filter(Boolean));

    for (let i = validRows.length - 1; i >= 0; i--) {
      const r = validRows[i];
      if ((r.barcode && existingBarcodes.has(r.barcode)) || (r.sku && existingSkus.has(r.sku))) {
        errors.push({ row: r.rowNumber, reason: 'An item with this barcode/SKU already exists' });
        validRows.splice(i, 1);
      }
    }
    validRows.sort((a, b) => a.rowNumber - b.rowNumber);
  }

  if (validRows.length === 0) {
    return res.status(200).json({ imported: 0, total: rawRows.length, errors });
  }

  // Neon's pooled connection (PgBouncer, transaction mode) can't hold a
  // multi-statement interactive transaction pinned to one connection, which
  // caused "transaction not found" errors when this ran as one big
  // prisma.$transaction(). Instead, create items independently (each call is
  // a single round trip, safe for a pooler), then batch-insert the STOCK_IN
  // movements in one query. Chunked to avoid opening too many connections
  // against Neon's pool limit on very large imports.
  const CHUNK_SIZE = 25;
  const createdItems = [];

  for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
    const chunk = validRows.slice(i, i + CHUNK_SIZE);

    const results = await Promise.allSettled(
      chunk.map((r) =>
        prisma.item.create({
          data: {
            name: r.name,
            description: r.description,
            barcode: r.barcode,
            sku: r.sku,
            category: r.category,
            unit: r.unit,
            quantity: r.quantity,
            costPrice: r.costPrice,
            sellingPrice: r.sellingPrice,
            reorderLevel: r.reorderLevel,
            ownerId,
          },
        }).then((item) => ({ item, row: r }))
      )
    );

    const movementsData = [];

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const r = chunk[j];

      if (result.status === 'fulfilled') {
        const { item } = result.value;
        createdItems.push(item);

        if (r.quantity > 0) {
          movementsData.push({
            itemId: item.id,
            userId: ownerId,
            type: 'STOCK_IN',
            quantity: r.quantity,
            unitPrice: r.costPrice,
            reference: 'BULK_IMPORT',
            note: 'Initial stock (bulk import)',
          });
        }
      } else {
        // Most likely a race: someone else imported the same barcode/SKU
        // between our earlier existence check and this insert.
        errors.push({ row: r.rowNumber, reason: `Failed to create item: ${result.reason.message}` });
      }
    }

    if (movementsData.length > 0) {
      await prisma.movement.createMany({ data: movementsData });
    }
  }

  res.status(201).json({
    imported: createdItems.length,
    total: rawRows.length,
    errors,
    items: createdItems,
  });
}

module.exports = { importItems };
