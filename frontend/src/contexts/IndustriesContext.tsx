import { createContext, useContext, useState, ReactNode, FC } from 'react';

export interface Industry {
  id: string;
  name: string;
  description: string;
}

const defaultIndustries: Industry[] = [
  { id: '1', name: 'Technology', description: 'Software, hardware, and IT services' },
  { id: '2', name: 'Manufacturing', description: 'Production and industrial goods' },
  { id: '3', name: 'Healthcare', description: 'Medical services and pharmaceuticals' },
  { id: '4', name: 'Finance', description: 'Banking, insurance, and financial services' },
  { id: '5', name: 'Retail', description: 'Consumer goods and retail sales' },
];

interface IndustriesContextType {
  industries: Industry[];
  setIndustries: (industries: Industry[]) => void;
  addIndustry: (industry: Industry) => void;
  updateIndustry: (id: string, field: 'name' | 'description', value: string) => void;
  deleteIndustry: (id: string) => void;
}

const IndustriesContext = createContext<IndustriesContextType | undefined>(undefined);

export const useIndustries = () => {
  const context = useContext(IndustriesContext);
  if (!context) {
    throw new Error('useIndustries must be used within IndustriesProvider');
  }
  return context;
};

interface IndustriesProviderProps {
  children: ReactNode;
}

export const IndustriesProvider: FC<IndustriesProviderProps> = ({ children }) => {
  const [industries, setIndustries] = useState<Industry[]>(defaultIndustries);

  const addIndustry = (industry: Industry) => {
    setIndustries([...industries, industry]);
  };

  const updateIndustry = (id: string, field: 'name' | 'description', value: string) => {
    setIndustries(industries.map(industry =>
      industry.id === id ? { ...industry, [field]: value } : industry
    ));
  };

  const deleteIndustry = (id: string) => {
    setIndustries(industries.filter(industry => industry.id !== id));
  };

  return (
    <IndustriesContext.Provider
      value={{
        industries,
        setIndustries,
        addIndustry,
        updateIndustry,
        deleteIndustry,
      }}
    >
      {children}
    </IndustriesContext.Provider>
  );
};
