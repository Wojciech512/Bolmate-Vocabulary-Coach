import {
  AppBar,
  Box,
  Container,
  Toolbar,
  Typography,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import LanguageSelector from "./LanguageSelector";
import { useThemeMode } from "../context/ThemeContext";
import { StyledButton } from "./ui";

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useThemeMode();

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
      <AppBar
        position="sticky"
        elevation={2}
        sx={{
          bgcolor: "background.paper",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
        }}
      >
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
          <FormControlLabel
            control={
              <Switch checked={darkMode} onChange={toggleDarkMode} color="primary" />
            }
            label="Dark"
            sx={{ mr: 2, color: "text.primary" }}
          />
          <LanguageSelector />
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path + "/");
            return (
              <StyledButton
                key={item.path}
                component={RouterLink}
                to={item.path as string}
                variant={isActive ? "secondary" : "text"}
                sx={{
                  color: isActive ? undefined : "text.primary",
                }}
              >
                {item.label}
              </StyledButton>
            );
          })}
        </Toolbar>
      </AppBar>

      <Container component="main" sx={{ flex: 1, py: 4 }}>
        {children}
      </Container>

      <Box component="footer" sx={{ py: 3, bgcolor: "background.paper" }}>
        <Container>
          <Typography variant="body2" color="text.secondary" align="center">
            ReactJS + Flask + PostgreSQL, Vocabulary coach © Created 2025 by Wojciech
            Wyleżoł
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default Layout;
