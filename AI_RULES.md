# AI Development Rules - Ticket System

## Tech Stack
- **Framework**: React 18 with TypeScript (Vite-based).
- **Styling**: Tailwind CSS for all UI components and layouts.
- **UI Components**: shadcn/ui (Radix UI primitives) for accessible, consistent components.
- **Icons**: Lucide React for all system iconography.
- **Routing**: React Router DOM v6 for navigation.
- **State Management**: React Context API for Auth and Ticket data; TanStack Query for async operations.
- **Forms**: React Hook Form with Zod for schema validation.
- **QR Handling**: `qrcode.react` for generation and `html5-qrcode` for scanning.
- **Notifications**: Sonner or shadcn/ui Toast for user feedback.

## Library Usage Rules
- **UI Components**: Always check `src/components/ui/` before creating new components. Use shadcn/ui patterns.
- **Icons**: Use `lucide-react`. Do not import external SVG files unless absolutely necessary.
- **Styling**: Use Tailwind utility classes exclusively. Avoid writing custom CSS in `.css` files unless defining global variables in `index.css`.
- **Data Fetching**: Use TanStack Query (`@tanstack/react-query`) for any future API integrations to handle caching and loading states.
- **Validation**: Use `zod` for all form validation schemas and type safety.
- **Date Handling**: Use `date-fns` for formatting and manipulating dates.
- **State**: Use Context Providers for global app state (like `AuthContext`) and local `useState` for component-specific UI state.

## Architecture Guidelines
- **File Structure**: 
  - Pages go in `src/pages/`.
  - Reusable UI components go in `src/components/ui/`.
  - Feature-specific components go in `src/components/`.
  - Business logic/hooks go in `src/hooks/`.
- **Responsive Design**: All components must be mobile-first and fully responsive using Tailwind's breakpoint prefixes (`sm:`, `md:`, `lg:`).
- **Type Safety**: Avoid `any`. Define interfaces for all data structures, especially for `Ingresso` and `User` types.