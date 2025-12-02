import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FlashcardForm from "../components/FlashcardForm";

const onCreated = vi.fn();
const createFlashcard = vi.fn(() => Promise.resolve({ data: {} }));
const fetchLanguages = vi.fn(() =>
  Promise.resolve({ data: { languages: [{ code: "es", label: "Spanish" }, { code: "pl", label: "Polish" }] } })
);

vi.mock("../api", () => ({
  createFlashcard: (...args: unknown[]) => createFlashcard(...args),
  fetchLanguages: () => fetchLanguages(),
}));

vi.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({
    nativeLanguage: "pl",
    setNativeLanguage: vi.fn(),
    languages: [
      { code: "es", label: "Spanish" },
      { code: "pl", label: "Polish" },
    ],
    isSwitching: false,
    switchToLanguage: vi.fn(),
  }),
}));

describe("FlashcardForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates required fields", async () => {
    render(<FlashcardForm onCreated={onCreated} />);

    await userEvent.click(screen.getByRole("button", { name: /save word/i }));

    expect(createFlashcard).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
    expect((screen.getByLabelText(/source word/i) as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText(/translation/i) as HTMLInputElement).value).toBe("");
  });

  it("submits a new flashcard and resets fields", async () => {
    render(<FlashcardForm onCreated={onCreated} />);

    await userEvent.type(screen.getByLabelText(/source word/i), "hola");
    await userEvent.type(screen.getByLabelText(/translation/i), "cześć");
    await userEvent.click(screen.getByRole("button", { name: /save word/i }));

    await waitFor(() => expect(createFlashcard).toHaveBeenCalled());
    expect(onCreated).toHaveBeenCalled();
    expect((screen.getByLabelText(/source word/i) as HTMLInputElement).value).toBe("");
  });

  it("loads language options from the API", async () => {
    render(<FlashcardForm onCreated={onCreated} />);

    await waitFor(() => expect(fetchLanguages).toHaveBeenCalled());
    await userEvent.click(screen.getByLabelText(/source language/i));

    const options = await screen.findAllByRole("option");
    expect(options.map((opt) => opt.textContent)).toEqual([
      "Spanish (ES)",
      "Polish (PL)",
    ]);
  });
});
