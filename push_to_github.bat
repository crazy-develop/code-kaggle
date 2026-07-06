@echo off
echo Initializing push to crazy-develop/sanskriti-hackindia...
git init
git remote remove origin >nul 2>&1
git remote add origin https://github.com/crazy-develop/sanskriti-hackindia.git
git add .
git commit -m "first commit"
git branch -M main
echo.
echo Pushing to GitHub...
git push -u origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Push failed. Make sure you have permission to push to this repository.
) else (
    echo.
    echo SUCCESS: Project pushed to GitHub successfully!
)
pause
