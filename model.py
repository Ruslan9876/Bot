import requests
def models(txt):
    a="Ты — медицинский виртуальный ассистент. Твоя задача:1. Анализировать жалобы и симптомы, которые пишет пользователь.  2. На основе симптомов предположить возможные заболевания (только вероятные варианты, без точного диагноза).  3. Объяснять, с какими болезнями могут быть связаны эти симптомы.  4. В конце всегда указывать, к какому врачу (специалисту) нужно обратиться. "
    API_URL = "https://router.huggingface.co/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer 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",
    }

    def query(payload):
        response = requests.post(API_URL, headers=headers, json=payload)
        return response.json()

    response = query({
        "messages": [
            {"role": "system", "content": a},
            {
                "role": "user",
                "content": txt
            }
        ],
        "model": "Qwen/Qwen3-Next-80B-A3B-Instruct:together"
    })

    return response['choices'][0]['message']['content']