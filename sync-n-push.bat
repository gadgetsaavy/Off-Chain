@echo off
REM Batch file to sync and push to the remote repository
git push --set-upstream origin main
REM Set the default commit message (you can customize this)
SET COMMIT_MESSAGE="Auto-sync commit"

REM Pull latest changes from the remote repository
echo Pulling latest changes from the remote...
git pull --rebase

REM Stage all changes
echo Staging all changes...
git add .

REM Commit changes
echo Committing changes...
git commit -m %COMMIT_MESSAGE%

REM Push changes to the remote repository
echo Pushing changes to the remote repository...
git push

echo Done!
pause
