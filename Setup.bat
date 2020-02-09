@echo off

echo Are you going to make a complete setup of server and client

pause

cd Server
start /b /wait Setup_Server.bat
cd ..
cd Client
start /b /wait Setup_Client.bat
rem call "" /B "Client\\Setup_Client.bat"

rem call	tsc -p "Server/Server.ts"
rem call	tsc -p "Client/Client.ts"

pause
exit 0
