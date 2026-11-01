-- Lista de espera do BraSúmula Pro: só o e-mail de quem pediu para ser avisado quando o plano abrir.
CREATE TABLE lista_espera (
  email TEXT PRIMARY KEY,            -- em minúsculas
  origem TEXT NOT NULL,              -- de que página veio (ex.: cartola)
  criado_em TEXT NOT NULL
);
