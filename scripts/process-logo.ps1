Add-Type -AssemblyName System.Drawing

$srcPath = Resolve-Path "public/logo.jpg"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)

Write-Host "Source image size: $($src.Width) x $($src.Height)"

# Save a full PNG copy
$src.Save((Join-Path (Get-Location) "public\logo.png"), [System.Drawing.Imaging.ImageFormat]::Png)

# The logo emblem (the helm wheel) is centered horizontally in the upper region.
# In a 1024x576 image (16:9):
# The helm is centered around X = 512, Y ~= 210 with radius approx 180.
# Let's crop the square emblem for the PWA icon and favicon:
# Calculate crop bounds:
$size = [Math]::Min($src.Width, $src.Height)
# For this image (approx 1024x576), crop center-top square
$cropWidth = [int]($src.Height * 0.95)
$cropHeight = $cropWidth
$cropX = [int](($src.Width - $cropWidth) / 2)
$cropY = [int](($src.Height - $cropHeight) * 0.15) # shift slightly up to center on the helm

$cropRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropWidth, $cropHeight)

function Resize-And-Save($targetSize, $outputPath) {
    $targetBmp = New-Object System.Drawing.Bitmap($targetSize, $targetSize)
    $g = [System.Drawing.Graphics]::FromImage($targetBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::FromArgb(9, 13, 22)) # Match background color #090d16

    $destRect = New-Object System.Drawing.Rectangle(0, 0, $targetSize, $targetSize)
    $g.DrawImage($src, $destRect, $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $targetBmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $targetBmp.Dispose()
    Write-Host "Saved: $outputPath ($targetSize x $targetSize)"
}

Resize-And-Save 512 "public/icons/icon-512x512.png"
Resize-And-Save 192 "public/icons/icon-192x192.png"
Resize-And-Save 64 "public/favicon.ico"

$src.Dispose()
Write-Host "Logo processing completed successfully!"
