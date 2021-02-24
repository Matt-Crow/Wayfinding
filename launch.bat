@ECHO off
echo Open your web browser to localhost:8000 to view the webpage
echo Pro-tip: use a private window to avoid caching files!
echo Press control-c to exit
python -m http.server 8000
PAUSE
