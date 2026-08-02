# Task 039 — OpenVINO model discovery compatibility

## Goal

Recognize supported nested OpenVINO safety component layouts and reliably start both local
processes.

## Allowed files

- `START-LEXI.cmd`
- `services/image-worker/image_worker/openvino_engine.py`
- `services/image-worker/tests/test_domain.py`
- `tasks/039-openvino-model-discovery.md`

## Acceptance criteria

- Safety checker XML is discovered recursively without assuming one filename.
- Feature-extractor JSON is discovered recursively without assuming one filename.
- Both declared components remain mandatory; missing components still fail closed.
- The Windows launcher uses explicit working directories for worker and web processes.
- Automated tests cover a nested model layout.
