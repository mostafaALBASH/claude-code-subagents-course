const express = require('express');
const app = express();

app.use(express.json());

let todos = [
  { id: 1, title: 'Buy groceries', completed: false },
  { id: 2, title: 'Walk the dog', completed: true },
  { id: 3, title: 'Write tests', completed: false },
];

app.get('/api/todos', (req, res) => {
  res.json(todos);
});

app.post('/api/todos', (req, res) => {
  const { title } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required and must be a non-empty string' });
  }
  if (title.length > 200) {
    return res.status(400).json({ error: 'title must be 200 characters or fewer' });
  }

  const todo = {
    id: todos.length + 1,
    title: title.trim(),
    completed: false,
  };
  todos.push(todo);
  res.status(201).json(todo);
});

app.patch('/api/todos/:id/toggle', (req, res) => {
  const id = req.params.id;
  const todo = todos.find(t => t.id == id);
  todo.completed = !todo.completed;
  res.json(todo);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
