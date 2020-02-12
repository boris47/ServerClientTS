@echo off

REM SETUP FOR CLIENT
call	npm install

call "./node_modules/.bin/tsc.cmd" -p tsconfig.json --watch false

start "" /B code . -n -g Client.ts

exit 0