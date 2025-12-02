import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { FormEvent, useEffect, useState } from "react";
import api from "../api";
import { StyledButton } from "../components/ui";

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
      await fetchUsers();
    } catch (err: unknown) {
      console.error(err);
      setError("Could not create the user. Make sure the email is unique.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" gutterBottom>
          Users
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Read and create users stored in PostgreSQL via the Flask API.
        </Typography>
      </Box>

      <Grid container spacing={2} alignItems="flex-start">
        <Grid item xs={12} md={4}>
          <Card component="form" onSubmit={handleSubmit} variant="outlined">
            <CardHeader title="Create user" subheader="Provide name and email" />
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                />
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  required
                />
                {error && (
                  <Alert severity="error" variant="outlined">
                    {error}
                  </Alert>
                )}
                <StyledButton type="submit" variant="primary" disabled={loading} fullWidth>
                  {loading ? "Submitting..." : "Create user"}
                </StyledButton>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card variant="outlined">
            <CardHeader
              title="Existing users"
              action={
                <StyledButton onClick={fetchUsers} disabled={loading} variant="outlined">
                  Refresh
                </StyledButton>
              }
            />
            <Divider />
            <CardContent>
              {loading && (
                <Typography variant="body2" color="text.secondary">
                  Loading...
                </Typography>
              )}
              {!loading && users.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No users found yet.
                </Typography>
              )}
              {!loading && users.length > 0 && (
                <List>
                  {users.map((user) => (
                    <ListItem key={user.id} divider>
                      <ListItemText
                        primary={user.name}
                        secondary={
                          <>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.secondary"
                            >
                              {user.email}
                            </Typography>
                            {user.created_at && (
                              <Typography
                                component="span"
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                {new Date(user.created_at).toLocaleString()}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default UsersPage;
