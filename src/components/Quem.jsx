// Etiqueta com o nome de quem fez o registo (nada, se o registo não tiver nome).
const Quem = ({ nome }) => (nome ? <span className="quem-chip" data-quem={nome}>{nome}</span> : null);

export default Quem;
