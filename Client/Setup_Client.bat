@echo off

REM SETUP FOR SERVER

call	npm init -y
rem	pause
call	npm install
rem	pause
call	npm install typescript --save-dev
rem	pause
call	npm install @types/node --save-dev
rem	pause

if not exist ".vscode" (
	mkdir ".vscode"
)

echo { 															> ".vscode/launch.json"
echo 	"version": "0.2.0",										>> ".vscode/launch.json"
echo 	"configurations": [                                     >> ".vscode/launch.json"
echo 		{                                                   >> ".vscode/launch.json"
echo 			"type": "node",                                 >> ".vscode/launch.json"
echo 			"request": "launch",                            >> ".vscode/launch.json"
echo 			"name": "Launch Program",                       >> ".vscode/launch.json"
echo 			"program": "${workspaceFolder}\\Client.js",     >> ".vscode/launch.json"
echo 			"outFiles": [                                   >> ".vscode/launch.json"
echo 				"${workspaceFolder}/*.js"     	            >> ".vscode/launch.json"
echo 			]												>> ".vscode/launch.json"
echo 		}                                                   >> ".vscode/launch.json"
echo 	]                                                       >> ".vscode/launch.json"
echo } 															>> ".vscode/launch.json"

echo { 															> tsconfig.json
echo     "compilerOptions": { 									>> tsconfig.json
echo         "module": "commonjs", 								>> tsconfig.json
echo         "sourceMap": true, 								>> tsconfig.json
echo         "watch": true 										>> tsconfig.json
echo     } 														>> tsconfig.json
echo } 															>> tsconfig.json

call "./node_modules/.bin/tsc.cmd" -p tsconfig.json --watch false

start "" /B code . -n -g Client.ts

exit 0