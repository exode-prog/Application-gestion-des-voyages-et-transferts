import React, { useState, useRef, useEffect } from 'react';
import { Phone, AlertCircle } from 'lucide-react';
import { documentService } from '../services/api';

const raisonsVoyage = [
  { value: 'mission', label: 'Mission' },
  { value: 'formation', label: 'Formation' },
  { value: 'etudes', label: 'Études' },
  { value: 'autres', label: 'Autres' },
];

const typesTransfert = [
  'Allocation de devises pour les opérations de faibles montants',
  'Achat de bien',
  'Achat de services',
  'Frais d\'assistance technique',
  'Importation de billets étrangers',
  'Allocation de devises aux voyageurs',
  'Revenus du travail (exclusivement pour les résidents étrangers et les non résidents)',
];
const getFlagEmoji = (countryCode: string) => {
  if (!countryCode) return '🏳️';
  const code = countryCode.toUpperCase();
  if (code.length === 2 && /^[A-Z]{2}$/.test(code)) {
    try {
      return String.fromCodePoint(
        ...Array.from(code).map(char => 127397 + char.charCodeAt(0))
      );
    } catch (error) {
      return '🏳️';
    }
  }
  return '🏳️';
};

export default function ClientForm() {
  const [activeTab, setActiveTab] = useState('voyage');
  const [showCountries, setShowCountries] = useState(false);
  const [countries, setCountries] = useState<Array<{code: string, name: string}>>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [countriesError, setCountriesError] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
      pays: [] as string[],
    raison: '',
    autreRaison: '',
    profession: '',
    sexe: '',
    dateDebut: '',
    dateFin: '',
    typeTransfert: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFileSizeError, setShowFileSizeError] = useState(false);
  const [oversizedFileName, setOversizedFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_URL = process.env.REACT_APP_API_URL || '';
  const countriesDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoadingCountries(true);
        setCountriesError(false);
        
        const response = await fetch('https://restcountries.com/v3.1/all?fields=cca2,name,translations');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
          const countryMap = new Map();
          
          data.forEach((country: any) => {
            const code = country.cca2;
            const name = country.translations?.fra?.common || country.name.common;
            
            if (!countryMap.has(code)) {
              countryMap.set(code, {
                code: code,
                name: name,
              });
            }
          });
          
          const formattedCountries = Array.from(countryMap.values())
            .sort((a: any, b: any) => a.name.localeCompare(b.name, 'fr'));
          
          setCountries(formattedCountries);
          setLoadingCountries(false);
          console.log('✅ API PRINCIPALE utilisée - Pays chargés via restcountries.com/v3.1');
        } else {
          throw new Error('Format de données invalide');
        }
        
      } catch (error) {
        console.error('Erreur lors du chargement des pays:', error);
        
        try {
          console.log('Tentative avec API de secours...');
          const backupResponse = await fetch('https://restcountries.com/v2/all?fields=alpha2Code,name');
          
          if (backupResponse.ok) {
            const backupData = await backupResponse.json();
            
            const countryMap = new Map();
            
            backupData.forEach((country: any) => {
              const code = country.alpha2Code;
              const name = country.name;
              
              if (!countryMap.has(code)) {
                countryMap.set(code, {
                  code: code,
                  name: name,
                });
              }
            });
            
            const formattedCountries = Array.from(countryMap.values())
              .sort((a: any, b: any) => a.name.localeCompare(b.name, 'fr'));
            
            setCountries(formattedCountries);
            setLoadingCountries(false);
	    console.log('🔄 API DE SECOURS utilisée - Pays chargés via restcountries.com/v2');
            return;
          }
        } catch (backupError) {
          console.error('L\'API de secours a également échoué:', backupError);
        }
        
        console.log('Utilisation de la liste de pays de secours...');
        const fallbackCountries = [
          'Afghanistan', 'Afrique du Sud', 'Albanie', 'Algérie', 'Allemagne', 'Andorre', 'Angola', 
          'Arabie Saoudite', 'Argentine', 'Arménie', 'Australie', 'Autriche', 'Azerbaïdjan',
          'Bahamas', 'Bahreïn', 'Bangladesh', 'Barbade', 'Belgique', 'Bélize', 'Bénin', 'Bhoutan',
          'Biélorussie', 'Birmanie', 'Bolivie', 'Bosnie-Herzégovine', 'Botswana', 'Brésil', 
          'Brunei', 'Bulgarie', 'Burkina Faso', 'Burundi',
          'Cambodge', 'Cameroun', 'Canada', 'Cap-Vert', 'Chili', 'Chine', 'Chypre', 'Colombie',
          'Comores', 'Congo', 'Corée du Nord', 'Corée du Sud', 'Costa Rica', 'Côte d\'Ivoire', 
          'Croatie', 'Cuba',
          'Danemark', 'Djibouti', 'Dominique',
          'Égypte', 'Émirats Arabes Unis', 'Équateur', 'Érythrée', 'Espagne', 'Estonie', 
          'Eswatini', 'États-Unis', 'Éthiopie',
          'Fidji', 'Finlande', 'France',
          'Gabon', 'Gambie', 'Géorgie', 'Ghana', 'Grèce', 'Grenade', 'Guatemala', 'Guinée',
          'Guinée équatoriale', 'Guinée-Bissau', 'Guyana',
          'Haïti', 'Honduras', 'Hongrie',
          'Inde', 'Indonésie', 'Irak', 'Iran', 'Irlande', 'Islande', 'Israël', 'Italie',
          'Jamaïque', 'Japon', 'Jordanie',
          'Kazakhstan', 'Kenya', 'Kirghizistan', 'Kiribati', 'Koweït',
          'Laos', 'Lesotho', 'Lettonie', 'Liban', 'Liberia', 'Libye', 'Liechtenstein', 'Lituanie',
          'Luxembourg',
          'Macédoine du Nord', 'Madagascar', 'Malaisie', 'Malawi', 'Maldives', 'Mali', 'Malte',
          'Maroc', 'Marshall', 'Maurice', 'Mauritanie', 'Mexique', 'Micronésie', 'Moldavie',
          'Monaco', 'Mongolie', 'Monténégro', 'Mozambique',
          'Namibie', 'Nauru', 'Népal', 'Nicaragua', 'Niger', 'Nigeria', 'Norvège', 'Nouvelle-Zélande',
          'Oman', 'Ouganda', 'Ouzbékistan',
          'Pakistan', 'Palaos', 'Palestine', 'Panama', 'Papouasie-Nouvelle-Guinée', 'Paraguay',
          'Pays-Bas', 'Pérou', 'Philippines', 'Pologne', 'Portugal',
          'Qatar',
          'Roumanie', 'Royaume-Uni', 'Russie', 'Rwanda',
          'Saint-Christophe-et-Niévès', 'Sainte-Lucie', 'Saint-Marin', 'Saint-Vincent-et-les-Grenadines',
          'Salomon', 'Salvador', 'Samoa', 'Sao Tomé-et-Principe', 'Sénégal', 'Serbie', 'Seychelles',
          'Sierra Leone', 'Singapour', 'Slovaquie', 'Slovénie', 'Somalie', 'Soudan', 'Soudan du Sud',
          'Sri Lanka', 'Suède', 'Suisse', 'Suriname', 'Syrie',
          'Tadjikistan', 'Tanzanie', 'Tchad', 'République Tchèque', 'Thaïlande', 'Timor oriental',
          'Togo', 'Tonga', 'Trinité-et-Tobago', 'Tunisie', 'Turkménistan', 'Turquie', 'Tuvalu',
          'Ukraine', 'Uruguay',
          'Vanuatu', 'Vatican', 'Venezuela', 'Vietnam',
          'Yémen',
          'Zambie', 'Zimbabwe'
        ].sort((a, b) => a.localeCompare(b, 'fr'))
        .map((countryName, index) => ({
          code: `C${index.toString().padStart(3, '0')}`,
          name: countryName,
        }));
        
        setCountries(fallbackCountries);
        setCountriesError(true);
        setLoadingCountries(false);
	 console.log('📋 LISTE MANUELLE utilisée - API échouée, utilisation de la liste de secours');
      }
    };

    fetchCountries();
  }, []);
 
useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCountries && 
          countriesDropdownRef.current && 
          !countriesDropdownRef.current.contains(event.target as Node) &&
          !(event.target as Element).closest('.countries-button')) {
        setShowCountries(false);
      }
    };
document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCountries]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const newFiles = Array.from(selectedFiles);
    const maxSize = 100 * 1024 * 1024;
    
    const invalidFiles = newFiles.filter((file: File) => file.size > maxSize);
    if (invalidFiles.length > 0) {
      setOversizedFileName(invalidFiles[0].name);
      setShowFileSizeError(true);
      return;
    }
    
    const validFiles = newFiles.filter((file: File) => file.size <= maxSize);
    setFiles(prev => [...prev, ...validFiles]);
    if (errors.files) {
      setErrors(prev => ({ ...prev, files: '' }));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.prenom.trim()) newErrors.prenom = 'Le prénom est requis';
    if (!formData.email.trim()) newErrors.email = 'L\'email est requis';
    if (!formData.telephone.trim()) newErrors.telephone = 'Le téléphone est requis';
    if (!formData.profession.trim()) newErrors.profession = 'La profession est requise';
    if (!formData.sexe) newErrors.sexe = 'Le sexe est requis';
    
    if (activeTab === 'voyage') {
      if (!formData.dateDebut) newErrors.dateDebut = 'La date de début est requise';
      if (!formData.dateFin) newErrors.dateFin = 'La date de fin est requise';
    }
    
    if (activeTab === 'voyage') {
      if (!formData.pays || formData.pays.length === 0) newErrors.pays = 'Au moins un pays est requis';
      if (!formData.raison) newErrors.raison = 'La raison du voyage est requise';
      if (formData.raison === 'autres' && !formData.autreRaison.trim()) {
        newErrors.autreRaison = 'Veuillez préciser la raison';
      }
    } else {
      if (!formData.typeTransfert) newErrors.typeTransfert = 'Le type de transfert est requis';
    }

    if (files.length === 0) newErrors.files = 'Au moins un fichier est requis';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendWhatsAppMessage = async (telephone: string, type: string) => {
    try {
      const message = type === 'voyage' 
        ? `Bonjour ${formData.prenom} ${formData.nom}, nous avons bien reçu vos documents de voyage. Notre équipe les examine actuellement. Nous vous contacterons bientôt.`
        : `Bonjour ${formData.prenom} ${formData.nom}, nous avons bien reçu votre dossier de transfert (${formData.typeTransfert}). Notre équipe l'examine actuellement. Nous vous contacterons bientôt.`;
      
      const clientPhoneNumber = telephone.replace(/[^0-9+]/g, '');
      
      console.log('🚀 Début envoi WhatsApp automatique');
      console.log('📞 Numéro client:', clientPhoneNumber);
      console.log('👤 Nom client:', `${formData.prenom} ${formData.nom}`);
      console.log('📋 Type:', type);

      const response = await fetch('http://localhost:5000/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: clientPhoneNumber,
          message: message,
          clientName: `${formData.prenom} ${formData.nom}`,
          type: type
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ SUCCÈS - Message WhatsApp envoyé automatiquement');
        console.log('📨 ID Message:', result.messageId);
        console.log('🌍 Destinataire:', result.to);
        console.log('📊 Statut:', result.status);
      } else {
        console.warn('⚠️ WhatsApp échoué:', result.error);
      }

      return true;
      
    } catch (error) {
      console.error('❌ Erreur technique WhatsApp:', error);
      return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('nom', formData.nom);
      formDataToSend.append('prenom', formData.prenom);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('telephone', formData.telephone);
      formDataToSend.append('profession', formData.profession);
      formDataToSend.append('sexe', formData.sexe);
      
      if (activeTab === 'voyage') {
        formDataToSend.append('dateDebut', formData.dateDebut);
        formDataToSend.append('dateFin', formData.dateFin);
        formData.pays.forEach((pays: string) => {
          formDataToSend.append('pays', pays);
        });
        formDataToSend.append('raison', formData.raison);
        if (formData.autreRaison) {
          formDataToSend.append('autreRaison', formData.autreRaison);
        }
      } else {
        formDataToSend.append('typeTransfert', formData.typeTransfert);
        if (formData.dateDebut) formDataToSend.append('dateDebut', formData.dateDebut);
        if (formData.dateFin) formDataToSend.append('dateFin', formData.dateFin);
      }
      
      files.forEach(file => {
        formDataToSend.append('file', file);
      });

      console.log('📦 Données envoyées:');
      console.log('Nom:', formData.nom);
      console.log('Prénom:', formData.prenom);
      console.log('Email:', formData.email);
      console.log('Téléphone:', formData.telephone);
      console.log('Profession:', formData.profession);
      console.log('Sexe:', formData.sexe);
      console.log('Fichiers:', files.length, 'fichier(s)');
      if (activeTab === 'voyage') {
        console.log('Pays:', formData.pays.join(', '));
        console.log('Raison:', formData.raison);
        console.log('Date début:', formData.dateDebut);
        console.log('Date fin:', formData.dateFin);
      } else {
        console.log('Type transfert:', formData.typeTransfert);
      }

      const result = activeTab === 'voyage' 
        ? await documentService.submit(formDataToSend)
        : await documentService.submitTransfert(formDataToSend);

      console.log('✅ Soumission réussie!', result);
      
      await sendWhatsAppMessage(formData.telephone, activeTab);
      setShowSuccess(true);
      
    } catch (error: any) {
      console.error('❌ ERREUR:', error);
      const errorMessage = error.response?.data?.message || error.message;
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '', prenom: '', email: '', telephone: '', pays: [], raison: '',
      autreRaison: '', profession: '', sexe: '', dateDebut: '', dateFin: '', typeTransfert: '',
    });
    setFiles([]);
    setErrors({});
    setShowSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-center space-x-4 mb-4">

            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
              <img 
                src="/logo.png" 
                alt="DataCollectApp Logo" 
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
                DataCollectApp
              </h1>
              <p className="text-blue-600 font-medium">Soumission de documents en ligne</p>
            </div>
          </div>
          
          <div className="text-center mt-4">
            <a
              href={`${API_URL}/api/documents/formulaire-limite.pdf`}
              className="text-blue-600 hover:text-blue-800 underline text-sm"
              download="formulaire-limite.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              Vous pouvez également télécharger le formulaire de limite ici
            </a>
          </div>

        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('voyage')}
              className={`flex-1 py-4 px-6 font-semibold transition-all ${
                activeTab === 'voyage'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Soumettre vos documents de voyage
            </button>
            <button
              onClick={() => setActiveTab('transfert')}
              className={`flex-1 py-4 px-6 font-semibold transition-all ${
                activeTab === 'transfert'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Soumettre un dossier de transfert
            </button>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      errors.nom ? 'border-red-300' : 'border-blue-100'
                    } focus:border-blue-500 focus:outline-none`}
                    placeholder="Votre nom"
                  />
                  {errors.nom && <p className="text-red-500 text-sm mt-1">{errors.nom}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      errors.prenom ? 'border-red-300' : 'border-blue-100'
                    } focus:border-blue-500 focus:outline-none`}
                    placeholder="Votre prénom"
                  />
                  {errors.prenom && <p className="text-red-500 text-sm mt-1">{errors.prenom}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      errors.email ? 'border-red-300' : 'border-blue-100'
                    } focus:border-blue-500 focus:outline-none`}
                    placeholder="votre.email@exemple.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-green-600" />
                    WhatsApp <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      errors.telephone ? 'border-red-300' : 'border-blue-100'
                    } focus:border-blue-500 focus:outline-none`}
                    placeholder="+236 XX XX XX XX"
                  />
                  {errors.telephone && <p className="text-red-500 text-sm mt-1">{errors.telephone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Profession <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="profession"
                    value={formData.profession}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      errors.profession ? 'border-red-300' : 'border-blue-100'
                    } focus:border-blue-500 focus:outline-none`}
                    placeholder="Votre profession"
                  />
                  {errors.profession && <p className="text-red-500 text-sm mt-1">{errors.profession}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sexe <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-6 pt-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="sexe"
                        value="H"
                        checked={formData.sexe === 'H'}
                        onChange={handleInputChange}
                        className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700 font-medium">Homme</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="sexe"
                        value="F"
                        checked={formData.sexe === 'F'}
                        onChange={handleInputChange}
                        className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700 font-medium">Femme</span>
                    </label>
                  </div>
                  {errors.sexe && <p className="text-red-500 text-sm mt-1">{errors.sexe}</p>}
                </div>
              </div>


{activeTab === 'voyage' && (
  <>
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Pays à visiter <span className="text-red-500">*</span>
        {countriesError && (
          <span className="text-orange-500 text-xs ml-2">
            (Liste de secours - recharger la page si besoin)
          </span>
        )}
      </label>
      
      {/* Bouton pour ouvrir/fermer la liste */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowCountries(!showCountries)}
          className="countries-button w-full px-4 py-3 rounded-xl border-2 border-blue-100 bg-white text-left focus:border-blue-500 focus:outline-none hover:border-blue-300 transition-colors"
        >
          <div className="flex justify-between items-center">
            <span className="text-gray-700">
              {formData.pays.length === 0 
                ? 'Sélectionnez un ou des pays à visiter' 
                : `${formData.pays.length} pays sélectionné(s)`
              }
            </span>
            <svg 
              className={`w-5 h-5 text-gray-500 transform transition-transform ${showCountries ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Liste déroulante des pays */}
	        {showCountries && (
	          <div 
	            ref={countriesDropdownRef}
	            className="countries-dropdown absolute z-10 w-full mt-1 max-h-60 overflow-y-auto border-2 border-blue-100 rounded-xl bg-white shadow-lg">
            {loadingCountries ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 text-sm mt-2">Chargement des pays...</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {countries.map(country => (
                  <label key={country.name} className="flex items-center justify-between p-2 hover:bg-blue-50 rounded-lg cursor-pointer">
                    <span className="text-sm text-gray-700 flex items-center">
                      <span className="mr-2 text-lg">{getFlagEmoji(country.code)}</span>
                      {country.name}
                    </span>
                    <input
                      type="checkbox"
                      value={country.name}
                      checked={formData.pays.includes(country.name)}
                      onChange={(e) => {
                        const { value, checked } = e.target;
                        setFormData(prev => ({
                          ...prev,
                          pays: checked 
                            ? [...prev.pays, value]
                            : prev.pays.filter(p => p !== value)
                        }));
                        
                        if (checked && errors.pays) {
                          setErrors(prev => ({ ...prev, pays: '' }));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Afficher les pays sélectionnés */}
      {formData.pays.length > 0 && (
        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
          {/*<p className="text-sm font-medium text-green-800 mb-2">
            ✅ {formData.pays.length} pays sélectionné(s) :
          </p>*/}
          <div className="flex flex-wrap gap-2">
            {formData.pays.map(paysName => {
              const country = countries.find(c => c.name === paysName);
              return (
                <span 
                  key={paysName} 
                  className="inline-flex items-center px-3 py-1 bg-green-500 text-white text-sm rounded-full hover:bg-green-600 transition-colors cursor-pointer"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      pays: prev.pays.filter(p => p !== paysName)
                    }));
                  }}
                >
                  {country ? getFlagEmoji(country.code) : '🏳️'} {paysName}
                  <span className="ml-2 text-xs">×</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
      
      {errors.pays && (
        <p className="text-red-500 text-sm mt-2 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {errors.pays}
        </p>
      )}
    </div>

    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Raison du voyage <span className="text-red-500">*</span>
      </label>
      <select
        name="raison"
        value={formData.raison}
        onChange={handleInputChange}
        className={`w-full px-4 py-3 rounded-xl border-2 ${
          errors.raison ? 'border-red-300' : 'border-blue-100'
        } focus:border-blue-500 focus:outline-none`}
      >
        <option value="" disabled>Sélectionnez une raison</option>
        {raisonsVoyage.map(raison => (
          <option key={raison.value} value={raison.value}>
            {raison.label}
          </option>
        ))}
      </select>
      {errors.raison && <p className="text-red-500 text-sm mt-1">{errors.raison}</p>}
    </div>

    {formData.raison === 'autres' && (
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Précisez la raison <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="autreRaison"
          value={formData.autreRaison}
          onChange={handleInputChange}
          className={`w-full px-4 py-3 rounded-xl border-2 ${
            errors.autreRaison ? 'border-red-300' : 'border-blue-100'
          } focus:border-blue-500 focus:outline-none`}
          placeholder="Décrivez la raison de votre voyage"
        />
        {errors.autreRaison && <p className="text-red-500 text-sm mt-1">{errors.autreRaison}</p>}
      </div>
    )}
  </>
)}
              {activeTab === 'transfert' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type de transfert <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="typeTransfert"
                    value={formData.typeTransfert}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      errors.typeTransfert ? 'border-red-300' : 'border-blue-100'
                    } focus:border-blue-500 focus:outline-none`}
                  >
                    <option value="" disabled>Sélectionnez le type de transfert</option>
                    {typesTransfert.map((type, index) => (
                      <option key={index} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.typeTransfert && <p className="text-red-500 text-sm mt-1">{errors.typeTransfert}</p>}
                </div>
              )}

              {activeTab === 'voyage' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date de début <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="dateDebut"
                      value={formData.dateDebut}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border-2 ${
                        errors.dateDebut ? 'border-red-300' : 'border-blue-100'
                      } focus:border-blue-500 focus:outline-none`}
                    />
                    {errors.dateDebut && <p className="text-red-500 text-sm mt-1">{errors.dateDebut}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date de fin <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="dateFin"
                      value={formData.dateFin}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border-2 ${
                        errors.dateFin ? 'border-red-300' : 'border-blue-100'
                      } focus:border-blue-500 focus:outline-none`}
                    />
                    {errors.dateFin && <p className="text-red-500 text-sm mt-1">{errors.dateFin}</p>}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Documents à joindre <span className="text-red-500">*</span>
                </label>
                <div
                  className={`relative rounded-2xl border-3 border-dashed transition-all duration-300 cursor-pointer p-8 ${
                    dragOver ? 'border-blue-500 bg-blue-50' : errors.files ? 'border-red-300 bg-red-50/30' : 'border-blue-200 hover:border-blue-400 bg-blue-50/30'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-center">
                    <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                      <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-gray-700 font-medium mb-2">
                      Glissez-déposez vos fichiers ici ou <span className="text-blue-600 font-bold">cliquez pour parcourir</span>
                    </p>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" multiple onChange={(e) => handleFileSelect(e.target.files)} className="hidden" />
                {errors.files && <p className="text-red-500 text-sm mt-2">{errors.files}</p>}

                {files.length > 0 && (
                  <div className="mt-6 space-y-3">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border-2 border-blue-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => removeFile(index)} className="w-8 h-8 rounded-full bg-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                          <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-8 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-lg rounded-xl hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                >
                  {isSubmitting ? <span>Envoi en cours...</span> : <span>Valider et envoyer</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showFileSizeError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-10 text-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Fichier trop volumineux</h3>
            <p className="text-gray-600 mb-2">
              Le fichier <span className="font-semibold text-gray-900">{oversizedFileName}</span> dépasse la taille maximale autorisée.
            </p>
            <p className="text-gray-600 mb-8">
              Taille maximale : <span className="font-bold text-blue-600">100 MB</span>
            </p>
            <button onClick={() => setShowFileSizeError(false)} className="w-full py-4 px-8 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-lg rounded-xl hover:from-red-700 hover:to-red-600 transition-all">
              Compris
            </button>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-10 text-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
              <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">Envoi réussi !</h3>
            <p className="text-gray-600 mb-2 text-lg">
              {activeTab === 'voyage' 
                ? 'Vos documents de voyage ont été transmis avec succès.'
                : 'Votre dossier de transfert a été transmis avec succès.'}
            </p>
            <p className="text-gray-600 mb-8 flex items-center justify-center">
              <Phone className="w-5 h-5 mr-2 text-green-600" />
              <span className="text-sm">Un message de confirmation a été envoyé sur votre WhatsApp.</span>
            </p>
            <button
              onClick={resetForm}
              className="w-full py-4 px-8 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-lg rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      <style>{`
        .border-3 {
          border-width: 3px;
        }
      `}</style>
    </div>
  );
}
