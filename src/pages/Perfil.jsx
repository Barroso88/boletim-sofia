import { useState, useEffect } from 'react';
import { Save, UserCircle, Calendar, MapPin, Users, Hash, Droplet, FileText, Edit3, Map } from 'lucide-react';
import { api } from '../services/api';
import './Perfil.css';

const Perfil = () => {
  const [perfil, setPerfil] = useState({
    nome_completo: '',
    data_nascimento: '',
    data_provavel_parto: '',
    morada: '',
    codigo_postal: '',
    cidade: '',
    nome_pai: '',
    nome_mae: '',
    local_nascimento: '',
    peso_nascimento: '',
    altura_nascimento: '',
    grupo_sanguineo: '',
    notas: ''
  });
  const [isEditing, setIsEditing] = useState(false);
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
    
    // Postal code validation/formatting (1111-111)
    if (name === 'codigo_postal') {
      let val = value.replace(/\D/g, ''); // keep only numbers
      if (val.length > 4) {
        val = val.substring(0, 4) + '-' + val.substring(4, 7);
      }
      setPerfil(prev => ({ ...prev, [name]: val }));
    } else {
      setPerfil(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    try {
      await api.savePerfil(perfil);
      setSaveMessage('Perfil guardado com sucesso!');
      setIsEditing(false); // Switch to read-only after saving
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveMessage('Erro ao guardar o perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const renderField = (icon, label, name, type = "text", placeholder, isFullWidth = false, isTextarea = false) => {
    const value = perfil[name];

    if (!isEditing) {
      return (
        <div className={`form-group read-only-group ${isFullWidth ? 'full-width' : ''}`}>
          <label>{icon} {label}</label>
          <div className="read-only-value">
            {value ? value : <span className="empty-val">Não preenchido</span>}
          </div>
        </div>
      );
    }

    return (
      <div className={`form-group ${isFullWidth ? 'full-width' : ''}`}>
        <label>{icon} {label}</label>
        {isTextarea ? (
          <textarea 
            name={name} 
            value={value} 
            onChange={handleChange} 
            placeholder={placeholder}
            rows="4"
          />
        ) : (
          <input 
            type={type} 
            name={name} 
            value={value} 
            onChange={handleChange} 
            placeholder={placeholder} 
            maxLength={name === 'codigo_postal' ? 8 : undefined}
          />
        )}
      </div>
    );
  };

  return (
    <div className="page-container perfil-page">
      <div className="flex-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="h2 text-gradient">Perfil da Sofia</h2>
          <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', marginTop: '2px' }}>
            {isEditing ? 'A editar informações...' : 'Informações pessoais e de nascimento'}
          </p>
        </div>
        
        {isEditing ? (
          <button className="btn-primary doc-add-btn" onClick={handleSave} disabled={isSaving}>
            <Save size={18} />
            <span>{isSaving ? 'A Guardar...' : 'Guardar Perfil'}</span>
          </button>
        ) : (
          <button className="btn-primary doc-add-btn" onClick={toggleEdit}>
            <Edit3 size={18} />
            <span>Editar Perfil</span>
          </button>
        )}
      </div>

      {saveMessage && (
        <div className={`save-message ${saveMessage.includes('Erro') ? 'error' : 'success'}`}>
          {saveMessage}
        </div>
      )}

      <form className="perfil-form glass-card" onSubmit={handleSave}>
        <div className="form-grid">
          
          {renderField(<UserCircle size={16} />, "Nome Completo", "nome_completo", "text", "Ex: Sofia Morais Barroso", true)}
          {renderField(<Calendar size={16} />, "Data de Nascimento", "data_nascimento", "date", "")}
          {renderField(<Calendar size={16} />, "Data Provável de Parto (DPP)", "data_provavel_parto", "date", "")}
          {renderField(<MapPin size={16} />, "Local de Nascimento", "local_nascimento", "text", "Ex: Maternidade Alfredo da Costa")}
          
          {renderField(<Users size={16} />, "Nome da Mãe", "nome_mae", "text", "Nome da mãe")}
          {renderField(<Users size={16} />, "Nome do Pai", "nome_pai", "text", "Nome do pai")}
          
          {renderField(<MapPin size={16} />, "Morada", "morada", "text", "Morada completa", true)}
          {renderField(<Map size={16} />, "Código Postal", "codigo_postal", "text", "1111-111")}
          {renderField(<MapPin size={16} />, "Cidade", "cidade", "text", "Ex: Lisboa")}
          
          {renderField(<Hash size={16} />, "Peso à Nascença", "peso_nascimento", "text", "Ex: 3.250 kg")}
          {renderField(<Hash size={16} />, "Altura à Nascença", "altura_nascimento", "text", "Ex: 50 cm")}
          {renderField(<Droplet size={16} />, "Grupo Sanguíneo", "grupo_sanguineo", "text", "Ex: O+")}
          
          {renderField(<FileText size={16} />, "Notas Adicionais", "notas", "text", "Outras informações relevantes...", true, true)}

        </div>
      </form>
    </div>
  );
};

export default Perfil;
