<?php
// ai config — Arena — B.4/B.11 + FIX-360-12 central thresholds — env wrapper R17 R38 — never hardcode
declare(strict_types=1);
$threshold = (int) env('AI_FALLBACK_THRESHOLD', 90);
return [
 'cloud'=>['base_url'=>env('CLOUD_LLM_BASE_URL','https://api.openai.com/v1'),'api_key'=>env('CLOUD_LLM_API_KEY',''),'model'=>env('CLOUD_LLM_MODEL','gpt-4o-mini')],
 'local_gpu'=>['endpoint'=>env('LOCAL_GPU_ENDPOINT','http://vllm_gpu:8000/v1'),'allowlist'=>env('LOCAL_GPU_ALLOWLIST','http://vllm_gpu:8000/v1,http://vllm_gpu:8000,http://vllm:8001,http://127.0.0.1:8001,http://localhost:8001'),'cost_per_1k'=> (float) env('LOCAL_GPU_COST_PER_1K',0.001)],
 'threshold'=> $threshold,
 // FIX-360-12: single source — calibrator heal < threshold, stepDown = threshold-10 (default 80), no magic 90 in code
 'calibrator_enabled'=> (bool) env('CALIBRATOR_ENABLED',true),
 'calibrator_threshold'=> (int) env('CALIBRATOR_HEALTH_THRESHOLD', $threshold),
 'step_down_threshold'=> (int) env('AI_STEP_DOWN_THRESHOLD', max(0, $threshold - 10)),
 'clock_skew_margin'=> (int) env('CLOCK_SKEW_MARGIN',30),
];
