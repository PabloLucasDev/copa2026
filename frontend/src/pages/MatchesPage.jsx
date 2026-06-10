import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CircleCheck, Clock, FilterX, LockKeyhole, MapPin, Swords, TriangleAlert, Users, X } from 'lucide-react';
import { api } from '../api.js';
import { Avatar } from '../components/Avatar.jsx';
import { getTeamNamePt, TeamFlag } from '../components/TeamName.jsx';

const emptyFilters = {
  date: '',
  team: '',
  group: '',
  phase: '',
  open: false,
  finished: false
};

const matchDurationMs = 2.5 * 60 * 60 * 1000;

export function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [catalogMatches, setCatalogMatches] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [predictionPanel, setPredictionPanel] = useState(null);
  const [loadingPredictions, setLoadingPredictions] = useState(false);

  useEffect(() => {
    loadMatches().catch((error) => setMessage(error.message));
  }, []);

  const filterOptions = useMemo(() => {
    const teams = new Set();
    const groups = new Set();
    const phases = new Set();

    catalogMatches.forEach((match) => {
      teams.add(match.team_a);
      teams.add(match.team_b);
      if (match.group_name) groups.add(match.group_name);
      if (match.phase) phases.add(match.phase);
    });

    return {
      teams: Array.from(teams).filter(Boolean).sort((a, b) => getTeamNamePt(a).localeCompare(getTeamNamePt(b))),
      groups: Array.from(groups).filter(Boolean).sort(),
      phases: Array.from(phases).filter(Boolean).sort()
    };
  }, [catalogMatches]);

  async function loadMatches(nextFilters = filters) {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    const { matches } = await api(`/matches?${params.toString()}`);
    setMatches(matches);
    if (!params.toString()) setCatalogMatches(matches);
    setLoading(false);
  }

  function updateFilter(key, value) {
    const next = { ...filters, [key]: value };

    if (key === 'group') next.phase = '';
    if (key === 'phase') next.group = '';

    setFilters(next);
    loadMatches(next).catch((error) => setMessage(error.message));
  }

  function clearFilters() {
    setFilters(emptyFilters);
    loadMatches(emptyFilters).catch((error) => setMessage(error.message));
  }

  async function savePrediction(matchId, scores) {
    try {
      await api(`/matches/${matchId}/prediction`, {
        method: 'PUT',
        body: scores
      });
      setMessage('Palpite salvo.');
      setMatches((currentMatches) =>
        currentMatches.map((match) =>
          match.id === matchId
            ? {
                ...match,
                user_prediction: {
                  ...(match.user_prediction || {}),
                  predicted_score_a: scores.predicted_score_a,
                  predicted_score_b: scores.predicted_score_b
                }
              }
            : match
        )
      );
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function openPredictions(match) {
    setLoadingPredictions(true);
    setMessage('');

    try {
      const result = await api(`/matches/${match.id}/predictions`);
      setPredictionPanel(result);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoadingPredictions(false);
    }
  }

  return (
    <section className="page-section games-page">
      <header className="page-header games-header">
        <div>
          <h1>Calendário de jogos</h1>
          <p className="warning-copy">
            <TriangleAlert size={15} />
            Palpites bloqueados 10 min antes do início.
          </p>
        </div>

        <div className="game-filters">
          <label>
            Data
            <input type="date" value={filters.date} onChange={(event) => updateFilter('date', event.target.value)} />
          </label>
          <label>
            Seleção
            <select value={filters.team} onChange={(event) => updateFilter('team', event.target.value)}>
              <option value="">Todas</option>
              {filterOptions.teams.map((team) => (
                <option key={team} value={team}>{getTeamNamePt(team)}</option>
              ))}
            </select>
          </label>
          <label>
            Fase
            <select
              value={filters.phase || filters.group}
              onChange={(event) => {
                const value = event.target.value;
                const isGroup = filterOptions.groups.includes(value);
                updateFilter(isGroup ? 'group' : 'phase', value);
              }}
            >
              <option value="">Todas</option>
              {filterOptions.phases.map((phase) => (
                <option key={phase} value={phase}>{phase}</option>
              ))}
              {filterOptions.groups.map((group) => (
                <option key={group} value={group}>Grupo {group}</option>
              ))}
            </select>
          </label>
          <button className="icon-button filter-clear" onClick={clearFilters} title="Limpar filtros" type="button">
            <FilterX size={18} />
          </button>
        </div>
      </header>

      {message && <p className="alert">{message}</p>}

      {loading ? (
        <p>Carregando jogos...</p>
      ) : (
        <div className="game-card-grid">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              loadingPredictions={loadingPredictions}
              match={match}
              onSavePrediction={savePrediction}
              onViewPredictions={openPredictions}
            />
          ))}
        </div>
      )}

      {predictionPanel && (
        <PredictionsModal
          match={predictionPanel.match}
          onClose={() => setPredictionPanel(null)}
          predictions={predictionPanel.predictions}
        />
      )}
    </section>
  );
}

function MatchCard({ loadingPredictions, match, onSavePrediction, onViewPredictions }) {
  const displayState = getMatchDisplayState(match);
  const isFinished = displayState === 'finished';
  const isClosed = displayState === 'closed';
  const isLive = displayState === 'live';
  const isOpen = match.prediction_open;
  const canShowPredictions = !isOpen && (isLive || isClosed || isFinished);
  const cardStatus = isFinished ? 'finished' : isLive ? 'live' : isClosed ? 'closed' : isOpen ? 'open' : 'locked';
  const phaseLabel = match.group_name ? 'Fase de Grupos' : match.phase;
  const statusLabel = getStatusLabel(displayState, isOpen);
  const StatusIcon = isFinished || isOpen ? CircleCheck : isLive ? Clock : LockKeyhole;
  const prediction = match.user_prediction;
  const [scoreA, setScoreA] = useState(prediction?.predicted_score_a ?? '');
  const [scoreB, setScoreB] = useState(prediction?.predicted_score_b ?? '');

  function saveScore(side, value) {
    const nextScoreA = side === 'a' ? value : scoreA;
    const nextScoreB = side === 'b' ? value : scoreB;

    setScoreA(nextScoreA);
    setScoreB(nextScoreB);

    onSavePrediction(match.id, {
      predicted_score_a: toScoreNumber(nextScoreA),
      predicted_score_b: toScoreNumber(nextScoreB)
    });
  }

  return (
    <article className={`game-card ${cardStatus}`}>
      <div className="game-card-top">
        <span className="game-chip">{phaseLabel}</span>
        <span className={`game-chip status ${cardStatus}`}>
          <StatusIcon size={13} />
          {statusLabel}
        </span>
      </div>

      <div className="game-score-form">
        <TeamBlock name={match.team_a} />
        <input
          aria-label={`Palpite ${getTeamNamePt(match.team_a)}`}
          disabled={!isOpen}
          min="0"
          onChange={(event) => saveScore('a', event.target.value)}
          type="number"
          value={scoreA}
        />
        <Swords aria-hidden="true" className="score-separator" size={18} />
        <input
          aria-label={`Palpite ${getTeamNamePt(match.team_b)}`}
          disabled={!isOpen}
          min="0"
          onChange={(event) => saveScore('b', event.target.value)}
          type="number"
          value={scoreB}
        />
        <TeamBlock align="right" name={match.team_b} />
      </div>

      <div className="game-card-footer">
        {isFinished ? (
          <>
            <span>
              <CalendarDays size={15} />
              {formatDate(match.date)}
            </span>
            <strong className="prediction-result">
              <CircleCheck size={15} />
              Palpite: {prediction ? `${prediction.predicted_score_a}x${prediction.predicted_score_b}` : '-'}
            </strong>
          </>
        ) : isLive ? (
          <>
            <strong className="live-status">
              <Clock size={15} />
              Em andamento ({String(match.time_brasilia).slice(0, 5)})
            </strong>
            <span>
              <MapPin size={15} />
              {match.stadium || match.city || 'Local a definir'}
            </span>
          </>
        ) : isClosed ? (
          <>
            <strong className="closed-status">
              <LockKeyhole size={15} />
              Fechado
            </strong>
            <span>
              <CalendarDays size={15} />
              {formatDate(match.date)} - {String(match.time_brasilia).slice(0, 5)}
            </span>
          </>
        ) : (
          <>
            <span>
              <CalendarDays size={15} />
              {formatDate(match.date)} - {String(match.time_brasilia).slice(0, 5)}
            </span>
            <span>
              <MapPin size={15} />
              {match.stadium || match.city || 'Local a definir'}
            </span>
          </>
        )}
      </div>

      {canShowPredictions && (
        <div className="game-card-actions">
          <button disabled={loadingPredictions} onClick={() => onViewPredictions(match)} type="button">
            <Users size={15} />
            Ver palpites
          </button>
        </div>
      )}
    </article>
  );
}

function PredictionsModal({ match, onClose, predictions }) {
  const withPrediction = predictions.filter((prediction) => prediction.has_prediction).length;

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="predictions-modal" role="dialog">
        <header className="predictions-modal-header">
          <div>
            <span className="game-chip">{match.group_name ? `Grupo ${match.group_name}` : match.phase}</span>
            <h2>
              <TeamBlock name={match.team_a} />
              <span>x</span>
              <TeamBlock align="right" name={match.team_b} />
            </h2>
            <p>{withPrediction}/{predictions.length} participantes votaram</p>
          </div>
          <button className="icon-button" onClick={onClose} title="Fechar" type="button">
            <X size={18} />
          </button>
        </header>

        <div className="prediction-votes-list">
          {predictions.map((prediction) => (
            <article className={`prediction-vote-row ${prediction.has_prediction ? '' : 'empty'}`} key={prediction.user_id}>
              <div className="person-cell">
                <Avatar name={prediction.name} size={34} src={prediction.profile_photo} />
                <div>
                  <strong>{prediction.name}</strong>
                  <span>{prediction.email}</span>
                </div>
              </div>
              <strong className="vote-score">
                {prediction.has_prediction ? `${prediction.predicted_score_a} x ${prediction.predicted_score_b}` : 'Sem palpite'}
              </strong>
              <span className="vote-points">
                {prediction.points !== null && prediction.points !== undefined
                  ? `${prediction.points} pts`
                  : prediction.has_prediction
                    ? 'Aguardando resultado'
                    : '-'}
              </span>
            </article>
          ))}
          {!predictions.length && <p className="empty-panel">Nenhum participante encontrado.</p>}
        </div>
      </section>
    </div>
  );
}

function toScoreNumber(value) {
  const score = Number(value);
  return Number.isInteger(score) && score >= 0 ? score : 0;
}

function getMatchDisplayState(match) {
  if (match.effective_status === 'finished' || match.status === 'finished') return 'finished';
  if (match.effective_status === 'live') return 'live';
  if (match.effective_status === 'closed' || match.status === 'closed') return 'closed';

  const startsAt = getStartsAt(match);
  if (!startsAt) return match.prediction_open ? 'open' : 'locked';

  const now = Date.now();
  const startTime = startsAt.getTime();

  if (now >= startTime && now < startTime + matchDurationMs) return 'live';
  if (now >= startTime + matchDurationMs) return 'closed';
  return match.prediction_open ? 'open' : 'locked';
}

function getStartsAt(match) {
  if (match.starts_at_utc) {
    const value = String(match.starts_at_utc);
    const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  if (match.date && match.time_brasilia) {
    const parsed = new Date(`${String(match.date).slice(0, 10)}T${String(match.time_brasilia).slice(0, 5)}:00-03:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

function getStatusLabel(displayState, isOpen) {
  if (displayState === 'finished') return 'Finalizado';
  if (displayState === 'live') return 'Em andamento';
  if (displayState === 'closed') return 'Fechado';
  return isOpen ? 'Aberto' : 'Bloqueado';
}

function TeamBlock({ name, align = 'left' }) {
  const displayName = getTeamNamePt(name);

  return (
    <div className={`game-team ${align === 'right' ? 'right' : ''}`}>
      <TeamFlag className="game-flag" name={name} />
      <strong title={displayName}>{displayName}</strong>
    </div>
  );
}

function formatDate(value) {
  if (!value) return '';
  const [year, month, day] = String(value).slice(0, 10).split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}`;
}
