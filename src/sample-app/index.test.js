const assert = require('assert');

const todos = [
  { id: 1, title: 'Buy groceries', completed: false },
  { id: 2, title: 'Walk the dog', completed: true },
  { id: 3, title: 'Write tests', completed: false },
];

// Passing test: the initial todos array has 3 items
assert.strictEqual(todos.length, 3, 'todos should have 3 items');
console.log('PASS: todos array has 3 items');

// Failing test: incorrectly expects all todos to be completed
assert.strictEqual(
  todos.every(t => t.completed),
  true,
  'all todos should be completed'
);
console.log('PASS: all todos are completed');
