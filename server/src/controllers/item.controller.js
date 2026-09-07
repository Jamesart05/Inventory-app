const prisma = require('../lib/prisma');

// List items belonging to the logged-in user, with optional text/barcode search.
async function listItems(req, res) {
  const { q, barcode, page = 1, pageSize = 20 } = req.query;
  const ownerId = req.user.id;

  const where = { ownerId };

  if (barcode) {
    where.barcode = barcode;
  } else if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { sku: { contains: q, mode: 'insensitive' } },
      { category: { contains: q, mode: 'insensitive' } },
      { barcode: { contains: q, mode: 'insensitive' } },
    ];
  }

  const take = Math.min(Number(pageSize) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const [items, total] = await Promise.all([
    prisma.item.findMany({ where, orderBy: { updatedAt: 'desc' }, take, skip }),
    prisma.item.count({ where }),
  ]);

  res.json({ items, total, page: Number(page), pageSize: take });
}

async function getItem(req, res) {
  const item = await prisma.item.findFirst({
    where: { id: req.params.id, ownerId: req.user.id },
    include: { movements: { orderBy: { createdAt: 'desc' }, take: 20 } },
  });
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json({ item });
}

// Dedicated barcode lookup, used by the camera scanner on the client.
async function getItemByBarcode(req, res) {
  const { code } = req.params;
  const item = await prisma.item.findFirst({
    where: { barcode: code, ownerId: req.user.id },
  });
  if (!item) return res.status(404).json({ error: 'No item with that barcode' });
  res.json({ item });
}

async function createItem(req, res) {
  const {
    name,
    description,
    barcode,
    sku,
    category,
    unit,
    quantity,
    costPrice,
    sellingPrice,
    reorderLevel,
    imageUrl,
  } = req.body;

  if (!name) return res.status(400).json({ error: 'name is required' });

  const item = await prisma.item.create({
    data: {
      name,
      description,
      barcode: barcode || null,
      sku: sku || null,
      category,
      unit: unit || 'pcs',
      quantity: quantity ? Number(quantity) : 0,
      costPrice: costPrice ?? 0,
      sellingPrice: sellingPrice ?? 0,
      reorderLevel: reorderLevel ? Number(reorderLevel) : 0,
      imageUrl,
      ownerId: req.user.id,
    },
  });

  res.status(201).json({ item });
}

async function updateItem(req, res) {
  const existing = await prisma.item.findFirst({
    where: { id: req.params.id, ownerId: req.user.id },
  });
  if (!existing) return res.status(404).json({ error: 'Item not found' });

  const {
    name,
    description,
    barcode,
    sku,
    category,
    unit,
    costPrice,
    sellingPrice,
    reorderLevel,
    imageUrl,
    isActive,
  } = req.body;

  const item = await prisma.item.update({
    where: { id: existing.id },
    data: {
      name,
      description,
      barcode: barcode || null,
      sku: sku || null,
      category,
      unit,
      costPrice,
      sellingPrice,
      reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : undefined,
      imageUrl,
      isActive,
    },
  });

  res.json({ item });
}

async function deleteItem(req, res) {
  const existing = await prisma.item.findFirst({
    where: { id: req.params.id, ownerId: req.user.id },
  });
  if (!existing) return res.status(404).json({ error: 'Item not found' });

  await prisma.item.delete({ where: { id: existing.id } });
  res.json({ message: 'Item deleted' });
}

module.exports = {
  listItems,
  getItem,
  getItemByBarcode,
  createItem,
  updateItem,
  deleteItem,
};
