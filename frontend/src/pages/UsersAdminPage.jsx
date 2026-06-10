import { useEffect, useMemo, useState } from 'react';
import { Ban, Pencil, Save, Shield, Trash2, UserCheck, UserPlus, X } from 'lucide-react';
import { api } from '../api.js';
import { Avatar } from '../components/Avatar.jsx';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'user',
  blocked: false
};

export function UsersAdminPage({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadUsers().catch((error) => setMessage(error.message));
  }, []);

  async function loadUsers() {
    const { users } = await api('/admin/users');
    setUsers(users);
  }

  async function saveUser(event) {
    event.preventDefault();

    const payload = {
      name: form.name,
      email: form.email,
      role: form.role,
      blocked: form.blocked
    };

    if (form.password) {
      payload.password = form.password;
    }

    try {
      if (editingUser) {
        await api(`/admin/users/${editingUser.id}`, {
          method: 'PATCH',
          body: payload
        });
        setMessage('Usuario atualizado.');
      } else {
        await api('/admin/users', {
          method: 'POST',
          body: { ...payload, password: form.password }
        });
        setMessage('Usuario criado.');
      }

      resetForm();
      await loadUsers();
    } catch (error) {
      setMessage(error.message);
    }
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

  function startCreate() {
    setEditingUser(null);
    setForm(emptyForm);
    setMessage('');
  }

  function startEdit(user) {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      blocked: Boolean(user.blocked)
    });
    setMessage('');
  }

  function resetForm() {
    setEditingUser(null);
    setForm(emptyForm);
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
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
        <div className="admin-actions">
          <button onClick={startCreate} type="button">
            <UserPlus size={16} />
            Novo usuario
          </button>
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

      <form className="admin-panel form-grid user-crud-form" onSubmit={saveUser}>
        <div className="panel-heading">
          <h2>{editingUser ? 'Editar usuario' : 'Criar usuario'}</h2>
          {editingUser && (
            <button onClick={resetForm} title="Cancelar edicao" type="button">
              <X size={16} />
              Cancelar
            </button>
          )}
        </div>
        <div className="form-row">
          <label>
            Nome
            <input required value={form.name} onChange={(event) => updateField('name', event.target.value)} />
          </label>
          <label>
            E-mail
            <input required type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} />
          </label>
        </div>
        <div className="form-row user-form-controls">
          <label>
            Senha
            <input
              minLength={8}
              placeholder={editingUser ? 'Deixe vazio para manter' : ''}
              required={!editingUser}
              type="password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
            />
          </label>
          <label>
            Perfil
            <select value={form.role} onChange={(event) => updateField('role', event.target.value)}>
              <option value="user">Usuario</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="check-filter user-blocked-field">
            <input checked={form.blocked} type="checkbox" onChange={(event) => updateField('blocked', event.target.checked)} />
            Bloqueado
          </label>
        </div>
        <div className="button-row">
          <button className="primary-button" type="submit">
            {editingUser ? <Save size={16} /> : <UserPlus size={16} />}
            {editingUser ? 'Salvar usuario' : 'Criar usuario'}
          </button>
          {editingUser && (
            <button onClick={resetForm} type="button">
              <X size={16} />
              Cancelar
            </button>
          )}
        </div>
      </form>

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
                    <button onClick={() => startEdit(user)} title="Editar usuario" type="button">
                      <Pencil size={16} />
                      Editar
                    </button>
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
