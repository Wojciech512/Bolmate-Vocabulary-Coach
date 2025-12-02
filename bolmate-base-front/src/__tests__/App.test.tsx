import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import { LanguageProvider } from "../context/LanguageContext";
import { ThemeProvider } from "../context/ThemeContext";
import { LoadingProvider } from "../context/LoadingContext";
import { SnackbarProvider } from "../context/SnackbarContext";

vi.mock("../api", () => ({
  fetchLanguages: () => Promise.resolve({ data: { languages: [] } }),
  setGlobalErrorHandler: vi.fn(),
}));

describe("App routing", () => {
  const renderApp = (initialEntries = ["/"]) =>
    render(
      <ThemeProvider>
        <SnackbarProvider>
          <LoadingProvider>
            <LanguageProvider>
              <MemoryRouter initialEntries={initialEntries}>
                <App />
              </MemoryRouter>
            </LanguageProvider>
          </LoadingProvider>
        </SnackbarProvider>
      </ThemeProvider>
    );

  it("renders the home page content", async () => {
    renderApp();

    expect(await screen.findByText(/Bolmate Vocabulary Coach/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to flashcards/i })).toBeInTheDocument();
  });

  it("redirects unknown routes to home", async () => {
    renderApp(["/unknown"]);

    expect(await screen.findByText(/Bolmate Vocabulary Coach/i)).toBeInTheDocument();
  });
});
