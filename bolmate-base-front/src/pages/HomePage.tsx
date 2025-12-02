import { Card, CardActions, CardContent, Typography, Box } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { Link as RouterLink } from "react-router-dom";
import { StyledButton } from "../components/ui";

function HomePage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Bolmate Vocabulary Coach
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Add Spanish (or any language) words from your notebook, practice them daily in a
        fast Q&A flow, and get AI-powered hints, examples, and OCR/interpretation
        support.
      </Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Add words
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Type your Spanish word and translation. Progress counters stay visible.
              </Typography>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2 }}>
              <StyledButton
                component={RouterLink}
                to="/flashcards"
                variant="primary"
                fullWidth
              >
                Go to Flashcards
              </StyledButton>
            </CardActions>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Practice
              </Typography>
              <Typography variant="body2" color="text.secondary">
                One-word quiz loop with instant correctness check and AI hints when you
                miss.
              </Typography>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2 }}>
              <StyledButton component={RouterLink} to="/quiz" variant="primary" fullWidth>
                Start Quiz
              </StyledButton>
            </CardActions>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Interpret
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Paste notebook text or upload files to extract vocabulary with
                translations.
              </Typography>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2 }}>
              <StyledButton
                component={RouterLink}
                to="/interpret"
                variant="primary"
                fullWidth
              >
                Try Interpret
              </StyledButton>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default HomePage;
