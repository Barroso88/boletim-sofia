import { useState, useEffect } from 'react';
import { Syringe, CheckCircle, Circle } from 'lucide-react';
import { api } from '../services/api';
import './Vacinas.css';

const defaultVacinas = [
  { id: 1, nome: 'Vacina contra a Difteria', dataRecomendada: '13 set 2026 a 13 out 2026', tomada: false, grupo: '2 Meses' },
  { id: 2, nome: 'Vacina contra a Hepatite B', dataRecomendada: '13 set 2026 a 13 out 2026', tomada: false, grupo: '2 Meses' },
  { id: 3, nome: 'Vacina contra a Poliomielite', dataRecomendada: '13 set 2026 a 13 out 2026', tomada: false, grupo: '2 Meses' },
  { id: 4, nome: 'Vacina contra a Tosse Convulsa, componente acelular', dataRecomendada: '13 set 2026 a 13 out 2026', tomada: false, grupo: '2 Meses' },
  { id: 5, nome: 'Vacina contra o Haemophilus influenzae tipo B', dataRecomendada: '13 set 2026 a 13 out 2026', tomada: false, grupo: '2 Meses' },
  { id: 6, nome: 'Vacina contra o meningococo do grupo B', dataRecomendada: '13 set 2026 a 13 out 2026', tomada: false, grupo: '2 Meses' },
  { id: 7, nome: 'Vacina contra o Tétano', dataRecomendada: '13 set 2026 a 13 out 2026', tomada: false, grupo: '2 Meses' },
  { id: 8, nome: 'Vacina pneumocócica conjugada de 20 componentes', dataRecomendada: '13 set 2026 a 13 out 2026', tomada: false, grupo: '2 Meses' },
  { id: 9, nome: 'Vacina viva contra o Sarampo', dataRecomendada: '13 jul 2027 a 13 ago 2027', tomada: false, grupo: '12 Meses' },
  { id: 10, nome: 'Vacina viva contra a Rubéola', dataRecomendada: '13 jul 2027 a 13 jul 2028', tomada: false, grupo: '12 Meses' },
];

const Vacinas = () => {
  const [vacinas, setVacinas] = useState([]);

  useEffect(() => {
    api.getVacinas(defaultVacinas).then(data => setVacinas(data));
  }, []);

  const toggleTomada = (id) => {
    const novaLista = vacinas.map(v => 
      v.id === id ? { ...v, tomada: !v.tomada } : v
    );
    setVacinas(novaLista);
    api.toggleVacina(id, novaLista);
  };

  // Group by 'grupo'
  const groupedVacinas = vacinas.reduce((acc, vacina) => {
    if (!acc[vacina.grupo]) {
      acc[vacina.grupo] = [];
    }
    acc[vacina.grupo].push(vacina);
    return acc;
  }, {});

  return (
    <div className="page-container">
      <div className="flex-between mb-4">
        <h2 className="h2 text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Syringe size={32} color="var(--color-primary)" /> Plano de Vacinação
        </h2>
      </div>

      <div className="vacinas-container">
        {Object.entries(groupedVacinas).map(([grupo, lista], index) => (
          <div key={grupo} className="vacina-group animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <h3 className="grupo-title">{grupo}</h3>
            
            <div className="vacinas-list">
              {lista.map(vacina => (
                <div 
                  key={vacina.id} 
                  className={`vacina-card glass-card ${vacina.tomada ? 'tomada' : ''}`}
                  onClick={() => toggleTomada(vacina.id)}
                >
                  <div className="vacina-status">
                    {vacina.tomada ? (
                      <CheckCircle size={28} className="icon-check" />
                    ) : (
                      <Circle size={28} className="icon-circle" />
                    )}
                  </div>
                  
                  <div className="vacina-info">
                    <h4 className="vacina-nome">{vacina.nome}</h4>
                    <span className="vacina-data">Data recomendada: {vacina.dataRecomendada}</span>
                  </div>
                  
                  <div className="vacina-badge">
                    {vacina.tomada ? (
                      <span className="badge-concluida">Concluída</span>
                    ) : (
                      <span className="badge-proxima">Próxima</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Vacinas;
