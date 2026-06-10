import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import { api } from '../api.js';
import { TeamName } from '../components/TeamName.jsx';

const initialForm = {
  date: getTodayInBrasilia(),
  time_brasilia: '12:00',
  group_name: 'Teste',
  team_a: 'Time Teste A',
  team_b: 'Time Teste B',
  stadium: 'Ambiente de teste',
  city: 'Teste'
};

function getTodayInBrasilia() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

export function TestMatchesAdminPage() {
  const [matches, setMatches] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadMatches().catch((error) => setMessage(error.message));
  }, []);

  async function loadMatches() {
    const { matches } = await api('/matches');
    setMatches(matches);
  }

  async function createMatch(event) {
    event.preventDefault();

    try {
      await api('/admin/matches', {
        method: 'POST',
        body: {
          ...form,
          phase: 'Teste',
          status: 'scheduled'
        }
      });
      setMessage('Jogo de teste criado.');
      setForm(initialForm);
      await loadMatches();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteMatch(match) {
    if (!window.confirm(`Excluir ${match.team_a} x ${match.team_b}?`)) {
      return;
    }

    try {
      await api(`/admin/matches/${match.id}`, { method: 'DELETE' });
      setMessage('Jogo de teste excluido.');
      await loadMatches();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  const testMatches = useMemo(() => {
    return matches.filter((match) => match.phase === 'Teste');
  }, [matches]);

  return (
    <section className="page-section">
      <header className="page-header">
        <div>
          <h1>Jogos de teste</h1>
          <p>Crie partidas falsas para testar palpites, resultados e ranking.</p>
        </div>
        <div className="admin-actions">
          <button onClick={loadMatches} type="button">
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>
      </header>

      {message && <p className="alert">{message}</p>}

      <form className="admin-panel form-grid test-match-form" onSubmit={createMatch}>
        <h2>Novo jogo falso</h2>
        <div className="form-row">
          <label>
            Data
            <input required type="date" value={form.date} onChange={(event) => updateField('date', event.target.value)} />
          </label>
          <label>
            Hora de Brasilia
            <input required type="time" value={form.time_brasilia} onChange={(event) => updateField('time_brasilia', event.target.value)} />
          </label>
          <label>
            Grupo
            <input required value={form.group_name} onChange={(event) => updateField('group_name', event.target.value)} />
          </label>
        </div>
        <div className="form-row">
          <label>
            Time A
            <input required value={form.team_a} onChange={(event) => updateField('team_a', event.target.value)} />
          </label>
          <label>
            Time B
            <input required value={form.team_b} onChange={(event) => updateField('team_b', event.target.value)} />
          </label>
        </div>
        <div className="form-row">
          <label>
            Estadio
            <input value={form.stadium} onChange={(event) => updateField('stadium', event.target.value)} />
          </label>
          <label>
            Cidade
            <input value={form.city} onChange={(event) => updateField('city', event.target.value)} />
          </label>
        </div>
        <button className="primary-button" type="submit">
          <Plus size={16} />
          Criar jogo falso
        </button>
      </form>

      <h2>Jogos falsos criados</h2>
      <div className="match-list test-match-list">
        {testMatches.map((match) => (
          <article className="match-row" key={match.id}>
            <div className="match-meta">
              <strong className="inline-match">
                <TeamName name={match.team_a} />
                <span>x</span>
                <TeamName name={match.team_b} />
              </strong>
              <span>{match.date} as {String(match.time_brasilia).slice(0, 5)} - {match.group_name || 'Teste'}</span>
              <small>{match.stadium || match.city || 'Sem local'}</small>
            </div>
            <span className={`status-pill ${match.status === 'finished' ? 'closed' : 'active'}`}>
              {match.status === 'finished' ? 'Finalizado' : 'Aberto'}
            </span>
            <button className="danger-button" onClick={() => deleteMatch(match)} type="button">
              <Trash2 size={16} />
              Excluir
            </button>
          </article>
        ))}
        {!testMatches.length && <p className="empty-panel">Nenhum jogo falso criado.</p>}
      </div>
    </section>
  );
}
