"""
Seed script for models table
Populate with known free models from various providers
"""

import sys
import os
# Add project root to path (2 levels up from scripts/seeders/)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

import db

def seed_models():
    """Seed models table with initial free models"""
    
    models_data = [
        # OpenAI
        {
            "provider": "openai",
            "model_name": "GPT-4o Mini",
            "model_id": "gpt-4o-mini",
            "context_length": 128000,
            "max_input_tokens": 128000,
            "max_output_tokens": 16384,
            "supports_streaming": 1,
            "supports_function_calling": 1,
            "supports_vision": 1,
            "pricing_type": "token",
            "input_price_per_1k": 0.00015,
            "output_price_per_1k": 0.0006,
            "is_free": 1,
            "free_tier_type": "preview",
            "rate_limit_rpm": 500,
            "rate_limit_tpm": 200000,
            "notes": "Free during preview period. Will become paid.",
            "source_url": "https://openai.com/api/pricing/",
            "last_verified": "2026-05-08T00:00:00Z"
        },
        
        # Anthropic
        {
            "provider": "anthropic",
            "model_name": "Claude 3.5 Haiku",
            "model_id": "claude-3-5-haiku-20241022",
            "context_length": 200000,
            "max_input_tokens": 200000,
            "max_output_tokens": 8192,
            "supports_streaming": 1,
            "supports_function_calling": 1,
            "supports_vision": 1,
            "pricing_type": "token",
            "input_price_per_1k": 0.0008,
            "output_price_per_1k": 0.004,
            "is_free": 1,
            "free_tier_type": "credit_based",
            "free_credit_amount": 5.00,
            "rate_limit_rpm": 50,
            "rate_limit_tpm": 40000,
            "notes": "$5 free credit on signup",
            "source_url": "https://www.anthropic.com/pricing",
            "last_verified": "2026-05-08T00:00:00Z"
        },
        
        # Google
        {
            "provider": "google",
            "model_name": "Gemini 1.5 Flash",
            "model_id": "gemini-1.5-flash",
            "context_length": 1000000,
            "max_input_tokens": 1000000,
            "max_output_tokens": 8192,
            "supports_streaming": 1,
            "supports_function_calling": 1,
            "supports_vision": 1,
            "pricing_type": "token",
            "input_price_per_1k": 0,
            "output_price_per_1k": 0,
            "is_free": 1,
            "free_tier_type": "always_free",
            "rate_limit_rpm": 15,
            "rate_limit_rph": 1500,
            "rate_limit_tpm": 1000000,
            "notes": "Always free tier with rate limits. 1M token context!",
            "source_url": "https://ai.google.dev/pricing",
            "last_verified": "2026-05-08T00:00:00Z"
        },
        
        {
            "provider": "google",
            "model_name": "Gemini 1.5 Pro",
            "model_id": "gemini-1.5-pro",
            "context_length": 2000000,
            "max_input_tokens": 2000000,
            "max_output_tokens": 8192,
            "supports_streaming": 1,
            "supports_function_calling": 1,
            "supports_vision": 1,
            "pricing_type": "token",
            "input_price_per_1k": 0,
            "output_price_per_1k": 0,
            "is_free": 1,
            "free_tier_type": "always_free",
            "rate_limit_rpm": 2,
            "rate_limit_rpd": 50,
            "notes": "Always free tier with strict rate limits. 2M token context!",
            "source_url": "https://ai.google.dev/pricing",
            "last_verified": "2026-05-08T00:00:00Z"
        },
        
        # Groq
        {
            "provider": "groq",
            "model_name": "Llama 3.3 70B Versatile",
            "model_id": "llama-3.3-70b-versatile",
            "context_length": 128000,
            "max_input_tokens": 128000,
            "max_output_tokens": 32768,
            "supports_streaming": 1,
            "supports_function_calling": 1,
            "supports_vision": 0,
            "pricing_type": "token",
            "input_price_per_1k": 0,
            "output_price_per_1k": 0,
            "is_free": 1,
            "free_tier_type": "always_free",
            "rate_limit_rpm": 30,
            "rate_limit_rpd": 14400,
            "rate_limit_tpm": 20000,
            "notes": "Free tier with rate limits. Ultra-fast inference.",
            "source_url": "https://groq.com/pricing/",
            "last_verified": "2026-05-08T00:00:00Z"
        },
        
        {
            "provider": "groq",
            "model_name": "Llama 3.1 8B Instant",
            "model_id": "llama-3.1-8b-instant",
            "context_length": 128000,
            "max_input_tokens": 128000,
            "max_output_tokens": 8192,
            "supports_streaming": 1,
            "supports_function_calling": 1,
            "supports_vision": 0,
            "pricing_type": "token",
            "input_price_per_1k": 0,
            "output_price_per_1k": 0,
            "is_free": 1,
            "free_tier_type": "always_free",
            "rate_limit_rpm": 30,
            "rate_limit_rpd": 14400,
            "rate_limit_tpm": 20000,
            "notes": "Free tier. Fastest model on Groq.",
            "source_url": "https://groq.com/pricing/",
            "last_verified": "2026-05-08T00:00:00Z"
        },
        
        # DeepSeek
        {
            "provider": "deepseek",
            "model_name": "DeepSeek Chat",
            "model_id": "deepseek-chat",
            "context_length": 64000,
            "max_input_tokens": 64000,
            "max_output_tokens": 8192,
            "supports_streaming": 1,
            "supports_function_calling": 1,
            "supports_vision": 0,
            "pricing_type": "token",
            "input_price_per_1k": 0.00014,
            "output_price_per_1k": 0.00028,
            "is_free": 1,
            "free_tier_type": "credit_based",
            "free_credit_amount": 10.00,
            "notes": "$10 free credit on signup. Very cheap pricing.",
            "source_url": "https://platform.deepseek.com/api-docs/pricing/",
            "last_verified": "2026-05-08T00:00:00Z"
        },
        
        # Mistral
        {
            "provider": "mistral",
            "model_name": "Mistral Small",
            "model_id": "mistral-small-latest",
            "context_length": 32000,
            "max_input_tokens": 32000,
            "max_output_tokens": 8192,
            "supports_streaming": 1,
            "supports_function_calling": 1,
            "supports_vision": 0,
            "pricing_type": "token",
            "input_price_per_1k": 0.0002,
            "output_price_per_1k": 0.0006,
            "is_free": 1,
            "free_tier_type": "credit_based",
            "free_credit_amount": 5.00,
            "notes": "€5 free credit on signup",
            "source_url": "https://mistral.ai/technology/#pricing",
            "last_verified": "2026-05-08T00:00:00Z"
        },
        
        # Cohere
        {
            "provider": "cohere",
            "model_name": "Command R",
            "model_id": "command-r",
            "context_length": 128000,
            "max_input_tokens": 128000,
            "max_output_tokens": 4096,
            "supports_streaming": 1,
            "supports_function_calling": 1,
            "supports_vision": 0,
            "pricing_type": "token",
            "input_price_per_1k": 0.00015,
            "output_price_per_1k": 0.0006,
            "is_free": 1,
            "free_tier_type": "trial",
            "rate_limit_rpm": 10,
            "notes": "Free trial tier with rate limits",
            "source_url": "https://cohere.com/pricing",
            "last_verified": "2026-05-08T00:00:00Z"
        },
        
        # Together AI
        {
            "provider": "together",
            "model_name": "Llama 3.1 8B Instruct Turbo",
            "model_id": "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
            "context_length": 131072,
            "max_input_tokens": 131072,
            "max_output_tokens": 8192,
            "supports_streaming": 1,
            "supports_function_calling": 0,
            "supports_vision": 0,
            "pricing_type": "token",
            "input_price_per_1k": 0.00018,
            "output_price_per_1k": 0.00018,
            "is_free": 1,
            "free_tier_type": "credit_based",
            "free_credit_amount": 5.00,
            "notes": "$5 free credit on signup",
            "source_url": "https://www.together.ai/pricing",
            "last_verified": "2026-05-08T00:00:00Z"
        },
    ]
    
    added = 0
    skipped = 0
    
    for model in models_data:
        result = db.add_model(**model)
        if result.get("status") == "added":
            added += 1
            print(f"✓ Added: {model['provider']} - {model['model_name']}")
        else:
            skipped += 1
            print(f"⊘ Skipped: {model['provider']} - {model['model_name']} (already exists)")
    
    print(f"\n{'='*50}")
    print(f"Seed completed: {added} added, {skipped} skipped")
    print(f"{'='*50}")

if __name__ == "__main__":
    print("Seeding models table...")
    print(f"{'='*50}\n")
    seed_models()
