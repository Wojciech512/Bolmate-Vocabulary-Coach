import { FormEvent, useEffect, useState } from "react";
import api from "../api";
import "../styles/users.css";

type User = {
  id: number;
  name: string;
  email: string;
  created_at?: string;
};

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get<User[]>("/users");
      setUsers(response.data);
    } catch (err) {
      console.error(err);
      setError("Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!name || !email) {
      setError("Both name and email are required.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/users", { name, email });
      setName("");
      setEmail("");
      fetchUsers();
    } catch (err: unknown) {
      console.error(err);
      setError("Could not create the user. Make sure the email is unique.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="users">
      <header>
        <h2>Users</h2>
        <p>Read and create users stored in PostgreSQL via the Flask API.</p>
      </header>

      <div className="users-grid">
        <form className="card" onSubmit={handleSubmit}>
          <label>
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Create user"}
          </button>
          {error && <p className="error">{error}</p>}
        </form>

        <div className="card">
          <div className="users-list-header">
            <h3>Existing users</h3>
            <button type="button" onClick={fetchUsers} disabled={loading}>
              Refresh
            </button>
          </div>
          {loading && <p>Loading...</p>}
          {!loading && users.length === 0 && <p>No users found yet.</p>}
          <ul className="users-list">
            {users.map((user) => (
              <li key={user.id}>
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
                {user.created_at && <small>{new Date(user.created_at).toLocaleString()}</small>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default UsersPage;
