import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  // Notion API のレスポンスは動的プロパティアクセスのため any が必要
  {
    files: ["src/lib/notion.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // _プレフィックスの変数は意図的な未使用（分割代入での除外パターン）
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];

export default eslintConfig;
