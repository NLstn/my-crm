import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../../../components';
import { useIndustries } from '../../../contexts/IndustriesContext';
import './DefineIndustries.css';

export type DefineIndustriesProps = Record<string, never>;

export const DefineIndustries: FC<DefineIndustriesProps> = () => {
  const navigate = useNavigate();
  const { industries, addIndustry, updateIndustry, deleteIndustry } = useIndustries();
  const [newIndustryName, setNewIndustryName] = useState('');
  const [newIndustryDescription, setNewIndustryDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddIndustry = () => {
    if (newIndustryName.trim()) {
      const newIndustry = {
        id: Date.now().toString(),
        name: newIndustryName.trim(),
        description: newIndustryDescription.trim(),
      };
      addIndustry(newIndustry);
      setNewIndustryName('');
      setNewIndustryDescription('');
    }
  };

  const handleDeleteIndustry = (id: string) => {
    deleteIndustry(id);
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const handleEditIndustry = (id: string) => {
    setEditingId(editingId === id ? null : id);
  };

  const handleUpdateIndustry = (id: string, field: 'name' | 'description', value: string) => {
    updateIndustry(id, field, value);
  };

  const handleBackToSettings = () => {
    navigate('/settings');
  };

  return (
    <div className="define-industries">
      <div className="define-industries__header">
        <div className="define-industries__header-content">
          <div>
            <h1 className="define-industries__title">Define Industries</h1>
            <p className="define-industries__subtitle">
              Manage industry types for account classification
            </p>
          </div>
          <Button
            onClick={handleBackToSettings}
            variant="secondary"
          >
            Back to Settings
          </Button>
        </div>
      </div>

      <div className="define-industries__content">
        <div className="define-industries__add-section">
          <h2 className="define-industries__section-title">Add New Industry</h2>
          <div className="define-industries__form">
            <Input
              label="Industry Name"
              value={newIndustryName}
              onChange={(e) => setNewIndustryName(e.target.value)}
              placeholder="e.g., Technology, Healthcare"
            />
            <Input
              label="Description"
              value={newIndustryDescription}
              onChange={(e) => setNewIndustryDescription(e.target.value)}
              placeholder="Brief description of the industry"
            />
            <Button
              onClick={handleAddIndustry}
              disabled={!newIndustryName.trim()}
            >
              Add Industry
            </Button>
          </div>
        </div>

        <div className="define-industries__list-section">
          <h2 className="define-industries__section-title">
            Existing Industries ({industries.length})
          </h2>
          <div className="define-industries__list">
            {industries.length === 0 ? (
              <div className="define-industries__empty">
                No industries defined yet. Add your first industry above.
              </div>
            ) : (
              industries.map((industry) => (
                <div key={industry.id} className="industry-item">
                  {editingId === industry.id ? (
                    <div className="industry-item__edit-form">
                      <Input
                        label="Industry Name"
                        value={industry.name}
                        onChange={(e) => handleUpdateIndustry(industry.id, 'name', e.target.value)}
                      />
                      <Input
                        label="Description"
                        value={industry.description}
                        onChange={(e) => handleUpdateIndustry(industry.id, 'description', e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="industry-item__content">
                      <div className="industry-item__info">
                        <h3 className="industry-item__name">{industry.name}</h3>
                        <p className="industry-item__description">{industry.description}</p>
                      </div>
                    </div>
                  )}
                  <div className="industry-item__actions">
                    <Button
                      onClick={() => handleEditIndustry(industry.id)}
                      variant="secondary"
                      size="sm"
                    >
                      {editingId === industry.id ? 'Done' : 'Edit'}
                    </Button>
                    <Button
                      onClick={() => handleDeleteIndustry(industry.id)}
                      variant="danger"
                      size="sm"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
