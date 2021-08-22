# Build your own React

1. package.json 생성

   > yarn init -y

2. src와 public 폴더 생성
3. index.ts파일 생성, public/index.html생성
4. React와 Webpack, babel 설치 + 바벨로더, 프리셋들

   > yarn add react react-dom typescript @types/react @types/react-dom @types/styled-components

   > yarn add webpack webpack-cli webpack-dev-server @babel/core @babel/preset-env @babel/preset-react @babel/preset-typescript babel-loader html-webpack-plugin -D

   - @babel/core : 바벨 기본기능
   - @babel/preset-env : 최신 문법 다운그레이드, 브라우저에서 필요한 es버전을 자동으로 파악해서 polyfill을 넣어줌
   - @babel/preset-react : jsx -> createElement
   - babel-loader : babel이랑 webpack연결
   - webpack
   - webpack-cli : 웹팩 커멘드라인으로 실행 도움
   - webpack-dev-server : 로컬에서 빌드후 서버띄어줌
   - html-webpack-plugin : 설정한 html파일에 output결과를 연결해 output에 html파일 생성

5. webpack.config.js 작성

   아직 css나 img파일 연결은 안한상태 입니다. build your own react에 따라서 필요할때마다 추가할 예정

   ```javascript
   const path = require("path");
   const HtmlWebpackPlugin = require("html-webpack-plugin");
   const { CleanWebpackPlugin } = require("clean-webpack-plugin");
   const config = {
     mode: "development",
     devtool: "inline-source-map", // 로그, 디버깅, 번들링 타임 고려시 선택, 배포시 cheap-module-source-map(용량 젤 작음)
     entry: "./index.ts",
     output: {
       path: path.resolve(__dirname, "./dist"),
       filename: "[name].js",
     },
     resolve: {
       // 확장자가 생략되어도 웹팩이 찾아줌
       modules: ["node_modules"],
       extensions: [".wasm", ".ts", ".tsx", ".mjs", ".cjs", ".js", ".json"], // 확장자명 생략 가능
     },
     module: {
       rules: [
         {
           test: /\.(ts|tsx)$/,
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
               "@babel/preset-typescript", // 타입스크립트
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
         // 컴파일시 오류나 경고 브라우저에서 보여줌
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
       new CleanWebpackPlugin(), // 빌드 이전 결과물 제거
     ],
   };

   module.exports = config;
   ```

6.
