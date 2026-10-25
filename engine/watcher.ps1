#Requires -Version 5.1
# Auto mode: applies the chosen tweaks while a listed game is running and reverts when it closes.
# Modo automático: aplica los ajustes mientras corre un juego de tu lista y revierte al cerrarlo.
$Dir    = Join-Path $env:ProgramData 'Win11Opti'
$AutoF  = Join-Path $Dir 'auto.json'
$StateF = Join-Path $Dir 'state.json'
$Engine = Join-Path $PSScriptRoot 'engine.ps1'
function Run-Engine($a) { & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $Engine @a | Out-Null }
while ($true) {
    try {
        if (-not (Test-Path $AutoF)) { break }
        $cfg = Get-Content $AutoF -Raw -Encoding UTF8 | ConvertFrom-Json
        $running = @(Get-Process -ErrorAction SilentlyContinue | ForEach-Object { "$($_.ProcessName).exe" })
        $hit = @($cfg.games | Where-Object { $running -contains $_ }).Count -gt 0
        $st = if (Test-Path $StateF) { Get-Content $StateF -Raw -Encoding UTF8 | ConvertFrom-Json }
        if ($hit -and -not $st) { Run-Engine @('-Action','Apply','-Ids',($cfg.ids -join ','),'-Source','auto') }
        elseif (-not $hit -and $st -and $st.source -eq 'auto') { Run-Engine @('-Action','Revert') }
    } catch {}
    Start-Sleep -Seconds 10
}
