param(
  [int]$Port = 8080
)

$RootPath = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Listener = $null

function Get-ContentType($Path) {
  switch ([IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8"; break }
    ".css" { "text/css; charset=utf-8"; break }
    ".js" { "text/javascript; charset=utf-8"; break }
    ".png" { "image/png"; break }
    ".jpg" { "image/jpeg"; break }
    ".jpeg" { "image/jpeg"; break }
    ".webp" { "image/webp"; break }
    ".svg" { "image/svg+xml"; break }
    default { "application/octet-stream" }
  }
}

for ($TryPort = $Port; $TryPort -lt ($Port + 20); $TryPort++) {
  try {
    $Listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Parse("127.0.0.1"), $TryPort)
    $Listener.Start()
    $Port = $TryPort
    break
  } catch {
    if ($Listener) {
      $Listener.Stop()
      $Listener = $null
    }
  }
}

if (-not $Listener) {
  throw "No available port found from $Port to $($Port + 19)."
}

Write-Host "Serving $RootPath at http://127.0.0.1:$Port/"

try {
  while ($true) {
    $Client = $Listener.AcceptTcpClient()
    try {
      $Stream = $Client.GetStream()
      $Reader = [IO.StreamReader]::new($Stream, [Text.Encoding]::ASCII, $false, 1024, $true)
      $RequestLine = $Reader.ReadLine()

      while ($Reader.ReadLine()) {}

      if (-not $RequestLine) {
        continue
      }

      $Parts = $RequestLine.Split(" ")
      $Relative = [Uri]::UnescapeDataString($Parts[1].TrimStart("/"))

      if ([string]::IsNullOrWhiteSpace($Relative)) {
        $Relative = "index.html"
      }

      $FullPath = [IO.Path]::GetFullPath((Join-Path $RootPath $Relative))

      if (-not $FullPath.StartsWith($RootPath, [StringComparison]::OrdinalIgnoreCase)) {
        $Body = [Text.Encoding]::UTF8.GetBytes("Forbidden")
        $Header = "HTTP/1.1 403 Forbidden`r`nContent-Length: $($Body.Length)`r`nConnection: close`r`n`r`n"
      } elseif (Test-Path -LiteralPath $FullPath -PathType Leaf) {
        $Body = [IO.File]::ReadAllBytes($FullPath)
        $Type = Get-ContentType $FullPath
        $Header = "HTTP/1.1 200 OK`r`nContent-Type: $Type`r`nContent-Length: $($Body.Length)`r`nConnection: close`r`n`r`n"
      } else {
        $Body = [Text.Encoding]::UTF8.GetBytes("Not Found")
        $Header = "HTTP/1.1 404 Not Found`r`nContent-Length: $($Body.Length)`r`nConnection: close`r`n`r`n"
      }

      $HeaderBytes = [Text.Encoding]::ASCII.GetBytes($Header)
      $Stream.Write($HeaderBytes, 0, $HeaderBytes.Length)
      $Stream.Write($Body, 0, $Body.Length)
    } finally {
      if ($Client) {
        $Client.Close()
      }
    }
  }
} finally {
  $Listener.Stop()
}
