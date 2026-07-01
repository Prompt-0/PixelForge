## 2026-07-02T02:22:44+05:30
You are the Test Infrastructure Setup Worker.
Your working directory is /home/ritesh/Projects/Active/Image_Manipulator/.agents/worker_m1_takeover.
Your task is to set up the Vitest and React Testing Library testing infrastructure for this project.

Specifically, you need to perform the following:
1. Install these devDependencies:
   - vitest
   - jsdom
   - @testing-library/react
   - @testing-library/jest-dom
   - @testing-library/user-event
   (Make sure `@testing-library/react` is compatible with React 19, i.e., version 16.0.0 or higher.)
2. Add the following scripts to package.json:
   - "test": "vitest"
   - "test:run": "vitest run"
   - "test:coverage": "vitest run --coverage"
3. Configure vite.config.ts to support Vitest. Ensure jsdom is the environment, src/setupTests.ts is the setup file, and globals: true is set.
4. Create src/setupTests.ts containing:
   import '@testing-library/jest-dom';
5. Update tsconfig.app.json to include "vitest/globals" in the types option (so TypeScript compiled tests recognize global vitest variables, or guide the compiler correctly).
6. Write a dummy test in src/components/__tests__/dummy.test.tsx to verify the setup.
7. Verify your work by running npm run build and npm run test:run to ensure both compiling and testing work perfectly with no typescript errors.
8. Write a progress.md update and a handoff.md in your working directory (/home/ritesh/Projects/Active/Image_Manipulator/.agents/worker_m1_takeover) once done.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
