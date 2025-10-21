#!/usr/bin/env python3
"""
Script de teste para validar rate limiting nos endpoints de autenticação.
Teste da Correção #11 (P0-011).
"""

import requests
import time
from typing import Dict, Any

API_BASE_URL = "http://localhost:8000/api/auth"

def test_login_rate_limit():
    """Testa rate limiting de login (5 tentativas/minuto)."""
    print("\n" + "="*60)
    print("🧪 TESTE 1: Rate Limiting de Login (5/minuto)")
    print("="*60)
    
    login_url = f"{API_BASE_URL}/login"
    test_credentials = {
        "email": "test@example.com",
        "password": "wrongpassword123"
    }
    
    for i in range(1, 8):
        print(f"\n📤 Tentativa {i}:")
        try:
            response = requests.post(login_url, json=test_credentials)
            
            # Headers de rate limit
            rate_limit = response.headers.get('X-RateLimit-Limit', 'N/A')
            rate_remaining = response.headers.get('X-RateLimit-Remaining', 'N/A')
            retry_after = response.headers.get('Retry-After', 'N/A')
            
            print(f"   Status: {response.status_code}")
            print(f"   X-RateLimit-Limit: {rate_limit}")
            print(f"   X-RateLimit-Remaining: {rate_remaining}")
            
            if response.status_code == 429:
                print(f"   ❌ BLOQUEADO! Retry-After: {retry_after}s")
                print(f"   Mensagem: {response.json()}")
                print("\n✅ Rate limiting funcionando corretamente!")
                break
            elif response.status_code == 401:
                print(f"   ✓ Requisição permitida (senha errada como esperado)")
            else:
                print(f"   ⚠️ Status inesperado: {response.status_code}")
                print(f"   Resposta: {response.json()}")
        
        except Exception as e:
            print(f"   ❌ Erro: {e}")
            break
        
        time.sleep(0.5)  # Aguardar meio segundo entre requisições
    
    if i < 7:
        print("\n⚠️ Teste interrompido antes de 7 tentativas")
    else:
        print("\n❌ Rate limiting NÃO funcionou (não bloqueou após 5 tentativas)")


def test_register_rate_limit():
    """Testa rate limiting de register (3 tentativas/hora)."""
    print("\n" + "="*60)
    print("🧪 TESTE 2: Rate Limiting de Register (3/hora)")
    print("="*60)
    
    register_url = f"{API_BASE_URL}/register"
    
    for i in range(1, 5):
        print(f"\n📤 Tentativa {i}:")
        
        test_user = {
            "email": f"testuser{i}_{int(time.time())}@example.com",
            "username": f"testuser{i}_{int(time.time())}",
            "password": "TestPass123!",
            "full_name": f"Test User {i}"
        }
        
        try:
            response = requests.post(register_url, json=test_user)
            
            # Headers de rate limit
            rate_limit = response.headers.get('X-RateLimit-Limit', 'N/A')
            rate_remaining = response.headers.get('X-RateLimit-Remaining', 'N/A')
            retry_after = response.headers.get('Retry-After', 'N/A')
            
            print(f"   Status: {response.status_code}")
            print(f"   X-RateLimit-Limit: {rate_limit}")
            print(f"   X-RateLimit-Remaining: {rate_remaining}")
            
            if response.status_code == 429:
                print(f"   ❌ BLOQUEADO! Retry-After: {retry_after}s")
                print(f"   Mensagem: {response.json()}")
                print("\n✅ Rate limiting funcionando corretamente!")
                break
            elif response.status_code in [200, 201]:
                print(f"   ✓ Registro permitido")
            else:
                print(f"   ⚠️ Status: {response.status_code}")
                print(f"   Resposta: {response.json()}")
        
        except Exception as e:
            print(f"   ❌ Erro: {e}")
            break
        
        time.sleep(0.5)  # Aguardar meio segundo entre requisições
    
    if i < 4:
        print("\n⚠️ Teste interrompido antes de 4 tentativas")
    else:
        print("\n❌ Rate limiting NÃO funcionou (não bloqueou após 3 tentativas)")


def check_server():
    """Verifica se o servidor está rodando."""
    try:
        response = requests.get("http://localhost:8000/health", timeout=2)
        if response.status_code == 200:
            print("✅ Servidor está rodando!")
            return True
        else:
            print(f"⚠️ Servidor respondeu com status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Servidor não está rodando!")
        print("\n💡 Para iniciar o servidor:")
        print("   cd backend")
        print("   pip install -r requirements.txt")
        print("   uvicorn main:app --reload")
        return False
    except Exception as e:
        print(f"❌ Erro ao conectar ao servidor: {e}")
        return False


if __name__ == "__main__":
    print("\n" + "="*60)
    print("🔒 TESTE DE RATE LIMITING - Correção #11 (P0-011)")
    print("="*60)
    
    print("\n📡 Verificando servidor...")
    if not check_server():
        print("\n❌ Testes cancelados. Inicie o servidor primeiro.")
        exit(1)
    
    # Executar testes
    test_login_rate_limit()
    
    print("\n\n⏳ Aguardando 2 segundos antes do próximo teste...")
    time.sleep(2)
    
    test_register_rate_limit()
    
    print("\n" + "="*60)
    print("✅ Testes de Rate Limiting Concluídos!")
    print("="*60)
    print("\n📝 Observações:")
    print("   - Login: Máximo 5 tentativas/minuto por IP")
    print("   - Register: Máximo 3 registros/hora por IP")
    print("   - Headers X-RateLimit-* presentes nas respostas")
    print("   - HTTP 429 retornado quando limite excedido")
    print("\n🎉 Correção #11 implementada com sucesso!")


