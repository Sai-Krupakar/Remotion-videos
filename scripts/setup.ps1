# One-time setup on a new Windows machine.
#   powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\setup.ps1 -WithLocalAI   # also installs the experimental local AI video stack
param(
    [switch]$WithLocalAI,
    [switch]$SkipVoices
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$voices = @(
    'en/en_US/ryan/medium/en_US-ryan-medium',
    'en/en_US/lessac/medium/en_US-lessac-medium',
    'en/en_US/amy/medium/en_US-amy-medium',
    'en/en_US/joe/medium/en_US-joe-medium',
    'en/en_GB/alan/medium/en_GB-alan-medium',
    'en/en_GB/jenny_dioco/medium/en_GB-jenny_dioco-medium'
)

function Step($text) { Write-Host "`n==> $text" -ForegroundColor Cyan }

Step 'Checking Node.js'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js is not installed. Install Node.js 20 or newer from https://nodejs.org and re-run.'
}
$nodeMajor = [int]((node --version).TrimStart('v').Split('.')[0])
if ($nodeMajor -lt 20) { throw "Node.js $(node --version) is too old; install Node.js 20 or newer." }
Write-Host "Node.js $(node --version)"

Step 'Installing JavaScript dependencies (npm ci)'
npm ci
if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }

Step 'Checking Python 3.11'
$python = $null
if (Get-Command py -ErrorAction SilentlyContinue) {
    & py -3.11 --version 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { $python = @('py', '-3.11') }
}
if (-not $python -and (Get-Command python -ErrorAction SilentlyContinue)) {
    $version = & python --version 2>&1
    if ($version -match 'Python 3\.(9|1[0-3])') { $python = @('python') }
}
if (-not $python) {
    throw 'Python 3.11 is required for narration. Install it from https://www.python.org/downloads/ and re-run.'
}

$venv = Join-Path $root '.venv-local-video'
$venvPython = Join-Path $venv 'Scripts\python.exe'
if (-not (Test-Path $venvPython)) {
    Step 'Creating Python environment (.venv-local-video)'
    $exe = $python[0]
    $pyArgs = @($python | Select-Object -Skip 1) + @('-m', 'venv', $venv)
    & $exe @pyArgs
    if ($LASTEXITCODE -ne 0) { throw 'Could not create the Python environment.' }
}

Step 'Installing narration packages (Piper TTS)'
& $venvPython -m pip install --upgrade pip --quiet --use-feature=truststore
& $venvPython -m pip install -r (Join-Path $root 'scripts\requirements-narration.txt')
if ($LASTEXITCODE -ne 0) { throw 'Installing narration packages failed.' }

if ($WithLocalAI) {
    Step 'Installing experimental local AI video packages (large download)'
    & $venvPython -m pip install -r (Join-Path $root 'local-video\requirements.txt')
    if ($LASTEXITCODE -ne 0) { throw 'Installing local AI video packages failed.' }
}

if (-not $SkipVoices) {
    Step 'Downloading Piper voices into voices\ (about 60 MB each)'
    $voiceDir = Join-Path $root 'voices'
    New-Item -ItemType Directory -Force $voiceDir | Out-Null
    foreach ($voice in $voices) {
        $name = Split-Path $voice -Leaf
        foreach ($ext in '.onnx', '.onnx.json') {
            $out = Join-Path $voiceDir "$name$ext"
            if (Test-Path $out) { continue }
            Write-Host "  $name$ext"
            $url = "https://huggingface.co/rhasspy/piper-voices/resolve/main/$voice$ext"
            & curl.exe -sSL --fail -o $out $url
            if ($LASTEXITCODE -ne 0) {
                Remove-Item $out -ErrorAction SilentlyContinue
                throw "Could not download $url"
            }
        }
    }
}

Step 'Checking installed voices'
& $venvPython (Join-Path $root 'scripts\create_narration.py') --list-voices

Step 'Running tests'
npm test
if ($LASTEXITCODE -ne 0) { throw 'Tests failed.' }

$chrome = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) {
    Write-Host "`nNote: Chrome/Edge was not found; Remotion will download its own browser on the first render." -ForegroundColor Yellow
}

Write-Host "`nSetup complete. Try:" -ForegroundColor Green
Write-Host '  npm run dev                                                   # preview in Remotion Studio'
Write-Host '  npm run render -- --video little-seed --resolution portrait-720'
