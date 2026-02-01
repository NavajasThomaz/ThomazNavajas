import os
import sys
import httpx


def main():
     base_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
     model = os.getenv("OLLAMA_MODEL", "qwen2.5:7b-instruct")
     prompt = "Responda em uma frase: qual a capital do Brasil?"

     payload = {
          "model": model,
          "prompt": prompt,
          "stream": False,
     }

     try:
          response = httpx.post(
               f"{base_url}/api/generate",
               json=payload,
               timeout=120,
          )
          response.raise_for_status()
          data = response.json()
     except httpx.HTTPError as exc:
          print(f"Erro ao chamar a API do Ollama: {exc}")
          return 1
     output = data.get("response", "").strip()
     print(output or "Sem resposta no campo 'response'.")
     return 0


if __name__ == "__main__":
     sys.exit(main())
