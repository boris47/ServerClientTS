@echo off

call :DeleteFolder %~dp0node_modules

call :DeleteFile %~dp0package-lock.json

call :DeleteFile %~dp0ServerCfg.json

del %~dp0*.js

goto :EOF



:DeleteFile
echo DeleteFile "%~1"
if exist %~1 (
	DEL %~1
)


:DeleteFolder
if exist %~1 (
	echo DeleteFolder "%~1"
	DEL /F /Q /S %~1
	RD /S /Q %~1
)

:ClearFolder
echo ClearFolder "%~1"
set rootPath=%~dp0
cd %~1
del *.map
del *.js
cd %rootPath%