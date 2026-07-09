// backend/src/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');

const JWT_SECRET = 'petcare_chave_secreta_2026';

const authController = {

  // ==========================================
  // REGISTO DE UTILIZADOR
  // ==========================================
  register: async (req, res) => {
    try {
      const { first_name, last_name, email, password, id_role } = req.body;

      // 1. Validação básica de campos obrigatórios
      if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({
          error: 'Campos em falta.',
          message: 'Os campos first_name, last_name, email e password são obrigatórios.'
        });
      }

      // 2. Verificar se o email já está registado
      const userExists = await User.findOne({ where: { email } });

      if (userExists) {
        return res.status(400).json({
          error: 'Email duplicado.',
          message: 'Este endereço de email já se encontra registado no sistema.'
        });
      }

      // 3. Encriptar password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 4. Definir role padrão
      const defaultRole = id_role || 1;

      // 5. Criar utilizador
      const newUser = await User.create({
        first_name,
        last_name,
        email,
        password: passwordHash,
        id_role: defaultRole
      });

      // 6. Resposta sem devolver password
      return res.status(201).json({
        message: 'Utilizador registado com sucesso!',
        user: {
          id_user: newUser.id_user,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          email: newUser.email,
          id_role: newUser.id_role
        }
      });

    } catch (error) {
      console.error('Erro no registo:', error);

      return res.status(500).json({
        error: 'Erro interno do servidor.',
        message: 'Ocorreu um erro ao tentar processar o registo.'
      });
    }
  },


  // ==========================================
  // LOGIN DE UTILIZADOR COM JWT
  // ==========================================
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // 1. Validar campos
      if (!email || !password) {
        return res.status(400).json({
          error: 'Dados incompletos.',
          message: 'É obrigatório introduzir o email e a password.'
        });
      }

      // 2. Procurar utilizador
      const user = await User.findOne({
        where: { email }
      });

      if (!user) {
        return res.status(401).json({
          error: 'Falha na autenticação.',
          message: 'O email ou a password introduzidos estão incorretos.'
        });
      }

      // 3. Comparar password
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Falha na autenticação.',
          message: 'O email ou a password introduzidos estão incorretos.'
        });
      }


      // 4. Criar JWT Token
      const token = jwt.sign(
        {
          id_user: user.id_user,
          email: user.email,
          id_role: user.id_role
        },
        JWT_SECRET,
        {
          expiresIn: '7d'
        }
      );


      // 5. Resposta com token
      return res.status(200).json({
        message: 'Autenticação efetuada com sucesso!',
        token,
        user: {
          id_user: user.id_user,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          id_role: user.id_role
        }
      });

    } catch (error) {
      console.error('Erro no login:', error);

      return res.status(500).json({
        error: 'Erro interno do servidor.',
        message: 'Ocorreu um erro ao tentar efetuar o login.'
      });
    }
  }
};

module.exports = authController;
