import React, { useState } from 'react';
import { Document, documentService } from '../services/api';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';
import { useToast } from './Toast';

interface DocumentTableProps {
  documents: Document[];
  loading: boolean;
  filters: any;
  onFiltersChange: (filters: any) => void;
  onUpdate: () => void;
  onEmailClick: (email: string) => void;
}

const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  loading,
  filters,
  onFiltersChange,
  onUpdate,
  onEmailClick,
}) => {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState({
    statut: '',
    motif: '',
    dateDebut: '',
    dateFin: '',
  });
  const [actionLoading, setActionLoading] = useState(false);

  const toast = useToast();

  // Ouvrir les modals
  const openDetailsModal = (document: Document) => {
    setSelectedDocument(document);
    setShowDetailsModal(true);
  };

  const openEditModal = (document: Document) => {
    setSelectedDocument(document);
    setEditForm({
      statut: document.statut,
      motif: document.motif,
      dateDebut: document.dateDebut.split('T')[0],
      dateFin: document.dateFin.split('T')[0],
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (document: Document) => {
    setSelectedDocument(document);
    setShowDeleteModal(true);
  };

  // Fermer les modals
  const closeModals = () => {
    setSelectedDocument(null);
    setShowDetailsModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
  };

  // Mettre à jour un document
  const handleUpdate = async () => {
    if (!selectedDocument) return;

    setActionLoading(true);
    try {
      await documentService.update(selectedDocument._id, editForm);
      toast.success('Document mis à jour avec succès');
      closeModals();
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setActionLoading(false);
    }
  };

  // Supprimer un document
  const handleDelete = async () => {
    if (!selectedDocument) return;

    setActionLoading(true);
    try {
      await documentService.delete(selectedDocument._id);
      toast.success('Document supprimé avec succès');
      closeModals();
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setActionLoading(false);
    }
  };

  // Télécharger un fichier
  const handleDownload = async (documentId: string, fileId: string) => {
    try {
      await documentService.downloadFile(documentId, fileId);
      toast.success('Téléchargement démarré');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du téléchargement');
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formater la taille de fichier
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Badge de statut
  const getStatusBadge = (statut: string) => {
    const badges = {
      en_attente: 'badge badge-warning',
      traite: 'badge badge-success',
      archive: 'badge badge-info',
    };
    
    const labels = {
      en_attente: 'En attente',
      partiellement_apuré : 'Partiellement Apuré ',
      apuré : 'Apuré ',
      archivé : 'Archivé',
      rejeté : 'Rejeté ',

    };

    return (
      <span className={badges[statut as keyof typeof badges]}>
        {labels[statut as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="card">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filtres et recherche</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={filters.statut}
                onChange={(e) => onFiltersChange({ ...filters, statut: e.target.value, page: 1 })}
                className="input-field"
              >
                <option value="">Tous les statuts</option>
                <option value="en_attente">En attente</option>
		<option value="partiellement_apuré ">Partiellement Apuré</option>
               <option value="apuré "> Apuré</option>
		<option value="archivé">Archivé</option>
                <option value="rejeté">Rejeté</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={filters.email || ''}
                onChange={(e) => onFiltersChange({ ...filters, email: e.target.value, page: 1 })}
                className="input-field"
                placeholder="Rechercher par email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Extension
              </label>
              <input
                type="text"
                value={filters.extension || ''}
                onChange={(e) => onFiltersChange({ ...filters, extension: e.target.value, page: 1 })}
                className="input-field"
                placeholder=".pdf, .jpg, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date début
              </label>
              <input
                type="date"
                value={filters.dateDebut || ''}
                onChange={(e) => onFiltersChange({ ...filters, dateDebut: e.target.value, page: 1 })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date fin
              </label>
              <input
                type="date"
                value={filters.dateFin || ''}
                onChange={(e) => onFiltersChange({ ...filters, dateFin: e.target.value, page: 1 })}
                className="input-field"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => onFiltersChange({
                  statut: '',
                  extension: '',
                  dateDebut: '',
                  dateFin: '',
                  email: '',
                  page: 1,
                  limit: 10,
                })}
                className="btn btn-secondary w-full"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="card">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Documents ({documents.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" text="Chargement des documents..." />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-lg">Aucun document trouvé</p>
              <p className="text-gray-400 text-sm mt-1">Les documents soumis apparaîtront ici</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Motif
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fichiers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((document) => (
                    <tr key={document._id} className="table-row">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {document.nom} {document.prenom}
                          </p>
                          <p className="text-sm text-gray-500">
                            📁 {document.dossierClient}
                          </p>
                          <p className="text-xs text-gray-400">
                            📅 {document.sousDossierDate}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <button
                            onClick={() => onEmailClick(document.email)}
                            className="text-sm text-primary-600 hover:text-primary-800 transition-colors duration-200 flex items-center"
                            title="Contacter par email"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {document.email}
                          </button>
                          <p className="text-sm text-gray-500">{document.telephone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 max-w-xs truncate" title={document.motif}>
                          {document.motif}
                        </p>
                        <p className="text-xs text-gray-500">
                          Du {formatDate(document.dateDebut)} au {formatDate(document.dateFin)}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-900">{document.fichiers.length}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {document.fichiers.reduce((total, f) => total + f.taille, 0) > 0 
                            ? formatFileSize(document.fichiers.reduce((total, f) => total + f.taille, 0))
                            : 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(document.statut)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <p>{formatDate(document.createdAt)}</p>
                          <p className="text-xs text-gray-400">
                            Créé il y a {Math.floor((Date.now() - new Date(document.createdAt).getTime()) / (1000 * 60 * 60 * 24))} jour(s)
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openDetailsModal(document)}
                            className="text-primary-600 hover:text-primary-800 transition-colors duration-200 p-1"
                            title="Voir les détails"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openEditModal(document)}
                            className="text-yellow-600 hover:text-yellow-800 transition-colors duration-200 p-1"
                            title="Modifier"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openDeleteModal(document)}
                            className="text-red-600 hover:text-red-800 transition-colors duration-200 p-1"
                            title="Supprimer"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal des détails */}
      <Modal
        isOpen={showDetailsModal}
        onClose={closeModals}
        title="Détails du document"
        size="xl"
      >
        {selectedDocument && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Informations client
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Nom complet:</span>
                    <p className="text-sm text-gray-900">{selectedDocument.nom} {selectedDocument.prenom}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Email:</span>
                    <button
                      onClick={() => onEmailClick(selectedDocument.email)}
                      className="text-sm text-primary-600 hover:text-primary-800 ml-1 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {selectedDocument.email}
                    </button>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Téléphone:</span>
                    <p className="text-sm text-gray-900">{selectedDocument.telephone}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Statut:</span>
                    <div className="mt-1">{getStatusBadge(selectedDocument.statut)}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Détails de la demande
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Période demandée:</span>
                    <p className="text-sm text-gray-900">
                      Du {formatDate(selectedDocument.dateDebut)} au {formatDate(selectedDocument.dateFin)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Date de soumission:</span>
                    <p className="text-sm text-gray-900">{formatDate(selectedDocument.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Dossier:</span>
                    <p className="text-sm text-gray-900">📁 {selectedDocument.dossierClient}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Sous-dossier:</span>
                    <p className="text-sm text-gray-900">📅 {selectedDocument.sousDossierDate}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Motif de la demande
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedDocument.motif}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Fichiers joints ({selectedDocument.fichiers.length})
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 gap-3">
                  {selectedDocument.fichiers.map((fichier) => (
                    <div
                      key={fichier._id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{fichier.nomOriginal}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(fichier.taille)} • {fichier.extension} • 
                            Ajouté le {formatDate(fichier.dateUpload)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(selectedDocument._id, fichier._id)}
                        className="btn btn-primary btn-sm flex items-center hover-lift"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Télécharger
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de modification */}
      <Modal
        isOpen={showEditModal}
        onClose={closeModals}
        title="Modifier le document"
        size="md"
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={editForm.statut}
              onChange={(e) => setEditForm({ ...editForm, statut: e.target.value })}
              className="input-field"
            >
              	
	        <option value="en_attente">En attente</option>
                <option value="partiellement_apuré ">Partiellement Apuré</option>
                <option value="apuré "> Apuré</option>
                <option value="archivé">Archivé</option>
                <option value="rejeté">Rejeté</option>
             


            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motif
            </label>
            <textarea
              value={editForm.motif}
              onChange={(e) => setEditForm({ ...editForm, motif: e.target.value })}
              className="input-field"
              rows={4}
              placeholder="Motif de la demande"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date début
              </label>
              <input
                type="date"
                value={editForm.dateDebut}
                onChange={(e) => setEditForm({ ...editForm, dateDebut: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date fin
              </label>
              <input
                type="date"
                value={editForm.dateFin}
                onChange={(e) => setEditForm({ ...editForm, dateFin: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={closeModals}
              className="btn btn-secondary flex-1"
              disabled={actionLoading}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              className="btn btn-primary flex-1"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" text="" />
                  <span className="ml-2">Sauvegarde...</span>
                </div>
              ) : (
                'Sauvegarder'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={closeModals}
        title="Confirmer la suppression"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Supprimer ce document ?
          </h3>
          {selectedDocument && (
            <div className="text-gray-600 mb-6">
              <p>Êtes-vous sûr de vouloir supprimer le document de</p>
              <p className="font-medium">{selectedDocument.nom} {selectedDocument.prenom}</p>
              <p className="text-sm text-red-600 mt-2">
                ⚠️ Cette action supprimera également tous les fichiers joints ({selectedDocument.fichiers.length} fichier(s))
              </p>
            </div>
          )}
          <div className="flex space-x-4">
            <button
              onClick={closeModals}
              className="btn btn-secondary flex-1"
              disabled={actionLoading}
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-danger flex-1"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" text="" />
                  <span className="ml-2">Suppression...</span>
                </div>
              ) : (
                'Supprimer'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentTable;
