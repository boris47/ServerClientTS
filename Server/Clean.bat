@echo off

call :DeleteFolder "node_modules"

call :DeleteFolder ".vscode"

del *.map
del *.js

del package.json
del package-lock.json
del tsconfig.json

goto :EOF

:DeleteFolder
if exist %~1 (
	DEL /F /Q /S %~1
	RD /S /Q %~1
)
goto :EOF

:ClearFolder
set rootPath=%~dp0
cd %~1
del *.map
del *.js
cd %rootPath%