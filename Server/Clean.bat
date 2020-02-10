@echo off

call :DeleteFolder "node_modules"

call :DeleteFolder ".vscode"

del *.map
del *.js

call :DeleteFile package.json
call :DeleteFile package-lock.json
call :DeleteFile tsconfig.json
call :DeleteFile ServerCfg.json

goto :EOF



:DeleteFile
if exist %~1 (
	DEL %~1
)
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
goto :EOF