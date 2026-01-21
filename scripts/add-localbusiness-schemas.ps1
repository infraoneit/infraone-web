#!/usr/bin/env pwsh

# Script to batch add LocalBusiness schemas to all regional pages
# This script generates the necessary imports and schema additions for all 23 remaining regional pages

Write-Host "Adding LocalBusiness Schemas to Regional Pages..." -ForegroundColor Green

# Webdesign regional pages (11 remaining)
$webdesignRegions = @(
    'zuerich', 'schaffhausen', 'thurgau', 'st-gallen', 'basel', 
    'bern', 'luzern', 'aargau', 'zug', 'solothurn', 'graubuenden'
)

# IT-Support regional pages (6)
$itSupportRegions = @(
    'winterthur', 'zuerich', 'schaffhausen', 'thurgau', 'st-gallen', 'andelfingen'
)

# Telefonie regional pages (6)
$telefonieRegions = @(
    'winterthur', 'zuerich', 'schaffhausen', 'thurgau', 'st-gallen', 'rapperswil'
)

Write-Host "`nWebdesign Pages: $($webdesignRegions.Count)" -ForegroundColor Cyan
Write-Host "IT-Support Pages: $($itSupportRegions.Count)" -ForegroundColor Cyan
Write-Host "Telefonie Pages: $($telefonieRegions.Count)" -ForegroundColor Cyan
Write-Host "`nTotal Regional Pages to Process: $($webdesignRegions.Count + $itSupportRegions.Count + $telefonieRegions.Count)" -ForegroundColor Yellow

Write-Host "`nNote: This is a reference script. Actual implementation done via code edits." -ForegroundColor Gray
