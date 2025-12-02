# Bolmate Base Frontend

React 18 + TypeScript SPA powered by Vite for vocabulary learning with AI-powered features, quiz system, and OCR interpretation.

## Features
- **React 18** with TypeScript for type-safe development
- **Vite** for fast builds and HMR (Hot Module Replacement)
- **React Router** for client-side routing
- **Material-UI (MUI)** for component library and theming
- **Axios** for API communication with global error handling
- **Context API** for state management (Language, Loading, Snackbar, Theme)
- **Quiz system** with normal/reverse modes, streak tracking, and confetti celebrations
- **OCR interpretation** with drag-and-drop file upload support
- **Bulk operations** for flashcard creation from interpreted text
- **Responsive design** with dark/light mode toggle
- **localStorage** persistence for user preferences

## Scripts
- `npm run dev` – Start development server on port 3000 with HMR
- `npm run build` – Create optimized production build (output to `dist/`)
- `npm run preview` – Preview production build locally
- `npm run lint` – Run ESLint for code quality checks
- `npm run test` – Run Jest tests (if configured)

## Environment
Copy `.env.example` to `.env` and configure:
- `VITE_API_BASE_URL` – Backend API URL (default: `http://localhost:5000`)

Vite exposes env variables prefixed with `VITE_` to the client bundle.

## Project Structure
```
src/
  main.tsx                    # Application entry point with context providers
  App.tsx                     # Main router with route definitions
  api.ts                      # Axios client + API functions + TypeScript types
  types.ts                    # Shared TypeScript type definitions

  components/                 # Reusable UI components
    Layout.tsx                # App shell with navigation and layout
    FlashcardForm.tsx         # Form for creating single flashcards
    FlashcardList.tsx         # Table view of flashcards with actions
    QuizPanel.tsx             # Quiz game logic and UI
    InterpretForm.tsx         # File/text interpretation interface
    LanguageSelector.tsx      # Language dropdown with persistence
    StreakProgressBar.tsx     # Visual streak tracker for quiz
    ui/                       # Shared styled components (buttons, cards, chips)

  pages/                      # Route components
    HomePage.tsx              # Landing page with feature overview
    FlashcardsPage.tsx        # Flashcard management interface
    QuizPage.tsx              # Quiz game interface
    InterpretPage.tsx         # OCR/text interpretation interface
    UsersPage.tsx             # Legacy user management (not actively used)

  context/                    # React Context providers
    LanguageContext.tsx       # Native language state + localStorage
    LoadingContext.tsx        # Global loading state management
    SnackbarContext.tsx       # Toast notification system
    ThemeContext.tsx          # MUI theme + dark/light mode toggle

  utils/                      # Helper functions
    confetti.ts               # Confetti animation for quiz success

  __tests__/                  # Test files
    App.test.tsx              # App component tests
    FlashcardForm.test.tsx    # FlashcardForm component tests
    LanguageContext.test.tsx  # Context tests
```

## Architecture

### API Layer (`src/api.ts`)
Central API client with:
- Axios instance configured with base URL from env
- Global error interceptor for consistent error handling
- TypeScript types for all requests and responses
- API functions mapped to backend endpoints:
  - **Flashcards**: `fetchFlashcards()`, `createFlashcard()`, `bulkCreateFlashcards()`, `deleteFlashcard()`
  - **Quiz**: `getQuizQuestion()`, `submitQuizAnswer()`, `generateQuiz()`
  - **Interpret**: `interpretText()`, `interpretFile()`
  - **Languages**: `fetchLanguages()`, `switchLanguage()`

### State Management (Context API)

#### LanguageContext (`src/context/LanguageContext.tsx`)
- Manages user's native language preference
- Persists to localStorage (key: `nativeLanguage`)
- Provides `nativeLanguage` (string) and `setNativeLanguage()` function
- Used throughout app for language-aware features

#### LoadingContext (`src/context/LoadingContext.tsx`)
- Global loading state for async operations
- Provides `withLoading()` wrapper function
- Displays loading spinner/indicator during API calls
- Prevents duplicate loading states

#### SnackbarContext (`src/context/SnackbarContext.tsx`)
- Toast notification system using MUI Snackbar
- Provides: `showSuccess()`, `showError()`, `showInfo()`
- Auto-dismiss after 3-6 seconds (configurable)
- Queue support for multiple notifications

#### ThemeContext (`src/context/ThemeContext.tsx`)
- MUI theme configuration with custom colors
- Dark/light mode toggle with persistence
- Responsive typography and spacing
- Custom component styles (buttons, cards, inputs)

### Pages

#### HomePage (`src/pages/HomePage.tsx`)
- Landing page with hero section
- Feature cards (Flashcards, Quiz, Interpret)
- Call-to-action buttons linking to main features
- Overview of app capabilities

#### FlashcardsPage (`src/pages/FlashcardsPage.tsx`)
- Dual view: form for adding + list for viewing
- `FlashcardForm` component for single word entry
- `FlashcardList` component with filtering:
  - Filter by source language
  - Filter by difficulty level
  - Sort by creation date
- Delete action per flashcard
- Real-time updates after create/delete

#### QuizPage (`src/pages/QuizPage.tsx`)
- Wraps `QuizPanel` component
- Instructions and quiz mode selectors
- Streak tracking and statistics display

#### InterpretPage (`src/pages/InterpretPage.tsx`)
- Wraps `InterpretForm` component
- Instructions for OCR/text extraction
- Bulk flashcard creation from interpreted items
- File upload with drag-and-drop support

### Components

#### Layout (`src/components/Layout.tsx`)
- App shell with:
  - Top navigation bar (logo, menu items, theme toggle, language selector)
  - Main content area with responsive padding
  - Footer (optional)
- Responsive design (mobile/tablet/desktop breakpoints)
- Sticky navigation with elevation on scroll

#### FlashcardForm (`src/components/FlashcardForm.tsx`)
- Fields:
  - Source word input (required)
  - Source language dropdown (fetched from API)
  - Translation input (required, labeled with native language)
- Validation:
  - Required field checks
  - Same-language warning (source == native)
- Submission:
  - Calls `createFlashcard()` API
  - Shows success notification
  - Clears form on success
  - Triggers parent refresh callback

#### FlashcardList (`src/components/FlashcardList.tsx`)
- Table view with columns:
  - Source word + language badge
  - Translation + language badge
  - Example sentence (truncated with tooltip)
  - Difficulty chip (color-coded: A1=green, A2=blue, B1=orange)
  - Stats (correct/incorrect counts)
  - Actions (delete button)
- Features:
  - Sorting by any column
  - Filtering by language and difficulty
  - Pagination (if large dataset)
  - Loading skeleton while fetching

#### QuizPanel (`src/components/QuizPanel.tsx`)
- Quiz game flow:
  1. Fetch random question via `getQuizQuestion()`
  2. Display question with language context
  3. Capture user answer (text input)
  4. Submit via `submitQuizAnswer()`
  5. Show feedback (correct/incorrect + AI hint)
  6. Update streak and stats
  7. Celebrate success with confetti (on correct answer)
  8. Auto-advance to next question after delay
- Modes:
  - Normal: source word → translation
  - Reverse: translation → source word
- Language filtering: only show cards matching target language
- Streak tracking: `StreakProgressBar` component shows current streak
- Statistics: displays correct/incorrect counts for current session

#### InterpretForm (`src/components/InterpretForm.tsx`)
- Dual input modes:
  - Text input: textarea for pasted text
  - File upload: drag-and-drop or click to browse
- Supported file types: PDF, DOCX, TXT, PNG, JPG
- Processing:
  - Calls `interpretFile()` or `interpretText()` based on input
  - Displays loading state during AI processing
  - Shows extracted vocabulary items as cards
- Item actions:
  - Preview: shows source word, translation, example sentence
  - Add: individual item → `createFlashcard()`
  - Bulk add: all items → `bulkCreateFlashcards()`
- Result display:
  - Language badges for source/target
  - Example sentences (if available)
  - Add/remove toggles per item

#### LanguageSelector (`src/components/LanguageSelector.tsx`)
- Dropdown for native language selection
- Fetches available languages from API via `fetchLanguages()`
- Persists selection to localStorage via LanguageContext
- Updates all language-aware components reactively

#### StreakProgressBar (`src/components/StreakProgressBar.tsx`)
- Visual progress bar showing:
  - Current streak count (consecutive correct answers)
  - Total correct/incorrect for session
  - Percentage accuracy
- Color-coded: green for high accuracy, yellow for medium, red for low
- Animated transitions on stat updates

### Utilities

#### Confetti (`src/utils/confetti.ts`)
- Canvas-based confetti animation
- Triggered on quiz success
- Configurable: particle count, colors, duration, physics
- Uses requestAnimationFrame for smooth animation
- Auto-cleanup after animation completes

## Styling
- **Material-UI (MUI)** for component library
- **Custom theme** in ThemeContext with:
  - Primary color: #3f51b5 (blue)
  - Secondary color: #f50057 (pink)
  - Dark mode: dark backgrounds + light text
  - Light mode: light backgrounds + dark text
- **Responsive breakpoints**: xs (<600px), sm (600-960px), md (960-1280px), lg (>1280px)
- **Global styles**: minimal CSS reset, font family (Roboto)

## API Integration

### Request Flow
1. User action triggers API call (e.g., form submit, button click)
2. Component calls API function from `src/api.ts`
3. API function wraps call in `withLoading()` from LoadingContext
4. Axios interceptor handles errors globally
5. Success: component updates state + shows success notification
6. Error: global error handler shows error notification via SnackbarContext

### Error Handling
- Global interceptor in `src/api.ts` catches all API errors
- Extracts error message from response or uses fallback
- Displays error via `showError()` from SnackbarContext
- No need for per-component error handling (DRY principle)

### Type Safety
- All API requests/responses have TypeScript types
- Types defined in `src/api.ts` alongside API functions
- Ensures compile-time type checking for API payloads
- Reduces runtime errors from API mismatches

## Development Workflow

### Local Development
1. Start backend: `cd ../bolmate-base-core && flask --app wsgi run`
2. Start frontend: `npm run dev`
3. Open http://localhost:3000
4. Changes auto-reload via HMR

### Building for Production
1. `npm run build` – creates optimized bundle in `dist/`
2. `npm run preview` – test production build locally
3. Deploy `dist/` to static hosting (Netlify, Vercel, S3, etc.)

### Environment Variables
- Development: `.env.development` (auto-loaded by Vite)
- Production: `.env.production` (auto-loaded by Vite)
- Local override: `.env.local` (gitignored, highest priority)

## Testing
Run tests with Jest + React Testing Library:
```bash
npm run test
```

Test coverage includes:
- Component rendering
- User interactions (form submit, button clicks)
- Context providers (language, loading, snackbar)
- API integration (mocked responses)

## Docker
The repository root provides `docker-compose.yml` to run frontend + backend + database together:
```bash
docker-compose up --build
```
Frontend accessible at http://localhost:3000

### Dockerfile
- Multi-stage build for optimized image size
- Stage 1: Build app with Node 18
- Stage 2: Serve static files with nginx
- Production image ~50MB (nginx + static assets only)

## Performance Optimizations
- Code splitting via React Router lazy loading
- Tree shaking via Vite (removes unused code)
- Asset optimization: images compressed, fonts subsetted
- Caching: API responses cached in service layer
- Memoization: expensive computations memoized with useMemo
- Virtualization: large lists virtualized (if needed)

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features required
- No IE11 support (end of life)

## Contributing
1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "Add my feature"`
4. Push to branch: `git push origin feature/my-feature`
5. Open pull request

## License
See repository root for license information.
