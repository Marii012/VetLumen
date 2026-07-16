const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');

const JWT_SECRET = 'VetLumen_2026_Secure_JWT_9Xf#82Lm@Qv!P7z';

const authController = {


  // REGISTO DE UTILIZADOR
  register: async (req, res) => {
    try {
      const { first_name, last_name, email, password, telefone, id_role } = req.body;

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
        telefone: telefone || null,
        id_role: Number(defaultRole) || 1,
        created_at: new Date()
      });

      // 6. Resposta sem devolver password
      return res.status(201).json({
        message: 'Utilizador registado com sucesso!',
        user: {
          id_user: newUser.id_user,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          email: newUser.email,
          telefone: newUser.telefone,
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
  },

  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword, confirmPassword, userId } = req.body;

      if (!userId || !currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          error: 'Dados incompletos.',
          message: 'Preencha todos os campos para alterar a palavra-passe.'
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          error: 'Palavra-passe inválida.',
          message: 'A nova palavra-passe e a confirmação não coincidem.'
        });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          error: 'Utilizador não encontrado.',
          message: 'Não foi possível encontrar o utilizador.'
        });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          error: 'Palavra-passe atual incorreta.',
          message: 'A palavra-passe atual está incorreta.'
        });
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);
      user.password = passwordHash;
      await user.save();

      return res.status(200).json({
        message: 'Palavra-passe alterada com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao alterar palavra-passe:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor.',
        message: 'Não foi possível alterar a palavra-passe.'
      });
    }
  }
};

module.exports = authController;
