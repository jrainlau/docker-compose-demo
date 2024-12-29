import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { addTodo, deleteTodos, getTodos, toggleTodos } from './api'

type Todo = {
  _id: string
  text: string
  completed: boolean
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [condition, setCondition] = useState('all')

  const onshowTodos: Todo[] = useMemo(() => {
    switch (condition) {
      case 'all':
        return todos
      case 'active':
        return todos.filter((todo) => !todo.completed)
      case 'completed':
        return todos.filter((todo) => todo.completed)
      default:
        return []
    }
  }, [todos, condition])

  useEffect(() => {
    refetchTodoList()
  }, [])

  async function refetchTodoList() {
    const todos = await getTodos()
    setTodos(todos)
  }

  async function onEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const inputValue = e.currentTarget.value;
      if (!inputValue) return
      e.currentTarget.value = ''
      await addTodo({
        text: inputValue,
        completed: false,
      })
      await refetchTodoList()
    }
  }

  async function onToggle(todo: Todo) {
    const { _id, completed } = todo
    await toggleTodos({
      ids: [_id],
      completed: !completed,
    })
    await refetchTodoList()
  }

  async function onDelete(todo: Todo) {
    await deleteTodos({
      ids: [todo._id],
    })
    await refetchTodoList()
  }

  function onFilter(e: React.ChangeEvent<HTMLInputElement>) {
    setCondition(e.target.value)
  }

  return (
    <main className='flex justify-center items-center flex-col w-[500px]'>
      <h1 className='text-red-900 text-8xl font-thin mb-2'>todos</h1>

      <input className='text-2xl p-4 shadow-md w-full inline-block' type="text" placeholder='What needs to be done?' onKeyUp={onEnter} />

      <div className="statistics flex justify-around w-full mt-4">
        <label className='flex items-center gap-1'>
          <input type="radio" name="filter" value="all" defaultChecked onChange={onFilter} />
          All
        </label>
        <label className='flex items-center gap-1'>
          <input type="radio" name="filter" value="active" onChange={onFilter} />
          Active
        </label>
        <label className='flex items-center gap-1'>
          <input type="radio" name="filter" value="completed" onChange={onFilter} />
          Completed
        </label>
      </div>

      <ul className="list w-full">
        {
          onshowTodos.map((todo: any, index: number) => {
            return (
              <li key={index} className="group item flex shadow-md p-4 items-center justify-between text-2xl">
                {
                  todo.completed ? <del>{todo.text}</del> : <span>{todo.text}</span>
                }
                <div className='flex items-center gap-2'>
                  <button className='invisible group-hover:visible' onClick={() => { onDelete(todo) }}>❌</button>
                  <input type="checkbox" checked={todo.completed} onChange={() => { onToggle(todo) }} />
                </div>
              </li>
            )
          })
        }
      </ul>
    </main>
  )
}

export default App
