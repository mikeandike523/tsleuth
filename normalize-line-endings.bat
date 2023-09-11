for /f "delims=" %%i in ('git ls-files') do (
    dos2unix.exe "%%i"
)