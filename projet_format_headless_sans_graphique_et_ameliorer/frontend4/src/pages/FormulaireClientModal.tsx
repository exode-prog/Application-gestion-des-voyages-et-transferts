import React, { useState } from 'react';

interface FormulaireClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  API_URL: string;
}

const FormulaireClientModal: React.FC<FormulaireClientModalProps> = ({ 
  isOpen, 
  onClose, 
  API_URL 
}) => {
  const [formulaireFile, setFormulaireFile] = useState<File | null>(null);
  const [uploadingFormulaire, setUploadingFormulaire] = useState(false);

  const uploadFormulaire = async () => {
    if (uploadingFormulaire) {
      console.log('⚠️ Upload déjà en cours, ignore...');
      return;
    }

    if (!formulaireFile) {
      alert('Veuillez sélectionner un fichier PDF');
      return;
    }

    if (formulaireFile.type !== 'application/pdf') {
      alert('Veuillez sélectionner un fichier PDF uniquement');
      return;
    }

    try {
      setUploadingFormulaire(true);
      
      const formData = new FormData();
      formData.append('formulaire', formulaireFile);

      console.log('📤 Début de l\'upload du formulaire...');

      const response = await fetch(`${API_URL}/api/documents/admin/formulaire-client`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      console.log('📨 Réponse reçue:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur serveur:', errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Upload réussi:', data);

      if (data.success) {
        alert(`✅ Formulaire client "${data.file?.nomOriginal || 'fichier'}" mis à jour avec succès`);
        onClose();
        setFormulaireFile(null);
      } else {
        throw new Error(data.message || 'Erreur inconnue lors de l\'upload');
      }

    } catch (error) {
      console.error('❌ Erreur upload formulaire:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      alert(`❌ Erreur lors de l'upload: ${errorMessage}`);
    } finally {
      setUploadingFormulaire(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-50 to-white">
          <h3 className="text-xl font-semibold text-gray-900">Formulaire Client</h3>
          <button
            onClick={onClose}
            disabled={uploadingFormulaire}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-full transition-all duration-300 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Téléverser le formulaire client (PDF uniquement)
            </label>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-all duration-300">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormulaireFile(file);
                  }
                }}
                className="hidden"
                id="formulaire-upload"
                disabled={uploadingFormulaire}
              />
              <label
                htmlFor="formulaire-upload"
                className="cursor-pointer block"
              >
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-gray-600">
                  {formulaireFile ? formulaireFile.name : 'Cliquez pour sélectionner un fichier PDF'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF uniquement • Max 10MB
                </p>
              </label>
            </div>

            {formulaireFile && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-green-800">{formulaireFile.name}</span>
                </div>
                <button
                  onClick={() => setFormulaireFile(null)}
                  className="text-red-600 hover:text-red-800 text-sm"
                  disabled={uploadingFormulaire}
                >
                  Supprimer
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-300"
              disabled={uploadingFormulaire}
            >
              Annuler
            </button>
            <button
  onClick={uploadFormulaire}
  disabled={!formulaireFile || uploadingFormulaire}
  className={`px-4 py-2 text-white rounded-lg transition-all duration-300 flex items-center ${
    !formulaireFile || uploadingFormulaire
      ? 'bg-gray-400 cursor-not-allowed'
      : 'bg-green-600 hover:bg-green-700'
  }`}
>
  {uploadingFormulaire && (
    <div className="flex items-center">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
      Envoi...
    </div>
  )}
  {!uploadingFormulaire && (
    <div className="flex items-center">
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      Téléverser
    </div>
  )}
</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormulaireClientModal;
