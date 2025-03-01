import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";
import replace from "@rollup/plugin-replace";

export default [
  {
    input: "index.js",
    output: [
      {
        file: "dist/acrf-builder.js",
        format: "iife",
        name: "builder",
        // globals: {
        //    "string-pixel-width":"pixelWidth",
        // },
      },
    ],
    plugins: [
      resolve({
        exportConditions: ["node", "browser"],
        preferBuiltins: false,
        browser: true,
      }),
      json(),
      commonjs(),
      babel({
        exclude: "node_modules/**",
        babelHelpers: "bundled",
      }),
      // replace({
      //   "process.env": JSON.stringify("production"),
      // }),
      terser(),
    ],
  },
  {
    input: "index.js",
    output: [
      {
        file: "dist/node-acrf-builder.js",
        format: "cjs",
        sourcemap: false,
      },
    ],
    plugins: [
      resolve(),
      json(),
      commonjs(),
      babel({
        exclude: "node_modules/**",
      }),
      terser(),
    ],
  },
];
