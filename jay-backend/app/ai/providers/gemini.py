"""
Gemini Flash provider for Ask JAY chat.

Uses the new google-genai SDK:
  from google import genai
  client = genai.Client(api_key=...)
"""
from google import genai
from google.genai.types import GenerateContentConfig, Content, Part
from app.config import get_settings


class GeminiProvider:
    def __init__(self):
        settings = get_settings()
        if not settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY not set in .env")
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model = "gemini-2.5-flash"

    def _build_contents(self, messages: list[dict]) -> list[Content]:
        contents = []
        for msg in messages:
            role = "model" if msg["role"] == "assistant" else msg["role"]
            contents.append(Content(role=role, parts=[Part(text=msg["content"])]))
        return contents

    async def get_stream(
        self,
        system_prompt: str,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ):
        """Returns an async iterator of response chunks. Caller must await this, then async-for the result."""
        config = GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=temperature,
            max_output_tokens=max_tokens,
        )
        contents = self._build_contents(messages)

        # This returns a coroutine that resolves to an AsyncIterator
        return await self.client.aio.models.generate_content_stream(
            model=self.model,
            contents=contents,
            config=config,
        )

    async def generate(
        self,
        system_prompt: str,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        config = GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=temperature,
            max_output_tokens=max_tokens,
        )
        contents = self._build_contents(messages)
        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=contents,
            config=config,
        )
        return response.text
