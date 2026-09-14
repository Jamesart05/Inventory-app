const prisma = require('../lib/prisma');

async function listItems(req, res) {
  const { q, name, style, minPrice, maxPrice, barcode, page = 1, pageSize = 20 } = req.query;
  const ownerId = req.user.id;

  const where = { ownerId };

  if (barcode) {
    where.barcode = barcode;
  } else {
    const conditions = [];

    if (q) {
      conditions.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
          { barcode: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    if (name) {
      conditions.push({ name: { contains: name, mode: 'insensitive' } });
    }
    if (style) {
      conditions.push({ category: { contains: style, mode: 'insensitive' } });
    }
    if (minPrice || maxPrice) {
      conditions.push({
        OR: [
          {
            retailPrice: {
              ...(minPrice ? { gte: Number(minPrice) } : {}),
              ...(maxPrice ? { lte: Number(maxPrice) } : {}),
            },
          },
          {
            wholesalePrice: {
              ...(minPrice ? { gte: Number(minPrice) } : {}),
              ...(maxPrice ? { lte: Number(maxPrice) } : {}),
            },
          },
        ],
      });
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }
  }

  const take = Math.min(Number(pageSize) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const [allItems, total] = await Promise.all([
    prisma.item.findMany({ where }),
    prisma.item.count({ where }),
  ]);

  allItems.sort((a, b) => {
    const diffA = a.quantity - a.reorderLevel;
    const diffB = b.quantity - b.reorderLevel;
    if (diffA !== diffB) return diffA - diffB;
    return a.name.localeCompare(b.name);
  });

  const items = allItems.slice(skip, skip + take);

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
    retailPrice,
    wholesalePrice,
    reorderLevel,
    imageUrl,
  } = req.body;

  if (!name) return res.status(400).json({ error: 'Name is required' });

  const existingItem = await prisma.item.findFirst({
    where: {
      ownerId: req.user.id,
      name: { equals: name.trim(), mode: 'insensitive' },
      ...(category ? { category: { equals: category.trim(), mode: 'insensitive' } } : {}),
    },
  });

  if (existingItem) {
    return res.status(400).json({ 
      error: `An item with the name "${name}"${category ? ` under style/category "${category}"` : ''} already exists!` 
    });
  }

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
      retailPrice: retailPrice ?? 0,
      wholesalePrice: wholesalePrice ?? 0,
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
    retailPrice,
    wholesalePrice,
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
      retailPrice,
      wholesalePrice,
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