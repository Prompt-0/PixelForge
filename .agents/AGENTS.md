# General Coding Guidelines

- **Vitest Global Mocking**: When mocking read-only browser globals (like `navigator.clipboard` or `window`) in Vitest/JSDOM environments, strictly use `vi.stubGlobal('property', { ... })`. You MUST also include an `afterEach(() => { vi.unstubAllGlobals(); })` hook to clear the mocks and prevent test cross-contamination. Avoid `Object.defineProperty` for globals.
- **TypeScript Imports**: The project uses `verbatimModuleSyntax: true`. Always use explicit type imports (e.g., `import { type TypeName } from './module'`) when importing interfaces or types.
- **React Inline Styles**: Be careful with CSS-in-JS property names; use standard React camelCase CSS properties (e.g., `textOverflow: 'ellipsis'`, not `textSpread`).
