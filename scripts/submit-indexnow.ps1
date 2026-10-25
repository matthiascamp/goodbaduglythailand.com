$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$keyFile = Get-ChildItem -LiteralPath (Join-Path $repo 'public') -File |
    Where-Object { $_.Name -match '^[0-9a-f]{32}\.txt$' } |
    Select-Object -First 1
if (-not $keyFile) { throw 'IndexNow key file is missing.' }
$key = $keyFile.BaseName
[xml]$sitemap = Get-Content -LiteralPath (Join-Path $repo 'public\sitemap.xml') -Raw
$urls = @($sitemap.urlset.url | ForEach-Object { $_.loc })
$body = @{
    host = 'goodbaduglythailand.com'
    key = $key
    urlList = $urls
} | ConvertTo-Json -Depth 3
Invoke-WebRequest -Uri 'https://api.indexnow.org/indexnow' -Method Post -ContentType 'application/json; charset=utf-8' -Body $body -UseBasicParsing | Select-Object StatusCode
