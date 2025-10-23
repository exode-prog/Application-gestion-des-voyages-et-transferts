import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Instance Axios avec configuration de base
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et erreurs
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'superviseur' | 'admin_bank';
  isActive: boolean;
  createdAt: string;
}

export interface DocumentFile {
  _id: string;
  nomOriginal: string;
  nomFichier: string;
  chemin: string;
  taille: number;
  typeFile: string;
  extension: string;
  dateUpload: string;
}

export interface Document {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  motif: string;
  dateDebut: string;
  dateFin: string;
  fichiers: DocumentFile[];
  dossierClient: string;
  sousDossierDate: string;
  statut: 'en_attente' | 'traite' | 'archive';
  createdAt: string;
  updatedAt: string;
}

export interface DocumentsResponse {
  success: boolean;
  documents: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface Statistics {
  totalDocuments: number;
  documentsEnAttente: number;
  documentsTraites: number;
  documentsArchives: number;
  extensionsStats: Array<{ _id: string; count: number }>;
  documentsRecents: Array<{
    _id: string;
    nom: string;
    prenom: string;
    email: string;
    createdAt: string;
    statut: string;
  }>;
}

// Services d'API
export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  getProfile: async (): Promise<{ success: boolean; user: User }> => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

export const documentService = {
  // Soumettre un document voyage
  submit: async (formData: FormData): Promise<ApiResponse<{ 
    reference: string;
    document: {
      _id: string;
      reference: string;
      nom: string;
      prenom: string;
      email: string;
      statut: string;
      typeDocument: string;
      nombreFichiers: number;
      tailleTotale: number;
      nombreSousDossiers: number;
    }
  }>> => {
    const response = await api.post('/api/documents/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Soumettre un document transfert
  submitTransfert: async (formData: FormData): Promise<ApiResponse<{ 
    reference: string;
    document: {
      _id: string;
      reference: string;
      nom: string;
      prenom: string;
      email: string;
      statut: string;
      typeDocument: string;
      nombreFichiers: number;
      tailleTotale: number;
    }
  }>> => {
    const response = await api.post('/api/documents/submit-transfert', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Récupérer tous les documents (admin)
  getAll: async (params?: {
    page?: number;
    limit?: number;
    statut?: string;
    extension?: string;
    dateDebut?: string;
    dateFin?: string;
    email?: string;
  }): Promise<DocumentsResponse> => {
    const response = await api.get('/api/documents', { params });
    return response.data;
  },

  // Récupérer un document par ID
  getById: async (id: string): Promise<{ success: boolean; document: Document }> => {
    const response = await api.get(`/api/documents/${id}`);
    return response.data;
  },

  // Mettre à jour un document
  update: async (
    id: string,
    data: {
      statut?: string;
      motif?: string;
      dateDebut?: string;
      dateFin?: string;
    }
  ): Promise<ApiResponse<Document>> => {
    const response = await api.put(`/api/documents/${id}`, data);
    return response.data;
  },

  // Supprimer un document
  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/api/documents/${id}`);
    return response.data;
  },

  // Télécharger un fichier
  downloadFile: async (documentId: string, fileId: string): Promise<void> => {
    const response = await api.get(
      `/api/documents/${documentId}/files/${fileId}/download`,
      {
        responseType: 'blob',
      }
    );

    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Extraire le nom de fichier des headers
    const contentDisposition = response.headers['content-disposition'];
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : 'fichier';
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Récupérer les statistiques
  getStats: async (): Promise<{ success: boolean; statistiques: Statistics }> => {
    const response = await api.get('/api/documents/stats');
    return response.data;
  },
};

export const userService = {
  // Récupérer tous les utilisateurs
  getAll: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    users: User[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> => {
    const response = await api.get('/api/users', { params });
    return response.data;
  },

  // Créer un utilisateur
  create: async (userData: {
    username: string;
    email: string;
    password: string;
    role?: 'superviseur' | 'admin_bank';
  }): Promise<ApiResponse<User>> => {
    const response = await api.post('/api/users', userData);
    return response.data;
  },

  // Récupérer un utilisateur par ID
  getById: async (id: string): Promise<{ success: boolean; user: User }> => {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },

  // Mettre à jour un utilisateur
  update: async (
    id: string,
    userData: {
      username?: string;
      email?: string;
      role?: 'superviseur' | 'admin_bank';
      isActive?: boolean;
    }
  ): Promise<ApiResponse<User>> => {
    const response = await api.put(`/api/users/${id}`, userData);
    return response.data;
  },

  // Supprimer un utilisateur
  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/api/users/${id}`);
    return response.data;
  },

  // Changer le mot de passe
  changePassword: async (
    id: string,
    newPassword: string
  ): Promise<ApiResponse<null>> => {
    const response = await api.post(`/api/users/${id}/change-password`, {
      newPassword,
    });
    return response.data;
  },
};

export default api;
