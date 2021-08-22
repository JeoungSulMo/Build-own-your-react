const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const config = {
  mode: "development",
  devtool: "inline-source-map", // 로그, 디버깅, 번들링 타임 고려시 선택, 배포시 cheap-module-source-map(용량 젤 작음)
  entry: "./index.js",
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "[name].js",
  },
  resolve: {
    // 확장자가 생략되어도 웹팩이 찾아줌
    modules: ["node_modules"],
    extensions: [".wasm", ".js", ".jsx", ".mjs", ".cjs", ".json"], // 확장자명 생략 가능
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        loader: "babel-loader",
        options: {
          presets: [
            [
              "@babel/preset-env",
              {
                modules: false,
                targets: {
                  browsers: ["last 2 chrome versions"],
                },
              },
            ],
            "@babel/preset-react", // 리액트
          ],
        },
        exclude: ["/node_modules"],
      },
    ],
  },
  devServer: {
    contentBase: path.resolve(__dirname),
    publicPath: "/", // 정적파일 불러올 때
    host: "localhost",
    port: 3000,
    open: true,
    historyApiFallback: {
      // 경로 이상하게 입력하면 여기로 연결
      index: "/public/index.html",
    },
    overlay: {
      // 컴파일 오류시 브라우저에서 보여줌
      warnings: true,
      errors: true,
    },
    clientLogLevel: "error",
    hot: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
    new CleanWebpackPlugin(), // 빌드 성공시 dist 파일 제거
  ],
};

module.exports = config;
