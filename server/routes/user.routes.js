const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const verifyToken = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/:id', userController.getProfile);
router.put('/:id', verifyToken, upload.single('avatar'), userController.updateProfile);

module.exports = router;
