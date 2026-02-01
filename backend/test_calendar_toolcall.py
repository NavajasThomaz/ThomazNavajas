import json
import os
import sys
import httpx


def main():
     base_url = os.getenv("BACKEND_URL", "http://localhost:8000")
     host_email = os.getenv("CALENDAR_HOST_EMAIL", "Thomaznavajas@gmail.com")
     user_email = os.getenv("CALENDAR_USER_EMAIL")
     if not host_email or not user_email:
          print("Defina CALENDAR_HOST_EMAIL e CALENDAR_USER_EMAIL para testar convites.")
          return 1
     message = (
          "Agende uma reunião de alinhamento com o cliente na quinta-feira, "
          "dia 06/02/2026, das 19:00 às 19:30 (America/Sao_Paulo), "
          "com o convidado teste@exemplo.com. Local: Google Meet. "
          "Assunto: Alinhamento do projeto."
     )

     payload = {
          "message": message,
          "hostEmail": host_email,
          "userEmail": user_email,
     }

     try:
          with httpx.stream("POST", f"{base_url}/chat", json=payload, timeout=120) as resp:
               resp.raise_for_status()
               final_text = ""
               for line in resp.iter_lines():
                    if not line:
                         continue
                    text_line = line.strip()
                    if not text_line:
                         continue
                    if text_line.startswith("data:"):
                         data = text_line[5:].strip()
                    else:
                         data = text_line
                    if data == "[DONE]":
                         break
                    try:
                         obj = json.loads(data)
                    except json.JSONDecodeError:
                         continue
                    if obj.get("error"):
                         print(f"Erro: {obj.get('error')}")
                         return 1
                    if obj.get("message"):
                         final_text += obj.get("message")
               print(final_text or "Sem resposta do modelo.")
               return 0
     except httpx.HTTPError as exc:
          print(f"Erro ao chamar o backend: {exc}")
          return 1


if __name__ == "__main__":
     sys.exit(main())
