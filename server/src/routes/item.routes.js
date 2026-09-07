const express = require('express');
const multer = require('multer');
const {
  listItems,
  getItem,
  getItemByBarcode,
  createItem,
  updateItem,
  deleteItem,
} = require('../controllers/item.controller');
const { importItems } = require('../controllers/import.controller');
const { requireAuth } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ok = /\.(csv|xlsx|xls)$/i.test(file.originalname);
    cb(ok ? null : new Error('Only .csv, .xlsx, or .xls files are allowed'), ok);
  },
});

const router = express.Router();

router.use(requireAuth);

router.get('/', listItems);
router.get('/barcode/:code', getItemByBarcode);
router.post('/import', upload.single('file'), importItems);
router.get('/:id', getItem);
router.post('/', createItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

module.exports = router;
