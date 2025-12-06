import antfu from "@antfu/eslint-config"

export default antfu({
  typescript: true,
  markdown: true,
  yaml: true,
  ignores: [".augment-guidelines"],
  rules: {
    "style/quotes": ["error", "double", { avoidEscape: true }],
    "require-await": "error",
    "ts/consistent-type-imports": "off",
    "antfu/no-top-level-await": "off",
    "curly": "off",
    "no-console": "off",
    "no-unused-vars": "warn",
    "antfu/if-newline": "off",
    "unused-imports/no-unused-imports": "warn",
    "eslint-comments/no-unlimited-disable": "off",
    "no-alert": "off",
    "perfectionist/sort-imports": ["error", {
      groups: [
        "builtin",
        "external",
        ["internal", "internal-type"],
        ["parent", "sibling", "index"],

        "type",
        ["parent-type", "sibling-type", "index-type"],

        "side-effect",
        "object",
        "unknown",
      ],
      newlinesBetween: "ignore",
      order: "asc",
      type: "natural",
    }],
  },
  vue: {
    overrides: {
      "vue/block-order": ["warn", {
        order: [["template", "script"], "style"],
      }],
      "vue/custom-event-name-casing": ["error", "kebab-case"],
    },
  },
  stylistic: {
    overrides: {
      "style/brace-style": ["warn", "1tbs"],
      "style/arrow-parens": "off",
    },
  },
})
