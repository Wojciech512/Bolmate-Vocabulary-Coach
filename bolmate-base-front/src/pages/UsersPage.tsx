import { FormEvent, useEffect, useState } from 'react'
import api from '../services/api'

interface User {
  id: number
  name: string
  email: string
  created_at: string
}

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const fetchUsers = async () => {
    const response = await api.get<User[]>('/users')
    setUsers(response.data)
  }

  useEffect(() => {
    fetchUsers().catch(() => setMessage('Could not load users'))
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')

    try {
      await api.post('/users', { name, email })
      setName('')
      setEmail('')
      setMessage('User created')
      await fetchUsers()
    } catch (error) {
      setMessage('Could not create user')
    }
  }

  return (
    <section className="panel">
      <h2>Users</h2>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" />
        </label>
        <button type="submit">Add user</button>
      </form>
      {message && <p className="status">{message}</p>}
      <ul className="users">
        {users.map((user) => (
          <li key={user.id}>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
            <small>{new Date(user.created_at).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default UsersPage
