import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="center-screen">
          <section className="auth-panel">
            <h1>Erro ao carregar a tela</h1>
            <p className="alert error">{this.state.error.message || 'Erro inesperado no frontend.'}</p>
            <button
              className="primary-button"
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              type="button"
            >
              Limpar sessão e recarregar
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
