import next from "eslint-config-next/core-web-vitals";

const config = [
  { ignores: [".next/**", "node_modules/**", "out/**", "build/**"] },
  ...next,
  {
    rules: {
      // External driver/flag/circuit images come from many unknown hosts;
      // plain <img> avoids next/image remote-pattern config for each one.
      "@next/next/no-img-element": "off",
    },
  },
];

export default config;
