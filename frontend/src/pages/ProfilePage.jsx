import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Avatar } from '../components/Avatar.jsx';
import { TeamName } from '../components/TeamName.jsx';

export function ProfilePage({ onUserUpdated }) {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProfile().catch((error) => setMessage(error.message));
  }, []);

  async function loadProfile() {
    const { profile } = await api('/profile');
    setProfile(profile);
  }

  async function updateProfile(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      const { user } = await api('/profile', {
        method: 'PUT',
        body: form
      });
      localStorage.setItem('user', JSON.stringify(user));
      onUserUpdated(user);
      setMessage('Perfil atualizado.');
      await loadProfile();
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!profile) {
    return (
      <section className="page-section">
        {message ? <p className="alert error">{message}</p> : <p>Carregando perfil...</p>}
      </section>
    );
  }

  return (
    <section className="page-section">
      <header className="profile-header">
        <Avatar name={profile.name} size={72} src={profile.profile_photo} />
        <div>
          <h1>{profile.name}</h1>
          <p>{profile.email}</p>
        </div>
      </header>

      <div className="stats-grid">
        <Metric label="Pontuação" value={profile.points} />
        <Metric label="Posição" value={profile.position ? `#${profile.position}` : '-'} />
        <Metric label="Acertos exatos" value={profile.exact_hits} />
        <Metric label="Vencedor/empate" value={profile.outcome_hits} />
      </div>

      <form className="form-row" onSubmit={updateProfile}>
        <input defaultValue={profile.name} name="name" required />
        <input accept="image/png,image/jpeg,image/webp" name="profile_photo" type="file" />
        <button className="primary-button" type="submit">Atualizar</button>
      </form>
      {message && <p className="alert">{message}</p>}

      <h2>Histórico de palpites</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Jogo</th>
              <th>Palpite</th>
              <th>Resultado</th>
              <th>Pontos</th>
            </tr>
          </thead>
          <tbody>
            {profile.history.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="inline-match">
                    <TeamName name={item.team_a} />
                    <span>x</span>
                    <TeamName name={item.team_b} />
                  </div>
                </td>
                <td>{item.predicted_score_a} x {item.predicted_score_b}</td>
                <td>{item.official_score_a ?? '-'} x {item.official_score_b ?? '-'}</td>
                <td>{item.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
