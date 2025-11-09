import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService, User } from '../services/api';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User };

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  token: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        token: action.payload.token,
      };

    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
      };

    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };

    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Vérifier l'authentification au démarrage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          // Vérifier la validité du token
          const response = await authService.getProfile();
          if (response.success) {
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: {
                user: response.user,
                token,
              },
            });
          } else {
            // Token invalide
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            dispatch({ type: 'LOGIN_FAILURE' });
          }
        } catch (error) {
          // Erreur de vérification, token probablement invalide
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch({ type: 'LOGIN_FAILURE' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });

      if (response.success && response.token && response.user) {
        // Stocker le token et les infos utilisateur
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.user,
            token: response.token,
          },
        });

        return { success: true, message: response.message };
      } else {
        // Échec de connexion - NE PAS modifier l'état global
        return { 
          success: false, 
          message: response.message || 'Email ou mot de passe incorrect' 
        };
      }
    } catch (error: any) {
      // Erreur - NE PAS modifier l'état global
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur de connexion au serveur',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  const value: AuthContextType = {
    state,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
