const prisma = require('../lib/prisma');

// List movements for the logged-in user, optionally filtered by item.
async function listMovements(req, res) {
  const { itemId, type, page = 1, pageSize = 20 } = req.query;
  const where = { userId: req.user.id };
  if (itemId) where.itemId = itemId;
  if (type) where.type = type;

  const take = Math.min(Number(pageSize) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const [movements, total] = await Promise.all([
    prisma.movement.findMany({
      where,
      include: { item: { select: { id: true, name: true, barcode: true, unit: true } } },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    prisma.movement.count({ where }),
  ]);

  res.json({ movements, total, page: Number(page), pageSize: take });
}

// Record a stock movement (STOCK_IN or STOCK_OUT) and atomically adjust the
// related item's quantity so the two never drift out of sync.
async function createMovement(req, res) {
  const { itemId, type, quantity, unitPrice, reference, note } = req.body;

  if (!itemId || !type || !quantity) {
    return res.status(400).json({ error: 'itemId, type and quantity are required' });
  }
  if (!['STOCK_IN', 'STOCK_OUT'].includes(type)) {
    return res.status(400).json({ error: 'type must be STOCK_IN or STOCK_OUT' });
  }
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({ error: 'quantity must be a positive number' });
  }

  const item = await prisma.item.findFirst({
    where: { id: itemId, ownerId: req.user.id },
  });
  if (!item) return res.status(404).json({ error: 'Item not found' });

  if (type === 'STOCK_OUT' && item.quantity < qty) {
    return res.status(400).json({ error: `Insufficient stock: only ${item.quantity} available` });
  }

  const delta = type === 'STOCK_IN' ? qty : -qty;

  const [movement, updatedItem] = await prisma.$transaction([
    prisma.movement.create({
      data: {
        itemId,
        userId: req.user.id,
        type,
        quantity: qty,
        unitPrice: unitPrice ?? 0,
        reference,
        note,
      },
    }),
    prisma.item.update({
      where: { id: itemId },
      data: { quantity: { increment: delta } },
    }),
  ]);

  res.status(201).json({ movement, item: updatedItem });
}

async function deleteMovement(req, res) {
  const movement = await prisma.movement.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!movement) return res.status(404).json({ error: 'Movement not found' });

  // Reverse the stock effect before deleting the record so quantities stay correct.
  const delta = movement.type === 'STOCK_IN' ? -movement.quantity : movement.quantity;

  await prisma.$transaction([
    prisma.item.update({ where: { id: movement.itemId }, data: { quantity: { increment: delta } } }),
    prisma.movement.delete({ where: { id: movement.id } }),
  ]);

  res.json({ message: 'Movement deleted and stock adjusted' });
}

module.exports = { listMovements, createMovement, deleteMovement };
