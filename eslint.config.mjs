import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      /* Prototype markup uses <a> and <img> on purpose. Matching it is the
         porting rule; Next Link/Image can come later without rewriting copy. */
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-img-element": "off",
      "react/no-unescaped-entities": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
