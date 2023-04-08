const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const users = require('./dados/users.json');

const app = express();

// Configuração do Handlebars
app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');

// Configuração do Body Parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configuração do Cookie Parser
app.use(cookieParser());

// Configuração do Express Session
app.use(
  session({
    secret: '777@#978terghbdfgpt',
    resave: false,
    saveUninitialized: true,
  })
);

// public path
app.use(express.static('public'));

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Verificar se o usuário existe no arquivo users.json
  const user = users.users.find(
    (user) => user.email === email && user.password === password
  );

  if (user) {
    res.render('tasks/tasks.handlebars');
  } else {
    res.render('auth/login');
  }
});

// Rota para processar o cadastro
app.post('/register', (req, res) => {
  const { email, password } = req.body;

  // Verificar se o usuário já existe no arquivo users.json
  const userExists = users.users.find((user) => user.email === email);

  if (userExists) {
    res.render('auth/register');
  } else {
    users.users.push({ email, password });
    res.render('auth/login');
  }
});

// Rota principal
app.get('/', (req, res) => {
  res.render('home/home');
});

app.get('/login', (req, res) => {
  res.render('auth/login');
});

app.get('/register', (req, res) => {
  res.render('auth/register');
});

app.get('/tasks', (req, res) => {
  res.render('tasks/tasks');
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
