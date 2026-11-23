import { Component } from 'react';
import { esquecerErros } from '../services/paginas';

// Se uma página tiver um erro, o resto da app (cabeçalho e barra de baixo) continua a funcionar
// e aparece uma mensagem com botões, em vez de o ecrã ficar todo em branco.
class ErroPagina extends Component {
  constructor(props) {
    super(props);
    this.state = { erro: null, chave: props.chave };
  }

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  // Ao mudar de separador (chave diferente) o aviso de erro limpa-se sozinho. Não se usa key= para
  // não recriar a árvore: recriá-la faz a página anterior desaparecer em vez de ficar visível enquanto a nova carrega.
  static getDerivedStateFromProps(props, state) {
    if (props.chave !== state.chave) return { erro: null, chave: props.chave };
    return null;
  }

  componentDidCatch(erro) {
    console.error('Erro ao mostrar a página:', erro);
  }

  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <h2 className="h3" style={{ marginBottom: '0.5rem' }}>Não foi possível abrir esta página</h2>
        <p className="text-small" style={{ marginBottom: '1.25rem' }}>
          Experimenta outra vez, ou atualiza a app.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="btn-primary" onClick={() => {
              esquecerErros();
              this.setState({ erro: null });
            }}>
            Tentar outra vez
          </button>
          <button type="button" className="btn-outline" onClick={() => window.location.reload()}>
            Atualizar a app
          </button>
        </div>
      </div>
    );
  }
}

export default ErroPagina;
