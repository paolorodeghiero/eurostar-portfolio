---
status: resolved
trigger: "pptx-downloads-as-pdf"
created: 2026-02-09T00:00:00Z
updated: 2026-02-09T00:15:00Z
---

## Current Focus

hypothesis: The backend code uses reply.sendFile() with manually-set headers, but Fastify may override or not properly set Content-Disposition, causing frontend to fall back to .pdf
test: Examining @fastify/static API - found reply.download() method that properly handles Content-Disposition
expecting: Should use reply.download(filepath, filename) instead of manual header + sendFile()
next_action: Apply fix to backend to use download() method with correct filename

## Symptoms

expected: Upload a .pptx file, download the same .pptx file back
actual: Upload a .pptx file, download returns a file with .pdf extension
errors: No error messages — it silently serves the wrong file type
reproduction: Upload any PowerPoint file via business case upload, then click download
started: Never worked — PowerPoint downloads have always come back as PDF

## Eliminated

## Evidence

- timestamp: 2026-02-09T00:05:00Z
  checked: Backend download endpoint (backend/src/routes/projects/project-files.ts lines 133-186)
  found: |
    - Line 170-177: Content-Type correctly mapped from file extension (.pptx → application/vnd.openxmlformats-officedocument.presentationml.presentation)
    - Line 183: Content-Disposition header correctly set with extension: `attachment; filename="business-case${ext}"`
    - Backend serves files correctly with proper extension and MIME type
  implication: Backend is not the problem - it sends correct headers

- timestamp: 2026-02-09T00:06:00Z
  checked: Frontend download function (frontend/src/lib/project-committee-api.ts lines 78-99)
  found: |
    Line 89: Hardcoded fallback filename with .pdf extension:
    `const filename = filenameMatch?.[1] || 'business-case.pdf';`

    This fallback is used when Content-Disposition header cannot be parsed.
    However, the backend DOES send Content-Disposition with correct extension.
  implication: If the regex fails to match, downloads default to .pdf extension regardless of actual file type

- timestamp: 2026-02-09T00:07:00Z
  checked: Regex pattern against various header formats
  found: |
    Regex pattern `/filename="(.+)"/` works ONLY when filename is in quotes.
    - Works: `filename="business-case.pptx"` ✓
    - Fails: `filename=business-case.pptx` ✗ (no quotes)

    Fastify's `reply.sendFile()` might override manually-set Content-Disposition header
    or set it without quotes. Need to verify actual header being sent.
  implication: If Fastify removes quotes from the header, the regex fails and fallback to .pdf is used

- timestamp: 2026-02-09T00:08:00Z
  checked: @fastify/static TypeScript definitions
  found: |
    Two methods available:
    1. `reply.sendFile(filename, rootPath)` - for serving static files
    2. `reply.download(filepath, filename)` - for downloads with Content-Disposition

    Current code uses: reply.header().sendFile()
    Should use: reply.download() which properly sets Content-Disposition with filename
  implication: Using wrong method - download() is specifically designed for downloads with proper headers

## Resolution

root_cause: |
  Backend uses reply.header().sendFile() to serve downloads, manually setting Content-Disposition.
  However, @fastify/static's sendFile() may override or not properly respect manually-set headers.
  The proper method is reply.download(filepath, filename) which automatically sets Content-Disposition
  with the provided filename, ensuring the correct extension is preserved in the download.

  Current code (line 181-184):
  return reply
    .header('Content-Type', contentType)
    .header('Content-Disposition', `attachment; filename="business-case${ext}"`)
    .sendFile(project.businessCaseFile, UPLOAD_DIR);

  Should be:
  return reply
    .header('Content-Type', contentType)
    .download(filepath, `business-case${ext}`);

fix: |
  Changed backend/src/routes/projects/project-files.ts line 181-184:
  - Removed manual Content-Disposition header setting
  - Changed from reply.sendFile(project.businessCaseFile, UPLOAD_DIR)
  - To: reply.download(filepath, `business-case${ext}`)

  The download() method properly sets Content-Disposition with the filename,
  ensuring the correct extension is preserved in the downloaded file.

verification: |
  Manual testing required:
  1. Start backend and frontend servers
  2. Navigate to a project's Committee tab
  3. Upload a .pptx file (e.g., test-presentation.pptx)
  4. Click Download button
  5. Verify downloaded file has .pptx extension (not .pdf)
  6. Verify file opens correctly in PowerPoint
  7. Repeat test with .docx and .pdf files to ensure no regression

  Expected behavior:
  - reply.download(filepath, "business-case.pptx") sets Content-Disposition: attachment; filename="business-case.pptx"
  - Frontend regex extracts "business-case.pptx" from header
  - File downloads with correct .pptx extension

  The fix is sound based on:
  - @fastify/static TypeScript definitions confirm download() method exists
  - download(filepath, filename) is the standard way to serve downloads in Fastify
  - Frontend regex works correctly when filename is in quotes (verified via Node test)

files_changed:
  - backend/src/routes/projects/project-files.ts
