param(
    [Parameter(Mandatory = $true)][string]$PlanPath,
    [Parameter(Mandatory = $true)][string]$OutputPath
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$plan = Get-Content -LiteralPath $PlanPath -Raw -Encoding UTF8 | ConvertFrom-Json
$speech = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    $speech.SetOutputToWaveFile($OutputPath)
    $speech.Speak([string]$plan.narration)
} finally {
    $speech.Dispose()
}
