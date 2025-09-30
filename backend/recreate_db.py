"""Script para recriar o banco de dados com a nova coluna IsAdmin"""
from app import create_app, db

app = create_app()

with app.app_context():
    print("Recriando banco de dados...")
    db.drop_all()
    print("Tabelas antigas removidas.")
    db.create_all()
    print("Tabelas novas criadas com sucesso!")
    print("\nIMPORTANTE: O primeiro usuário que se registrar será o administrador.")
