const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Apply authentication to all cart routes
router.use(authenticateToken);

// Cart routes
router.post('/', validate, cartController.addToCart);

router.get('/', cartController.getCart);

router.put('/:id', validate, cartController.updateCartItem);

router.delete('/:id', cartController.removeFromCart);

router.delete('/', cartController.clearCart);

router.post('/validate', cartController.validateCart);

module.exports = router;
