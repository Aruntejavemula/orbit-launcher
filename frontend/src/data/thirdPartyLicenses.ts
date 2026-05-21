/** Major third-party components shipped with Remio (not exhaustive). */
export type ThirdPartyLicense = {
  name: string;
  license: string;
  url?: string;
};

export const THIRD_PARTY_LICENSES: ThirdPartyLicense[] = [
  { name: "React", license: "MIT", url: "https://github.com/facebook/react" },
  { name: "Electron", license: "MIT", url: "https://github.com/electron/electron" },
  { name: "Vite", license: "MIT", url: "https://github.com/vitejs/vite" },
  { name: "TypeScript", license: "Apache-2.0", url: "https://github.com/microsoft/TypeScript" },
  { name: "Tailwind CSS", license: "MIT", url: "https://github.com/tailwindlabs/tailwindcss" },
  { name: "Framer Motion", license: "MIT", url: "https://github.com/motiondivision/motion" },
  { name: "TanStack Query", license: "MIT", url: "https://github.com/TanStack/query" },
  { name: "Axios", license: "MIT", url: "https://github.com/axios/axios" },
  { name: "Lucide React", license: "ISC", url: "https://github.com/lucide-icons/lucide" },
  { name: "FastAPI", license: "MIT", url: "https://github.com/fastapi/fastapi" },
  { name: "SQLAlchemy", license: "MIT", url: "https://github.com/sqlalchemy/sqlalchemy" },
  { name: "Pydantic", license: "MIT", url: "https://github.com/pydantic/pydantic" },
  { name: "Playwright", license: "Apache-2.0", url: "https://github.com/microsoft/playwright" },
  { name: "Vitest", license: "MIT", url: "https://github.com/vitest-dev/vitest" },
];
