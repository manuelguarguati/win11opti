#Requires -Version 5.1
<#
 Win11Opti engine. Executes ONLY declarative actions from catalog/tweaks.json
 (registry, service, process, power) and safe app removal.
 Motor de Win11Opti. Ejecuta SOLO acciones declarativas del catálogo y registra todo para poder deshacerlo.
#>
param(
    [Parameter(Mandatory)][ValidateSet('Apply','Revert','SetAuto','ClearAuto','RemoveApps','RestartExplorer','CreateRestorePoint')][string]$Action,
    [string]$Ids = '', [double]$Hours = 0, [string]$Games = '', [string]$AppIds = '',
    [ValidateSet('manual','auto')][string]$Source = 'manual'
)
$ErrorActionPreference = 'Stop'
$Dir      = Join-Path $env:ProgramData 'Win11Opti'
$StateF   = Join-Path $Dir 'state.json'
$AutoF    = Join-Path $Dir 'auto.json'
$LogF     = Join-Path $Dir 'engine.log'
$Catalog  = Get-Content (Join-Path $PSScriptRoot '..\catalog\tweaks.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$HighGuid = '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c'
$GuidRx   = '[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}'
$TaskRev  = 'Win11Opti-Revert'
$TaskWat  = 'Win11Opti-AutoWatcher'

if (-not (Test-Path $Dir)) { New-Item -ItemType Directory -Path $Dir | Out-Null }
# Only SYSTEM/Admins can write here; users can read.
& icacls $Dir /inheritance:r /grant:r '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F' '*S-1-5-32-545:(OI)(CI)RX' | Out-Null

function Log($m) { Add-Content -Path $LogF -Value ("{0} {1}" -f (Get-Date -Format 's'), $m) -Encoding UTF8 }
function Save($p, $o) { Set-Content -Path $p -Value (ConvertTo-Json -InputObject $o -Depth 8) -Encoding UTF8 }
function Load($p) { if (Test-Path $p) { Get-Content $p -Raw -Encoding UTF8 | ConvertFrom-Json } }

function Invoke-Do($a) {
    switch ($a.type) {
        'registry' {
            if ($a.path -notmatch '^(HKCU|HKLM):\\') { throw "Registry path not allowed: $($a.path)" }
            $keyExisted = Test-Path $a.path
            $isDefault = ($a.name -eq '(Default)' -or $a.name -eq '@')
            $existed = $false; $old = $null; $oldKind = $null
            if ($keyExisted) {
                try {
                    if ($isDefault) {
                        $old = (Get-Item -Path $a.path).GetValue('')
                        $existed = ($null -ne $old)
                        $oldKind = 'String'
                    } else {
                        $old = (Get-ItemProperty -Path $a.path -Name $a.name -ErrorAction Stop).($a.name)
                        $oldKind = (Get-Item -Path $a.path).GetValueKind($a.name).ToString()
                        $existed = $true
                    }
                } catch {}
            } else {
                New-Item -Path $a.path -Force | Out-Null
            }
            $val = if ($a.kind -eq 'DWord') { [int]$a.value } else { [string]$a.value }
            if ($isDefault) {
                Set-Item -Path $a.path -Value $val
            } else {
                Set-ItemProperty -Path $a.path -Name $a.name -Value $val -Type $a.kind
            }
            return @{
                type='registry'; path=$a.path; name=$a.name; existed=$existed;
                keyExisted=$keyExisted; value=$old; kind=$oldKind; isDefault=$isDefault
            }
        }
        'service' {
            if ($a.name -notmatch '^[A-Za-z0-9_.-]+$') { throw 'Invalid service name' }
            $s = Get-Service -Name $a.name -ErrorAction SilentlyContinue
            if (-not $s) { return $null }
            $was = $s.Status.ToString()
            if ($was -eq 'Running') { Stop-Service -Name $a.name -Force -ErrorAction SilentlyContinue }
            return @{ type='service'; name=$a.name; was=$was }
        }
        'process' {
            if ($a.name -notmatch '^[A-Za-z0-9_.-]+$') { throw 'Invalid process name' }
            $p = Get-Process -Name $a.name -ErrorAction SilentlyContinue | Select-Object -First 1
            if (-not $p) { return $null }
            $path = $p.Path
            Stop-Process -Name $a.name -Force -ErrorAction SilentlyContinue
            return @{ type='process'; name=$a.name; path=$path }
        }
        'power' {
            $cur = [regex]::Match((& powercfg /getactivescheme | Out-String), $GuidRx).Value
            & powercfg /setactive $HighGuid *> $null
            if ($LASTEXITCODE -ne 0) { return $null }
            return @{ type='power'; guid=$cur }
        }
        default { throw "Unknown action type: $($a.type)" }
    }
}

function Invoke-Undo($u) {
    switch ($u.type) {
        'registry' {
            $isDefault = ($u.isDefault -or $u.name -eq '(Default)' -or $u.name -eq '@')
            if ($u.existed) {
                $val = if ($u.kind -eq 'DWord') { [int]$u.value } else { [string]$u.value }
                if ($isDefault) {
                    Set-Item -Path $u.path -Value $val
                } else {
                    Set-ItemProperty -Path $u.path -Name $u.name -Value $val -Type $u.kind
                }
            } else {
                if ($isDefault) {
                    if (-not $u.keyExisted) {
                        Remove-Item -Path $u.path -Recurse -Force -ErrorAction SilentlyContinue
                    } else {
                        Set-Item -Path $u.path -Value '' -ErrorAction SilentlyContinue
                    }
                } else {
                    Remove-ItemProperty -Path $u.path -Name $u.name -ErrorAction SilentlyContinue
                }
            }
        }
        'service' { if ($u.was -eq 'Running') { Start-Service -Name $u.name -ErrorAction SilentlyContinue } }
        'process' { if ($u.path) { Start-Process -FilePath 'explorer.exe' -ArgumentList ('"{0}"' -f $u.path) } }
        'power'   { if ($u.guid) { & powercfg /setactive $u.guid *> $null } }
    }
}

function Revert-All {
    $st = Load $StateF
    if ($st) {
        $undo = @($st.undo); [array]::Reverse($undo)
        foreach ($u in $undo) { try { Invoke-Undo $u } catch { Log "undo failed: $($u.type) $($_.Exception.Message)" } }
        Remove-Item $StateF -Force -ErrorAction SilentlyContinue
        Log 'reverted'
    }
    Unregister-ScheduledTask -TaskName $TaskRev -Confirm:$false -ErrorAction SilentlyContinue
}

function Register-Task($name, $arg, $trigger, $limit) {
    $act = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $arg
    $pri = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest
    $set = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit $limit
    Register-ScheduledTask -TaskName $name -Action $act -Trigger $trigger -Principal $pri -Settings $set -Force | Out-Null
}

switch ($Action) {
 'Apply' {
    Revert-All
    $list = $Ids.Split(',') | Where-Object { $_ } | ForEach-Object { $_.Trim() }
    $chosen = @($Catalog.tweaks | Where-Object { $list -contains $_.id })
    if ($chosen.Count -eq 0) { throw 'No valid tweaks selected' }
    if (@($chosen | Where-Object { $_.risk -ne 'safe' }).Count -gt 0) {
        try { Checkpoint-Computer -Description 'Win11Opti' -RestorePointType MODIFY_SETTINGS } catch { Log "restore point skipped: $($_.Exception.Message)" }
    }
    $undo = @(); $applied = @()
    foreach ($t in $chosen) {
        $ok = $false
        foreach ($a in $t.actions) {
            try { $r = Invoke-Do $a; if ($r) { $r.tweak = $t.id; $undo += $r; $ok = $true } }
            catch { Log "FAILED $($t.id): $($_.Exception.Message)" }
        }
        if ($ok) { $applied += $t.id }
    }
    $end = if ($Hours -gt 0) { (Get-Date).AddHours($Hours) } else { $null }
    Save $StateF @{ applied=@($applied); source=$Source; start=(Get-Date).ToString('o'); end=$(if ($end) { $end.ToString('o') } else { $null }); undo=@($undo) }
    if ($end) {
        $arg = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$PSCommandPath`" -Action Revert"
        Register-Task $TaskRev $arg (New-ScheduledTaskTrigger -Once -At $end) (New-TimeSpan -Minutes 10)
    }
    Log "applied: $($applied -join ',') source=$Source hours=$Hours"
 }
 'Revert' { Revert-All }
 'SetAuto' {
    $g = $Games.Split(',') | Where-Object { $_ -match '^[A-Za-z0-9 ._-]{1,64}\.exe$' }
    $i = $Ids.Split(',') | Where-Object { $_ -match '^[a-z0-9-]+$' -and ($Catalog.tweaks.id -contains $_) }
    if (-not $g -or -not $i) { throw 'Need at least one valid game and tweak' }
    Save $AutoF @{ games=@($g); ids=@($i) }
    $arg = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$(Join-Path $PSScriptRoot 'watcher.ps1')`""
    Register-Task $TaskWat $arg (New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME") ([TimeSpan]::Zero)
    Start-ScheduledTask -TaskName $TaskWat
    Log "auto enabled: $($g -join ',')"
 }
 'ClearAuto' {
    Unregister-ScheduledTask -TaskName $TaskWat -Confirm:$false -ErrorAction SilentlyContinue
    Remove-Item $AutoF -Force -ErrorAction SilentlyContinue
    $st = Load $StateF; if ($st -and $st.source -eq 'auto') { Revert-All }
    Log 'auto disabled'
 }
 'RemoveApps' {
    $apps = $AppIds.Split(',') | Where-Object { $_ } | ForEach-Object { $_.Trim() }
    $removed = @()
    foreach ($app in $apps) {
        if ($app -match '^[A-Za-z0-9._-]+$') {
            Log "Removing appx: $app"
            try {
                Get-AppxPackage -Name "*$app*" | Remove-AppxPackage -AllUsers -ErrorAction SilentlyContinue
                Get-AppxProvisionedPackage -Online | Where-Object { $_.DisplayName -like "*$app*" } | Remove-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue
                $removed += $app
            } catch {
                Log "Failed removing $app: $($_.Exception.Message)"
            }
        }
    }
    Log "Completed debloat apps: $($removed -join ', ')"
 }
 'RestartExplorer' {
    Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 600
    if (-not (Get-Process -Name explorer -ErrorAction SilentlyContinue)) {
        Start-Process explorer.exe
    }
    Log "Restarted Windows Explorer"
 }
 'CreateRestorePoint' {
    try {
        Checkpoint-Computer -Description 'Win11Opti-Manual' -RestorePointType MODIFY_SETTINGS -ErrorAction Stop
        Log "Manual restore point created."
    } catch {
        Log "Manual restore point failed: $($_.Exception.Message)"
        throw $_
    }
 }
}
