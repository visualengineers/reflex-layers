# Declare the parameters
param (
  [string]$Path = ".", # The path to the directory with the files to be listed
  [string]$Output = "files.txt" # The name of the output file
)

# Check if the file exists
if (Test-Path $Output) {
  # Delete the file
  Remove-Item -Force $Output
}


# Create an empty output file
New-Item -Path $Output -ItemType File -Force

# Loop through all the files in the current directory
Get-ChildItem -Path $Path -File | Where-Object {$_.Extension -ne ".txt" -and $_.Extension -ne ".ps1" } | Sort-Object | ForEach-Object {

  # Append the file name to the output file
  Add-Content -Path $Output -Value $_.Name
}
