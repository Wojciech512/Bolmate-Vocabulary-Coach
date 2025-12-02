import { AppBar, Box, Button, Container, Toolbar, Typography } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import LanguageSelector from "./LanguageSelector";

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
    <Box
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      bgcolor="background.default"
    >
      <AppBar position="sticky" sx={{ bgcolor: "white" }}>
        <Toolbar sx={{ gap: 2 }}>
          <Box sx={{ position: "relative", display: "inline-block" }}>
            <Box
              component="img"
              src="/assets/bolmate-logo.png"
              alt="Bolmate Logo"
              sx={{ height: 40, width: "auto", display: "block" }}
            />
            <Typography
              variant="caption"
              sx={{
                position: "absolute",
                bottom: -10,
                right: -50,
                fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
                fontStyle: "italic",
                transform: "rotate(-15deg)",
                fontWeight: 500,
                fontSize: "1.65rem",
                color: "#df00ff",
              }}
            >
              Vocabulary
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <LanguageSelector />
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path + "/");
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
                  color: isActive ? undefined : "#0A1B33",
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
