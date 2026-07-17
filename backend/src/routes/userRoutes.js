const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getAllUsers);

router.get('/:id', userController.getUserById);

router.put('/:id', userController.updateUser);

// rota de reset-password removida: funcionalidade retirada do painel Admin

router.delete('/:id', userController.deleteUser);

module.exports = router;