from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, DateTime, Boolean, ForeignKey

from . import db


class Usuario(db.Model):
    __tablename__ = "Usuario"
    __table_args__ = (
        db.UniqueConstraint("Login", name="uq_usuario_login"),
        db.UniqueConstraint("Email", name="uq_usuario_email"),
        db.Index("ix_usuario_login", "Login"),
        db.Index("ix_usuario_email", "Email"),
    )

    IDUsuario: Mapped[int] = mapped_column(Integer, primary_key=True)
    Nome: Mapped[str] = mapped_column(String(120), nullable=False)
    Login: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    Email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    Senha: Mapped[str] = mapped_column(String(255), nullable=False)
    IsAdmin: Mapped[bool] = mapped_column(Boolean, default=False)
    DtInclusao: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    DtAlteracao: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    pokemons: Mapped[list["PokemonUsuario"]] = relationship(
        back_populates="usuario", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Usuario id={self.IDUsuario} login={self.Login}>"


class TipoPokemon(db.Model):
    __tablename__ = "TipoPokemon"
    __table_args__ = (
        db.UniqueConstraint("Descricao", name="uq_tipopokemon_descricao"),
        db.Index("ix_tipopokemon_descricao", "Descricao"),
    )

    IDTipoPokemon: Mapped[int] = mapped_column(Integer, primary_key=True)
    Descricao: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)

    pokemons: Mapped[list["PokemonUsuario"]] = relationship(back_populates="tipo")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<TipoPokemon id={self.IDTipoPokemon} desc={self.Descricao}>"


class PokemonUsuario(db.Model):
    __tablename__ = "PokemonUsuario"
    __table_args__ = (
        # Um mesmo usuário não deve ter duplicado o mesmo Código com o mesmo papel
        db.Index(
            "ix_pokemon_usuario_user_codigo",
            "IDUsuario",
            "Codigo",
            unique=False,
        ),
        db.Index(
            "ix_pokemon_usuario_user_flags",
            "IDUsuario",
            "Favorito",
            "GrupoBatalha",
            unique=False,
        ),
    )

    IDPokemonUsuario: Mapped[int] = mapped_column(Integer, primary_key=True)
    IDUsuario: Mapped[int] = mapped_column(ForeignKey("Usuario.IDUsuario"), nullable=False)
    IDTipoPokemon: Mapped[int | None] = mapped_column(
        ForeignKey("TipoPokemon.IDTipoPokemon"), nullable=True
    )
    Codigo: Mapped[str] = mapped_column(String(50), nullable=False)
    ImagemUrl: Mapped[str | None] = mapped_column(String(255), nullable=True)
    Nome: Mapped[str] = mapped_column(String(120), nullable=False)
    GrupoBatalha: Mapped[bool] = mapped_column(Boolean, default=False)
    Favorito: Mapped[bool] = mapped_column(Boolean, default=False)

    usuario: Mapped[Usuario] = relationship(back_populates="pokemons")
    tipo: Mapped[TipoPokemon] = relationship(back_populates="pokemons")

    DtInclusao: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    DtAlteracao: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<PokemonUsuario id={self.IDPokemonUsuario} user={self.IDUsuario} "
            f"codigo={self.Codigo} fav={self.Favorito} equipe={self.GrupoBatalha}>"
        )


