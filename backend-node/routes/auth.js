const express = require('express');
const router = express.Router();
const { googleLogin, forgotPassword, resetPassword } = require('../controllers/authController');

router.post('/google-login', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
