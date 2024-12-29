import { Elysia } from 'elysia';
import mongoose from 'mongoose';

// Define a Todo model
const Todo = mongoose.model('Todo', new mongoose.Schema({
  text: String,
  completed: Boolean,
  updateTime: Date,
}));

// Connect to MongoDB
mongoose.connect('mongodb://mongodb:27017/local')
  .then(() => {
    console.log('Connected to MongoDB.');

    // Define the routes
    const app = new Elysia()
      .get('/api', () => 'Hello Elysia')
      .get('/api/todos', async () => {
        const todos = await Todo.find();
        return todos;
      })
      .post('/api/todos', async (req: any) => {
        const newTodo = new Todo({
          text: req.body.text,
          completed: false,
          updateTime: new Date(),
        });
        await newTodo.save();
        return newTodo.toJSON();
      })
      .get('/api/todos/query', async (req) => {
        const todos = await Todo.find(req.query);
        return todos;
      })
      .patch('/api/todos', async (req: any) => {
        const { ids, completed } = req.body;
        await Todo.updateMany({ _id: { $in: ids } }, { completed });
        return { message: 'Todos updated' };
      })
      .delete('/api/todos', async (req: any) => {
        const { ids } = req.body;
        await Todo.deleteMany({ _id: { $in: ids } });
        return { message: 'Todos deleted' };
      })
      .listen(8080);

    console.log('🦊 Elysia are listening on port 8080...');
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });
