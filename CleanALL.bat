
@echo off

for /R %%f in (Clean.bat) do (
	IF EXIST %%f (
		echo "%%f"
		call "%%f"
	)
)