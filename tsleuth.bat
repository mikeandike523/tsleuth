@echo OFF
node %~dp0cli/dist/main.js --calling-directory="%CD%" %*
@echo ON