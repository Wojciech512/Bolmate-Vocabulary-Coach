import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider, useLanguage } from "../context/LanguageContext";

vi.mock("../api", () => ({
  fetchLanguages: () => Promise.resolve({
    data: { languages: [{ code: "pl", label: "Polish" }, { code: "es", label: "Spanish" }] },
  }),
}));

const TestComponent = () => {
  const { nativeLanguage, switchToLanguage, isSwitching } = useLanguage();
  return (
    <div>
      <span data-testid="native">{nativeLanguage}</span>
      <span data-testid="switching">{isSwitching ? "yes" : "no"}</span>
      <button onClick={() => switchToLanguage("es")}>switch</button>
    </div>
  );
};

describe("LanguageContext", () => {
  it("initializes from localStorage and allows switching", async () => {
    localStorage.setItem("nativeLanguage", "pl");
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId("native")).toHaveTextContent("pl");

    await userEvent.click(screen.getByRole("button", { name: /switch/i }));
    expect(screen.getByTestId("switching")).toHaveTextContent("yes");

    await new Promise((resolve) => setTimeout(resolve, 400));
    await waitFor(() => expect(screen.getByTestId("native")).toHaveTextContent("es"));

    expect(localStorage.getItem("nativeLanguage")).toBe("es");
    expect(screen.getByTestId("switching")).toHaveTextContent("no");
  });
});
