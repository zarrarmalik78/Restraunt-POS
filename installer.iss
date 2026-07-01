#define MyAppName "Pizza Hut POS"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Pizza Hut"
#define MyAppExeName "Pizza Hut POS.exe"

[Setup]
AppId={{D377B6BE-1456-43B0-8F97-B3B8A74AE8D1}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppName}
DisableProgramGroupPage=yes
LicenseFile=eula.txt
OutputDir=installer_build
OutputBaseFilename=PizzaHutPOSInstaller
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "release\win-unpacked\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "release\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Code]
var
  DataDir: String;

// Function to find a suitable non-system drive
function FindBestDataDrive(): String;
var
  I: Integer;
  DrivePath: String;
begin
  // Start searching from D to Z
  for I := Ord('D') to Ord('Z') do
  begin
    DrivePath := Chr(I) + ':\';
    if DirExists(DrivePath) then
    begin
      Result := DrivePath;
      Exit;
    end;
  end;
  
  // Fallback to C:\
  Result := 'C:\';
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  ConfigPath: String;
  ConfigContent: String;
begin
  if CurStep = ssPostInstall then
  begin
    // Determine the data directory
    DataDir := FindBestDataDrive() + 'PizzaHutPOS-Data';
    
    // Create the directory
    if not DirExists(DataDir) then
    begin
      ForceDirectories(DataDir);
    end;
    
    // Write configuration file to ProgramData
    ConfigPath := ExpandConstant('{commonappdata}\PizzaHutPOS');
    if not DirExists(ConfigPath) then
    begin
      ForceDirectories(ConfigPath);
    end;
    
    // JSON content. 
    ConfigContent := '{"dataDir": "' + DataDir + '"}';
    StringChange(ConfigContent, '\', '\\');
    
    SaveStringToFile(ConfigPath + '\config.json', ConfigContent, False);
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  ConfigPath: String;
begin
  if CurUninstallStep = usPostUninstall then
  begin
    // Remove the config file, but keep the database
    ConfigPath := ExpandConstant('{commonappdata}\PizzaHutPOS\config.json');
    if FileExists(ConfigPath) then
    begin
      DeleteFile(ConfigPath);
    end;
  end;
end;
