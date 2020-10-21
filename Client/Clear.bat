@echo off

call ClearCache.bat


if exist "%APPDATA%/../local/electron" (
	REM Clear local/electron folder
	del /f /s /q "%APPDATA%/../local/electron"

	rmdir /s /q "%APPDATA%/../local/electron"
)

if exist "%APPDATA%/../local/electron-builder" (
	REM Clear local/electron-builder folder
	del /f /s /q "%APPDATA%/../local/electron-builder"

	rmdir /s /q "%APPDATA%/../local/electron-builder"
)

if exist "%APPDATA%/Electron" (
	REM Clear Roaming/Electron folder
	del /f /s /q "%APPDATA%/Electron"

	rmdir /s /q "%APPDATA%/Electron"
)

if exist "node_modules" (
	REM Clear folder Content
	del /f /s /q "node_modules"

	REM Remove directory
	rmdir /s /q "node_modules"
)

if exist "package-lock.json" (
	REM Delete file 'package-lock.json'
rem	del /f /s /q "package-lock.json"
)