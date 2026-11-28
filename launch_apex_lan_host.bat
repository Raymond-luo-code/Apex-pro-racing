@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================================
echo   APEX PRO RACING // LAN MULTIPLAYER HOST MODE (HTTP + WEBSOCKET)
echo   - Friends on same Wi-Fi / LAN can open the URL printed below
echo   - Supports Quick Match + 6-char Private Room Code + Public Lobby
echo ============================================================================
python apex_desktop_app.py --lan %*
if errorlevel 1 (
  echo.
  echo [!] Launch failed. Confirm Python 3 is available in PATH.
  pause
)
