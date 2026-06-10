import { useEffect, useMemo, useState } from 'react';
import { Ban, Shield, Trash2, UserCheck } from 'lucide-react';
import { api } from '../api.js';
import { Avatar } from '../components/Avatar.jsx';

export function UsersAdminPage({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadUsers().catch((error) => setMessage(error.message));
  }, []);

  async function loadUsers() {
    const { users } = await api('/admin/users');
    setUsers(users);
  }

  async function updateUser(userId, patch) {
    try {
      await api(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: patch
      });
      setMessage('Usuario atualizado.');
      await loadUsers();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteUser(user) {
    if (!window.confirm(`Remover ${user.name}? Essa acao apaga tambem os palpites desse usuario.`)) {
      return;
    }

    try {
      await api(`/admin/users/${user.id}`, { method: 'DELETE' });
      setMessage('Usuario removido.');
      await loadUsers();
    } catch (error) {
      setMessage(error.message);
    }
  }

  const totals = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((user) => !user.blocked).length,
      admins: users.filter((user) => user.role === 'admin').length
    };
  }, [users]);

  return (
    <section className="page-section">
      <header className="page-header">
        <div>
          <h1>Usuarios</h1>
          <p>Gerencie acesso, bloqueios e perfil administrativo dos participantes.</p>
        </div>
      </header>

      {message && <p className="alert">{message}</p>}

      <div className="stats-grid user-admin-stats">
        <article className="metric">
          <span>Total</span>
          <strong>{totals.total}</strong>
        </article>
        <article className="metric">
          <span>Ativos</span>
          <strong>{totals.active}</strong>
        </article>
        <article className="metric">
          <span>Admins</span>
          <strong>{totals.admins}</strong>
        </article>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isCurrentUser = user.id === currentUser?.id;

              return (
                <tr key={user.id}>
                  <td>
                    <div className="person-cell">
                      <Avatar name={user.name} size={36} src={user.profile_photo} />
                      <strong>{user.name}</strong>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role === 'admin' ? 'Admin' : 'Usuario'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${user.blocked ? 'blocked' : 'active'}`}>
                      {user.blocked ? 'Bloqueado' : 'Ativo'}
                    </span>
                  </td>
                  <td className="button-row">
                    <button
                      disabled={isCurrentUser && !user.blocked}
                      onClick={() => updateUser(user.id, { blocked: !user.blocked })}
                      title={user.blocked ? 'Desbloquear usuario' : 'Bloquear usuario'}
                      type="button"
                    >
                      {user.blocked ? <UserCheck size={16} /> : <Ban size={16} />}
                      {user.blocked ? 'Desbloquear' : 'Bloquear'}
                    </button>
                    <button
                      disabled={isCurrentUser && user.role === 'admin'}
                      onClick={() => updateUser(user.id, { role: user.role === 'admin' ? 'user' : 'admin' })}
                      title={user.role === 'admin' ? 'Tornar usuario comum' : 'Tornar admin'}
                      type="button"
                    >
                      <Shield size={16} />
                      {user.role === 'admin' ? 'Tornar usuario' : 'Tornar admin'}
                    </button>
                    <button
                      className="danger-button"
                      disabled={isCurrentUser}
                      onClick={() => deleteUser(user)}
                      title="Remover usuario"
                      type="button"
                    >
                      <Trash2 size={16} />
                      Remover
                    </button>
                  </td>
                </tr>
              );
            })}
            {!users.length && (
              <tr>
                <td colSpan="5">Nenhum usuario cadastrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
