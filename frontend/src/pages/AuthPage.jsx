import { useState } from 'react';
import { api } from '../api.js';
import officeCopaLogo from '../../images/logoOfficeCopa.png';


export function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(event.currentTarget);

    try {
      const session =
        mode === 'login'
          ? await api('/auth/login', {
              method: 'POST',
              body: {
                email: form.get('email'),
                password: form.get('password')
              }
            })
          : await api('/auth/register', {
              method: 'POST',
              body: form
            });

      onAuthenticated(session);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-panel">
        <div className="brand compact">
          <img src={officeCopaLogo} alt="Logo da Office Copa" width="116" height="116" />
        </div>

        <div className="segmented">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')} type="button">
            Login
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')} type="button">
            Cadastro
          </button>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label>
              Nome completo
              <input name="name" required />
            </label>
          )}

          <label>
            E-mail corporativo
            <input autoComplete="email" name="email" required type="email" />
          </label>

          <label>
            Senha
            <input autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} name="password" required type="password" />
          </label>

          {mode === 'register' && (
            <label>
              Foto de perfil
              <input accept="image/png,image/jpeg,image/webp" name="profile_photo" type="file" />
            </label>
          )}

          {error && <p className="alert error">{error}</p>}

          <button className="primary-button" disabled={loading} type="submit">
            {loading ? 'Enviando...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </section>
    </main>
  );
}
