import { AppBar, Box, Button, Container, Toolbar, Typography } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Flashcards", path: "/flashcards" },
    { label: "Quiz", path: "/quiz" },
    { label: "Interpret", path: "/interpret" },
  ];

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh" bgcolor="background.default">
      <AppBar position="static" color="primary" enableColorOnDark>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Bolmate Coach
          </Typography>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            return (
              <Button
                key={item.path}
                component={RouterLink}
                to={item.path}
                color={isActive ? "secondary" : "inherit"}
                variant={isActive ? "contained" : "text"}
                sx={{
                  textTransform: "none",
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Toolbar>
      </AppBar>

      <Container component="main" sx={{ flex: 1, py: 4 }}>
        {children}
      </Container>

      <Box component="footer" sx={{ py: 3, bgcolor: "grey.100" }}>
        <Container>
          <Typography variant="body2" color="text.secondary" align="center">
            React + Flask + PostgreSQL vocabulary coach
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default Layout;
