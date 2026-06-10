import { useEffect, useMemo, useState } from 'react';
import {
  CalendarCheck,
  Clock,
  Download,
  MapPin,
  Radio,
  Swords
} from 'lucide-react';
import { api } from '../api.js';
import { TeamName } from '../components/TeamName.jsx';

const liveMatchDurationMs = 2.5 * 60 * 60 * 1000;

export function DashboardPage({ currentUser, onNavigate }) {
  const [matches, setMatches] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [message, setMessage] = useState('');
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    loadDashboardData().catch((error) => setMessage(error.message));
  }, []);

  async function loadDashboardData() {
    const [{ matches }, { ranking }] = await Promise.all([
      api('/matches'),
      api('/ranking')
    ]);
    setMatches(matches);
    setRanking(ranking);
  }

  async function saveResult(matchId, scores) {
    try {
      await api(`/admin/matches/${matchId}/result`, {
        method: 'PATCH',
        body: scores
      });
      setMessage('Resultado salvo.');
      const { ranking } = await api('/ranking');
      setRanking(ranking);
      setMatches((currentMatches) =>
        currentMatches.map((match) =>
          match.id === matchId
            ? {
                ...match,
                official_score_a: scores.official_score_a,
                official_score_b: scores.official_score_b,
                status: 'finished'
              }
            : match
        )
      );
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function exportRanking() {
    const csv = await api('/ranking/export.csv');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ranking-copa-2026.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  const dashboardStats = useMemo(() => {
    const computedGames = matches.filter((match) => match.status === 'finished').length;

    return {
      computedGames,
      totalGames: matches.length,
      groupPhaseGames: matches.filter((match) => match.group_name).length,
      liveGames: matches.filter(isMatchLive).length
    };
  }, [matches]);

  const scoreMatches = useMemo(() => {
    return matches
      .sort((a, b) => getMatchTime(a) - getMatchTime(b))
      .slice(0, 2);
  }, [matches]);

  const liveMatches = useMemo(() => matches.filter(isMatchLive).sort((a, b) => getMatchTime(a) - getMatchTime(b)), [matches]);
  const rankingLeaders = useMemo(() => ranking.slice(0, 6), [ranking]);

  return (
    <section className="page-section dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Visão Geral da Copa</h1>
          <p>{isAdmin ? 'Gerencie resultados, usuários e o ranking do bolão corporativo.' : 'Acompanhe jogos, ranking e movimentação do bolão corporativo.'}</p>
        </div>
        <div className="dashboard-actions">
          <button onClick={exportRanking} type="button">
            <Download size={15} />
            Exportar Ranking
          </button>
        </div>
      </header>

      {message && <p className="alert">{message}</p>}

      <div className="dashboard-layout">
        <div className="dashboard-main-column">
          <section className="dashboard-panel scores-panel">
            <div className="panel-heading">
              <h2>
                <CalendarCheck size={22} />
                {isAdmin ? 'Lançamento de Placares Oficiais' : 'Ranking do Bolão'}
              </h2>
              <span className="phase-select">Fase de Grupos</span>
            </div>
            <RankingBarChart ranking={rankingLeaders} />
            {isAdmin && (
              <div className="score-table">
                <div className="score-table-head">
                  <span>Data/Hora</span>
                  <span>Mandante</span>
                  <span>Placar Oficial</span>
                  <span>Visitante</span>
                  <span>Status</span>
                </div>
                {scoreMatches.map((match) => (
                  <ScoreRow key={match.id} match={match} onSaveResult={saveResult} />
                ))}
                {!scoreMatches.length && <p className="empty-panel">Nenhum jogo pendente de resultado.</p>}
              </div>
            )}
            <button className="panel-link" onClick={() => onNavigate?.(isAdmin ? 'matches' : 'ranking')} type="button">
              {isAdmin ? 'Ver todos os jogos' : 'Ver ranking completo'}
            </button>
          </section>
        </div>

        <aside className="dashboard-side-column">
          <div className="stat-grid">
            <article className="dashboard-stat primary live-stat">
              <span>Jogos Acontecendo Agora</span>
              <strong>{dashboardStats.liveGames}</strong>
              <small>{dashboardStats.liveGames === 1 ? 'partida em andamento' : 'partidas em andamento'}</small>
            </article>
            <article className="dashboard-stat">
              <span>Jogos Computados</span>
              <strong>{dashboardStats.computedGames}<small>/{dashboardStats.totalGames}</small></strong>
              <small>Fase de Grupos</small>
            </article>
          </div>

          <section className="dashboard-panel live-games-panel">
            <div className="panel-heading">
              <h2>
                <Radio size={22} />
                Jogos Acontecendo Agora
              </h2>
              <Clock size={20} />
            </div>
            <div className="live-games-list">
              {liveMatches.map((match) => (
                <article className="live-game-row" key={match.id}>
                  <div>
                    <strong>
                      <TeamName name={match.team_a} />
                      <span>x</span>
                      <TeamName name={match.team_b} />
                    </strong>
                    <span>
                      <Clock size={14} />
                      Início {String(match.time_brasilia).slice(0, 5)}
                    </span>
                  </div>
                  <small>
                    <MapPin size={14} />
                    {match.stadium || match.city || 'Local a definir'}
                  </small>
                </article>
              ))}
              {!liveMatches.length && (
                <div className="empty-live-games">
                  <Radio size={28} />
                  <strong>Nenhum jogo acontecendo agora</strong>
                  <span>Quando uma partida estiver no horário, ela aparece aqui.</span>
                </div>
              )}
            </div>
            <button className="panel-link" onClick={() => onNavigate?.('matches')} type="button">Ver calendário de jogos</button>
          </section>
        </aside>
      </div>
    </section>
  );
}

function RankingBarChart({ ranking }) {
  const maxPoints = Math.max(...ranking.map((row) => Number(row.points) || 0), 1);
  const axisMax = Math.max(Math.ceil(maxPoints / 10) * 10, 10);
  const axisTicks = [axisMax, Math.round(axisMax * 0.75), Math.round(axisMax * 0.5), Math.round(axisMax * 0.25), 0];

  return (
    <div className="ranking-bars">
      <div className="ranking-bars-title">
        <strong>Ranking por pontuação</strong>
        <span>Quem está na frente</span>
      </div>
      <div className="ranking-column-chart">
        <div className="ranking-y-axis">
          {axisTicks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
        <div className="ranking-plot">
          <div className="ranking-grid-lines" aria-hidden="true">
            {axisTicks.map((tick) => (
              <span key={tick} />
            ))}
          </div>
          <div className="ranking-columns">
            {ranking.map((row) => {
              const points = Number(row.points) || 0;
              return (
                <div className="ranking-column" key={row.id}>
                  <div className="ranking-column-track">
                    <span className="ranking-column-bar" style={{ height: `${Math.max((points / axisMax) * 100, points ? 6 : 0)}%` }}>
                      <span className="ranking-column-value">{points}</span>
                    </span>
                  </div>
                  <strong>{shortName(row.name)}</strong>
                </div>
              );
            })}
          </div>
        </div>
        {!ranking.length && <p className="empty-panel">Ranking ainda sem pontuações.</p>}
      </div>
    </div>
  );
}

function shortName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] || 'Usuário';
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function ScoreRow({ match, onSaveResult }) {
  const [scoreA, setScoreA] = useState(match.official_score_a ?? '');
  const [scoreB, setScoreB] = useState(match.official_score_b ?? '');

  function saveScore(side, value) {
    const nextScoreA = side === 'a' ? value : scoreA;
    const nextScoreB = side === 'b' ? value : scoreB;

    setScoreA(nextScoreA);
    setScoreB(nextScoreB);

    onSaveResult(match.id, {
      official_score_a: toScoreNumber(nextScoreA),
      official_score_b: toScoreNumber(nextScoreB)
    });
  }

  return (
    <article className="score-table-row">
      <div>
        <strong>{formatRelativeMatchTime(match)}</strong>
        <span>{match.group_name ? `Grupo ${match.group_name}` : match.phase}</span>
      </div>
      <TeamName name={match.team_a} />
      <div className="official-score-inputs">
        <input min="0" onChange={(event) => saveScore('a', event.target.value)} type="number" value={scoreA} />
        <Swords aria-hidden="true" size={18} />
        <input min="0" onChange={(event) => saveScore('b', event.target.value)} type="number" value={scoreB} />
      </div>
      <TeamName name={match.team_b} />
      <span className={`status-badge ${match.status === 'finished' ? 'saved' : 'pending'}`}>
        {match.status === 'finished' ? 'Salvo' : 'Agendado'}
      </span>
    </article>
  );
}

function toScoreNumber(value) {
  const score = Number(value);
  return Number.isInteger(score) && score >= 0 ? score : 0;
}

function getMatchTime(match) {
  return new Date(`${String(match.date).slice(0, 10)}T${String(match.time_brasilia).slice(0, 5)}:00-03:00`).getTime();
}

function isMatchLive(match) {
  if (match.effective_status === 'live') return true;
  if (match.status === 'finished' || match.status === 'closed') return false;

  const startsAt = getMatchTime(match);
  if (Number.isNaN(startsAt)) return false;

  const now = Date.now();
  return now >= startsAt && now < startsAt + liveMatchDurationMs;
}

function formatRelativeMatchTime(match) {
  const matchDate = String(match.date).slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const time = String(match.time_brasilia).slice(0, 5);

  if (matchDate === today) return `Hoje, ${time}`;
  if (matchDate === tomorrow) return `Amanhã, ${time}`;
  return `${formatDate(matchDate)}, ${time}`;
}

function formatDate(value) {
  const [year, month, day] = String(value).slice(0, 10).split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}`;
}
