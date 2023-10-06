@echo OFF
node %~dp0cli/dist/main.js "%CD%" %*
@echo ON