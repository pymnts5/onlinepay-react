import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import postcss from "rollup-plugin-postcss";

const config = {
  input: "src/index.tsx",
  output: [
    { file: "dist/index.cjs.js", format: "cjs" },
    { file: "dist/index.esm.js", format: "esm" },
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript(),
    postcss({
      extract: "onlinepay.css",
      minimize: true,
      sourceMap: true,
    }),
  ],
  external: ["react", "react-dom"],
};

export default config;
