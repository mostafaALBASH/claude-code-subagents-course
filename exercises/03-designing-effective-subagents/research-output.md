# Todo Deletion Flow Research

## Question

How does todo deletion work in this project? Trace the full flow from the HTTP request to the data being removed.

## Findings

Todo deletion does not exist in this project. No `DELETE` route or deletion logic is implemented anywhere in the codebase.

## Data Storage

**File**: [src/sample-app/index.js](../../src/sample-app/index.js#L6-L10) (lines 6-10)

Todos are held in a plain in-memory JavaScript array:

```js
let todos = [...]
```

There is no file system persistence, no database, and no external storage layer. Data is lost on server restart.

## Existing Routes

All routes are defined inline in [src/sample-app/index.js](../../src/sample-app/index.js):

| Method | Path | Lines | Description |
|--------|------|-------|-------------|
| GET | `/api/todos` | 12-14 | Returns all todos as JSON |
| POST | `/api/todos` | 16-24 | Creates a new todo, pushes to in-memory array |
| PATCH | `/api/todos/:id/toggle` | 26-31 | Toggles `completed` field in-place |

## Middleware

Only `express.json()` (line 4) is registered globally for body parsing. No per-route validation, authentication, or authorization middleware exists.

## Closest Relevant Mutation Flow

```
HTTP PATCH /api/todos/:id/toggle
  -> inline handler (line 26)
  -> todos.find() (line 28)
  -> mutates todo.completed in-place in the in-memory array
```

## Gaps

- No `DELETE` route (`app.delete(...)`) exists anywhere in the source.
- The entire application is a single file with no separate router files, controller modules, or service layers.

## Recommendation

To add deletion, a new handler is needed:

```js
app.delete('/api/todos/:id', (req, res) => {
  const index = todos.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  todos.splice(index, 1);
  res.status(204).send();
});
```
