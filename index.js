const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const users = require('./dados/users.json');
const tasks = require('./dados/tasks.json');
const fs = require('fs');

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
    res.render('auth/login', { error: 'Credenciais inválidas' });
  }
});

// Rota para processar o cadastro
app.post('/register', (req, res) => {
  const { email, password } = req.body;

  users.users.push({ email, password });

  // Verificar se o usuário já existe no arquivo users.json
  const userExists = users.users.find((user) => user.email === email);

  fs.writeFileSync('dados/users.json', JSON.stringify(users));

  if (userExists) {
    res.render('auth/register');
  } else {
    users.users.push({ email, password });
    res.render('auth/login');
  }
});

//Cadastro de Tarefas
app.post('/register/tasks', (req, res) => {
  const { name, task, time_finish } = req.body;

  const taskExists = tasks.tasks.find((tasks) => tasks.name === name);

  if (taskExists) {
    res.render('tasks/registerTasks', {
      error: 'Tarefa já existe na base de dados', //ta bugado aqui
    });
  } else {
    tasks.tasks.push({ name, task, time_finish });
    fs.writeFileSync('dados/tasks.json', JSON.stringify(tasks));
    res.render('tasks/registerTasks');
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
  res.render('tasks/tasks', tasks);
});

app.get('/register/tasks', (req, res) => {
  res.render('tasks/registerTasks');
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
  console.log('Acesse: http://localhost:3000');
});
