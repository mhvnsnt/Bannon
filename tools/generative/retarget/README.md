# retarget/ — mocap onto the Bannon 58-bone skeleton

Two complementary inputs, one output (glTF animation on `mixamorig:` bones):

- `mediapipe_to_glb.py` — video → BlazePose 33 landmarks (MediaPipe Pose
  Landmarker, Apache-2.0) → per-bone direction solve → GLB. `--synthetic-test`
  proves the solve without a camera. Real video needs
  `pip install mediapipe opencv-python`; the 9MB model auto-downloads.
- `bvh_retarget.py` — stdlib BVH parser → `mixamo_map.json` joint map → GLB.
  Feed it CMU-database, Mixamo-pack, or itch.io BVH captures.

This writes **GLB animations** (three.js/web builds, previews). The engine's
clip-JSON path (`tools/mocap/video_to_clip.py`, `text_to_clip.py`) is the
sibling system for the UE5/HTML runtime — same sources, different output.
