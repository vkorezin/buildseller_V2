import React, { useState, useEffect } from 'react';

// Базовые константы по умолчанию
const defaultBuildingTypesConfig = {
  coeff12m: 1.15,
  coeff18m: 1.1,
  coeff24m: 1.01,
  height0m: 0.9,
  height7m: 1.1,
  purlinType4: 0.47,
  craneType2: 1.0137,
  type1Fastener: 0.2,
  type2Gk: 0.7
};

const BuildingTypesEditor = ({ onClose }) => {
  const [config, setConfig] = useState(defaultBuildingTypesConfig);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedConfig = localStorage.getItem('euroangar_building_types_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    setIsSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('euroangar_building_types_config', JSON.stringify(config));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleReset = () => {
    setConfig(defaultBuildingTypesConfig);
    setIsSaved(false);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '12px', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>⚙️ Настройки типов зданий (Константы)</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#7f8c8d' }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          
          {/* Блок 1: Облегчение по пролетам */}
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #3498db' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#2980b9' }}>1. Коэффициенты облегчения каркаса (ЛСТК)</h4>
            <p style={{ fontSize: '12px', color: '#666', margin: '0 0 15px 0' }}>На эти значения делится базовая масса черного металла (Тип 3), чтобы получить вес легкого оцинкованного каркаса (Тип 1). Промежуточные пролеты рассчитываются по интерполяции.</p>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Пролет ≤ 12 м</label>
                <input type="number" step="0.01" name="coeff12m" value={config.coeff12m} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Пролет 18 м</label>
                <input type="number" step="0.01" name="coeff18m" value={config.coeff18m} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Пролет ≥ 24 м</label>
                <input type="number" step="0.01" name="coeff24m" value={config.coeff24m} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
            </div>
          </div>

          {/* Блок 2: Поправка по высоте */}
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #e67e22' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#d35400' }}>2. Поправка утяжеления по высоте (ЛСТК)</h4>
            <p style={{ fontSize: '12px', color: '#666', margin: '0 0 15px 0' }}>Чем выше колонны из ЛСТК, тем они тяжелее из-за ветрового момента. Полученная масса Типа 1 умножается на этот коэффициент. Для зданий выше 7 метров берется максимальное значение.</p>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Множитель при высоте 0 м</label>
                <input type="number" step="0.01" name="height0m" value={config.height0m} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Множитель при высоте ≥ 7 м</label>
                <input type="number" step="0.01" name="height7m" value={config.height7m} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
            </div>
          </div>

          {/* Блок 3: Специфические константы */}
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #9b59b6' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#8e44ad' }}>3. Специфические константы типов</h4>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Утяжеление прогонов (Тип 4 - Полностью черный металл)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="number" step="0.01" name="purlinType4" value={config.purlinType4} onChange={handleChange} style={{ width: '120px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                <span style={{ fontSize: '12px', color: '#666' }}>Базовая масса оцинкованных прогонов делится на это число (0.47 = утяжеление в ~2.1 раза).</span>
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Влияние крана (Тип 2 - Комбинированный)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="number" step="0.04" name="craneType2" value={config.craneType2} onChange={handleChange} style={{ width: '120px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                <span style={{ fontSize: '12px', color: '#666' }}>При наличии опорного крана базовая масса Типа 3 делится на это число для получения массы Типа 2.</span>
              </div>
            </div>
          </div>

          {/* Блок 4: Пропорции материалов для цен */}
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #2ecc71' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#27ae60' }}>4. Распределение материалов (для расчета стоимости)</h4>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Доля фасонки в Типе 1 (Полностью ЛСТК)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="number" step="0.05" name="type1Fastener" value={config.type1Fastener} onChange={handleChange} style={{ width: '120px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                <span style={{ fontSize: '12px', color: '#666' }}>Значение 0.2 означает, что 20% массы каркаса считается по цене "Фасонки", а 80% — по цене "ЛСТК".</span>
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Доля черного металла в Типе 2 (Комбинированный)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="number" step="0.05" name="type2Gk" value={config.type2Gk} onChange={handleChange} style={{ width: '120px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                <span style={{ fontSize: '12px', color: '#666' }}>Значение 0.7 означает, что 70% массы считается по цене "ГК" (колонны), а 30% — по цене "ЛСТК" (кровля).</span>
              </div>
            </div>
          </div>

        </div>

        {/* Кнопки управления */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '25px', paddingTop: '15px', borderTop: '2px solid #eee' }}>
          <button onClick={handleReset} style={{ padding: '10px 15px', backgroundColor: '#fff', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Вернуть базовые
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {isSaved && <span style={{ color: '#27ae60', fontWeight: 'bold' }}>✓ Сохранено!</span>}
            <button onClick={handleSave} style={{ padding: '10px 25px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              Сохранить настройки
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BuildingTypesEditor;
