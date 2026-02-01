import json
import os
import math
import re
from typing import Optional

from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
import httpx

app = FastAPI()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "qwen2.5:7b-instruct")

ASSISTANT_SYSTEM = (
     "Você é Thomaz Colalillo Navajas e fala em 1ª pessoa. "
     "Fale como em uma conversa natural (sem mencionar 'currículo', 'documentos', 'trechos', 'contexto', 'RAG' ou 'fontes'). "
     "Use apenas fatos que eu realmente teria sobre mim; não invente datas, números ou experiências. "
     "Se eu não souber/lembrar algo com precisão (ex: anos exatos), diga que não tem o número exato de cabeça e responda com os períodos/experiências que você tem, sem chutar. "
     "Para perguntas como 'quantos anos de X', cite períodos com datas explícitas e só dê um total aproximado se der para justificar. "
     "Não cite a data/hora atual na resposta a menos que o usuário pergunte explicitamente (ex: 'que dia é hoje?' / 'que ano estamos?'). "
     "Para perguntas de 'anos de experiência', responda de forma CONSISTENTE e objetiva: "
     "(1) 1 frase com um número APROXIMADO (se for o caso) e o ponto de partida (ex: 'desde 2021'); "
     "(2) 2–3 bullets com exemplos concretos (onde usei, o que fiz, impacto). "
     "Não diga 'não tenho período exato' e depois afirme 'mais de X anos'. Se for estimativa, escreva 'aprox.' e baseie no que está na memória interna. "
     "Quando fizer sentido, aponte para páginas do meu site para detalhes (sem dizer que é currículo): "
     "/experience (experiências), /skills (skills), /projects (projetos). "
     "Nas bullets, evite repetir o mesmo ano (ex: 'desde 2021' em tudo). Prefira 1 bullet por contexto/período (ex: estágio, pesquisa, trabalho atual). "
     "Seja profissional, direto e didático; use listas curtas quando ajudar. "
     "Sem assuntos pessoais. Não diga que é um chatbot. "
     "Contato: thomaznavajas@gmail.com | linkedin.com/in/thomaz-navajas. "
     "Idioma: PT-BR por padrão; se o usuário escrever em inglês, responda em inglês."
)

RESUME_TEXT_PATH = os.getenv("RESUME_TEXT_PATH") or os.path.join(os.path.dirname(__file__), "resume.txt")
RAG_TOP_K = int(os.getenv("RAG_TOP_K", "5"))
RAG_MAX_CHARS_PER_CHUNK = int(os.getenv("RAG_MAX_CHARS_PER_CHUNK", "700"))
RAG_CHUNK_OVERLAP = int(os.getenv("RAG_CHUNK_OVERLAP", "120"))


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
     t = (text or "").lower()
     parts = re.findall(r"[a-z0-9_+\-./]+", t, flags=re.IGNORECASE)
     out = []
     for p in parts:
          if len(p) < 2:
               continue
          if p in _STOPWORDS:
               continue
          out.append(p)
     return out


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


@app.get("/health")
def health():
     ollama_ok = False
     try:
          with httpx.Client(timeout=2.0) as client:
               resp = client.get(f"{OLLAMA_URL}/api/tags")
               ollama_ok = resp.status_code == 200
     except Exception:
          ollama_ok = False
     return {"status": "ok", "ollama_ok": ollama_ok}


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


def build_messages(payload: dict, user_text: str, tool_result: Optional[dict]):
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

     messages = build_messages(payload or {}, user_text, tool_result)
     stream_payload = {
          "model": model,
          "messages": messages,
          "stream": True,
     }

     async def event_stream():
          async with httpx.AsyncClient(timeout=None) as client:
               async with client.stream("POST", f"{OLLAMA_URL}/api/chat", json=stream_payload) as resp:
                    try:
                         resp.raise_for_status()
                    except httpx.HTTPError as exc:
                         yield f"data: {json.dumps({'error': str(exc)})}\n"
                         yield "data: [DONE]\n"
                         return
                    async for line in resp.aiter_lines():
                         if not line:
                              continue
                         try:
                              obj = json.loads(line)
                         except json.JSONDecodeError:
                              continue
                         if obj.get("error"):
                              yield f"data: {json.dumps({'error': obj.get('error')})}\n"
                              continue
                         content = (obj.get("message") or {}).get("content") or ""
                         if content:
                              yield f"data: {json.dumps({'message': content})}\n"
                         if obj.get("done"):
                              yield f"data: {json.dumps({'meta': {'model': obj.get('model', model)}})}\n"
                              yield "data: [DONE]\n"
                              return

     return StreamingResponse(
          event_stream(),
          media_type="text/event-stream",
          headers={
               "Cache-Control": "no-cache, no-transform",
               "Connection": "keep-alive",
          },
     )