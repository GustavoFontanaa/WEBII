const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const users = require('./dados/users.json');
const tasks = require('./dados/tasks.json');
const results = require('./dados/resultados.json');
const createQuestion = require('./dados/pergunta.json');
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
  const { perguntas, nome_avaliacao } = req.body;

  const tasks = JSON.parse(fs.readFileSync('dados/tasks.json', 'utf-8'));

  const avaliacaoExists = tasks.avaliacoes.find(
    (avaliacao) => avaliacao.nome === nome_avaliacao
  );

  if (avaliacaoExists) {
    const pergunta = JSON.parse(
      fs.readFileSync('dados/pergunta.json', 'utf-8')
    );

    res.render('tasks/registerTasks', {
      error: 'Já existe uma avaliação com este nome',
      perguntas: pergunta.pergunta,
    });
  } else {
    const newId = tasks.avaliacoes.length + 1;

    tasks.avaliacoes.push({
      id: newId,
      nome: nome_avaliacao,
      perguntas: perguntas.map((perguntaId) => parseInt(perguntaId)),
    });

    fs.writeFileSync('dados/tasks.json', JSON.stringify(tasks));
    res.redirect('/tasks');
  }
});

app.get('/questions/:id', (req, res) => {
  const id = req.params.id;

  res.render('questions/index', tasks.perguntas[id - 1]);
});

app.get('/avaliacao/:id', (req, res) => {
  const id = req.params.id;

  const tasks = JSON.parse(fs.readFileSync('dados/tasks.json', 'utf-8'));

  const avaliacao = tasks.avaliacoes.pop((avaliacao) => avaliacao.id == id);

  const perguntaFile = JSON.parse(
    fs.readFileSync('dados/pergunta.json', 'utf-8')
  );
  const perguntas = perguntaFile.pergunta.filter((pergunta) =>
    avaliacao.perguntas.includes(pergunta.id)
  );

  res.render('questions/index', { perguntas, avaliacao: avaliacao.nome });
});

app.post('/results', (req, res) => {
  const data = req.body;

  const nomeAluno = data.nome_aluno;
  const avaliacao = data.avaliacao;

  delete data.nome_aluno;

  let numQuestoes = 0;
  let numAcertos = 0;

  for (let chave in data) {
    if (!chave.startsWith('resposta_correta')) {
      let numPergunta = chave.split('_')[1];

      if (data[chave] === data[`resposta_correta_${numPergunta}`]) {
        numAcertos++;
      }
      numQuestoes++;
    }
  }

  const nota = (10 * numAcertos) / numQuestoes;

  const resultado = {
    avaliacao: avaliacao,
    aluno: nomeAluno,
    nota: parseFloat(nota.toFixed(2)),
    num_perguntas: numQuestoes,
    num_respostas_corretas: numAcertos,
    feedback:
      nota > 6
        ? 'Parabéns você foi acima da média!!'
        : 'Estude um pouco mais, não foi dessa vez',
  };

  const resultados = JSON.parse(
    fs.readFileSync('dados/resultados.json', 'utf-8')
  );

  resultados.resultados.push(resultado);

  fs.writeFile('dados/resultados.json', JSON.stringify(resultados), (err) => {
    if (err) throw err;
    console.log('Resultados salvos com sucesso!');
  });

  res.render('results/index', { resultados });
});

// Rota principal
app.get('/', (req, res) => {
  res.render('home/home', { tasks: tasks.avaliacoes });
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

app.get('/createQuestion', (req, res) => {
  res.render('registerQuestion/index', createQuestion);
});

app.get('/register/tasks', (req, res) => {
  const pergunta = JSON.parse(fs.readFileSync('dados/pergunta.json', 'utf-8'));

  res.render('tasks/registerTasks', { perguntas: pergunta.pergunta });
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

app.post('/createQuestion', (req, res) => {
  const { id, pergunta, a, b, c, d, e, resposta_correta } = req.body;
  const newId = createQuestion.pergunta.length + 1;
  createQuestion.pergunta.push({
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
  fs.writeFileSync('dados/pergunta.json', JSON.stringify(createQuestion));
  res.render('registerQuestion/index');
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
  console.log('Acesse: http://localhost:3000');
});
