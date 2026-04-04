"""Gemini prompt templates for structuring web-sourced content."""

INGREDIENT_PROMPT = """You are a skincare content processor. Given raw data from multiple web sources about the ingredient "{name}", produce a structured JSON entry.

RULES:
- Every factual claim MUST cite a source_url from the provided sources
- Categorize into exactly one of: vitamin, acid, peptide, antioxidant, humectant, emollient, surfactant, preservative, botanical, retinoid, exfoliant, other
- Assign departments from: skincare, haircare, bodycare (can be multiple)
- Rate safety: safe | caution | prescription
- Identify which concerns this helps from: acne, aging, pigmentation, dryness, sensitivity, dullness, oiliness, redness, hair_fall, dandruff, frizz, breakage, stretch_marks, body_acne
- Identify conflicting ingredients (e.g. retinol + AHA)
- Assign descriptive tags for discoverability (e.g. "brightening", "anti-inflammatory")
- Do NOT generate information not present in the sources. If unsure, omit the field.
- Output ONLY valid JSON, no markdown fences.

RAW SOURCES:
{sources_block}

OUTPUT JSON SCHEMA:
{{
  "also_known_as": ["string"],
  "category": "string",
  "what_it_does": "one sentence",
  "how_it_works": "2-3 sentences",
  "benefits": ["string"],
  "who_its_for": ["string — skin types or concerns"],
  "avoid_with": ["ingredient names"],
  "safety_rating": "safe|caution|prescription",
  "concentration_range": "e.g. 2-5% or null",
  "facts": [{{"text": "claim", "source_url": "url", "source_name": "name"}}],
  "departments": ["skincare"],
  "tags": ["string"]
}}"""


ARTICLE_PROMPT = """You are a skincare content editor. Given raw web page text from multiple sources about "{topic}", produce a structured article JSON.

RULES:
- Write a clear, informative article synthesizing the sources
- Every factual claim in the body must be attributable to a provided source
- Classify the article type as exactly one of: guide_101, expert_tip, editorial, popular_read
- Assign departments from: skincare, haircare, bodycare
- Assign related concern names from: acne, aging, pigmentation, dryness, sensitivity, dullness, hair_fall, dandruff, frizz
- Estimate read time in minutes (body word count / 200)
- If there's a clear expert author, extract their name and credentials
- Do NOT invent quotes or credentials not in the sources
- Output ONLY valid JSON, no markdown fences.

RAW SOURCES:
{sources_block}

OUTPUT JSON SCHEMA:
{{
  "title": "string",
  "type": "guide_101|expert_tip|editorial|popular_read",
  "summary": "2-3 sentences",
  "body": "full article in markdown, cite sources inline as [Source Name](url)",
  "author_name": "string or null",
  "author_credential": "string or null",
  "read_time_minutes": 5,
  "tags": ["string"],
  "departments": ["skincare"],
  "concerns": ["acne"],
  "image_search_query": "search query to find a relevant hero image"
}}"""


CONCERN_PROMPT = """You are a dermatology content processor. Given raw data from multiple sources about the skin/hair concern "{name}", produce a structured JSON entry.

RULES:
- Every factual claim MUST cite source_url from provided sources
- Assign departments from: skincare, haircare, bodycare
- List recommended and avoid ingredients by common name
- Include lifestyle tips if mentioned in sources
- Structure severity levels if the condition has mild/moderate/severe forms
- Do NOT invent medical advice not in the sources
- Output ONLY valid JSON, no markdown fences.

RAW SOURCES:
{sources_block}

OUTPUT JSON SCHEMA:
{{
  "description": "what this condition is, 2-3 sentences",
  "causes": [{{"text": "cause", "source_url": "url", "source_name": "name"}}],
  "symptoms": [{{"text": "symptom", "source_url": "url", "source_name": "name"}}],
  "treatments": [{{"text": "treatment approach", "source_url": "url", "source_name": "name"}}],
  "recommended_ingredients": ["niacinamide", "salicylic acid"],
  "avoid_ingredients": ["alcohol", "fragrance"],
  "lifestyle_tips": [{{"text": "tip", "source_url": "url", "source_name": "name"}}],
  "severity_levels": {{"mild": "description", "moderate": "description", "severe": "description"}},
  "departments": ["skincare"],
  "tags": ["string"],
  "image_search_query": "search query for a relevant image"
}}"""


MYTHS_PROMPT = """You are a skincare myth-buster. Given raw data from multiple sources, extract {count} common skincare/haircare myths and their evidence-based truths.

RULES:
- Each myth must be a real widely-believed misconception found in the sources
- Each truth must cite a source_url
- Assign departments from: skincare, haircare, bodycare
- Do NOT invent myths not discussed in the sources
- Output ONLY valid JSON array, no markdown fences.

RAW SOURCES:
{sources_block}

OUTPUT JSON SCHEMA (array):
[{{
  "myth": "the false claim people believe",
  "truth": "the evidence-based reality",
  "explanation": "why the myth is wrong, with nuance",
  "source_url": "primary source url",
  "source_name": "source name",
  "departments": ["skincare"],
  "tags": ["string"]
}}]"""


TIPS_PROMPT = """You are a skincare advisor. Given raw data from multiple sources, extract {count} actionable skincare/haircare tips.

RULES:
- Each tip must be practical and specific
- Categorize each as: hydration, sun_protection, cleansing, exfoliation, anti_aging, acne, diet, lifestyle, routine_building, ingredient_usage, hair_care, body_care
- Cite the source for each tip
- Assign departments from: skincare, haircare, bodycare
- Do NOT invent tips not supported by the sources
- Output ONLY valid JSON array, no markdown fences.

RAW SOURCES:
{sources_block}

OUTPUT JSON SCHEMA (array):
[{{
  "title": "short title (3-6 words)",
  "body": "actionable advice, 1-3 sentences",
  "category": "hydration|sun_protection|cleansing|exfoliation|anti_aging|acne|diet|lifestyle|routine_building|ingredient_usage|hair_care|body_care",
  "source_url": "url",
  "source_name": "name",
  "departments": ["skincare"],
  "tags": ["string"]
}}]"""


def build_sources_block(results: list) -> str:
    """Format FetchResult list into a sources block for prompts."""
    parts = []
    for i, r in enumerate(results, 1):
        if not r.raw_text.strip():
            continue
        parts.append(f"---SOURCE {i}: {r.source_name} ({r.source_url})---\n{r.raw_text}")
    return "\n\n".join(parts)
