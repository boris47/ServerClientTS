@echo off

REM SETUP FOR SERVER
call	npm install

call "./node_modules/.bin/tsc.cmd" -p tsconfig.json --watch false

start "" /B code . -n -g Server.ts

exit 0