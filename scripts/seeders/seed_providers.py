"""
Seed script for providers table
Data source: docs/providers_from_api_keys.txt (snapshot from api_keys table)
"""

import sys
import os
# Add project root to path (2 levels up from scripts/seeders/)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

import db

def seed_providers():
    """Seed providers table from static file"""
    
    # Read provider list from file (2 levels up to project root, then docs/)
    file_path = os.path.join(os.path.dirname(__file__), "..", "..", "docs", "providers_from_api_keys.txt")
    with open(file_path, 'r') as f:
        provider_names = [line.strip() for line in f if line.strip()]
    
    # Provider metadata (display_name, website_url, docs_url)
    provider_metadata = {
        "aimlapi": {"display_name": "AIML API", "website_url": "https://aimlapi.com", "docs_url": "https://docs.aimlapi.com"},
        "anthropic": {"display_name": "Anthropic", "website_url": "https://www.anthropic.com", "docs_url": "https://docs.anthropic.com"},
        "azure": {"display_name": "Azure OpenAI", "website_url": "https://azure.microsoft.com/products/ai-services/openai-service", "docs_url": "https://learn.microsoft.com/azure/ai-services/openai/"},
        "baseten": {"display_name": "Baseten", "website_url": "https://www.baseten.co", "docs_url": "https://docs.baseten.co"},
        "cerebras": {"display_name": "Cerebras", "website_url": "https://cerebras.ai", "docs_url": "https://inference-docs.cerebras.ai"},
        "cohere": {"display_name": "Cohere", "website_url": "https://cohere.com", "docs_url": "https://docs.cohere.com"},
        "crof": {"display_name": "Crof", "website_url": "https://crof.ai", "docs_url": "https://crof.ai/docs"},
        "deepseek": {"display_name": "DeepSeek", "website_url": "https://www.deepseek.com", "docs_url": "https://platform.deepseek.com/api-docs"},
        "gemini": {"display_name": "Gemini", "website_url": "https://gemini.google.com", "docs_url": "https://ai.google.dev/gemini-api/docs"},
        "google": {"display_name": "Google AI", "website_url": "https://ai.google.dev", "docs_url": "https://ai.google.dev/docs"},
        "groq": {"display_name": "Groq", "website_url": "https://groq.com", "docs_url": "https://console.groq.com/docs"},
        "jina-ai": {"display_name": "Jina AI", "website_url": "https://jina.ai", "docs_url": "https://docs.jina.ai"},
        "kilo-gateway": {"display_name": "Kilo Gateway", "website_url": "https://kilo.ai", "docs_url": "https://kilo.ai/docs"},
        "longcat": {"display_name": "LongCat", "website_url": "https://longcat.ai", "docs_url": "https://longcat.ai/docs"},
        "morph": {"display_name": "Morph", "website_url": "https://morph.so", "docs_url": "https://docs.morph.so"},
        "nscale": {"display_name": "NScale", "website_url": "https://nscale.com", "docs_url": "https://docs.nscale.com"},
        "nvidia": {"display_name": "NVIDIA", "website_url": "https://www.nvidia.com/en-us/ai-data-science/", "docs_url": "https://docs.api.nvidia.com"},
        "openai": {"display_name": "OpenAI", "website_url": "https://openai.com", "docs_url": "https://platform.openai.com/docs"},
        "openrouter": {"display_name": "OpenRouter", "website_url": "https://openrouter.ai", "docs_url": "https://openrouter.ai/docs"},
        "publicai": {"display_name": "Public AI", "website_url": "https://public.ai", "docs_url": "https://public.ai/docs"},
        "qoder": {"display_name": "Qoder", "website_url": "https://qoder.ai", "docs_url": "https://qoder.ai/docs"},
        "sambanova": {"display_name": "SambaNova", "website_url": "https://sambanova.ai", "docs_url": "https://docs.sambanova.ai"},
        "siliconflow": {"display_name": "SiliconFlow", "website_url": "https://siliconflow.com", "docs_url": "https://docs.siliconflow.com"},
        "test": {"display_name": "Test Provider", "website_url": "", "docs_url": ""},
        "voyage-ai": {"display_name": "Voyage AI", "website_url": "https://www.voyageai.com", "docs_url": "https://docs.voyageai.com"},
    }
    
    added = 0
    skipped = 0
    
    for provider_name in provider_names:
        metadata = provider_metadata.get(provider_name, {
            "display_name": provider_name.title(),
            "website_url": "",
            "docs_url": ""
        })
        
        result = db.add_provider(
            name=provider_name,
            display_name=metadata["display_name"],
            website_url=metadata.get("website_url", ""),
            docs_url=metadata.get("docs_url", "")
        )
        
        if result.get("status") == "added":
            added += 1
            print(f"✓ Added: {metadata['display_name']:20} ({provider_name})")
        else:
            skipped += 1
            print(f"⊘ Skipped: {metadata['display_name']:20} (already exists)")
    
    print(f"\n{'='*60}")
    print(f"Seed completed: {added} added, {skipped} skipped")
    print(f"Total providers: {len(provider_names)}")
    print(f"{'='*60}")

if __name__ == "__main__":
    print("Seeding providers table from docs/providers_from_api_keys.txt")
    print(f"{'='*60}\n")
    seed_providers()
