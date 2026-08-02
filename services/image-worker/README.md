# Local image worker

Runs serialized OpenVINO generation on Intel GPU. Requests share a stable job ID and output goes to
`generated/quarantine`. Run `start-worker.cmd`; health is `http://127.0.0.1:8765/health`.

`POST /v1/images/jobs` accepts only `term`, `meaning`, `context`, and `level`, never arbitrary
prompts. Output is not exposed until the independent safety step (Task 037).

The measured first generation took 76.2 seconds, so collections must enqueue images ahead of
practice and reuse cached results instead of blocking each question.
