$first = $true
while ($line = [Console]::In.ReadLine()) {
  try { $data = $line | ConvertFrom-Json } catch { $data = $null }
  if ($first -and $data -and $data.config) {
    $w = $data.config.width
    $h = $data.config.height
    [Console]::Error.WriteLine("Random walker (PowerShell) launching on a ${w}x${h} map")
    $first = $false
  }
  $moves = @("N","S","E","W")
  $idx = Get-Random -Minimum 0 -Maximum 4
  Write-Output $moves[$idx]
}
