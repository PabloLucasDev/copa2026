import { useEffect, useState } from 'react';
import { LockKeyhole, RefreshCw, UnlockKeyhole } from 'lucide-react';
import { api } from '../api.js';
import { TeamName } from '../components/TeamName.jsx';

export function AdminPage() {
  const [matches, setMatches] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAdminData().catch((error) => setMessage(error.message));
  }, []);

  async function loadAdminData() {
    const { matches } = await api('/matches');
    setMatches(matches);
  }

  async function saveResult(event, matchId) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      await api(`/admin/matches/${matchId}/result`, {
        method: 'PATCH',
        body: {
          official_score_a: Number(form.get('official_score_a')),
          official_score_b: Number(form.get('official_score_b'))
        }
      });
      setMessage('Resultado salvo e ranking recalculado.');
      await loadAdminData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function recalculate() {
    try {
      const result = await api('/admin/recalculate', { method: 'POST' });
      setMessage(`${result.recalculated_matches} jogos recalculados.`);
      await loadAdminData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateMatchStatus(match, status) {
    try {
      await api(`/admin/matches/${match.id}/status`, {
        method: 'PATCH',
        body: { status }
      });
      setMessage(status === 'closed' ? 'Palpites encerrados para o jogo.' : 'Jogo reaberto para palpites.');
      await loadAdminData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="page-section">
      <header className="page-header">
        <div>
          <h1>Resultados oficiais</h1>
          <p>Lance placares finais e recalcule o ranking do bolão.</p>
        </div>
        <div className="admin-actions">
          <button onClick={recalculate} type="button">
            <RefreshCw size={16} />
            Recalcular
          </button>
        </div>
      </header>

      {message && <p className="alert">{message}</p>}

      <div className="match-list compact-list">
        {matches.map((match) => {
          const status = match.effective_status || match.status;
          const canClose = match.status !== 'finished' && match.status !== 'closed';
          const canReopen = match.status === 'closed';

          return (
            <article className="match-row" key={match.id}>
              <div className="match-meta">
                <strong className="inline-match">
                  <TeamName name={match.team_a} />
                  <span>x</span>
                  <TeamName name={match.team_b} />
                </strong>
                <span>{match.date} as {String(match.time_brasilia).slice(0, 5)} - {match.phase}</span>
              </div>
              <form className="prediction-form" onSubmit={(event) => saveResult(event, match.id)}>
                <input defaultValue={match.official_score_a ?? ''} min="0" name="official_score_a" required type="number" />
                <span>x</span>
                <input defaultValue={match.official_score_b ?? ''} min="0" name="official_score_b" required type="number" />
                <button title="Salvar resultado" type="submit">Salvar</button>
              </form>
              <div className="match-admin-status">
                <span className={`status-pill ${getStatusClass(status)}`}>
                  {getStatusText(status, match.prediction_open)}
                </span>
                {canClose && (
                  <button onClick={() => updateMatchStatus(match, 'closed')} title="Encerrar palpites" type="button">
                    <LockKeyhole size={16} />
                    Encerrar
                  </button>
                )}
                {canReopen && (
                  <button onClick={() => updateMatchStatus(match, 'scheduled')} title="Reabrir palpites" type="button">
                    <UnlockKeyhole size={16} />
                    Reabrir
                  </button>
                )}
              </div>
            </article>
          );
        })}
        {!matches.length && <p className="empty-panel">Nenhum jogo cadastrado.</p>}
      </div>
    </section>
  );
}

function getStatusText(status, predictionOpen) {
  if (status === 'finished') return 'Finalizado';
  if (status === 'live') return 'Em andamento';
  if (status === 'closed') return 'Encerrado';
  return predictionOpen ? 'Aberto' : 'Bloqueado';
}

function getStatusClass(status) {
  if (status === 'finished') return 'closed';
  if (status === 'live') return 'live';
  if (status === 'closed') return 'closed';
  return 'active';
}
