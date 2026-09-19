import json
import os
import math
import re
import unicodedata
import time
from typing import Optional

from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
import httpx

app = FastAPI()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "llama3.1:8b")
OLLAMA_TEMPERATURE = float(os.getenv("OLLAMA_TEMPERATURE", "0"))
STRICT_GROUNDING = os.getenv("STRICT_GROUNDING", "1").strip() == "1"
OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY", "").strip()
OLLAMA_CLOUD_URL = os.getenv("OLLAMA_CLOUD_URL", "").strip()
OLLAMA_CLOUD_API_KEY = os.getenv("OLLAMA_CLOUD_API_KEY", "").strip()
OLLAMA_CLOUD_MODEL = os.getenv("OLLAMA_CLOUD_MODEL", "gemini-3-flash-preview:cloud").strip()
OLLAMA_EMBEDDING_MODEL = os.getenv("OLLAMA_EMBEDDING_MODEL", "").strip()
LAST_MODEL_TTL_SECONDS = int(os.getenv("LAST_MODEL_TTL_SECONDS", "300"))

_LAST_MODEL = None
_LAST_SOURCE = None
_LAST_MODEL_TS = None
_LAST_EMBEDDING_USED = False
_LAST_EMBEDDING_SOURCE = None
_EMBEDDING_CACHE = {"model": None, "vectors": None, "source": None}

ASSISTANT_SYSTEM = (
     "Você é Thomaz Colalillo Navajas de 24 anos de idade e fala em 1ª pessoa."
     "Se for a primeira interação, se apresente educadamente antes de responder a pergunta."
     "Fale como em uma conversa natural."
     "Use apenas fatos; não invente datas, números, experiências ou informações."
     "Seja profissional, direto e didático; use listas curtas quando ajudar."
     "Sem assuntos pessoais. Não diga que é um chatbot."
     "Se a disponibilidade para inicio for perguntada, responda que estou disponível a partir de uma semana."
     "Se a pergunta for sobre o meu currículo, responda com os dados do currículo."
     "Não envie respostas duplicadas. Não seja repetitivo."
     "Contato: thomaznavajas@gmail.com | linkedin.com/in/thomaz-navajas."
     "Idioma: PT-BR por padrão; se o usuário escrever em inglês, responda em inglês."
)

RESUME_TEXT_PATH = os.getenv("RESUME_TEXT_PATH") or os.path.join(os.path.dirname(__file__), "resume.txt")
RAG_TOP_K = int(os.getenv("RAG_TOP_K", "5"))
RAG_MAX_CHARS_PER_CHUNK = int(os.getenv("RAG_MAX_CHARS_PER_CHUNK", "700"))
RAG_CHUNK_OVERLAP = int(os.getenv("RAG_CHUNK_OVERLAP", "120"))
EMBEDDING_CACHE_PATH = os.getenv("EMBEDDING_CACHE_PATH") or os.path.join(
     os.path.dirname(__file__), "embeddings_cache.json"
)
SAFE_NO_EVIDENCE_SYSTEM = (
     "Se a pergunta exigir dados pessoais ou profissionais que não estejam no currículo,"
     "não invente. Responda de forma honesta dizendo que não tem essa informação e "
     "sugira olhar as abas /experience, /skills ou /projects ou tentar outra pergunta. "
     "Para perguntas gerais, responda normalmente sem afirmar fatos pessoais."
)


def _load_resume_text():
     try:
          with open(RESUME_TEXT_PATH, "r", encoding="utf-8") as handle:
               return (handle.read() or "").strip()
     except Exception:
          return ""

def _chunk_text(text: str, max_chars: int, overlap: int):
     raw = (text or "").replace("\r\n", "\n").replace("\r", "\n").strip()
     if not raw:
          return []
     paragraphs = [p.strip() for p in re.split(r"\n\s*\n+", raw) if p.strip()]
     blocks = []
     for p in paragraphs:
          if len(p) <= max_chars:
               blocks.append(p)
               continue
          start = 0
          while start < len(p):
               end = min(len(p), start + max_chars)
               blocks.append(p[start:end].strip())
               if end >= len(p):
                    break
               start = max(0, end - overlap)
     return [b for b in blocks if b]


_STOPWORDS = {
     "a", "o", "os", "as", "um", "uma", "uns", "umas",
     "de", "da", "do", "das", "dos", "em", "no", "na", "nos", "nas",
     "e", "ou", "com", "para", "por", "se", "que", "como",
     "ao", "aos", "à", "às", "sobre", "entre", "sem",
     "the", "an", "and", "or", "of", "to", "in", "on", "for", "with", "as", "is", "are",
}


def _tokenize(text: str):
     t = _normalize_text(text or "")
     parts = re.findall(r"[a-z0-9_+\-./]+", t, flags=re.IGNORECASE)
     out = []
     for p in parts:
          if len(p) < 2:
               continue
          if p in _STOPWORDS:
               continue
          out.append(p)
     return out

def _normalize_text(text: str):
     t = (text or "").lower()
     normalized = unicodedata.normalize("NFKD", t)
     return "".join(ch for ch in normalized if not unicodedata.combining(ch))

def _should_use_rag(text: str):
     q = _normalize_text(text or "").strip()
     if not q:
          return False
     if len(q) < 8:
          return False
     small_talk = [
          "oi",
          "ola",
          "olá",
          "e ai",
          "e aí",
          "tudo bem",
          "como vai",
          "bom dia",
          "boa tarde",
          "boa noite",
          "obrigado",
          "obrigada",
          "valeu",
     ]
     for term in small_talk:
          if term in q:
               return False
     rag_terms = [
          "curriculo",
          "currículo",
          "experiencia",
          "experiência",
          "projeto",
          "projetos",
          "habilidade",
          "habilidades",
          "skills",
          "stack",
          "trabalho",
          "emprego",
          "formacao",
          "formação",
          "academica",
          "academica",
          "empresa",
          "contato",
          "email",
          "disponibilidade",
          "cargo",
          "ano",
          "periodo",
          "período",
     ]
     return any(term in q for term in rag_terms)

def _is_first_experience_question(text: str):
     q = _normalize_text(text or "")
     if "primeir" not in q:
          return False
     targets = [
          "primeiro emprego",
          "primeira experiencia",
          "primeira experiencia profissional",
          "primeiro trabalho",
          "primeiro cargo",
          "primeira experiencia de trabalho",
     ]
     return any(t in q for t in targets)

def _parse_month_year(value: str):
     try:
          mm, yyyy = value.split("/")
          return int(yyyy) * 100 + int(mm)
     except Exception:
          return None

def _first_experience_answer():
     if not _RESUME_TEXT:
          return None
     lines = [ln.strip() for ln in _RESUME_TEXT.splitlines()]
     entries = []
     for idx, line in enumerate(lines):
          match = re.match(r"^(.*)\s(\d{2}/\d{4})\s*[–-]\s*(.+)$", line)
          if not match:
               continue
          company = match.group(1).strip()
          start = match.group(2).strip()
          end = match.group(3).strip()
          start_num = _parse_month_year(start)
          if not start_num:
               continue
          role = ""
          if idx + 1 < len(lines):
               nxt = lines[idx + 1].strip()
               if nxt and not nxt.startswith("•") and not re.search(r"\d{2}/\d{4}\s*[–-]", nxt):
                    role = nxt
          entries.append(
               {
                    "company": company,
                    "role": role,
                    "start": start,
                    "end": end,
                    "start_num": start_num,
               }
          )
     if not entries:
          return None
     first = sorted(entries, key=lambda e: e["start_num"])[0]
     if first["role"]:
          return f"Minha primeira experiência profissional foi na {first['company']}, como {first['role']} ({first['start']} – {first['end']})."
     return f"Minha primeira experiência profissional foi na {first['company']} ({first['start']} – {first['end']})."

def _cosine_similarity(a: list[float], b: list[float]):
     if not a or not b:
          return 0.0
     if len(a) != len(b):
          return 0.0
     dot = 0.0
     norm_a = 0.0
     norm_b = 0.0
     for i in range(len(a)):
          av = float(a[i])
          bv = float(b[i])
          dot += av * bv
          norm_a += av * av
          norm_b += bv * bv
     if norm_a <= 0.0 or norm_b <= 0.0:
          return 0.0
     return dot / (math.sqrt(norm_a) * math.sqrt(norm_b))

def _fetch_embedding(text: str):
     if not text or not text.strip():
          return None
     for target in _embedding_targets():
          payload = {"model": target["model"], "prompt": text}
          try:
               with httpx.Client(timeout=15.0, headers=_ollama_headers(target["api_key"])) as client:
                    resp = client.post(f"{target['url']}/api/embeddings", json=payload)
                    resp.raise_for_status()
                    data = resp.json() or {}
               vector = data.get("embedding")
               if isinstance(vector, list) and vector:
                    _EMBEDDING_CACHE["source"] = target["kind"]
                    _set_last_embedding(target["kind"], used=False)
                    return vector
          except Exception:
               continue
     return None

def _load_embedding_cache():
     if not EMBEDDING_CACHE_PATH:
          return None
     try:
          with open(EMBEDDING_CACHE_PATH, "r", encoding="utf-8") as handle:
               data = json.load(handle) or {}
          if data.get("model") != OLLAMA_EMBEDDING_MODEL:
               return None
          vectors = data.get("vectors")
          if not isinstance(vectors, list) or not vectors:
               return None
          if len(vectors) != len(_RESUME_CHUNKS):
               return None
          for vec in vectors:
               if not isinstance(vec, list) or not vec:
                    return None
          _set_last_embedding("cache", used=False)
          return vectors
     except Exception:
          return None

def _save_embedding_cache(vectors: list[list[float]]):
     if not EMBEDDING_CACHE_PATH:
          return
     try:
          folder = os.path.dirname(EMBEDDING_CACHE_PATH)
          if folder:
               os.makedirs(folder, exist_ok=True)
          with open(EMBEDDING_CACHE_PATH, "w", encoding="utf-8") as handle:
               json.dump({"model": OLLAMA_EMBEDDING_MODEL, "vectors": vectors}, handle)
     except Exception:
          return

def _ensure_chunk_embeddings():
     if not OLLAMA_EMBEDDING_MODEL:
          return None
     if _EMBEDDING_CACHE.get("model") == OLLAMA_EMBEDDING_MODEL and _EMBEDDING_CACHE.get("vectors"):
          _set_last_embedding(_EMBEDDING_CACHE.get("source") or "cache", used=False)
          return _EMBEDDING_CACHE.get("vectors")
     if not _RESUME_CHUNKS:
          return None
     cached = _load_embedding_cache()
     if cached:
          _EMBEDDING_CACHE["model"] = OLLAMA_EMBEDDING_MODEL
          _EMBEDDING_CACHE["vectors"] = cached
          _EMBEDDING_CACHE["source"] = "cache"
          return cached
     vectors = []
     for chunk in _RESUME_CHUNKS:
          vec = _fetch_embedding(chunk)
          if not vec:
               return None
          vectors.append(vec)
     _EMBEDDING_CACHE["model"] = OLLAMA_EMBEDDING_MODEL
     _EMBEDDING_CACHE["vectors"] = vectors
     _EMBEDDING_CACHE["source"] = _EMBEDDING_CACHE.get("source") or "local"
     _save_embedding_cache(vectors)
     return vectors

def _ollama_headers(api_key: str):
     if not api_key:
          return {}
     return {"Authorization": f"Bearer {api_key}"}

def _ollama_targets():
     targets = []
     if OLLAMA_CLOUD_URL:
          targets.append(
               {
                    "url": OLLAMA_CLOUD_URL,
                    "api_key": OLLAMA_CLOUD_API_KEY,
                    "model": OLLAMA_CLOUD_MODEL or DEFAULT_MODEL,
                    "kind": "cloud",
               }
          )
     targets.append(
          {
               "url": OLLAMA_URL,
               "api_key": OLLAMA_API_KEY,
               "model": None,
               "kind": "local",
          }
     )
     return targets

def _embedding_targets():
     if not OLLAMA_EMBEDDING_MODEL:
          return []
     targets = []
     if OLLAMA_CLOUD_URL:
          targets.append(
               {
                    "url": OLLAMA_CLOUD_URL,
                    "api_key": OLLAMA_CLOUD_API_KEY,
                    "model": OLLAMA_EMBEDDING_MODEL,
                    "kind": "cloud",
               }
          )
     targets.append(
          {
               "url": OLLAMA_URL,
               "api_key": OLLAMA_API_KEY,
               "model": OLLAMA_EMBEDDING_MODEL,
               "kind": "local",
          }
     )
     return targets

def _extract_running_model(data: dict):
     models = data.get("models") or []
     if not isinstance(models, list) or not models:
          return None
     first = models[0] or {}
     if isinstance(first, dict):
          return first.get("name") or first.get("model")
     return None

def _check_ollama_target(target: dict):
     try:
          with httpx.Client(timeout=3.5, headers=_ollama_headers(target["api_key"])) as client:
               if target["kind"] == "cloud":
                    resp = client.get(f"{target['url']}/api/tags")
               else:
                    resp = client.get(f"{target['url']}/api/ps")
                    if resp.status_code == 404:
                         resp = client.get(f"{target['url']}/api/tags")
               resp.raise_for_status()
               data = resp.json() or {}
          if target["kind"] == "cloud":
               return {"ok": True, "model": target["model"] or DEFAULT_MODEL, "source": target["kind"]}
          running_model = _extract_running_model(data)
          if running_model:
               return {"ok": True, "model": running_model, "source": target["kind"]}
          model_name = target["model"] or DEFAULT_MODEL
          return {"ok": True, "model": model_name, "source": target["kind"]}
     except Exception:
          return {"ok": False, "model": None, "source": target["kind"]}

def _ollama_health_status():
     targets = _ollama_targets()
     cloud = next((t for t in targets if t["kind"] == "cloud"), None)
     local = next((t for t in targets if t["kind"] == "local"), None)
     if cloud:
          cloud_status = _check_ollama_target(cloud)
          if cloud_status.get("ok"):
               return cloud_status
     if local:
          local_status = _check_ollama_target(local)
          if local_status.get("ok"):
               return local_status
     return {"ok": False, "model": None, "source": None}

def _set_last_model(model: str, source: str):
     global _LAST_MODEL
     global _LAST_SOURCE
     global _LAST_MODEL_TS
     _LAST_MODEL = model
     _LAST_SOURCE = source
     _LAST_MODEL_TS = time.time()

def _set_last_embedding(source: str, used: bool):
     global _LAST_EMBEDDING_SOURCE
     global _LAST_EMBEDDING_USED
     _LAST_EMBEDDING_SOURCE = source
     if used:
          _LAST_EMBEDDING_USED = True

def _is_answer_grounded(answer: str, evidence_text: str):
     if not answer:
          return False
     evidence_tokens = set(_tokenize(evidence_text or ""))
     if not evidence_tokens:
          return False
     answer_tokens = _tokenize(answer)
     allowlist = {
          "primeira", "primeiro", "experiencia", "experiência", "profissional",
          "trabalhei", "atuei", "fui", "foi", "sou", "como", "minha", "meu", "atual",
          "desde", "em", "no", "na", "nos", "nas", "para", "com", "por",
     }
     for tok in answer_tokens:
          if tok in allowlist:
               continue
          if tok not in evidence_tokens:
               return False
     return True

def _expand_query(query: str):
     q = (query or "").lower()
     extra = []
     if "python" in q:
          extra += [
               "allcom",
               "furg",
               "radio memory",
               "augen",
               "fastapi",
               "mongodb",
               "motor",
               "sqlalchemy",
               "opencv",
               "tensorflow",
               "pytorch",
          ]
     if "engenharia de dados" in q or "data engineering" in q:
          extra += ["etl", "elt", "pipeline", "airflow", "dbt", "kafka", "databricks", "pyspark", "sql"]
     if "ia" in q or "ml" in q or "machine learning" in q:
          extra += ["pytorch", "tensorflow", "scikit-learn"]
     if "llm" in q or "chat" in q or "agente" in q:
          extra += ["langchain", "rag", "ollama", "sse", "websocket"]
     if "allcom" in q:
          extra += ["selenium", "fastapi", "mongodb", "motor", "sqlalchemy", "ocr", "tesseract"]
     return f"{query}\n" + " ".join(extra)

def _build_bm25_index(chunks: list[str]):
     docs = []
     df = {}
     lengths = []
     for c in chunks:
          toks = _tokenize(c)
          docs.append(toks)
          lengths.append(len(toks))
          seen = set()
          for tok in toks:
               if tok in seen:
                    continue
               df[tok] = df.get(tok, 0) + 1
               seen.add(tok)
     avgdl = (sum(lengths) / max(1, len(lengths))) if lengths else 0.0
     return {"chunks": chunks, "docs": docs, "df": df, "avgdl": avgdl, "lengths": lengths}

def _bm25_scores(index: dict, query: str):
     k1 = 1.5
     b = 0.75
     N = len(index["docs"])
     if N == 0:
          return []
     q_tokens = _tokenize(_expand_query(query))
     q_tf = {}
     for t in q_tokens:
          q_tf[t] = q_tf.get(t, 0) + 1
     scores = [0.0] * N
     for i, doc in enumerate(index["docs"]):
          dl = index["lengths"][i] or 0
          if dl == 0:
               continue
          tf = {}
          for t in doc:
               tf[t] = tf.get(t, 0) + 1
          s = 0.0
          for t in q_tf.keys():
               df = index["df"].get(t, 0)
               if df == 0:
                    continue
               idf = math.log(1.0 + (N - df + 0.5) / (df + 0.5))
               f = tf.get(t, 0)
               if f == 0:
                    continue
               denom = f + k1 * (1.0 - b + b * (dl / (index["avgdl"] or 1.0)))
               s += idf * ((f * (k1 + 1.0)) / denom)
          scores[i] = s
     return scores


_RESUME_TEXT = _load_resume_text()
_RESUME_CHUNKS = _chunk_text(_RESUME_TEXT, RAG_MAX_CHARS_PER_CHUNK, RAG_CHUNK_OVERLAP)
_RESUME_INDEX = _build_bm25_index(_RESUME_CHUNKS)


def _retrieve_resume_chunks(query: str, top_k: int):
     if not query or not str(query).strip():
          return []
     embedding_hits = _retrieve_resume_chunks_embeddings(query, top_k)
     bm25_hits = _retrieve_resume_chunks_bm25(query, top_k)
     if embedding_hits:
          merged = []
          for item in embedding_hits + bm25_hits:
               if item and item not in merged:
                    merged.append(item)
          return merged[: max(1, top_k)]
     return bm25_hits

def _retrieve_resume_chunks_bm25(query: str, top_k: int):
     scores = _bm25_scores(_RESUME_INDEX, query)
     if not scores:
          return []
     ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
     picked = []
     for i in ranked[: max(1, top_k)]:
          if scores[i] <= 0:
               continue
          picked.append(_RESUME_INDEX["chunks"][i])
     if not picked and ranked:
          picked = [_RESUME_INDEX["chunks"][ranked[0]]]
     return [p for p in picked if p]

def _retrieve_resume_chunks_embeddings(query: str, top_k: int):
     if not OLLAMA_EMBEDDING_MODEL:
          return []
     vectors = _ensure_chunk_embeddings()
     if not vectors:
          return []
     query_vec = _fetch_embedding(query)
     if not query_vec:
          return []
     scored = []
     for idx, vec in enumerate(vectors):
          scored.append((_cosine_similarity(query_vec, vec), idx))
     scored.sort(key=lambda x: x[0], reverse=True)
     picked = []
     for score, idx in scored[: max(1, top_k)]:
          if score <= 0:
               continue
          picked.append(_RESUME_CHUNKS[idx])
     hits = [p for p in picked if p]
     if hits:
          _set_last_embedding(_EMBEDDING_CACHE.get("source") or _LAST_EMBEDDING_SOURCE or "unknown", used=True)
     return hits


@app.get("/health")
def health():
     status = _ollama_health_status()
     now_ts = time.time()
     last_ok = bool(_LAST_MODEL and _LAST_MODEL_TS and (now_ts - _LAST_MODEL_TS) <= LAST_MODEL_TTL_SECONDS)
     model = _LAST_MODEL if last_ok else status.get("model")
     source = _LAST_SOURCE if last_ok else status.get("source")
     return {
          "status": "ok",
          "ollama_ok": status.get("ok", False),
          "model": model,
          "source": source,
          "embedding_enabled": bool(OLLAMA_EMBEDDING_MODEL),
          "embedding_model": OLLAMA_EMBEDDING_MODEL or None,
          "embedding_source": _LAST_EMBEDDING_SOURCE or _EMBEDDING_CACHE.get("source"),
          "embedding_used": bool(_LAST_EMBEDDING_USED),
     }


def extract_user_text(payload: dict):
     explicit_text = payload.get("message") or payload.get("text")
     body_messages = payload.get("messages") or []
     if explicit_text:
          return explicit_text
     if isinstance(body_messages, list):
          for msg in reversed(body_messages):
               if msg.get("role") == "user" and msg.get("text"):
                    return msg.get("text")
     return None


def build_messages(payload: dict, user_text: str, tool_result: Optional[dict], resume_hits: Optional[list[str]] = None):
     base = []
     body_messages = payload.get("messages") or []
     if isinstance(body_messages, list) and body_messages:
          for msg in body_messages:
               role = msg.get("role")
               text = msg.get("text")
               if role and text:
                    base.append({"role": role, "content": text})
     if not base:
          base = [{"role": "user", "content": user_text}]

     tz = ZoneInfo(os.getenv("APP_TIMEZONE", "America/Sao_Paulo"))
     now = datetime.now(tz=tz)
     now_text = now.strftime("%Y-%m-%d %H:%M")
     if resume_hits is None:
          resume_hits = _retrieve_resume_chunks(user_text, RAG_TOP_K)
     system_messages = [
          {"role": "system", "content": ASSISTANT_SYSTEM},
          {
               "role": "system",
               "content": (
                    f"Contexto interno de tempo: ano atual = {now.year} ({tz.key}). "
                    "Use isso apenas para não errar o ano quando perguntarem. "
                    "Não repita essa informação a menos que o usuário peça explicitamente."
               ),
          },
     ]
     if resume_hits:
          joined = "\n\n".join([f"[{idx + 1}] {txt}" for idx, txt in enumerate(resume_hits)])
          system_messages.append(
               {
                    "role": "system",
                    "content": (
                         "Memória interna do Thomaz (uso interno). "
                         "Use isso para responder com precisão, mas NÃO mencione que está consultando texto, currículo, documento ou fonte. "
                         "Responda como se fosse conhecimento próprio.\n\n"
                         f"{joined}"
                    ),
               }
          )
     return system_messages + base

async def _grounded_chat_answer(messages: list[dict], model: str, resume_hits: list[str]):
     if not resume_hits:
          return None
     grounding_context = "\n\n".join([txt for txt in resume_hits if txt]).strip()
     if not grounding_context:
          return None
     grounded_messages = list(messages)
     grounded_messages.append(
          {
               "role": "system",
               "content": (
                    "Responda usando APENAS os trechos abaixo. "
                    "Se não houver informação suficiente, diga que não tem essa informação no currículo "
                    "e sugira as abas /experience, /skills ou /projects.\n\n"
                    f"{grounding_context}"
               ),
          }
     )
     for target in _ollama_targets():
          target_model = target["model"] or model
          payload = {
               "model": target_model,
               "messages": grounded_messages,
               "stream": False,
          }
          if OLLAMA_TEMPERATURE is not None:
               payload["options"] = {"temperature": OLLAMA_TEMPERATURE}
          try:
               async with httpx.AsyncClient(timeout=None, headers=_ollama_headers(target["api_key"])) as client:
                    resp = await client.post(f"{target['url']}/api/chat", json=payload)
                    resp.raise_for_status()
                    data = resp.json() or {}
          except Exception:
               continue
          answer = ((data.get("message") or {}).get("content") or "").strip()
          if not answer:
               continue
          if not _is_answer_grounded(answer, grounding_context):
               continue
          _set_last_model(target_model, target["kind"])
          return answer
     return None


def stream_single_message(message: str):
     async def generator():
          yield f"data: {json.dumps({'message': message}, ensure_ascii=False)}\n"
          yield "data: [DONE]\n"
     return generator()


@app.post("/chat")
async def chat(request: Request):
     payload = await request.json()
     user_text = extract_user_text(payload or {})
     if not user_text or not str(user_text).strip():
          raise HTTPException(status_code=400, detail="Mensagem do usuário ausente.")

     model = payload.get("model") or DEFAULT_MODEL
     tool_result = None

     if _is_first_experience_question(user_text):
          first_answer = _first_experience_answer()
          if first_answer:
               return StreamingResponse(stream_single_message(first_answer), media_type="text/event-stream")

     resume_hits = _retrieve_resume_chunks(user_text, RAG_TOP_K) if _should_use_rag(user_text) else []
     messages = build_messages(payload or {}, user_text, tool_result, resume_hits)
     if STRICT_GROUNDING:
          final_message = await _grounded_chat_answer(messages, model, resume_hits)
          if final_message:
               return StreamingResponse(stream_single_message(final_message), media_type="text/event-stream")
          messages = list(messages) + [{"role": "system", "content": SAFE_NO_EVIDENCE_SYSTEM}]

     async def event_stream():
          last_error = None
          for target in _ollama_targets():
               target_model = target["model"] or model
               model_set = False
               stream_payload = {
                    "model": target_model,
                    "messages": messages,
                    "stream": True,
               }
               if OLLAMA_TEMPERATURE is not None:
                    stream_payload["options"] = {"temperature": OLLAMA_TEMPERATURE}
               try:
                    async with httpx.AsyncClient(timeout=None, headers=_ollama_headers(target["api_key"])) as client:
                         async with client.stream("POST", f"{target['url']}/api/chat", json=stream_payload) as resp:
                              resp.raise_for_status()
                              async for line in resp.aiter_lines():
                                   if not line:
                                        continue
                                   try:
                                        obj = json.loads(line)
                                   except json.JSONDecodeError:
                                        continue
                                   if obj.get("error"):
                                        last_error = obj.get("error")
                                        continue
                                   content = (obj.get("message") or {}).get("content") or ""
                                   if content:
                                        if not model_set:
                                             _set_last_model(target_model, target["kind"])
                                             model_set = True
                                        yield f"data: {json.dumps({'message': content})}\n"
                                   if obj.get("done"):
                                        if not model_set:
                                             _set_last_model(target_model, target["kind"])
                                             model_set = True
                                        yield f"data: {json.dumps({'meta': {'model': obj.get('model', target_model)}})}\n"
                                        yield "data: [DONE]\n"
                                        return
               except httpx.HTTPError as exc:
                    last_error = str(exc)
                    continue
          yield f"data: {json.dumps({'error': last_error or 'Falha ao conectar ao modelo.'})}\n"
          yield "data: [DONE]\n"

     return StreamingResponse(
          event_stream(),
          media_type="text/event-stream",
          headers={
               "Cache-Control": "no-cache, no-transform",
               "Connection": "keep-alive",
          },
     )