@echo off

call ClearCache.bat

call Clear.bat

REM Install typescript modules
call npm install typescript @types/mime-types @types/node @types/source-map-support @types/webpack @types/websocket @types/electron-devtools-installer --save-dev

REM Install dev dependencies
call npm install electron electron-builder electron-webpack electron-webpack-ts electron-webpack-vue electron-devtools-installer ts-loader vue-loader vue-property-decorator vue-template-compiler webpack --save-dev

REM Install prod dependencies
call npm install axios electron-updater mime-types source-map-support vue vue-router websocket