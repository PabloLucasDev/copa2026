import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Avatar } from '../components/Avatar.jsx';

export function RankingPage() {
  const [ranking, setRanking] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/ranking')
      .then(({ ranking }) => setRanking(ranking))
      .catch((error) => setError(error.message));
  }, []);

  return (
    <section className="page-section">
      <header className="page-header">
        <div>
          <h1>Ranking geral</h1>
          <p>Atualizado automaticamente apos resultados oficiais.</p>
        </div>
      </header>

      {error && <p className="alert error">{error}</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Posição</th>
              <th>Participante</th>
              <th>Pontos</th>
              <th>Exatos</th>
              <th>Vencedor/empate</th>
              <th>Palpites</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((row) => (
              <tr key={row.id}>
                <td><strong>#{row.position}</strong></td>
                <td>
                  <div className="person-cell">
                    <Avatar name={row.name} src={row.profile_photo} />
                    <span>{row.name}</span>
                  </div>
                </td>
                <td>{row.points}</td>
                <td>{row.exact_hits}</td>
                <td>{row.outcome_hits}</td>
                <td>{row.total_predictions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
