' ============================================================
' Pizza Hut POS - Launcher
' Starts the local backend server and opens the app in the
' user's default browser. Silently - no console window shown.
' ============================================================

Dim appDir, nodePath, serverScript, port, url

' Resolve the directory this script lives in
appDir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\") - 1)
nodePath    = """" & appDir & "\runtime\node.exe"""
serverScript = """" & appDir & "\server\index.cjs"""
port = 3001
url  = "http://localhost:" & port

' ── 1. Check if server is already running ─────────────────────────────────────
Function IsServerRunning()
  On Error Resume Next
  Dim http
  Set http = CreateObject("MSXML2.XMLHTTP")
  http.Open "GET", url & "/api/settings", False
  http.Send
  If Err.Number = 0 And http.Status >= 200 And http.Status < 400 Then
    IsServerRunning = True
  Else
    IsServerRunning = False
  End If
  On Error GoTo 0
End Function

' ── 2. Start server if not running ────────────────────────────────────────────
If Not IsServerRunning() Then
  Dim shell
  Set shell = CreateObject("WScript.Shell")

  ' Run node.exe silently (window style 0 = hidden, bWaitOnReturn = False)
  shell.Run nodePath & " " & serverScript, 0, False

  ' Wait up to 15 seconds for server to become ready
  Dim waited
  waited = 0
  Do While Not IsServerRunning() And waited < 30
    WScript.Sleep 500
    waited = waited + 1
  Loop

  If Not IsServerRunning() Then
    MsgBox "Pizza Hut POS could not start the local server." & vbCrLf & _
           "Please try running the application again." & vbCrLf & vbCrLf & _
           "If the problem persists, contact your system administrator.", _
           vbCritical, "Pizza Hut POS - Startup Error"
    WScript.Quit 1
  End If
End If

' ── 3. Open the app in the browser (App Mode) ─────────────────────────────────
Dim shell2
Set shell2 = CreateObject("WScript.Shell")

On Error Resume Next
Err.Clear
' Try MS Edge (built into Windows 10/11) in App Mode
shell2.Run "msedge --app=" & url, 1, False

If Err.Number <> 0 Then
  Err.Clear
  ' Try Google Chrome in App Mode
  shell2.Run "chrome --app=" & url, 1, False
  
  If Err.Number <> 0 Then
    Err.Clear
    ' Fallback to default system browser
    shell2.Run url, 1, False
  End If
End If
On Error GoTo 0
