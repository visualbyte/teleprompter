# Marketing Notes

Features that already work natively but need to be explained to users — no code required.

---

## Cloud Storage Support

**Status:** Already works — no code to build.

**How it works:** Orra's import button uses the native iOS document picker (`expo-document-picker` → `UIDocumentPickerViewController`). iOS natively shows all cloud storage apps the user has enabled in their Files app — Google Drive, OneDrive, Dropbox, iCloud Drive, Box, etc.

**User setup (one-time):** Open iOS Files app → Browse → ... → Edit → toggle on Google Drive (or any other provider).

**Why to market it:** Users assume they need to transfer files via USB/cable. The real workflow is:
- Write script on laptop → save to Google Drive
- On phone: open Orra → tap import → pick from Google Drive directly
- No cable, no computer, no hassle before a shoot

**Suggested copy:** "Works with Google Drive, OneDrive, iCloud, Dropbox — open your script directly from the cloud."

**Origin:** Pain point from a real video shoot — connecting phone to computer, transferring file, disconnecting, remounting on stand just to load a script. Entirely avoidable with cloud + iOS Files integration.
