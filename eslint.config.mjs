import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

const cleanBrowserGlobals = Object.fromEntries(
 Object.entries(globals.browser).filter(([key]) => !key.includes(' '))
);

export default [
 {
   files: ["**/*.{js,mjs,cjs,ts}"],
   languageOptions: { 
     globals: cleanBrowserGlobals
   }
 },
 pluginJs.configs.recommended,
 ...tseslint.configs.recommended,
];
