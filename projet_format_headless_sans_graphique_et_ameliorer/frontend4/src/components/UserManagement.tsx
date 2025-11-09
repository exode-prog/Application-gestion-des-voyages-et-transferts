import React, { useState, useEffect } from 'react';
const API_URL = process.env.REACT_APP_API_URL || 'http://172.237.112.125/:5000';

// Types
interface User {
  id: string;
  username: string;
  email: string;
  role: 'superviseur' | 'admin_bank' | 'super_admin' | 'agent_saisie' | 'auditeur' | 'conformité';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface UserFormData {
  username: string;
  email: string;
  password: string;
  role: 'superviseur' | 'admin_bank'| 'super_admin' | 'agent_saisie' | 'auditeur' | 'conformité';

}

// Service API pour les utilisateurs avec gestion d'erreurs
const userService = {
  getAll: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token manquant');
      }
      
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur API getAll:', error);
      throw error;
    }
  },
  
  create: async (userData: UserFormData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur API create:', error);
      throw error;
    }
  },
  
  update: async (id: string, userData: Partial<User>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur API update:', error);
      throw error;
    }
  },
  
  delete: async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur API delete:', error);
      throw error;
    }
  }
};

interface UserManagementProps {
  currentUser: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    role: 'superviseur'
  });

  // Charger les utilisateurs
  


// ✅ AJOUTER après loadUsers (ligne 157)
const loadUsers = async () => {
  try {
    setLoading(true);
    setError('');
    const response = await userService.getAll();
    if (response.success) {
      let filteredUsers = response.users || [];
      
      // ✅ NOUVEAU - Filtrage selon le rôle
      if (currentUser.role === 'super_admin') {
        filteredUsers = filteredUsers.filter((u: User) => 
          u.role === 'admin_bank' || u.role === 'super_admin'
        );
      } else if (currentUser.role === 'admin_bank') {
        filteredUsers = filteredUsers.filter((u: User) => 
          u.role !== 'super_admin' && u.role !== 'admin_bank'
        );
      }
      
      setUsers(filteredUsers);
    } else {
      setError(response.message || 'Erreur lors du chargement');
    }
  } catch (error: any) {
    console.error('Erreur chargement utilisateurs:', error);
    setError('Impossible de charger les utilisateurs. Vérifiez votre connexion.');
    setUsers([]);
  } finally {
    setLoading(false);
  }
};



  useEffect(() => {
    loadUsers();
  }, []);

  // Handlers
  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
    setShowProfileModal(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await userService.create(formData);
      if (response.success) {
        setShowCreateModal(false);
        
	setFormData({ 
  username: '', 
  email: '', 
  password: '', 
  role: currentUser.role === 'super_admin' ? 'admin_bank' : 'superviseur' 
});
        loadUsers();
      } else {
        setError(response.message || 'Erreur lors de la création');
      }
    } catch (error: any) {
      setError('Erreur lors de la création de l\'utilisateur');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    try {
      const { password, ...updateData } = formData;
      const response = await userService.update(selectedUser.id, updateData);
      if (response.success) {
        setShowEditModal(false);
        loadUsers();
      } else {
        setError(response.message || 'Erreur lors de la modification');
      }
    } catch (error: any) {
      setError('Erreur lors de la modification de l\'utilisateur');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      const response = await userService.delete(userToDelete.id);
      if (response.success) {
        setShowDeleteModal(false);
        setUserToDelete(null);
        loadUsers();
      } else {
        setError(response.message || 'Erreur lors de la suppression');
      }
    } catch (error: any) {
      setError('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

 
const getRoleBadge = (role: string) => {
  const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
  switch(role) {
    case 'admin_bank':
      return `${baseClasses} bg-purple-100 text-purple-800`;
    case 'super_admin':
      return `${baseClasses} bg-red-100 text-red-800`;
    case 'agent_saisie':
      return `${baseClasses} bg-green-100 text-green-800`;
    case 'auditeur':
      return `${baseClasses} bg-orange-100 text-orange-800`;
    case 'conformité':
      return `${baseClasses} bg-pink-100 text-pink-800`;
    default:
      return `${baseClasses} bg-blue-100 text-blue-800`;
  }
};

  const getStatusBadge = (isActive: boolean) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    return isActive 
      ? `${baseClasses} bg-green-100 text-green-800`
      : `${baseClasses} bg-red-100 text-red-800`;
  };

  const resetModals = () => {
    setShowProfileModal(false);
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedUser(null);
    setUserToDelete(null);
    setError('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Gestion des utilisateurs</h2>
            <p className="text-sm text-gray-600 mt-1">{users.length} utilisateur{users.length > 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nouvel utilisateur
          </button>
        </div>
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Tableau des utilisateurs */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rôle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Créé le
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <p className="text-gray-500">Aucun utilisateur trouvé</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr 
                  key={user.id} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleViewProfile(user)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500">ID: {user.id ? user.id.substring(0, 8) : 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getRoleBadge(user.role)}>
                      	{user.role === 'admin_bank'  ? 'Administrateur de la banque':
			 user.role === 'super_admin'  ? 'Super Administrateur'  : 
			 user.role === 'auditeur'  ? 'Auditeur'  :
	                 user.role === 'conformité'  ? 'Agent de conformité'   :
		         user.role === 'agent_saisie'  ? 'Agent de saisie'  : 'Superviseur'}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(user.isActive)}>
                      {user.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(user);
                        }}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Modifier"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      
                      {user.id !== currentUser.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(user);
                          }}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Supprimer"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Profil Utilisateur */}
      {showProfileModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Profil utilisateur</h3>
              <button
                onClick={resetModals}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                  {selectedUser.username.charAt(0).toUpperCase()}
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-gray-900">{selectedUser.username}</h4>
                  <p className="text-gray-600">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Rôle</label>
                  <div className="mt-1">
            

 

<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-300 hover:scale-105 ${
  selectedUser.role === 'admin_bank' ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' :
  selectedUser.role === 'super_admin' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
  selectedUser.role === 'agent_saisie' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
  selectedUser.role === 'auditeur' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
  selectedUser.role === 'conformité' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' :
  'bg-blue-100 text-blue-800 hover:bg-blue-200'
}`}>
  {selectedUser.role === 'admin_bank' ? 'Administrateur de la banque' :
   selectedUser.role === 'super_admin' ? 'Super Admin' :
   selectedUser.role === 'agent_saisie' ? 'Agent de Saisie' :
   selectedUser.role === 'auditeur' ? 'Auditeur' :
   selectedUser.role === 'conformité' ? 'Conformité' :
   'Superviseur'}
</span>

                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Statut</label>
                  <div className="mt-1">
                    <span className={getStatusBadge(selectedUser.isActive)}>
                      {selectedUser.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Créé le</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedUser.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">
                    {selectedUser.id ? selectedUser.id.substring(0, 8) + '...' : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={resetModals}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  openEditModal(selectedUser);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Création */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Créer un utilisateur</h3>
              <button
                onClick={resetModals}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom d'utilisateur</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Rôle</label>
                
		<select
  value={formData.role}
  onChange={(e) => setFormData({...formData, role: e.target.value as any})}
  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
>
  {currentUser.role === 'super_admin' ? (
    <>
      <option value="admin_bank">Administrateur de la banque</option>
      <option value="super_admin">Super Admin</option>
    </>
  ) : (
    <>
      <option value="superviseur">Superviseur</option>
      <option value="agent_saisie">Agent de Saisie</option>
      <option value="auditeur">Auditeur</option>
      <option value="conformité">Conformité</option>
    </>
  )}
</select>


              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetModals}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Modification */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Modifier l'utilisateur</h3>
              <button
                onClick={resetModals}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom d'utilisateur</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Rôle</label>
               
 <select
  value={formData.role}
  onChange={(e) => setFormData({...formData, role: e.target.value as any})}
  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
  disabled={selectedUser.id === currentUser.id}
>
  {currentUser.role === 'super_admin' ? (
    <>
      <option value="super_admin">Super Admin</option>
      <option value="admin_bank">Administrateur de la banque</option>
    </>
  ) : (
    <>
      <option value="superviseur">Superviseur</option>
      <option value="agent_saisie">Agent de Saisie</option>
      <option value="auditeur">Auditeur</option>
      <option value="conformité">Conformité</option>
    </>
  )}
</select>


              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetModals}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Modifier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Supprimer l'utilisateur</h3>
              <button
                onClick={resetModals}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">Attention!</h4>
                  <p className="text-sm text-gray-600">Cette action est définitive.</p>
                </div>
              </div>
              
              <p className="text-gray-600">
                Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{userToDelete.username}</strong> ?
              </p>
              <p className="text-sm text-red-600 mt-2">
                Cette action est irréversible et supprimera toutes les données associées.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={resetModals}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
