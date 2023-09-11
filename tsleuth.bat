@echo OFF
node %~dp0dist/main.js --calling-directory="%CD%" %*
@echo ON