-- Salas do simulador: até 5 pessoas palpitando juntas e vendo os palpites umas das outras.
CREATE TABLE salas (
  codigo TEXT PRIMARY KEY,           -- 6 caracteres, ex.: K7P2QX (mostrado como K7P-2QX)
  nome TEXT NOT NULL,
  competicao TEXT NOT NULL,          -- ex.: BSA
  temporada INTEGER NOT NULL,
  criada_em TEXT NOT NULL,
  atualizada_em TEXT NOT NULL        -- muda a cada entrada, saída ou palpite; serve de ETag e para apagar salas paradas
);

CREATE TABLE participantes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sala TEXT NOT NULL REFERENCES salas (codigo) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cor INTEGER NOT NULL,              -- 0 a 4: a cor da pessoa na tela
  dono INTEGER NOT NULL DEFAULT 0,   -- quem criou (ou herdou) a sala pode remover os outros
  chave_hash TEXT NOT NULL,          -- SHA-256 da chave secreta que só o navegador da pessoa tem
  palpites TEXT NOT NULL DEFAULT '', -- no mesmo formato do link de compartilhar do simulador
  entrou_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL,
  UNIQUE (sala, cor)
);

CREATE INDEX participantes_por_sala ON participantes (sala);
CREATE INDEX salas_por_atualizacao ON salas (atualizada_em);
