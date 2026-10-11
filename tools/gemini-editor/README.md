# gemini-editor (shim)

This repo's entry point to the **gemini-editor** instruction-driven image
pipeline. Home base: `~/workspace/font-wizard/tools/gemini-editor/`
(donor-first — no duplicated code).

```bash
tools/gemini-editor/edit_image.py -i in.jpg --instr "make the background black"
```

Full docs: home base `PIPELINE.md`. GPU setup: home base `server/KAGGLE_SETUP.md`.
Env: `GEMINI_EDITOR_HOME` (override home), `GEMINI_EDITOR_GPU_URL` (GPU server),
`ART_STACK_DIR` (art-stack location).
