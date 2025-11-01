"""
Script de migração: Converter patient_id de String para Integer
"""
import os
import sys
from pathlib import Path

# Fix encoding for Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Adicionar backend ao path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from sqlalchemy import create_engine, text
from models.user import Base
from models.patient import Patient
from models.appointment import Appointment

# Caminho do banco
BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_PATH = BASE_DIR / "alignwork.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

print(f"[MIGRACAO] Migrando banco de dados: {DATABASE_PATH}")
print("=" * 60)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

def migrate():
    """Executa a migração"""
    
    with engine.connect() as conn:
        # Verificar se há appointments
        result = conn.execute(text("SELECT COUNT(*) FROM appointments"))
        count = result.scalar()
        print(f"[INFO] Total de appointments: {count}")
        
        if count == 0:
            print("[OK] Nenhum appointment para migrar. Recriando tabelas...")
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)
            print("[OK] Tabelas recriadas com sucesso!")
            return
        
        # Criar tabela temporária com nova estrutura
        print("\n[STEP 1] Criando tabela temporária...")
        conn.execute(text("""
            CREATE TABLE appointments_new (
                id INTEGER PRIMARY KEY,
                tenant_id VARCHAR NOT NULL,
                patient_id INTEGER NOT NULL,
                starts_at DATETIME NOT NULL,
                duration_min INTEGER NOT NULL,
                status VARCHAR DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients(id)
            )
        """))
        conn.commit()
        
        # Copiar dados convertendo patient_id para integer
        print("[STEP 2] Copiando dados (convertendo patient_id)...")
        conn.execute(text("""
            INSERT INTO appointments_new 
                (id, tenant_id, patient_id, starts_at, duration_min, status, created_at, updated_at)
            SELECT 
                id, 
                tenant_id, 
                CAST(patient_id AS INTEGER), 
                starts_at, 
                duration_min, 
                status, 
                created_at, 
                updated_at
            FROM appointments
        """))
        conn.commit()
        
        # Dropar tabela antiga
        print("[STEP 3] Removendo tabela antiga...")
        conn.execute(text("DROP TABLE appointments"))
        conn.commit()
        
        # Renomear nova tabela
        print("[STEP 4] Renomeando tabela nova...")
        conn.execute(text("ALTER TABLE appointments_new RENAME TO appointments"))
        conn.commit()
        
        # Recriar índices
        print("[STEP 5] Recriando indices...")
        conn.execute(text("CREATE INDEX ix_appointments_tenant_id ON appointments(tenant_id)"))
        conn.execute(text("CREATE INDEX ix_appointments_patient_id ON appointments(patient_id)"))
        conn.commit()
        
        # Atualizar constraint de CPF na tabela patients
        print("\n[STEP 6] Corrigindo constraint de CPF...")
        
        # Criar tabela temporária para patients
        conn.execute(text("""
            CREATE TABLE patients_new (
                id INTEGER PRIMARY KEY,
                tenant_id VARCHAR NOT NULL,
                name VARCHAR NOT NULL,
                cpf VARCHAR NOT NULL,
                phone VARCHAR NOT NULL,
                email VARCHAR,
                address TEXT NOT NULL,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.commit()
        
        # Copiar dados
        conn.execute(text("""
            INSERT INTO patients_new 
                (id, tenant_id, name, cpf, phone, email, address, notes, created_at, updated_at)
            SELECT id, tenant_id, name, cpf, phone, email, address, notes, created_at, updated_at
            FROM patients
        """))
        conn.commit()
        
        # Dropar tabela antiga
        conn.execute(text("DROP TABLE patients"))
        conn.commit()
        
        # Renomear nova tabela
        conn.execute(text("ALTER TABLE patients_new RENAME TO patients"))
        conn.commit()
        
        # Criar índices e constraints
        conn.execute(text("CREATE INDEX ix_patients_tenant_id ON patients(tenant_id)"))
        conn.execute(text("CREATE INDEX ix_patients_cpf ON patients(cpf)"))
        conn.execute(text("CREATE UNIQUE INDEX uix_tenant_cpf ON patients(tenant_id, cpf)"))
        conn.commit()
        
        print("\n[OK] Migracao concluida com sucesso!")
        print("=" * 60)
        
        # Verificar dados
        result = conn.execute(text("SELECT COUNT(*) FROM patients"))
        patients_count = result.scalar()
        result = conn.execute(text("SELECT COUNT(*) FROM appointments"))
        appointments_count = result.scalar()
        
        print(f"\n[RESUMO]")
        print(f"   - Pacientes: {patients_count}")
        print(f"   - Agendamentos: {appointments_count}")

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"\n[ERRO] Erro na migracao: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

