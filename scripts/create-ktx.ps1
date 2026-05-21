 # Declare the parameters
param (
  [string]$ToolPath = "C:\Program Files\KTX-Software\bin\toktx.exe",
  [string]$Path = ".", # The path to the directory with the files to be listed
  [string]$Output = "files.txt", # The name of the files list (must be located in $Path)
  [string]$OutputFile = "output_texArray", # The name of the output file
  [int]$NumLayers = 10 # number of layers / textures in the file list
)

# save current directory
$currentDir = Get-Location

cd $Path

$result = "--t2 --encode etc1s --layers " + $NumLayers + " " + $OutputFile + " @" + $Output

echo "Invoking `"$ToolPath`" with Parameters: $result"

# use Invoke-Expression to evaluate string as argument list
Invoke-Expression " & `"$ToolPath`" --% $result"


# Change the current directory back to the stored directory
Set-Location $currentDir