#define MyAppName      "Pizza Hut POS"
#define MyAppVersion   "1.5.0.0"
#define MyAppPublisher "Pizza Hut"

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
SetupIconFile=browser-release\dist\logo.ico

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: checkedonce

[Files]
; Frontend build
Source: "browser-release\dist\*"; DestDir: "{app}\dist"; Flags: ignoreversion recursesubdirs createallsubdirs

; Backend server + its node_modules
Source: "browser-release\server\*"; DestDir: "{app}\server"; Flags: ignoreversion recursesubdirs createallsubdirs

; Bundled Node.js runtime
Source: "browser-release\runtime\node.exe"; DestDir: "{app}\runtime"; Flags: ignoreversion

; Launcher script
Source: "browser-release\launcher.vbs"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
; Start Menu shortcut → runs launcher silently via wscript
Name: "{autoprograms}\{#MyAppName}"; Filename: "{sys}\wscript.exe"; Parameters: "/b ""{app}\launcher.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\unins000.exe"

; Desktop shortcut (optional, ticked by default)
Name: "{autodesktop}\{#MyAppName}"; Filename: "{sys}\wscript.exe"; Parameters: "/b ""{app}\launcher.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\unins000.exe"; Tasks: desktopicon

[Run]
; Launch the app after installation finishes
Filename: "{sys}\wscript.exe"; Parameters: "/b ""{app}\launcher.vbs"""; WorkingDir: "{app}"; Description: "Launch {#MyAppName}"; Flags: postinstall nowait skipifsilent

[Code]
var
  DataDir: String;

// Find the best available non-system drive for the database
function FindBestDataDrive(): String;
var
  I: Integer;
  DrivePath: String;
begin
  for I := Ord('D') to Ord('Z') do
  begin
    DrivePath := Chr(I) + ':\';
    if DirExists(DrivePath) then
    begin
      Result := DrivePath;
      Exit;
    end;
  end;
  Result := 'C:\';
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  ConfigPath: String;
  ConfigContent: String;
begin
  if CurStep = ssPostInstall then
  begin
    // Determine and create database directory
    DataDir := FindBestDataDrive() + 'PizzaHutPOS-Data';
    if not DirExists(DataDir) then
      ForceDirectories(DataDir);

    // Write config.json to ProgramData so the server can find the DB path
    ConfigPath := ExpandConstant('{commonappdata}\PizzaHutPOS');
    if not DirExists(ConfigPath) then
      ForceDirectories(ConfigPath);

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
    // Remove config only — preserve the database
    ConfigPath := ExpandConstant('{commonappdata}\PizzaHutPOS\config.json');
    if FileExists(ConfigPath) then
      DeleteFile(ConfigPath);
  end;
end;
