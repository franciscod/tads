module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  rules: {
    "comma-dangle": ["error", "never"],
    "array-element-newline": ["error", {
        "ArrayExpression": "consistent",
        "ArrayPattern": { "minItems": 3 },
    }],
    "@typescript-eslint/no-non-null-assertion": "off"
  }
};
