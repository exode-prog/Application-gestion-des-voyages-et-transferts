import React, { useState, useEffect } from 'react';
import FormulaireClientModal from './FormulaireClientModal';
interface Fichier {
  _id: string;
  nom: string;
  nomOriginal: string;
  taille: number;
  extension: string;
  chemin: string;
}

interface SousDossier {
  _id?: string;
  nom: string;
  date: string;
  fichiers: Fichier[];
  motif?: string;
  pays?: string | string[];
  raison?: string;
  autreRaison?: string;
  typeTransfert?: string;
  dateDebut?: string;
  dateFin?: string;
}

interface DossierClient {
  reference: string;  // ✅ NOUVEAU : Format JJMMAAAA-ID
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  profession: string;  // ✅ NOUVEAU
  sexe: string;  // ✅ NOUVEAU : 'H' ou 'F'
  
  // Champs spécifiques voyage
  pays?: string | string[];  // ✅ NOUVEAU (si type voyage)
  raison?: string;  // ✅ NOUVEAU (si type voyage)
  autreRaison?: string;  // ✅ NOUVEAU (si raison = 'autres')
  
  // Champs spécifiques transfert (dans documents aussi maintenant)
  typeTransfert?: string;  // ✅ NOUVEAU (si type transfert)
  
  typeDocument: 'voyage' | 'transfert';  // ✅ NOUVEAU : distinguer les types
  motif?: string;  // Ancien champ maintenu pour compatibilité
  
  sousDossiers: SousDossier[];
  statut: 'en_attente' | 'partiellement_apuré' | 'apuré' | 'archivé' | 'rejeté';
  dateCreation: string;
  dateDebut: string;  // ✅ NOUVEAU
  dateFin: string;  // ✅ NOUVEAU
  motifRejet?: string;
}

interface DossierTransfert {
  reference: string;  // Format: JJMMAAAA-ID
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  typeTransfert: string;
  profession: string;
  sexe: string;
  dateDebut: string;
  dateFin: string;
  fichiers: Fichier[];
  statut: 'en_attente' | 'partiellement_apuré' | 'apuré' | 'archivé' | 'rejeté';
  dateCreation: string;
  motifRejet?: string;
}


interface User {
  _id: string;
  username: string;
  email: string;
  role: 'superviseur' | 'admin_bank' | 'super_admin' | 'agent_saisie' | 'auditeur' | 'conformité';
  isActive: boolean;
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'documents' | 'transferts' | 'users'>('documents');
  const [dossiers, setDossiers] = useState<DossierClient[]>([]);
  const [filteredDossiers, setFilteredDossiers] = useState<DossierClient[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateSearch, setDateSearch] = useState('');
  const [loading, setLoading] = useState(true);
const [transferts, setTransferts] = useState<DossierTransfert[]>([]);
const [filteredTransferts, setFilteredTransferts] = useState<DossierTransfert[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('superviseur');
  const [currentUser, setCurrentUser] = useState('Superviseur');

  const [showDossierModal, setShowDossierModal] = useState(false);
  const [showSousDossierModal, setShowSousDossierModal] = useState(false);
  const [showTransfertModal, setShowTransfertModal] = useState(false); //Nouveau
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<DossierClient | null>(null);
  const [selectedTransfert, setSelectedTransfert] = useState<DossierTransfert | null>(null);  // ✅ NOUVEAU
  const [selectedSousDossier, setSelectedSousDossier] = useState<SousDossier | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{type: 'dossier' | 'sousdossier' | 'user' | 'file' | 'transfert', data: any} | null>(null);
  const [showFormulaireModal, setShowFormulaireModal] = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [dossierToReject, setDossierToReject] = useState<DossierClient | null>(null);
  const [transfertToReject, setTransfertToReject] = useState<DossierTransfert | null>(null);  // ✅ NOUVEAU
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'superviseur' as 'superviseur' | 'admin_bank' | 'super_admin' | 'agent_saisie' | 'auditeur' | 'conformité'
  });

  const API_URL = process.env.REACT_APP_API_URL || '';

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.username) setCurrentUser(user.username);
        if (user.role) {
          setCurrentUserRole(user.role);
      /*    if (user.role === 'super_admin') {
            setActiveTab('users');
          }*/
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
      }
    }
  }, []);


useEffect(() => {
  if (activeTab === 'documents' || activeTab === 'transferts') {
    loadDossiers(); // ✅ Charge les voyages ET les transferts
  } else {
    loadUsers();
  }
}, [activeTab, currentUserRole]);


  const canViewDocuments = () => {
    return ['admin_bank', 'agent_saisie', 'superviseur', 'auditeur', 'conformité'].includes(currentUserRole);
  };

  const canViewUsers = () => {
    return ['super_admin', 'admin_bank'].includes(currentUserRole);
  };

  const canManageAllStatuses = () => {
    return ['admin_bank', 'superviseur', 'auditeur'].includes(currentUserRole);
  };

  const canSeeArchiveStatus = () => {
    return !['agent_saisie'].includes(currentUserRole);
  };

  const canSeeRejectedStatus = () => {
    return currentUserRole === 'conformité';
  };

  const canCreateUsers = () => {
    return ['super_admin', 'admin_bank'].includes(currentUserRole);
  };

  const canDeleteSubfoldersAndFiles = () => {
    return ['admin_bank', 'superviseur'].includes(currentUserRole);
  };
const canModifyStatus = () => {
  return !['auditeur'].includes(currentUserRole);
}

  
const loadDossiers = async () => {
  try {
    setLoading(true);
    
    const token = localStorage.getItem('token');
    console.log('🔐 Token:', token ? 'Présent' : 'MANQUANT');
    
    const url = `${API_URL}/api/documents/admin/dossiers`;
    console.log('📡 Appel API:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📊 Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur HTTP:', response.status, errorText);
      throw new Error(`Erreur ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('📦 Données reçues:', data);
    console.log('✅ Success:', data.success);
    console.log('📋 Nombre dossiers:', data.dossiers ? data.dossiers.length : 0);

    if (data.success) {
      console.log('📊 Dossiers bruts:', data.dossiers);
      
      // Séparer voyage et transfert
      const allDocuments = data.dossiers;
      
      const documentsVoyage = allDocuments.filter((d: DossierClient) => 
        d.typeDocument === 'voyage' || !d.typeDocument
      );
      
      const documentsTransfert = allDocuments.filter((d: DossierClient) => 
        d.typeDocument === 'transfert'
      );
      
      console.log('✈️  Voyages:', documentsVoyage.length);
      console.log('💸 Transferts:', documentsTransfert.length);
      
      // Filtrer par rôle
      let filteredVoyage = documentsVoyage;
      let filteredTransfert = documentsTransfert;
      
      if (currentUserRole === 'agent_saisie') {
        filteredVoyage = filteredVoyage.filter((d: DossierClient) => 
          d.statut !== 'archivé' && d.statut !== 'rejeté'
        );
        filteredTransfert = filteredTransfert.filter((d: DossierClient) => 
          d.statut !== 'archivé' && d.statut !== 'rejeté'
        );
      } else if (currentUserRole !== 'conformité') {
        filteredVoyage = filteredVoyage.filter((d: DossierClient) => 
          d.statut !== 'rejeté'
        );
        filteredTransfert = filteredTransfert.filter((d: DossierClient) => 
          d.statut !== 'rejeté'
        );
      }
      
      console.log('📊 Après filtrage rôle:');
      console.log('  Voyages:', filteredVoyage.length);
      console.log('  Transferts:', filteredTransfert.length);

      setDossiers(filteredVoyage);
      setFilteredDossiers(filteredVoyage);
      
      // Convertir transferts
      const transfertsFormates: DossierTransfert[] = filteredTransfert.map((d: DossierClient) => ({
        reference: d.reference,
        nom: d.nom,
        prenom: d.prenom,
        email: d.email,
        telephone: d.telephone,
        profession: d.profession,
        sexe: d.sexe,
        typeTransfert: d.typeTransfert || '',
        dateDebut: d.dateDebut,
        dateFin: d.dateFin,
        fichiers: d.sousDossiers[0]?.fichiers || [],
        statut: d.statut,
        dateCreation: d.dateCreation,
        motifRejet: d.motifRejet
      }));
      
      setTransferts(transfertsFormates);
      setFilteredTransferts(transfertsFormates);
      
      console.log('✅ États mis à jour !');
    }
  } catch (error) {
    console.error('❌ ERREUR CHARGEMENT:', error);
    if (error instanceof Error) {
      alert(`Erreur: ${error.message}`);
    }
  } finally {
    setLoading(false);
  }
};


  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();

      if (data.success) {
        let filteredUsers = data.users;
        
        if (currentUserRole === 'super_admin') {
          filteredUsers = data.users.filter((u: User) => 
            u.role === 'admin_bank' || u.role === 'super_admin'
          );
        } else if (currentUserRole === 'admin_bank') {
          filteredUsers = data.users.filter((u: User) => 
            u.role !== 'super_admin' && u.role !== 'admin_bank'
          );
        }

        setUsers(filteredUsers);
        setFilteredUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
  if (activeTab === 'documents') {
    let filtered = dossiers;

    if (searchTerm.trim()) {
      filtered = filtered.filter(dossier =>
        dossier.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dossier.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dossier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dossier.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||  // ✅ NOUVEAU
        dossier.profession?.toLowerCase().includes(searchTerm.toLowerCase()) ||  // ✅ NOUVEAU
        (Array.isArray(dossier.pays) 
          ? dossier.pays.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
          : dossier.pays?.toLowerCase().includes(searchTerm.toLowerCase())  ) ||  
        dossier.typeTransfert?.toLowerCase().includes(searchTerm.toLowerCase()) ||  // ✅ NOUVEAU
        dossier.motif?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dossier.telephone?.includes(searchTerm)
      );
    }

    if (dateSearch.trim()) {
      const searchDate = new Date(dateSearch).toLocaleDateString('fr-FR');
      filtered = filtered.filter(dossier => {
        const dossierDate = new Date(dossier.dateCreation).toLocaleDateString('fr-FR');
        return dossierDate === searchDate;
      });
    }

    setFilteredDossiers(filtered);
  } else if (activeTab === 'transferts') {
    let filtered = transferts;

    if (searchTerm.trim()) {
      filtered = filtered.filter(transfert =>
        transfert.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfert.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfert.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfert.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||  // ✅ Recherche par référence
        transfert.profession?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfert.typeTransfert.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfert.telephone?.includes(searchTerm)
      );
    }

    if (dateSearch.trim()) {
      const searchDate = new Date(dateSearch).toLocaleDateString('fr-FR');
      filtered = filtered.filter(transfert => {
        const transfertDate = new Date(transfert.dateCreation).toLocaleDateString('fr-FR');
        return transfertDate === searchDate;
      });
    }

    setFilteredTransferts(filtered);
  } else {
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }
};



  const resetSearch = () => {
  setSearchTerm('');
  setDateSearch('');
  if (activeTab === 'documents') {
    setFilteredDossiers(dossiers);
  } else if (activeTab === 'transferts') {
    setFilteredTransferts(transferts);
  } else {
    setFilteredUsers(users);
  }
};

  const stats = activeTab === 'documents' ? {
  total: dossiers.length,
  enAttente: dossiers.filter(d => d.statut === 'en_attente').length,
  traites: dossiers.filter(d => d.statut === 'apuré').length,
  archives: dossiers.filter(d => d.statut === 'archivé').length,
  rejetes: dossiers.filter(d => d.statut === 'rejeté').length,
  voyage: dossiers.filter(d => d.typeDocument === 'voyage').length,  // ✅ NOUVEAU
  transfert: dossiers.filter(d => d.typeDocument === 'transfert').length  // ✅ NOUVEAU
} : activeTab === 'transferts' ? {
  total: transferts.length,
  enAttente: transferts.filter(t => t.statut === 'en_attente').length,
  traites: transferts.filter(t => t.statut === 'apuré').length,
  archives: transferts.filter(t => t.statut === 'archivé').length,
  rejetes: transferts.filter(t => t.statut === 'rejeté').length
} : {
  total: filteredUsers.length,
  actifs: filteredUsers.filter(u => u.isActive).length,
  superviseurs: filteredUsers.filter(u => u.role === 'superviseur').length,
  agents: filteredUsers.filter(u => u.role === 'agent_saisie').length,
  auditeurs: filteredUsers.filter(u => u.role === 'auditeur').length,
  conformite: filteredUsers.filter(u => u.role === 'conformité').length,
  admins: filteredUsers.filter(u => u.role === 'admin_bank').length,
  superAdmins: filteredUsers.filter(u => u.role === 'super_admin').length
};



useEffect(() => {
  // Charger automatiquement les utilisateurs si super_admin
  if (currentUserRole === 'super_admin') {
    // D'abord charger les données, puis changer l'onglet
    const switchToUsers = async () => {
      await loadUsers();
      setActiveTab('users');
    };
    switchToUsers();
  }
}, [currentUserRole]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const openDossierModal = (dossier: DossierClient) => {
    setSelectedDossier(dossier);
    setShowDossierModal(true);
  };

  const openSousDossierModal = (sousDossier: SousDossier) => {
    setSelectedSousDossier(sousDossier);
    setShowSousDossierModal(true);
  };

const changeStatut = async (reference: string, newStatut: 'en_attente' | 'partiellement_apuré' | 'apuré' | 'archivé' | 'rejeté') => {
  if (newStatut === 'rejeté' && currentUserRole === 'conformité') {
    const dossier = dossiers.find(d => d.reference === reference);
    setDossierToReject(dossier || null);
    setShowRejectModal(true);
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/documents/admin/statut/${reference}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ statut: newStatut })
    });

    if (response.ok) {
      setDossiers(prev => prev.map(d =>
        d.reference === reference ? { ...d, statut: newStatut } : d
      ));
      setFilteredDossiers(prev => prev.map(d =>
        d.reference === reference ? { ...d, statut: newStatut } : d
      ));
    }
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
  }
};

const changeTransfertStatut = async (reference: string, newStatut: 'en_attente' | 'partiellement_apuré' | 'apuré' | 'archivé' | 'rejeté') => {
  if (newStatut === 'rejeté' && currentUserRole === 'conformité') {
    const transfert = transferts.find(t => t.reference === reference);
     setTransfertToReject(transfert || null);
    setShowRejectModal(true);
    return;
  }

 try {
    // ✅ Utiliser la même route que pour les documents
    const response = await fetch(`${API_URL}/api/documents/admin/statut/${reference}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ statut: newStatut })
    });

    if (response.ok) {
      setTransferts(prev => prev.map(t =>
        t.reference === reference ? { ...t, statut: newStatut } : t
      ));
      setFilteredTransferts(prev => prev.map(t =>
        t.reference === reference ? { ...t, statut: newStatut } : t
      ));
    }
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
  }
};

  const confirmReject = async () => {
  const target = dossierToReject || transfertToReject;
  if (!target || !rejectReason.trim()) {
    alert('Veuillez saisir un motif de rejet');
    return;
  }
   const endpoint = dossierToReject 
    
    ? `${API_URL}/api/documents/admin/statut/${dossierToReject.reference}`
    : `${API_URL}/api/documents/admin/statut/${transfertToReject!.reference}`;  // ✅ Même route

  try {
    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        statut: 'rejeté',
        motifRejet: rejectReason
      })
    });

    if (response.ok) {
      if (dossierToReject) {
        setDossiers(prev => prev.map(d =>
          d.reference === dossierToReject.reference ? { ...d, statut: 'rejeté' } : d
        ));
        setFilteredDossiers(prev => prev.map(d =>
          d.reference === dossierToReject.reference ? { ...d, statut: 'rejeté' } : d
        ));
      } else if (transfertToReject) {
        setTransferts(prev => prev.map(t =>
          t.reference === transfertToReject.reference ? { ...t, statut: 'rejeté' } : t
        ));
        setFilteredTransferts(prev => prev.map(t =>
          t.reference === transfertToReject.reference ? { ...t, statut: 'rejeté' } : t
        ));
	loadDossiers();
      }

      setShowRejectModal(false);
      setRejectReason('');
      setDossierToReject(null);
      setTransfertToReject(null);
      alert('Dossier rejeté avec succès');
    }
  } catch (error) {
    console.error('Erreur lors du rejet:', error);
  }
};


  const exportToExcel = () => {
  if (currentUserRole !== 'auditeur' && currentUserRole !== 'conformité') {
    alert('Seuls les auditeurs et conformité peuvent exporter');
    return;
  }

  let dataToExport: any[] = [];
  let filename = '';

  if (activeTab === 'documents') {
    dataToExport = filteredDossiers.map(dossier => ({
      'Référence': dossier.reference,  // ✅ NOUVEAU
      'Nom': dossier.nom,
      'Prénom': dossier.prenom,
      'Email': dossier.email,
      'Téléphone': dossier.telephone || 'N/A',
      'Profession': dossier.profession,  // ✅ NOUVEAU
      'Sexe': dossier.sexe,  // ✅ NOUVEAU
      'Type': dossier.typeDocument,  // ✅ NOUVEAU
       'Pays': Array.isArray(dossier.pays) ? dossier.pays.join(', ') : dossier.pays || 'N/A',  
      'Type Transfert': dossier.typeTransfert || 'N/A',  // ✅ NOUVEAU
      'Motif': dossier.motif || 'N/A',
      'Statut': dossier.statut,
      'Date de création': formatDate(dossier.dateCreation),
      'Date début': formatDate(dossier.dateDebut),  // ✅ NOUVEAU
      'Date fin': formatDate(dossier.dateFin),  // ✅ NOUVEAU
      'Nombre de sous-dossiers': dossier.sousDossiers.length
    }));
    filename = `documents_export_${new Date().toISOString().split('T')[0]}.csv`;
  } else if (activeTab === 'transferts') {
    dataToExport = filteredTransferts.map(transfert => ({
      'Référence': transfert.reference,
      'Nom': transfert.nom,
      'Prénom': transfert.prenom,
      'Email': transfert.email,
      'Téléphone': transfert.telephone || 'N/A',
      'Profession': transfert.profession,
      'Sexe': transfert.sexe,
      'Type Transfert': transfert.typeTransfert,
      'Statut': transfert.statut,
      'Date de création': formatDate(transfert.dateCreation),
      'Date début': formatDate(transfert.dateDebut),
      'Date fin': formatDate(transfert.dateFin),
      'Nombre de fichiers': transfert.fichiers.length
    }));
    filename = `transferts_export_${new Date().toISOString().split('T')[0]}.csv`;
  }

  const headers = Object.keys(dataToExport[0] || {});
  const csvContent = [
    headers.join(','),
    ...dataToExport.map(row => headers.map(h => `"${row[h as keyof typeof row]}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};



  const openEmailClient = (email: string) => {
    window.location.href = `mailto:${email}?subject=Rappel concernant votre dossier&body=Bonjour,\n\nNous vous rappelons concernant votre dossier en cours.\n\nCordialement,\nL'équipe DataCollectApp`;
  };

  

const openWhatsApp = (telephone: string, nom: string, prenom: string, type: 'voyage' | 'transfert', reference: string, motif: string) => {
  const phoneNumber = telephone.replace(/[\s\-()]/g, '');
  
  let typeMessage = '';
  if (type === 'voyage') {
    typeMessage = `vos documents de voyage avec référence : "${reference}"`;
  } else {
    typeMessage = `vos dossiers de transfert avec référence : "${reference}"`;
  }
  
  const message = `Bonjour ${prenom} ${nom},\n\nNous vous contactons concernant ${typeMessage}.\n\nNous aimerions faire un point sur votre dossier. Pourriez-vous nous contacter dès que possible ?\n\nCordialement,\nL'équipe DataCollectApp`;
  
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
};

  const openUserModal = (user: User) => {
    setSelectedUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role
    });
    setShowUserModal(true);
  };

  const openCreateUserModal = () => {
    setUserForm({
      username: '',
      email: '',
      password: '',
      role: currentUserRole === 'super_admin' ? 'admin_bank' : 'superviseur'
    });
    setShowCreateUserModal(true);
  };

  const createUser = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(userForm)
      });

      if (response.ok) {
        await loadUsers();
        setShowCreateUserModal(false);
        setUserForm({ 
          username: '', 
          email: '', 
          password: '', 
          role: currentUserRole === 'super_admin' ? 'admin_bank' : 'superviseur' 
        });
        alert('Utilisateur créé avec succès');
      } else {
        alert('Erreur lors de la création de l\'utilisateur');
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      alert('Erreur lors de la création de l\'utilisateur');
    }
  };

  const updateUser = async () => {
    if (!selectedUser) return;

    try {
      const updateData: any = {
        username: userForm.username,
        email: userForm.email,
        role: userForm.role
      };

      if (userForm.password) {
        updateData.password = userForm.password;
      }

      const response = await fetch(`${API_URL}/api/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await loadUsers();
        setShowUserModal(false);
        alert('Utilisateur modifié avec succès');
      } else {
        const errorData = await response.json();
        alert(`Erreur: ${errorData.message || 'Modification échouée'}`);
      }
    } catch (error) {
      console.error('Erreur lors de la modification de l\'utilisateur:', error);
      alert('Erreur lors de la modification');
    }
  };

  const toggleUserStatus = async (userId: string) => {
    if (currentUserRole !== 'admin_bank' && currentUserRole !== 'super_admin') {
      alert('Seuls les administrateurs peuvent modifier les utilisateurs');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          isActive: !users.find(u => u._id === userId)?.isActive
        })
      });

      if (response.ok) {
        await loadUsers();
      }
    } catch (error) {
      console.error('Erreur lors du changement de statut utilisateur:', error);
    }
  };

  
const deleteFile = async (fileId: string, fileName: string, chemin: string) => {
  if (!canDeleteSubfoldersAndFiles()) {
    alert('Vous n\'avez pas les permissions pour supprimer des fichiers');
    return;
  }

  const shouldDelete = window.confirm(`Supprimer le fichier "${fileName}" ?`);
  if (!shouldDelete) return;

  try {
    let endpoint = '';
    
    if (selectedDossier) {
      // Pour les documents voyage
      endpoint = `${API_URL}/api/documents/admin/file/${selectedDossier.reference}/${selectedSousDossier?._id}/${fileId}`;
    } else if (selectedTransfert) {
      // ✅ NOUVEAU : POUR LES TRANSFERTS
      const response = await fetch(`${API_URL}/api/documents/admin/dossiers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      const transfertDoc = data.dossiers.find((d: any) => d.reference === selectedTransfert.reference);
      
      if (!transfertDoc?.sousDossiers?.[0]?._id) {
        alert('Structure du document invalide');
        return;
      }
      
      const sousDossierId = transfertDoc.sousDossiers[0]._id;
      endpoint = `${API_URL}/api/documents/admin/file/${selectedTransfert.reference}/${sousDossierId}/${fileId}`;
    }

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.ok) {
      alert('Fichier supprimé avec succès');
      setShowSousDossierModal(false);
      setShowDossierModal(false);
      setShowTransfertModal(false);
      await loadDossiers();
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du fichier:', error);
  }
};


  const downloadFile = async (fileId: string, nomOriginal: string) => {
    try {
      const downloadUrl = `${API_URL}/api/documents/admin/download/${selectedDossier?.reference}/${selectedSousDossier?._id}/${fileId}`;

      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        alert('Erreur lors du téléchargement');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomOriginal;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement du fichier');
    }
  };



    // Telechargement fichier transfert :  Utiliser la route documents
const downloadTransfertFile = async (fileId: string, nomOriginal: string) => {
  try {
    if (!selectedTransfert) {
      alert('Aucun transfert sélectionné');
      return;
    }

    // ✅ Récupérer le document complet
    const response = await fetch(`${API_URL}/api/documents/admin/dossiers`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    const data = await response.json();
    const transfertDoc = data.dossiers.find((d: any) => d.reference === selectedTransfert.reference);
    
    if (!transfertDoc?.sousDossiers?.[0]?._id) {
      alert('Structure du document invalide');
      return;
    }

    const sousDossierId = transfertDoc.sousDossiers[0]._id;

    // ✅ Télécharger
    const downloadUrl = `${API_URL}/api/documents/admin/download/${selectedTransfert.reference}/${sousDossierId}/${fileId}`;
    
    const downloadResponse = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!downloadResponse.ok) {
      alert('Erreur lors du téléchargement');
      return;
    }

    const blob = await downloadResponse.blob();
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement('a'); // ✅ window.document
    a.href = url;
    a.download = nomOriginal;
    window.document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    window.document.body.removeChild(a);

  } catch (error) {
    console.error('Erreur téléchargement:', error);
    alert('Erreur lors du téléchargement du fichier');
  }
};


const confirmDelete = (type: 'dossier' | 'sousdossier' | 'user' | 'file' | 'transfert', data: any) => {
  if (type === 'user' && currentUserRole !== 'admin_bank' && currentUserRole !== 'super_admin') {
    alert('Seuls les administrateurs peuvent supprimer des utilisateurs');
    return;
  }
  if ((type === 'dossier' || type === 'sousdossier' || type === 'file' || type === 'transfert') && !canDeleteSubfoldersAndFiles()) {
    alert('Vous n\'avez pas les permissions pour supprimer');
    return;
  }
  setDeleteTarget({ type, data });
  setShowDeleteModal(true);
};


  const handleDelete = async () => {
  if (!deleteTarget) return;

  try {
    let endpoint = '';
    if (deleteTarget.type === 'dossier') {
      endpoint = `${API_URL}/api/documents/admin/dossier/${deleteTarget.data.reference}`;
    } else if (deleteTarget.type === 'sousdossier') {
      endpoint = `${API_URL}/api/documents/admin/sousdossier/${selectedDossier?.reference}/${deleteTarget.data._id}`;
    } else if (deleteTarget.type === 'transfert') {
     // ✅ Les transferts sont dans /api/documents
     endpoint = `${API_URL}/api/documents/admin/dossier/${deleteTarget.data.reference}`;
  } else if (deleteTarget.type === 'user') {
      endpoint = `${API_URL}/api/users/${deleteTarget.data._id}`;
    }

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.ok) {
      if (deleteTarget.type === 'dossier') {
        await loadDossiers();
      } else if (deleteTarget.type === 'transfert') {
        await  loadDossiers();
      } else if (deleteTarget.type === 'user') {
        await loadUsers();
      } else {
        await loadDossiers();
      }
      alert('Suppression effectuée avec succès');
    }
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
  }

  setShowDeleteModal(false);
  setDeleteTarget(null);
  setShowDossierModal(false);
  setShowSousDossierModal(false);
  setShowTransfertModal(false);
  setShowUserModal(false);
};


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('dossiers_statuts');
    window.location.href = '/admin/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto px-2">
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-2xl p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  DataCollectApp
                  <span className="block text-xl font-normal text-blue-100 mt-2">
                    Tableau de bord administrateur
                  </span>
                </h1>
                <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mt-3">
                  <svg className="w-5 h-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-white font-medium mr-2">{currentUser}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    currentUserRole === 'super_admin' ? 'bg-red-400 text-red-900' :
                    currentUserRole === 'admin_bank' ? 'bg-yellow-400 text-yellow-900' :
                    currentUserRole === 'agent_saisie' ? 'bg-green-400 text-green-900' :
                    currentUserRole === 'auditeur' ? 'bg-purple-400 text-purple-900' :
                    currentUserRole === 'conformité' ? 'bg-orange-400 text-orange-900' :
                    'bg-blue-300 text-blue-900'
                  }`}>
                    {currentUserRole === 'super_admin' ? 'Super Admin' :
                     currentUserRole === 'admin_bank' ? 'Administrateur de la banque' :
                     currentUserRole === 'agent_saisie' ? 'Agent de Saisie' :
                     currentUserRole === 'auditeur' ? 'Auditeur' :
                     currentUserRole === 'conformité' ? 'Conformité' :
                     'Superviseur'}
                  </span>
                </div>
              </div>
              <button onClick={handleLogout} className="px-6 py-3 bg-white text-red-600 rounded-xl hover:bg-red-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center font-semibold group">
                <svg className="w-5 h-5 mr-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Déconnexion
              </button>
            </div>
          </div>

          {activeTab === 'documents' && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-sm text-gray-600">Total documents</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{stats.enAttente}</p>
                    <p className="text-sm text-gray-600">En Attente</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{stats.traites}</p>
                    <p className="text-sm text-gray-600">Apurés</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{stats.archives}</p>
                    <p className="text-sm text-gray-600">Archives</p>
                  </div>
                </div>
              </div>

              {canSeeRejectedStatus() && (
                <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-xl hover:scale-105 transition-all duration-300">
                  <div className="flex items-center">
                    <div className="p-3 bg-red-100 rounded-full">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">{stats.rejetes}</p>
                      <p className="text-sm text-gray-600">Rejetés</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
{activeTab === 'transferts' && (
  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
    <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-xl hover:scale-105 transition-all duration-300">
      <div className="flex items-center">
        <div className="p-3 bg-blue-100 rounded-full">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <div className="ml-4">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-600">Total transferts</p>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-xl hover:scale-105 transition-all duration-300">
      <div className="flex items-center">
        <div className="p-3 bg-yellow-100 rounded-full">
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="ml-4">
          <p className="text-2xl font-bold text-gray-900">{stats.enAttente}</p>
          <p className="text-sm text-gray-600">En Attente</p>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-xl hover:scale-105 transition-all duration-300">
      <div className="flex items-center">
        <div className="p-3 bg-green-100 rounded-full">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="ml-4">
          <p className="text-2xl font-bold text-gray-900">{stats.traites}</p>
          <p className="text-sm text-gray-600">Apurés</p>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-xl hover:scale-105 transition-all duration-300">
      <div className="flex items-center">
        <div className="p-3 bg-blue-100 rounded-full">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="ml-4">
          <p className="text-2xl font-bold text-gray-900">{stats.archives}</p>
          <p className="text-sm text-gray-600">Archives</p>
        </div>
      </div>
    </div>

    {canSeeRejectedStatus() && (
      <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-xl hover:scale-105 transition-all duration-300">
        <div className="flex items-center">
          <div className="p-3 bg-red-100 rounded-full">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-2xl font-bold text-gray-900">{stats.rejetes}</p>
            <p className="text-sm text-gray-600">Rejetés</p>
          </div>
        </div>
      </div>
    )}
  </div>
)}



          {activeTab === 'users' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-sm text-gray-600">Total utilisateurs</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{stats.actifs}</p>
                    <p className="text-sm text-gray-600">Actifs</p>
                  </div>
                </div>
              </div>

              {currentUserRole === 'super_admin' ? (
                <>
                  <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <div className="flex items-center">
                      <div className="p-3 bg-yellow-100 rounded-full">
                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
                        <p className="text-sm text-gray-600">Admin Banque</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <div className="flex items-center">
                      <div className="p-3 bg-red-100 rounded-full">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl font-bold text-gray-900">{stats.superAdmins}</p>
                        <p className="text-sm text-gray-600">Super Admins</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-100 rounded-full">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl font-bold text-gray-900">{stats.superviseurs}</p>
                        <p className="text-sm text-gray-600">Superviseurs</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <div className="flex items-center">
                      <div className="p-3 bg-orange-100 rounded-full">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl font-bold text-gray-900">{stats.auditeurs}</p>
                        <p className="text-sm text-gray-600">Auditeurs</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border hover:shadow-lg transition-shadow duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher  {activeTab === 'documents' ? 'un document' : activeTab === 'transferts' ? 'un transfert' : 'un utilisateur'}
		
              </label>		
  	      <input
  type="text"
  placeholder={
    activeTab === 'documents' 
      ? "Référence, nom, email, profession, pays..." 
      : activeTab === 'transferts'
      ? "Référence, nom, email, type transfert..."
      : "Nom d'utilisateur, email..."
  }
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
/>
            </div>

            		
	    {(activeTab === 'documents' || activeTab === 'transferts') && (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Recherche par date
    </label>
    <input
      type="date"
      value={dateSearch}
      onChange={(e) => setDateSearch(e.target.value)}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
)}

            <div className="flex space-x-2">
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all duration-300 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Rechercher
              </button>
              <button
                onClick={resetSearch}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 hover:shadow-lg transition-all duration-300"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
        <div className="flex space-x-1 mb-6">
          {canViewDocuments() && (
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-6 py-3 rounded-lg transition-all duration-300 flex items-center ${
                activeTab === 'documents'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Documents
            </button>
          )}
          {canViewDocuments() && (
            <button
              onClick={() => setActiveTab('transferts')}
              className={`px-6 py-3 rounded-lg transition-all duration-300 flex items-center ${
                activeTab === 'transferts'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Transferts
            </button>
          )}
          {canViewUsers() && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 rounded-lg transition-all duration-300 flex items-center ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Utilisateurs
            </button>
          )}
          
          {/* BOUTONS D'ACTION À DROITE */}
          <div className="ml-auto flex space-x-2">
            {(currentUserRole === 'auditeur' || currentUserRole === 'conformité') && (activeTab === 'documents' || activeTab === 'transferts') && (
              <button
                onClick={exportToExcel}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:shadow-lg transition-all duration-300 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exporter Excel
              </button>
            )}
            
            {/* BOUTON FORMULAIRE CLIENT ICI */}
            {currentUserRole === 'superviseur' && (
              <button
                onClick={() => setShowFormulaireModal(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:shadow-lg transition-all duration-300 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Formulaire client
              </button>
            )}
          </div>
        </div>

        {activeTab === 'documents' ? (
          <div className="bg-white rounded-2xl shadow-xl border-4 border-blue-100 overflow-hidden">
            <div className="px-6 py-5 border-b-4 border-blue-200 bg-gradient-to-r from-blue-600 to-indigo-600">
              <h3 className="text-xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Documents de voyages ({filteredDossiers.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
  <tr>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-mail / Téléphone</th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
  </tr>
</thead>


<tbody className="bg-white divide-y divide-gray-200">
  {filteredDossiers.map((dossier) => (
    <tr key={dossier.reference} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-white transition-all duration-300">
      {/* Colonne Référence */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className={`w-10 h-10 ${dossier.typeDocument === 'voyage' ? 'bg-blue-100' : 'bg-purple-100'} rounded-full flex items-center justify-center mr-3`}>
            <svg className={`w-5 h-5 ${dossier.typeDocument === 'voyage' ? 'text-blue-600' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {dossier.typeDocument === 'voyage' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              )}
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{dossier.reference}</p>
            <p className="text-xs text-gray-500">
              {dossier.typeDocument === 'voyage' ? 'Voyage' : 'Transfert'}
            </p>
          </div>
        </div>
      </td>

      {/* Colonne Client */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <p className="text-sm font-medium text-gray-900">{dossier.nom} {dossier.prenom}</p>
          <p className="text-xs text-gray-500">{dossier.profession}</p>
          <p className="text-xs text-gray-400">{dossier.sexe === 'H' ? 'Homme' : 'Femme'}</p>
        </div>
      </td>

      {/* Colonne Contact */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col space-y-1">
          <button
            onClick={() => openEmailClient(dossier.email)}
            className="text-blue-600 hover:text-blue-800 hover:underline hover:bg-blue-50 px-2 py-1 rounded transition-all duration-300 text-sm flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {dossier.email}
          </button>
          {dossier.telephone && (
            <button
  onClick={() => openWhatsApp(dossier.telephone || '', dossier.nom, dossier.prenom, 'voyage', dossier.reference, dossier.motif || 'votre dossier')}
  className="text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1 rounded transition-all duration-300 text-xs flex items-center"
>
  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
  {dossier.telephone}
</button>
          )}
        </div>
      </td>

     
      {/* Colonne Statut */}
      <td className="px-6 py-4 whitespace-nowrap">
        <select
          value={dossier.statut}
          onChange={(e) => changeStatut(dossier.reference, e.target.value as any)}
         // disabled={!canManageAllStatuses() && currentUserRole !== 'agent_saisie' && currentUserRole !== 'conformité'}
         disabled={!canModifyStatus()}
          className={`text-xs px-3 py-1 rounded-full border-0 font-medium focus:ring-2 transition-all cursor-pointer ${
            dossier.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800 focus:ring-yellow-500' :
            dossier.statut === 'partiellement_apuré' ? 'bg-orange-100 text-orange-800 focus:ring-orange-500' :
            dossier.statut === 'apuré' ? 'bg-green-100 text-green-800 focus:ring-green-500' :
            dossier.statut === 'archivé' ? 'bg-blue-100 text-blue-800 focus:ring-blue-500' :
            dossier.statut === 'rejeté' ? 'bg-red-600 text-white focus:ring-red-500' :
            'bg-gray-100 text-gray-800 focus:ring-gray-500'
          }`}
        >
          <option value="en_attente">En attente</option>
          <option value="partiellement_apuré">Partiellement apuré</option>
          <option value="apuré">Apuré</option>
          {canSeeArchiveStatus() && <option value="archivé">Archivé</option>}
          {canSeeRejectedStatus() && <option value="rejeté">Rejeté</option>}
        </select>
      </td>

      {/* Colonne Date */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div>
          <p>{formatDate(dossier.dateCreation)}</p>
          <p className="text-xs text-gray-400">
            {dossier.sousDossiers.length} sous-dossier(s)
          </p>
        </div>
      </td>

      {/* Colonne Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => openDossierModal(dossier)}
            className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-all duration-300"
          >
            Voir
          </button>
          {(currentUserRole === 'admin_bank' || currentUserRole === 'superviseur') && dossier.statut !== 'rejeté' && (
            <button
              onClick={() => confirmDelete('dossier', dossier)}
              className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-all duration-300"
            >
              Supprimer
            </button>
          )}
        </div>
      </td>
    </tr>
  ))}
</tbody>


              </table>
          </div>
          </div>
        ) : activeTab === 'transferts' ? (
  <div className="bg-white rounded-2xl shadow-xl border-4 border-blue-100 overflow-hidden">
    <div className="px-6 py-5 border-b-4 border-blue-200 bg-gradient-to-r from-blue-600 to-blue-700">
      <h3 className="text-xl font-bold text-white flex items-center">
        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        Dossiers de transferts ({filteredTransferts.length})
      </h3>
    </div>

    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type Transfert</th>
           {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>  pour la gestion des dates  */}
	   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date dépôt</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredTransferts.map((transfert) => (
            <tr key={transfert.reference} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-white transition-all duration-300">
              {/* Colonne Référence */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-700">{transfert.reference}</p>
                    <p className="text-xs text-gray-500">{transfert.fichiers.length} fichier(s)</p>
                  </div>
                </div>
              </td>

              {/* Colonne Client */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <p className="text-sm font-medium text-gray-900">{transfert.nom} {transfert.prenom}</p>
                  <p className="text-xs text-gray-500">{transfert.profession}</p>
                  <p className="text-xs text-gray-400">{transfert.sexe === 'H' ? 'Homme' : 'Femme'}</p>
                </div>
              </td>

              {/* Colonne Contact */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={() => openEmailClient(transfert.email)}
                    className="text-blue-600 hover:text-blue-800 hover:underline text-sm flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {transfert.email}
                  </button>
                  {transfert.telephone && (
                    <button
  onClick={() => openWhatsApp(transfert.telephone || '', transfert.nom, transfert.prenom, 'transfert', transfert.reference, 'votre dossier de transfert')}
  className="text-green-600 hover:text-green-800 text-xs flex items-center"
>
  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
  {transfert.telephone}
</button>
                  )}
                </div>
              </td>

              {/* Colonne Type Transfert */}
              <td className="px-6 py-4">
                <p className="text-sm text-gray-900 max-w-xs truncate" title={transfert.typeTransfert}>
                  {transfert.typeTransfert}
                </p>
              </td>

              {/* Colonne Période */}
             {/* <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                <div>
                  <p>Du {new Date(transfert.dateDebut).toLocaleDateString('fr-FR')}</p>
                  <p>Au {new Date(transfert.dateFin).toLocaleDateString('fr-FR')}</p>
                </div>
              </td>*/}
	       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
		  {formatDate(transfert.dateCreation)}
		</td>

              {/* Colonne Statut */}
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={transfert.statut}
                  onChange={(e) => changeTransfertStatut(transfert.reference, e.target.value as any)}
                  //disabled={!canManageAllStatuses() && currentUserRole !== 'agent_saisie' && currentUserRole !== 'conformité'}                 
		 disabled={!canModifyStatus()}
                  className={`text-xs px-3 py-1 rounded-full border-0 font-medium focus:ring-2 transition-all cursor-pointer ${
                    transfert.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                    transfert.statut === 'partiellement_apuré' ? 'bg-orange-100 text-orange-800' :
                    transfert.statut === 'apuré' ? 'bg-green-100 text-green-800' :
                    transfert.statut === 'archivé' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-600 text-white'
                  }`}
                >
                  <option value="en_attente">En attente</option>
                  <option value="partiellement_apuré">Partiellement apuré</option>
                  <option value="apuré">Apuré</option>
                  {canSeeArchiveStatus() && <option value="archivé">Archivé</option>}
                  {canSeeRejectedStatus() && <option value="rejeté">Rejeté</option>}
                </select>
              </td>

              {/* Colonne Date */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(transfert.dateCreation)}
              </td>

              {/* Colonne Actions */}
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setSelectedTransfert(transfert);
                      setShowTransfertModal(true);
                    }}
                    className="text-blue-600 hover:text-purple-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-all duration-300"
                  >
                    Voir
                  </button>
                  {(currentUserRole === 'admin_bank' || currentUserRole === 'superviseur') && transfert.statut !== 'rejeté' && (
                    <button
                      onClick={() => confirmDelete('transfert', transfert)}
                      className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-all duration-300"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
) : (

	
          <div className="space-y-4">
            <div className="flex justify-end">
              {canCreateUsers() && (
                <button
                  onClick={openCreateUserModal}
                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all duration-300 flex items-center" 
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Créer un utilisateur
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-xl border-4 border-green-100 overflow-hidden">
               	<div className="px-6 py-5 border-b-4 border-blue-200 bg-gradient-to-r from-blue-600 to-cyan-600">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  Utilisateurs ({filteredUsers.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date création</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gradient-to-r hover:from-green-50 hover:to-white transition-all duration-300">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{user.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{user.email}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin_bank' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'agent_saisie' ? 'bg-green-100 text-green-800' :
                            user.role === 'auditeur' ? 'bg-orange-100 text-orange-800' :
                            user.role === 'conformité' ? 'bg-pink-100 text-pink-800' :
                            user.role === 'super_admin' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role === 'admin_bank' ? 'Administrateur de la banque' :
                             user.role === 'agent_saisie' ? 'Agent de Saisie' :
                             user.role === 'auditeur' ? 'Auditeur' :
                             user.role === 'conformité' ? 'Conformité' :
                             user.role === 'super_admin' ? 'Super Admin' :
                             'Superviseur'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleUserStatus(user._id)}
                            disabled={currentUserRole !== 'admin_bank' && currentUserRole !== 'super_admin'}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            } ${(currentUserRole !== 'admin_bank' && currentUserRole !== 'super_admin') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {user.isActive ? 'Actif' : 'Inactif'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            {(currentUserRole === 'admin_bank' || currentUserRole === 'super_admin') && (
                              <>
                                <button
                                  onClick={() => openUserModal(user)}
                                  className="text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-lg transition-all duration-300"
                                >
                                  Modifier
                                </button>
                                <button
                                  onClick={() => confirmDelete('user', user)}
                                  className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-all duration-300"
                                >
                                  Supprimer
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}



{showDossierModal && selectedDossier && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-white">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Dossier: {selectedDossier.nom} {selectedDossier.prenom}</h3>
          <p className="text-gray-600 text-sm mt-1">{selectedDossier.email} | {selectedDossier.telephone}</p>
          <p className="text-gray-500 text-xs mt-1">
            Type: {selectedDossier.typeDocument === 'voyage' ? 'Voyage' : 'Transfert'} | 
            Statut: {selectedDossier.statut} | 
            Référence: {selectedDossier.reference}
          </p>
        </div>
        <button
          onClick={() => setShowDossierModal(false)}
          className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-full transition-all duration-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Informations détaillées du client */}
      <div className="p-6 border-b bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Informations client</h4>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Nom complet:</span> {selectedDossier.nom} {selectedDossier.prenom}</div>
              <div><span className="font-medium">Email:</span> {selectedDossier.email}</div>
              <div><span className="font-medium">Téléphone:</span> {selectedDossier.telephone || 'Non renseigné'}</div>
              <div><span className="font-medium">Profession:</span> {selectedDossier.profession}</div>
              <div><span className="font-medium">Sexe:</span> {selectedDossier.sexe === 'H' ? 'Homme' : 'Femme'}</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Informations générales</h4>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Type:</span> {selectedDossier.typeDocument === 'voyage' ? 'Voyage' : 'Transfert'}</div>
              <div><span className="font-medium">Référence:</span> {selectedDossier.reference}</div>
              <div><span className="font-medium">Statut:</span> 
                <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  selectedDossier.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                  selectedDossier.statut === 'partiellement_apuré' ? 'bg-orange-100 text-orange-800' :
                  selectedDossier.statut === 'apuré' ? 'bg-green-100 text-green-800' :
                  selectedDossier.statut === 'archivé' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedDossier.statut}
                </span>
              </div>
              <div><span className="font-medium">Date création:</span> {formatDate(selectedDossier.dateCreation)}</div>
              <div><span className="font-medium">Nombre de sous-dossiers:</span> {selectedDossier.sousDossiers.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          Sous-dossiers ({selectedDossier.sousDossiers.length})
        </h4>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {selectedDossier.sousDossiers.map((sousDossier, index) => (
            <div key={index} className="border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all duration-300 bg-white">
              <div className="flex flex-col h-full">
                {/* En-tête du sous-dossier */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-medium text-gray-900 truncate" title={sousDossier.nom}>
                        {sousDossier.nom}
                      </h5>
                      <p className="text-sm text-gray-600">{sousDossier.fichiers.length} fichier(s)</p>
                      <p className="text-xs text-gray-500">Créé le {formatDate(sousDossier.date)}</p>
                      
                      {/* Aperçu des informations spécifiques */}
                      {selectedDossier.typeDocument === 'voyage' ? (
                        <div className="mt-2 text-xs text-gray-600">                 
                          <p><strong>Pays:</strong> {Array.isArray(sousDossier.pays) ? sousDossier.pays?.join(', ') : sousDossier.pays}</p>
                          <p><strong>Raison:</strong> {sousDossier.raison === 'autres' ? sousDossier.autreRaison : sousDossier.raison}</p>
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-gray-600">
                          <p><strong>Type:</strong> {sousDossier.typeTransfert}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                  <button
                    onClick={() => openSousDossierModal(sousDossier)}
                    className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all duration-300 text-sm font-medium flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Voir détails
                  </button>
                  
                  {canDeleteSubfoldersAndFiles() && selectedDossier.statut !== 'rejeté' && (
                    <button
                      onClick={() => confirmDelete('sousdossier', sousDossier)}
                      className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-all duration-300 text-sm font-medium flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message si aucun sous-dossier */}
        {selectedDossier.sousDossiers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
            <p className="mt-2">Aucun sous-dossier dans ce dossier</p>
          </div>
        )}
      </div>
    </div>
  </div>
)}

{showSousDossierModal && selectedSousDossier && selectedDossier && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
    <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border-4 border-blue-200">
      <div className="flex items-center justify-between p-6 border-b-4 border-blue-300 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div>
          <h3 className="text-xl font-semibold text-white">Sous-dossier: {selectedSousDossier.nom}</h3>
          <p className="text-blue-100 text-sm mt-1">Créé le {formatDate(selectedSousDossier.date)}</p>
        </div>
        <button
          onClick={() => setShowSousDossierModal(false)}
          className="text-white hover:text-gray-200 p-2 hover:bg-white/20 rounded-full transition-all duration-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

    
  <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
        {/* Détails spécifiques au sous-dossier */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Détails du {selectedDossier?.typeDocument === 'voyage' ? 'voyage' : 'transfert'}</h4>
          
{selectedDossier?.typeDocument === 'voyage' ? (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div>
       
       <div><span className="font-medium">Pays à visiter:</span> {Array.isArray(selectedSousDossier?.pays) ? selectedSousDossier.pays?.join(', ') : selectedSousDossier?.pays}</div>
       <div><span className="font-medium">Raison:</span> {selectedSousDossier?.raison === 'autres' ? selectedSousDossier?.autreRaison : selectedSousDossier?.raison}</div>
      </div>
      <div>
       <div><span className="font-medium">Période:</span> Du {selectedSousDossier?.dateDebut ? new Date(selectedSousDossier.dateDebut).toLocaleDateString('fr-FR') : 'N/A'} au {selectedSousDossier?.dateFin ? new Date(selectedSousDossier.dateFin).toLocaleDateString('fr-FR') : 'N/A'}</div>
      </div>
    </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div><span className="font-medium">Type de transfert:</span> {selectedDossier?.typeTransfert}</div>
                <div><span className="font-medium">Période:</span> 
                 
                  {selectedDossier?.dateDebut && selectedDossier?.dateFin 
                    ? `Du ${new Date(selectedDossier.dateDebut).toLocaleDateString('fr-FR')} au ${new Date(selectedDossier.dateFin).toLocaleDateString('fr-FR')}`
                    : 'Non spécifiée'
                  }
                </div>
              </div>
              <div>
                {selectedSousDossier.motif && (
                  <div><span className="font-medium">Détails:</span> {selectedSousDossier.motif}</div>
                )}
              </div>
            </div>
          )}
        </div>

        <h4 className="text-lg font-medium text-gray-900 mb-4">
          Fichiers ({selectedSousDossier.fichiers.length})
        </h4>

        <div className="space-y-3">
          {selectedSousDossier.fichiers.map((fichier, index) => (
            <div key={index} className="flex items-center justify-between p-5 border-2 border-blue-200 rounded-2xl bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {fichier.nomOriginal || fichier.nom}
                  </p>
                  <p className="text-sm text-gray-600">{formatFileSize(fichier.taille)} • {fichier.extension}</p>
                  <p className="text-xs text-gray-500">Fichier système: {fichier.nom}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => downloadFile(fichier._id, fichier.nomOriginal || fichier.nom)}
                  className="text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-3 py-1 rounded transition-all duration-300 text-sm"
                >
                  Télécharger
                </button>
                {canDeleteSubfoldersAndFiles() && selectedDossier?.statut !== 'rejeté' && (
                  <button
                    onClick={() => deleteFile(fichier._id, fichier.nomOriginal || fichier.nom, fichier.chemin)}
                    className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1 rounded transition-all duration-300 text-sm"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
          <button
            onClick={() => setShowSousDossierModal(false)}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-300"
          >
            Fermer
          </button>
          {canDeleteSubfoldersAndFiles() && selectedDossier?.statut !== 'rejeté' && (
            <button
              onClick={() => confirmDelete('sousdossier', selectedSousDossier)}
              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-300"
            >
              Supprimer le sous-dossier
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
)}
 
       {showTransfertModal && selectedTransfert && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
    <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border-4 border-blue-200">
      <div className="flex items-center justify-between p-6 border-b-4 border-purple-300 bg-gradient-to-r from-blue-600 to-blue-700">
        <div>
          <h3 className="text-xl font-semibold text-white">Dossier Transfert: {selectedTransfert.reference}</h3>
          <p className="text-purple-100 text-sm mt-1">Créé le {formatDate(selectedTransfert.dateCreation)}</p>
        </div>
        <button
          onClick={() => setShowTransfertModal(false)}
          className="text-white hover:text-gray-200 p-2 hover:bg-white/20 rounded-full transition-all duration-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
        {/* Informations client */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Informations client
            </h4>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-500">Nom complet:</span>
                <p className="text-sm text-gray-900">{selectedTransfert.nom} {selectedTransfert.prenom}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Email:</span>
                <p className="text-sm text-gray-900">{selectedTransfert.email}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Téléphone:</span>
                <p className="text-sm text-gray-900">{selectedTransfert.telephone || 'Non renseigné'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Profession:</span>
                <p className="text-sm text-gray-900">{selectedTransfert.profession}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Sexe:</span>
                <p className="text-sm text-gray-900">{selectedTransfert.sexe === 'H' ? 'Homme' : 'Femme'}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Détails du transfert
            </h4>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-500">Type de transfert:</span>
                <p className="text-sm text-gray-900">{selectedTransfert.typeTransfert}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Période:</span>
                <p className="text-sm text-gray-900">
                  Du {new Date(selectedTransfert.dateDebut).toLocaleDateString('fr-FR')} au {new Date(selectedTransfert.dateFin).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Statut:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  selectedTransfert.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                  selectedTransfert.statut === 'partiellement_apuré' ? 'bg-orange-100 text-orange-800' :
                  selectedTransfert.statut === 'apuré' ? 'bg-green-100 text-green-800' :
                  selectedTransfert.statut === 'archivé' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedTransfert.statut}
                </span>
              </div>
              {selectedTransfert.motifRejet && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Motif rejet:</span>
                  <p className="text-sm text-red-600">{selectedTransfert.motifRejet}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fichiers */}
        <div className="bg-white border-2 border-blue-200 rounded-xl p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Fichiers ({selectedTransfert.fichiers.length})
          </h4>

          {selectedTransfert.fichiers.length > 0 ? (
            <div className="space-y-3">
              {selectedTransfert.fichiers.map((fichier, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-blue-100 rounded-lg bg-purple-50/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>

                    <div>
                      <p className="font-medium text-gray-900">
                        {fichier.nomOriginal || fichier.nom}
                      </p>
                      <p className="text-sm text-gray-600">{formatFileSize(fichier.taille)} • {fichier.extension}</p>
                    </div>
                  </div>
                 {/* 
		<button
                    onClick={() => downloadTransfertFile(fichier._id, fichier.nomOriginal || fichier.nom)}
                    className="text-purple-600 hover:text-purple-800 bg-purple-100 hover:bg-purple-200 px-3 py-1 rounded transition-all duration-300 text-sm"
                  >
                    Télécharger
                  </button>*/}
		<div className="flex items-center space-x-2">
  <button
    onClick={() => downloadTransfertFile(fichier._id, fichier.nomOriginal || fichier.nom)}
    className="text-blue-600 hover:text-purple-800 bg-blue-100 hover:bg-purple-200 px-3 py-1 rounded transition-all duration-300 text-sm"
  >
    Télécharger
  </button>
  {/* ✅ BOUTON SUPPRESSION AJOUTÉ ICI */}
  {canDeleteSubfoldersAndFiles() && selectedTransfert.statut !== 'rejeté' && (
    <button
      onClick={() => deleteFile(fichier._id, fichier.nomOriginal || fichier.nom, fichier.chemin)}
      className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1 rounded transition-all duration-300 text-sm"
    >
      Supprimer
    </button>
  )}
</div>
		
		
                </div>

              ))}
            </div>

          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2">Aucun fichier dans ce dossier</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 pt-6 border-t flex justify-end space-x-3">
          <button
            onClick={() => setShowTransfertModal(false)}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-300"
          >
            Fermer
          </button>
          {(currentUserRole === 'admin_bank' || currentUserRole === 'agent_saisie') && selectedTransfert.statut !== 'rejeté' && (
            <button
              onClick={() => confirmDelete('transfert', selectedTransfert)}
              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-300"
            >
              Supprimer le dossier
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
)}

        {showCreateUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-white">
                <h3 className="text-xl font-semibold text-gray-900">Créer un utilisateur</h3>
                <button
                  onClick={() => setShowCreateUserModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-full transition-all duration-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom d'utilisateur</label>
                    <input
                      type="text"
                      value={userForm.username}
                      onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Nom d'utilisateur"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Mot de passe (min 6 caractères)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({...userForm, role: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {currentUserRole === 'super_admin' ? (
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
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCreateUserModal(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-300"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={createUser}
                    className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all duration-300"
                  >
                    Créer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-white">
                <h3 className="text-xl font-semibold text-gray-900">Modifier l'utilisateur</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-full transition-all duration-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom d'utilisateur</label>
                    <input
                      type="text"
                      value={userForm.username}
                      onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe (optionnel)</label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Laisser vide pour ne pas changer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({...userForm, role: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {currentUserRole === 'super_admin' ? (
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
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-300"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={updateUser}
                    className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all duration-300"
                  >
                    Sauvegarder
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

         {showRejectModal && (dossierToReject || transfertToReject) && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border-4 border-red-200">
              <div className="p-6 border-b-4 border-red-300 bg-gradient-to-r from-red-600 to-rose-600">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mr-4">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Motif de rejet</h3>
                    <p className="text-red-100 text-sm mt-1">Dossier: {dossierToReject?.nom || transfertToReject?.nom}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-br from-red-50 to-white">
                <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Décrivez le motif du rejet *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:ring-4 focus:ring-red-500/30 focus:border-red-500 min-h-[140px] transition-all duration-300 hover:border-red-300 bg-white/80 backdrop-blur"
                  placeholder="Expliquez en détail pourquoi ce dossier est rejeté (documents manquants, non conformes, etc.)..."
                  required
                />
                <p className="text-xs text-gray-600 mt-2 flex items-center">
                  <svg className="w-4 h-4 text-yellow-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Le client recevra ce motif par email
                </p>
              </div>

              <div className="p-6 border-t-2 border-red-100 bg-gray-50 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                    setDossierToReject(null);
                  }}
                  className="px-6 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-100 border-2 border-gray-300 hover:border-gray-400 transition-all duration-300 font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmReject}
                  disabled={!rejectReason.trim()}
                  className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center ${
                    rejectReason.trim()
                      ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-red-500/50'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Valider le rejet
                </button>
              </div>
            </div>
          </div>
	)} 

        {showDeleteModal && deleteTarget && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                  Confirmer la suppression
                </h3>

                <p className="text-gray-600 text-center mb-6">
                  {deleteTarget.type === 'dossier'
                    ? `Êtes-vous sûr de vouloir supprimer le dossier "${deleteTarget.data.reference}" (${deleteTarget.data.nom}) et tous ses sous-dossiers ?`
                    : deleteTarget.type === 'transfert'
                    ? `Êtes-vous sûr de vouloir supprimer le dossier de transfert "${deleteTarget.data.reference}" (${deleteTarget.data.nom}) et tous ses fichiers ?`
                    : deleteTarget.type === 'user'
                    ? `Êtes-vous sûr de vouloir supprimer l'utilisateur "${deleteTarget.data.username}" ?`
                    : `Êtes-vous sûr de vouloir supprimer le sous-dossier "${deleteTarget.data.nom}" et tous ses fichiers ?`
                  }
                  <br />
                  <span className="text-red-600 font-medium">Cette action est irréversible.</span>
                </p>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-300"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-300"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <FormulaireClientModal
          isOpen={showFormulaireModal}
          onClose={() => setShowFormulaireModal(false)}
          API_URL={API_URL}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
