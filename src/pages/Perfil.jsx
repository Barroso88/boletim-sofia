import { useState, useEffect } from 'react';
import { Save, UserCircle, Calendar, MapPin, Users, Hash, Droplet, FileText } from 'lucide-react';
import { api } from '../services/api';
import './Perfil.css';

const Perfil = () => {
  const [perfil, setPerfil] = useState({
    nome_completo: '',
    data_nascimento: '',
    morada: '',
    nome_pai: '',
    nome_mae: '',
    local_nascimento: '',
    peso_nascimento: '',
    altura_nascimento: '',
    grupo_sanguineo: '',
    notas: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    api.getPerfil().then(data => {
      if (data) {
        setPerfil(data);
      }
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPerfil(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    try {
      await api.savePerfil(perfil);
      setSaveMessage('Perfil guardado com sucesso!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveMessage('Erro ao guardar o perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-container perfil-page">
      <div className="flex-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="h2 text-gradient">Perfil da Sofia</h2>
          <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', marginTop: '2px' }}>
            Informações pessoais e de nascimento
          </p>
        </div>
        <button className="btn-primary doc-add-btn" onClick={handleSave} disabled={isSaving}>
          <Save size={18} />
          <span>{isSaving ? 'A Guardar...' : 'Guardar Perfil'}</span>
        </button>
      </div>

      {saveMessage && (
        <div className={`save-message ${saveMessage.includes('Erro') ? 'error' : 'success'}`}>
          {saveMessage}
        </div>
      )}

      <form className="perfil-form glass-card" onSubmit={handleSave}>
        <div className="form-grid">
          
          <div className="form-group full-width">
            <label><UserCircle size={16} /> Nome Completo</label>
            <input 
              type="text" 
              name="nome_completo" 
              value={perfil.nome_completo} 
              onChange={handleChange} 
              placeholder="Ex: Sofia Morais Barroso" 
            />
          </div>

          <div className="form-group">
            <label><Calendar size={16} /> Data de Nascimento</label>
            <input 
              type="date" 
              name="data_nascimento" 
              value={perfil.data_nascimento} 
              onChange={handleChange} 
            />
          </div>

          <div className="form-group">
            <label><MapPin size={16} /> Local de Nascimento</label>
            <input 
              type="text" 
              name="local_nascimento" 
              value={perfil.local_nascimento} 
              onChange={handleChange} 
              placeholder="Ex: Maternidade Alfredo da Costa" 
            />
          </div>

          <div className="form-group">
            <label><Users size={16} /> Nome da Mãe</label>
            <input 
              type="text" 
              name="nome_mae" 
              value={perfil.nome_mae} 
              onChange={handleChange} 
              placeholder="Nome da mãe" 
            />
          </div>

          <div className="form-group">
            <label><Users size={16} /> Nome do Pai</label>
            <input 
              type="text" 
              name="nome_pai" 
              value={perfil.nome_pai} 
              onChange={handleChange} 
              placeholder="Nome do pai" 
            />
          </div>

          <div className="form-group full-width">
            <label><MapPin size={16} /> Morada</label>
            <input 
              type="text" 
              name="morada" 
              value={perfil.morada} 
              onChange={handleChange} 
              placeholder="Morada completa" 
            />
          </div>

          <div className="form-group">
            <label><Hash size={16} /> Peso à Nascença</label>
            <input 
              type="text" 
              name="peso_nascimento" 
              value={perfil.peso_nascimento} 
              onChange={handleChange} 
              placeholder="Ex: 3.250 kg" 
            />
          </div>

          <div className="form-group">
            <label><Hash size={16} /> Altura à Nascença</label>
            <input 
              type="text" 
              name="altura_nascimento" 
              value={perfil.altura_nascimento} 
              onChange={handleChange} 
              placeholder="Ex: 50 cm" 
            />
          </div>

          <div className="form-group">
            <label><Droplet size={16} /> Grupo Sanguíneo</label>
            <input 
              type="text" 
              name="grupo_sanguineo" 
              value={perfil.grupo_sanguineo} 
              onChange={handleChange} 
              placeholder="Ex: O+" 
            />
          </div>

          <div className="form-group full-width">
            <label><FileText size={16} /> Notas Adicionais</label>
            <textarea 
              name="notas" 
              value={perfil.notas} 
              onChange={handleChange} 
              placeholder="Outras informações relevantes..."
              rows="4"
            />
          </div>

        </div>
      </form>
    </div>
  );
};

export default Perfil;
