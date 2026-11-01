-- Contas (Firebase): cada participante de sala passa a ser de uma conta, e a conta guarda o time do coração.

-- uid da conta no Firebase. NULL só para quem entrou antes do login existir, até ligar a participação à conta.
ALTER TABLE participantes ADD COLUMN uid TEXT;
-- Uma conta aparece no máximo uma vez em cada sala.
CREATE UNIQUE INDEX participantes_sala_uid ON participantes (sala, uid) WHERE uid IS NOT NULL;
CREATE INDEX participantes_por_uid ON participantes (uid);

-- Preferências da conta. Nada de senha ou e-mail: isso fica só no Firebase.
CREATE TABLE usuarios (
  uid TEXT PRIMARY KEY,
  meu_time INTEGER,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);
