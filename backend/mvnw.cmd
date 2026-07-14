@REM Maven Wrapper script for Windows
@echo off
setlocal

set "MAVEN_PROJECTBASEDIR=%~dp0"
set "WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.jar"

set MAVEN_CMD_LINE_ARGS=%*

if defined JAVA_HOME (
    "%JAVA_HOME%\bin\java.exe" -jar "%WRAPPER_JAR%" %MAVEN_CMD_LINE_ARGS%
) else (
    java -jar "%WRAPPER_JAR%" %MAVEN_CMD_LINE_ARGS%
)

if ERRORLEVEL 1 goto error
goto end

:error
set ERROR_CODE=1

:end
exit /B %ERROR_CODE%
