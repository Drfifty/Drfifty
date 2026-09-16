<?php
// ai config — Arena — B.4 — env wrapper R17 R38 — never hardcode
declare(strict_types=1);
return [
 'cloud'=>['base_url'=>env('CLOUD_LLM_BASE_URL','https://api.openai.com/v1'),'api_key'=>env('CLOUD_LLM_API_KEY',''),'model'=>env('CLOUD_LLM_MODEL','gpt-4o-mini')],
 'local_gpu'=>['endpoint'=>env('LOCAL_GPU_ENDPOINT','http://127.0.0.1:8001'),'allowlist'=>env('LOCAL_GPU_ALLOWLIST','http://vllm:8001,http://127.0.0.1:8001,http://localhost:8001'),'cost_per_1k'=> (float) env('LOCAL_GPU_COST_PER_1K',0.001)],
 'threshold'=> (int) env('AI_FALLBACK_THRESHOLD',90),
 'calibrator_enabled'=> (bool) env('CALIBRATOR_ENABLED',true),
];
