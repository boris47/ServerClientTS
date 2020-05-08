@echo off

if exist "node_modules" (
	REM Clear folder Content
	del /f /s /q "node_modules"

	REM Remove directory
	rmdir /s /q "node_modules"
)

if exist "package-lock.json" (
	REM Delete file 'package-lock.json'
	del /f /s /q "package-lock.json"
)