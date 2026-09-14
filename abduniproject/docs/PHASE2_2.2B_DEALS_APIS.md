# PHASE 2.2b — AU DEALS APIs (Arena Canonical)

> **Env:** `Arena` (`arena/01a09d54-drfifty`) | **Project:** `abduniproject` (`adl_`) | **Base:** `https://api.abduni.com/api/v1` | **Auth:** JWT 15m | **App:** `AU_DEALS` | **Date:** 2026-09-14

## 0) Global Contract (inherits 2.2a)

| Item | Value |
|------|-------|
| **Headers** | `Authorization: Bearer <jwt>` + `X-App-Id: AU_DEALS` + `Idempotency-Key: uuid` (POST) + `Accept: application/json` |
| **Rate** | `60/min` global, `20/min` listings POST, `30/min` search GET |
| **Pagination** | `?page&per_page=15` → `{data, meta:{current_page,last_page,total}, links}` |
| **Errors** | `{message, code, errors, meta:{trace_id}}` |
| **RBAC** | `deals.view` vs `deals.execute` (Rule36), `is_hidden` DOM strip + server `can` |
| **Lite** | `CheckModuleStatus:AU DEALS → 503 {code:"module_hibernated"}` |

```ts
type AppId='AU_DEALS'; type UUID=string; type MoneySubunit=number;
type Paginated<T>={data:T[]; meta:{current_page:number;last_page:number;total:number}};
```

---

## 1) Listing Creation — `POST /api/v1/deals/listings`

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` |
| **RBAC** | `can:deals.create.execute` (seller/vendor) |
| **Throttle** | `20/min` |
| **Idempotency** | `Idempotency-Key: uuid` → dedup `deals_listings.uuid` 24h |

**Headers:**
```
Authorization: Bearer eyJ...
X-App-Id: AU_DEALS
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```

**Request JSON (201):**
```json
{
  "category_id": 3,
  "title": "بنادول إكسترا 500mg جملة",
  "title_ar": "بنادول إكسترا 500mg جملة",
  "description": "عرض جملة 1000 علبة، صلاحية 2027",
  "description_ar": "عرض جملة 1000 علبة، صلاحية 2027",
  "type": "bulk",
  "currency": "EGP",
  "price_subunit": 750000,
  "original_price_subunit": 850000,
  "stock_quantity": 1000,
  "min_order_quantity": 10,
  "unit": "box",
  "governorate": "Cairo",
  "city": "Nasr City",
  "lat": 30.0444,
  "lng": 31.2357,
  "expiry_date": "2027-12-31",
  "bundle_id": null,
  "attributes": {"concentration":"500mg","expiry_months":18},
  "items": [
    {"sku":"PAN-500-1000","name":"Panadol Extra","name_ar":"بنادول إكسترا","quantity":1000,"price_subunit":750,"batch_number":"B2027A","expiry_date":"2027-12-31"}
  ]
}
```

**Validation (`StoreListingRequest`):**
```php
'category_id'=>['required','exists:deal_categories,id','where:is_active,1'],
'title'=>['required','string','min:10','max:255'], 'title_ar'=>['required','string','min:10','max:255'],
'description'=>['required','string','min:20','max:5000'], 'description_ar'=>['required','string','min:20','max:5000'],
'type'=>['required','in:single,bulk,bundle,barter'], 'currency'=>['required','in:EGP,USD,SAR,AED'],
'price_subunit'=>['required','integer','min:1'], 'stock_quantity'=>['required','integer','min:1','max:1000000'],
'governorate'=>['required','string','max:80'], 'city'=>['required','string','max:80'],
'lat'=>['required','numeric','between:-90,90'], 'lng'=>['required','numeric','between:-180,180'],
'attributes'=>['sometimes','array'], // validated against category.attributes_schema JSON
'items'=>['sometimes','array','max:50'], 'items.*.sku'=>['required_with:items','string','max:80'], 'items.*.quantity'=>['required','integer','min:1'],
```

**Success `201`:**
```json
{
  "data": {
    "listing": {"uuid":"...","title":"بنادول إكسترا 500mg جملة","status":"active","price_subunit":750000,"available":1000,"location_point":"POINT(31.2357 30.0444)","attributes":{"concentration":"500mg"}},
    "items_count":1
  },
  "meta":{"trace_id":"..."}
}
```

**Errors:** `400` missing app_id, `401` token_expired, `403` forbidden_execute, `422` {`errors:{title:[...], price_subunit:[...]}`}, `429`, `503` hibernated, `500`.

---

## 2) Deal Search Feeds — `GET /api/v1/deals/listings`

| Field | Value |
|-------|-------|
| **Guard** | `public` (L1 Guest) or `auth:jwt` (boost) — **Oil1:** contact hidden pre-escrow |
| **Cache** | `Redis::remember deals:feed:{hash} 60s` (Rule37, no COUNT(*) on live) |
| **Index** | `FULLTEXT ngram` + `SPATIAL` radius `ST_Distance_Sphere` |

**Query Params:**
```
?q=بنادول&category_id=1&governorate=Cairo&city=Nasr City&lat=30.0444&lng=31.2357&radius_km=10
&min_price=10000&max_price=1000000&currency=EGP&type=bulk&sort=relevance|price_asc|newest
&page=1&per_page=15
```

**Success `200`:**
```json
{
  "data": [
    {
      "uuid":"...","title":"بنادول إكسترا 500mg جملة","title_ar":"بنادول إكسترا","price_subunit":750000,"currency":"EGP","stock_quantity":1000,
      "governorate":"Cairo","city":"Nasr City","distance_m":850,"relevance":12.4,
      "seller":{"id":77,"name":"مورد معتمد","badge":"verified_8pt","is_contact_hidden":true},
      "views_count":124,"is_stagnant":false
    }
  ],
  "meta":{"current_page":1,"last_page":12,"total":178,"took_ms":18},
  "links":{"next":"?page=2..."}
}
```
*Contact:* `is_contact_hidden:true` until `escrow holding` (Oil1). `distance_m` from `ST_Distance_Sphere(location_point, @center)`.

**SQL (engine):**
```sql
SELECT *, MATCH(title,title_ar,description,description_ar) AGAINST (? IN BOOLEAN MODE) AS rel,
       ST_Distance_Sphere(location_point, ST_SRID(POINT(?,?),4326)) AS dist
FROM deals_listings WHERE status='active' AND is_hidden=0 AND (? IS NULL OR MATCH(...) AGAINST (?)) AND ST_Distance_Sphere(...)<10000 ORDER BY rel DESC LIMIT 15 OFFSET 0;
```

**Errors:** `400` invalid radius, `422` `q min:2`, `500`.

---

### 2.1 `GET /api/v1/deals/listings/{uuid}`

| Field | Value |
|-------|-------|
| **Guard** | `public` |

**Success `200`:**
```json
{
  "data": {
    "listing":{"uuid":"...","title":"...","description":"...","price_subunit":750000,"original_price_subunit":850000,"discount_percentage":11.76,"stock_quantity":1000,"unit":"box","governorate":"Cairo","city":"Nasr City","expiry_date":"2027-12-31","views_count":125,"clicks_count":12,"interactions_count":0,"is_stagnant":true,"attributes":{"concentration":"500mg"},"seller":{"id":77,"badge":"8pt"},"category":{"id":3,"name":"Medicines"}},
    "items":[{"sku":"PAN-500-1000","quantity":1000,"price_subunit":750,"batch_number":"B2027A","expiry_date":"2027-12-31"}],
    "bundle":null
  }
}
```
*Side-effect:* `increment views_count` via `DB::table->increment` + `stagnant` untouched; `click` via `POST /deals/listings/{uuid}/click` dedup 24h IP+session.

**Errors:** `404 {code:"listing_not_found"}`, `410 {code:"listing_hidden"}`.

---

## 3) Stagnant Deal Promotion Triggers

### 3.1 `GET /api/v1/deals/stagnant` — vendor’s stagnant feed

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` |
| **RBAC** | `can:deals.stagnant.view` (owner only) |

**Query:** `?status=pending&per_page=15`

**Success `200`:**
```json
{
  "data":[
    {"listing_uuid":"...","title":"بنادول...","stagnant_since":"2026-09-13T09:00:00Z","views_at_detection":0,"interaction_count":0,"is_notified":true,"status":"pending"}
  ],
  "meta":{"total":3}
}
```

### 3.2 `POST /api/v1/deals/stagnant/{uuid}/promote`

| Field | Value |
|-------|-------|
| **Guard** | `auth:jwt` |
| **RBAC** | `can:deals.promote.execute` (owner) + `requires_hitl?` via `micro_switch_matrix` (Agent 4) |
| **Throttle** | `10/min` |

**Request:**
```json
{
  "action": "boost_price_cut",
  "discount_percentage": 5,
  "boost_days": 3,
  "note": "تخفيض تحفيزي 5%"
}
```
**Validation:**
```php
'action'=>['required','in:boost_price_cut,boost_featured,relist'],
'discount_percentage'=>['required_if:action,boost_price_cut','numeric','between:1,30'],
'boost_days'=>['required','integer','between:1,7'],
```

**Success `200`:**
```json
{
  "data": {
    "listing":{"uuid":"...","price_subunit":712500,"discount_percentage":5,"is_featured":true,"is_stagnant":false},
    "stagnant":{"status":"resolved","resolved_at":"2026-09-14T09:05:00Z"},
    "promotion":{"bundle_items":null,"valid_to":"2026-09-17T09:05:00Z"}
  }
}
```
*Engine:* `DB::transaction` → `UPDATE deals_listings SET price_subunit = price_subunit * (1 - discount/100), is_stagnant=0, is_featured=1` + `DELETE stagnant_deals` + `Agent 4 log`. Idempotent per listing 24h.

**Errors:** `404` not stagnant, `409 {code:"already_promoted_24h"}`, `422`, `403 not_owner`.

---

## 4) Provider Catalog Endpoints

### 4.1 `GET /api/v1/deals/providers`

| Field | Value |
|-------|-------|
| **Guard** | `public` (catalog) |
| **Cache** | `60s` |

**Query:** `?category=medicines&governorate=Cairo&verified=1&sort=rating_desc&page=1`

**Success `200`:**
```json
{
  "data":[
    {"id":77,"name":"مورد أدوية معتمد","name_ar":"مورد أدوية","category":"medicines","rating":4.8,"completed_deals":142,"is_verified":true,"governorate":"Cairo","badge":"8pt","top_listings":[{"uuid":"...","title":"بنادول..."}]}
  ],
  "meta":{"total":45}
}
```

### 4.2 `GET /api/v1/deals/providers/{id}`

**Success `200`:**
```json
{
  "data":{
    "provider":{"id":77,"name":"مورد أدوية معتمد","rating":4.8,"verified":true,"member_since":"2024-03-01","categories":["medicines","bulk-stock"],"governorate":"Cairo"},
    "listings": {"data":[...],"meta":{}},
    "stats":{"active_listings":12,"stagnant_count":1}
  }
}
```

**Errors:** `404`, `500`.

---

## 5) Status Codes Matrix

| Code | When |
|------|------|
| `200` | search, get, promote success, catalog |
| `201` | listing creation |
| `400` | invalid query (radius>100, per_page>50) |
| `401` | `token_expired/token_invalid` |
| `403` | `forbidden_execute/not_owner/module_hibernated` |
| `422` | validation `errors:{field:[msg]}` + leak_detected |
| `429` | throttle `Retry-After` |
| `500` | unhandled + trace_id |
| `503` | `AU DEALS` hibernated via `feature_flags` |

---

## 6) Route File (Laravel 12)

```php
// routes/api/v1/deals.php — Arena canonical
use App\Modules\AUDeals\Http\Controllers\Api\V1\ListingController;
use App\Modules\AUDeals\Http\Controllers\Api\V1\ProviderController;
use App\Modules\AUDeals\Http\Controllers\Api\V1\StagnantController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/deals')->group(function(){
  // Public feed
  Route::get('listings', [ListingController::class,'index']);
  Route::get('listings/{uuid}', [ListingController::class,'show']);
  Route::get('providers', [ProviderController::class,'index']);
  Route::get('providers/{id}', [ProviderController::class,'show']);
  // Auth
  Route::middleware('auth:jwt')->group(function(){
    Route::post('listings', [ListingController::class,'store'])->middleware(['can:deals.create.execute','throttle:20,1']);
    Route::put('listings/{uuid}', [ListingController::class,'update'])->middleware('can:deals.update.execute');
    Route::get('stagnant', [StagnantController::class,'index'])->middleware('can:deals.stagnant.view');
    Route::post('stagnant/{uuid}/promote', [StagnantController::class,'promote'])->middleware('can:deals.promote.execute');
  });
});
```

---

**ملخص عربي:** واجهات AU DEALS بجاهزية إنتاج — إنشاء قوائم مع حقول ديناميكية JSON ومخزون SKU، وبحث سريع FULLTEXT + مكاني مع إخفاء جهات الاتصال قبل الضمان، وتتبع الركود 24 ساعة وترويج بخصم/تثبيت، وكتالوج موردين مصنّف، مع مفاتيح تكرار وفصل عرض/تنفيذ.

*Next: [PROMPT 2.3] Global Search & Reverb*
