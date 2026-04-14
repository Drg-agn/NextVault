const { Router } = require('express');
const authController = require('../controller/auth.controller');

const router = Router();

// ✅ Safety check (helps debug crashes)
if (!authController.userRegisterController || !authController.userLoginController) {
  throw new Error("Auth controller functions are not properly exported");
}

router.post('/register', authController.userRegisterController);
router.post('/login', authController.userLoginController);
router.post('/logout', authController.userLogoutController);

module.exports = router;


