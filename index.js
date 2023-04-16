const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const users = require('./dados/users.json');
const tasks = require('./dados/tasks.json');
const results = require('./dados/resultados.json');
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
    res.redirect('tasks');
  } else {
    res.render('auth/login', { error: 'Credenciais inválidas' });
  }
});

// Rota para processar o cadastro
app.post('/register', (req, res) => {
  const { email, password } = req.body;

  // Verificar se o usuário já existe no arquivo users.json
  const userExists = users.users.find((user) => user.email === email);

  if (userExists) {
    res.render('auth/register', { error: 'Usuário ja existe' });
  } else {
    users.users.push({ email, password });
    fs.writeFileSync('dados/users.json', JSON.stringify(users));
    res.redirect('login');
  }
});

//Cadastro de Tarefas
app.post('/register/tasks', (req, res) => {
  const { id, pergunta, opcoes, resposta_correta } = req.body;

  const taskExists = tasks.perguntas.find(
    (perguntas) => perguntas.pergunta === pergunta
  );


  if (taskExists) {
    res.render('tasks/registerTasks', {
      error: 'Tarefa já existe na base de dados',
    });
  } else {
    const { id, pergunta, a, b, c, d, e, resposta_correta } = req.body;
    const tasks = JSON.parse(fs.readFileSync('dados/tasks.json', 'utf-8'));
    const lastTask = tasks.perguntas[tasks.perguntas.length - 1];
    const newId = lastTask ? lastTask.id + 1 : 1;
    tasks.perguntas.push({
      id: newId,
      pergunta,
      opcoes: [
        { letra: 'a', resposta: a },
        { letra: 'b', resposta: b },
        { letra: 'c', resposta: c },
        { letra: 'd', resposta: d },
        { letra: 'e', resposta: e },
      ],
      resposta_correta,
    });
    fs.writeFileSync('dados/tasks.json', JSON.stringify(tasks));
    res.render('tasks/registerTasks');
  }
});

app.get('/questions/:id', (req, res) => {
  const id = req.params.id;

  res.render('questions/index', tasks.perguntas[id - 1]);
});

app.post('/results', (req, res) => {
  const resultados = JSON.parse(
    fs.readFileSync('dados/resultados.json', 'utf-8')
  );

  // salvando os resultados em um arquivo JSON
  fs.writeFile('dados/resultados.json', JSON.stringify(resultados), (err) => {
    if (err) throw err;
    console.log('Resultados salvos com sucesso!');
  });

  // renderizando a página de resultados
  res.render('results/index', { resultados });
});

// Rota principal
app.get('/', (req, res) => {
  res.render('home/home', tasks);
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

app.get('/results', (req, res) => {
  results.resultados.sort((a, b) => {
    if (a.num_perguntas === b.num_perguntas) {
      return b.num_respostas_corretas - a.num_respostas_corretas;
    }
    return b.num_perguntas - a.num_perguntas;
  });
  res.render('results/index', results);
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
  console.log('Acesse: http://localhost:3000');
});
