# VetLumen

VetLumen é uma aplicação web desenvolvida no âmbito da unidade curricular de **Aplicações para a Internet II (AI2)**, com o objetivo de apoiar a gestão de uma clínica veterinária.

A plataforma disponibiliza uma área pública para apresentação da clínica e dos seus serviços, bem como áreas privadas destinadas aos diferentes perfis de utilizador (**Cliente**, **Veterinário** e **Administrador**), cada um com funcionalidades específicas.

---

## Funcionalidades

### Área Pública

* Página inicial da clínica
* Apresentação dos serviços veterinários
* Informação sobre a equipa
* Formulário de contacto (sem necessidade de autenticação)
* Estado do atendimento atualizado automaticamente consoante a hora do dia

### Cliente

* Registo e autenticação
* Gestão do perfil e alteração da palavra-passe
* Registo e gestão dos seus animais
* Consulta do histórico clínico
* Consulta do plano de vacinação
* Marcação de consultas
* Cancelamento de consultas pendentes
* Consulta dos detalhes das consultas
* Consulta de faturas e respetivos detalhes

### Veterinário

* Gestão das consultas
* Aceitação ou cancelamento de consultas
* Conclusão de consultas
* Registo clínico dos animais
* Gestão do histórico médico
* Registo de vacinação
* Consulta da informação dos pacientes
* Gestão do perfil

### Administrador

* Gestão de utilizadores
* Criação, edição e eliminação de utilizadores
* Redefinição de palavras-passe
* Gestão de animais
* Gestão de históricos clínicos
* Gestão de vacinas
* Gestão de consultas
* Gestão dos serviços da clínica
* Gestão das faturas
* Gestão das mensagens enviadas através do formulário de contacto
* Consulta do histórico de atividades do sistema
* Gestão do perfil

---

## Tecnologias Utilizadas

### Frontend

* React
* React Hooks
* Bootstrap
* Axios
* React Router

### Backend

* Node.js
* Express
* JWT
* bcrypt

### Base de Dados

* PostgreSQL
* Sequelize ORM

---

## Arquitetura

O projeto segue o padrão arquitetural **MVC (Model-View-Controller)**, permitindo separar claramente:

* Models
* Controllers
* Routes
* Middleware
* Frontend React
* Base de Dados PostgreSQL

Esta organização facilita a manutenção, reutilização e evolução da aplicação.

---

## Autenticação

O sistema utiliza autenticação baseada em **JWT (JSON Web Token)**.

As palavras-passe são armazenadas de forma segura através de **bcrypt**.

O acesso às funcionalidades é controlado através de permissões por perfil:

* Cliente
* Veterinário
* Administrador

---

## Funcionalidades Implementadas

* Gestão de utilizadores
* Gestão de animais
* Gestão de espécies e raças
* Gestão de consultas
* Histórico clínico
* Gestão de vacinação
* Gestão de serviços
* Gestão de faturação
* Gestão de contactos
* Histórico de atividades
* Autenticação e autorização
* Dashboard específica para cada perfil

---

## Deploy

A aplicação encontra-se preparada para execução em ambiente cloud.

* **Frontend:** Vercel
* **Backend:** Render
* **Base de Dados:** Neon PostgreSQL

---

## Inteligência Artificial

Durante o desenvolvimento do projeto foi utilizada Inteligência Artificial como ferramenta de apoio na resolução de problemas, compreensão de conceitos, implementação de funcionalidades e melhoria da organização do código. Todas as soluções foram analisadas, adaptadas e integradas de acordo com as necessidades específicas da aplicação.

---

## Autor

**Mariana Fernandes - pv30216**

Licenciatura em Tecnologias e Design Multimédia

Aplicações para a Internet II — 2026
