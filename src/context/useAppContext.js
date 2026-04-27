import { useContext } from 'react';
import { AppContext } from './appContextCore';

export const useAppContext = () => useContext(AppContext);
