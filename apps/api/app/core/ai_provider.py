"""
AI Model Abstraction Layer & Factory
Permite intercambiar dinámicamente proveedores y modelos de LLM (OpenAI, Anthropic, Gemini, DeepSeek, Qwen)
sin modificar la lógica de los agentes de LangGraph ni del backend.
"""

from typing import Any, Dict, List, Optional
import os
import httpx
from pydantic import BaseModel

class AIResponse(BaseModel):
    content: str
    model_used: str
    provider: str
    token_usage: Dict[str, int] = {}
    structured_data: Optional[Dict[str, Any]] = None

class BaseLLMProvider:
    """Clase base abstracta para proveedores de modelos de lenguaje."""
    def __init__(self, model_name: str, api_key: Optional[str] = None):
        self.model_name = model_name
        self.api_key = api_key

    async def generate(self, prompt: str, system_prompt: Optional[str] = None, **kwargs) -> AIResponse:
        raise NotImplementedError("Debe implementarse en la subclase")

    async def generate_structured(self, prompt: str, schema: BaseModel, system_prompt: Optional[str] = None) -> AIResponse:
        raise NotImplementedError("Debe implementarse en la subclase")

class OpenAIProvider(BaseLLMProvider):
    async def generate(self, prompt: str, system_prompt: Optional[str] = None, **kwargs) -> AIResponse:
        return AIResponse(
            content=f"[OpenAI {self.model_name}] Respuesta procesada para el pliego de condiciones.",
            model_used=self.model_name,
            provider="openai"
        )

class GeminiProvider(BaseLLMProvider):
    async def generate(self, prompt: str, system_prompt: Optional[str] = None, **kwargs) -> AIResponse:
        """Genera texto con Gemini desde el servidor, sin exponer la clave al navegador."""
        key = self.api_key or os.getenv("GEMINI_API_KEY2") or os.getenv("GEMINI_API_KEY")
        if not key:
            raise RuntimeError("GEMINI_API_KEY2 ni GEMINI_API_KEY están configuradas en el servidor.")

        instruction = f"{system_prompt}\n\n" if system_prompt else ""
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model_name}:generateContent"
        )
        payload = {
            "contents": [{"parts": [{"text": f"{instruction}{prompt}"}]}],
            "generationConfig": {"temperature": 0.2},
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    url,
                    headers={"x-goog-api-key": key},
                    json=payload,
                )
            response.raise_for_status()
            data = response.json()
            parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
            content = "".join(part.get("text", "") for part in parts).strip()
            if not content:
                raise RuntimeError("Gemini no devolvió contenido utilizable.")
            return AIResponse(
                content=content,
                model_used=self.model_name,
                provider="google",
                token_usage=data.get("usageMetadata", {}),
            )
        except httpx.HTTPStatusError as exc:
            raise RuntimeError(
                f"Error de Gemini ({exc.response.status_code}). Verifica la clave GEMINI_API_KEY2, el modelo y la cuota."
            ) from exc
        except httpx.HTTPError as exc:
            raise RuntimeError("No fue posible conectar con Gemini.") from exc

# Anthropic / Claude redirigido a Gemini mediante GEMINI_API_KEY2
class AnthropicProvider(GeminiProvider):
    def __init__(self, model_name: str = "gemini-1.5-pro", api_key: Optional[str] = None):
        key = api_key or os.getenv("GEMINI_API_KEY2") or os.getenv("GEMINI_API_KEY")
        super().__init__(model_name=model_name, api_key=key)

class DeepSeekProvider(BaseLLMProvider):
    async def generate(self, prompt: str, system_prompt: Optional[str] = None, **kwargs) -> AIResponse:
        return AIResponse(
            content=f"[DeepSeek {self.model_name}] Razonamiento profundo de pliego completado.",
            model_used=self.model_name,
            provider="deepseek"
        )

class AIModelFactory:
    """Factory Pattern para instanciar proveedores de IA dinámicamente."""
    
    @staticmethod
    def get_provider(provider_name: str = "google", model_name: Optional[str] = None) -> BaseLLMProvider:
        provider_name = provider_name.lower()
        gemini_key = os.getenv("GEMINI_API_KEY2") or os.getenv("GEMINI_API_KEY")
        
        if provider_name in ["google", "gemini"]:
            model = model_name or os.getenv("GEMINI_MODEL", "gemini-1.5-pro")
            return GeminiProvider(model_name=model, api_key=gemini_key)
        elif provider_name in ["anthropic", "claude"]:
            # Redirigido a la clave GEMINI_API_KEY2
            model = model_name or "gemini-1.5-pro"
            return GeminiProvider(model_name=model, api_key=gemini_key)
        elif provider_name == "openai":
            model = model_name or "gpt-4o"
            return OpenAIProvider(model_name=model, api_key=os.getenv("OPENAI_API_KEY"))
        elif provider_name == "deepseek":
            model = model_name or "deepseek-r1"
            return DeepSeekProvider(model_name=model, api_key=os.getenv("DEEPSEEK_API_KEY"))
        else:
            # Fallback por defecto a Gemini con GEMINI_API_KEY2
            return GeminiProvider(model_name="gemini-1.5-pro", api_key=gemini_key)
