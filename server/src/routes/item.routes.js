const express = require('express');
const {
  listItems,
  getItem,
  getItemByBarcode,
  createItem,
  updateItem,
  deleteItem,
} = require('../controllers/item.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', listItems);
router.get('/barcode/:code', getItemByBarcode);
router.get('/:id', getItem);
router.post('/', createItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

module.exports = router;
