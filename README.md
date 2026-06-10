# Bolao Copa 2026 - OFFICE CONT

Sistema interno para colaboradores registrarem palpites dos jogos da Copa do Mundo FIFA 2026.

## Arquitetura

- `backend`: API Fastify, MySQL, JWT, upload de foto, agendamento de e-mails e rotas administrativas.
- `frontend`: React com Vite, telas de login/cadastro, calendario de jogos, perfil, ranking e admin.
- `database`: MySQL com tabelas `users`, `matches`, `predictions` e `notifications`.

## Banco de dados

Crie um banco MySQL local:

```sql
CREATE DATABASE copa_bolao CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Copie o arquivo de ambiente:

```bash
cp backend/.env.example backend/.env
```

Edite as credenciais em `backend/.env` e rode a migracao:

```bash
npm install
npm run db:migrate
```

## Rodando localmente

```bash
npm start
```

App e API: `http://127.0.0.1:3023`

O comando `npm start` gera o build estatico do frontend e sobe o backend servindo a interface e as rotas da API no mesmo servidor.

Para desenvolvimento com hot reload:

```bash
npm run dev --workspace backend
npm run dev --workspace frontend
```

Frontend: `http://127.0.0.1:5173`

Novos cadastros entram como `user`; administradores podem promover usuarios pela tela de usuarios.

## Regras implementadas

- Cadastro limitado a e-mails `@officecont.cnt.br`.
- Senhas com hash `bcrypt`.
- JWT para rotas autenticadas.
- Upload opcional de foto de perfil.
- Palpite bloqueado automaticamente 10 minutos antes do inicio do jogo.
- Administrador importa jogos por CSV, cadastra/edita jogos e informa resultado oficial.
- Pontuacao automatica: placar exato 10 pontos, vencedor/empate 5 pontos, erro 0.
- Ranking com criterios de desempate: pontos, acertos exatos, acertos de vencedor/empate, total de palpites e nome.
- Exportacao do ranking em CSV.
- Job de lembrete por e-mail 10 minutos antes de jogos ainda nao notificados.

## CSV de importacao de jogos

Cabecalhos aceitos:

```csv
date,time_brasilia,phase,group_name,team_a,team_b,stadium,city
2026-06-11,16:00,Fase de grupos,A,Brasil,Argentina,Estadio exemplo,Sao Paulo
```

Tambem sao aceitos nomes em portugues: `data`, `horario`, `fase`, `grupo`, `mandante`, `visitante`, `estadio`, `cidade`.
