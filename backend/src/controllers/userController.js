const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/userModel');

const userController = {
  // 1. LISTAR TODOS OS UTILIZADORES (Apenas para o Administrador)
  getAllUsers: async (req, res) => {
    try {
      // Procura todos os utilizadores mas esconde a password por segurança
      const users = await User.findAll({
        attributes: { exclude: ['password'] }
      });
      return res.status(200).json(users);
    } catch (error) {
      console.error('Erro ao listar utilizadores:', error);
      return res.status(500).json({ 
        error: 'Erro no servidor.', 
        message: 'Não foi possível carregar a lista de utilizadores.' 
      });
    }
  },

  // 2. VER PERFIL DE UM UTILIZADOR ESPECÍFICO (Por ID)
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({ 
          error: 'Não encontrado.', 
          message: 'O utilizador solicitado não existe.' 
        });
      }

      return res.status(200).json(user);
    } catch (error) {
      console.error('Erro ao procurar utilizador:', error);
      return res.status(500).json({ 
        error: 'Erro no servidor.', 
        message: 'Ocorreu um erro ao procurar o utilizador.' 
      });
    }
  },

  // 3. ATUALIZAR DADOS PESSOAIS (Cliente/Vet editam o seu, Admin edita todos)
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { first_name, last_name, email, telefone, id_role } = req.body;

      // Verificar se o utilizador existe
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: 'Utilizador não encontrado.' });
      }

      // Se o utilizador estiver a tentar mudar o email, verificar se o novo já existe
      if (email && email !== user.email) {
        const emailExists = await User.findOne({ where: { email } });
        if (emailExists) {
          return res.status(400).json({ 
            error: 'Email em uso.', 
            message: 'Este endereço de email já está associado a outra conta.' 
          });
        }
      }

      // Atualizar os campos permitidos (evitamos atualizar a password aqui)
      user.first_name = first_name || user.first_name;
      user.last_name = last_name || user.last_name;
      user.email = email || user.email;
      user.telefone = telefone !== undefined ? telefone : user.telefone;
      
      // Apenas o admin deveria mudar a role, mas o teu backend validará isso com middlewares mais tarde
      if (id_role) user.id_role = id_role; 

      await user.save();

      return res.status(200).json({
        message: 'Perfil atualizado com sucesso!',
        user: {
          id_user: user.id_user,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          telefone: user.telefone,
          created_at: user.created_at,
          id_role: user.id_role
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar utilizador:', error);
      return res.status(500).json({ 
        error: 'Erro no servidor.', 
        message: 'Não foi possível atualizar os dados do utilizador.' 
      });
    }
  },

  // 4. ELIMINAR UTILIZADOR (Admin remove contas, ou Cliente apaga a sua própria conta)
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: 'Utilizador não encontrado.' });
      }

      // Remove do Neon. Nota: Lembras-te que no SQL pusemos ON DELETE CASCADE em PET?
      // Se apagares o User aqui, os animais dele serão apagados automaticamente!
      await user.destroy(); 

      return res.status(200).json({ message: 'Utilizador e todos os seus dados associados foram eliminados.' });
    } catch (error) {
      console.error('Erro ao eliminar utilizador:', error);
      return res.status(500).json({ 
        error: 'Erro no servidor.', 
        message: 'Ocorreu um erro ao tentar eliminar o utilizador.' 
      });
    }
  },

  resetUserPassword: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          error: 'Utilizador não encontrado.',
          message: 'Não foi possível encontrar o utilizador.'
        });
      }

      const randomPassword = crypto.randomBytes(6).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user.password = passwordHash;
      await user.save();

      return res.status(200).json({
        message: 'Palavra-passe redefinida com sucesso!',
        password: randomPassword
      });
    } catch (error) {
      console.error('Erro ao redefinir palavra-passe:', error);
      return res.status(500).json({
        error: 'Erro no servidor.',
        message: 'Não foi possível redefinir a palavra-passe.'
      });
    }
  }
};

module.exports = userController;