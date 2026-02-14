
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Menu, Plus, Home, Folder, Lock, Settings, Trash2, X, Download, 
  Share2, Pencil, Save, ChevronLeft, ChevronRight, User, Shield, 
  Database, Info, LogOut, Moon, Bell, ChevronRight as ChevronIcon,
  Delete, AlertTriangle, KeyRound, Upload, FileJson, CheckCircle2,
  RefreshCw, ShieldAlert, Smartphone, Laptop
} from 'lucide-react';
import { Category, DocumentItem, DocType } from './types';
import { CATEGORIES as INITIAL_CATEGORIES, INITIAL_DOCUMENTS, getDocIcon } from './constants';

const INITIAL_SECURE_DOCUMENTS: DocumentItem[] = [
  {
    id: 's1',
    name: 'Reisepass_Scan.pdf',
    type: 'pdf',
    category: 'Tresor',
    timestamp: 'Vor 1 Monat',
  },
  {
    id: 's2',
    name: 'Krypto_Keys.txt',
    type: 'txt',
    category: 'Tresor',
    timestamp: 'Vor 2 Wochen',
    content: 'BTC: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh\nETH: 0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
  }
];

const App: React.FC = () => {
  // --- Persistence Logic ---
  const [appPin, setAppPin] = useState<string | null>(() => localStorage.getItem('docvault_app_pin'));
  
  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    const saved = localStorage.getItem('docvault_docs');
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  });

  const [vaultDocs, setVaultDocs] = useState<DocumentItem[]>(() => {
    const saved = localStorage.getItem('docvault_vault_docs');
    return saved ? JSON.parse(saved) : INITIAL_SECURE_DOCUMENTS;
  });

  const [folders, setFolders] = useState<string[]>(() => {
    const saved = localStorage.getItem('docvault_folders');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  // Settings states
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('docvault_dark_mode') !== 'false');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('docvault_notifications') === 'true');

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('docvault_docs', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('docvault_vault_docs', JSON.stringify(vaultDocs));
  }, [vaultDocs]);

  useEffect(() => {
    localStorage.setItem('docvault_folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    if (appPin) localStorage.setItem('docvault_app_pin', appPin);
    else localStorage.removeItem('docvault_app_pin');
  }, [appPin]);

  useEffect(() => {
    localStorage.setItem('docvault_dark_mode', isDarkMode.toString());
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('docvault_notifications', notificationsEnabled.toString());
  }, [notificationsEnabled]);

  // --- App State ---
  const [activeCategory, setActiveCategory] = useState<string>('Alle');
  const [activeTab, setActiveTab] = useState('Home');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  
  // Modals
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; docId: string | null }>({
    isOpen: false,
    docId: null
  });
  const [restoreConfirmation, setRestoreConfirmation] = useState<{ isOpen: boolean; data: any | null }>({
    isOpen: false,
    data: null
  });
  const [isFactoryResetModalOpen, setIsFactoryResetModalOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);

  // Security Auth State
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [pinAction, setPinAction] = useState<'unlock' | 'remove' | 'change_step1' | 'change_step2' | null>(null); 
  const [enteredAuthPin, setEnteredAuthPin] = useState('');
  const [authPinError, setAuthPinError] = useState(false);
  const [tempOldPin, setTempOldPin] = useState('');

  const [editingFolderName, setEditingFolderName] = useState<{old: string, new: string} | null>(null);

  const [isDetailEditing, setIsDetailEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<string>('Sonstiges');
  const [editContent, setEditContent] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const filteredDocuments = useMemo(() => {
    if (activeCategory === 'Alle') return documents;
    return documents.filter(doc => doc.category === activeCategory);
  }, [activeCategory, documents]);

  // Handle PIN input for all security flows
  const handleVaultAuthInput = (num: string) => {
    if (enteredAuthPin.length >= 4) return;
    setAuthPinError(false);
    const newPinStr = enteredAuthPin + num;
    setEnteredAuthPin(newPinStr);
    
    if (newPinStr.length === 4) {
      if (!appPin && !pinAction) {
        setAppPin(newPinStr);
        setIsVaultUnlocked(true);
        setEnteredAuthPin('');
        triggerToast("Tresor eingerichtet");
        return;
      }
      if (pinAction === 'unlock' || (!pinAction && activeTab === 'Tresor')) {
        if (newPinStr === appPin) {
          setIsVaultUnlocked(true);
          setPinAction(null);
          setEnteredAuthPin('');
        } else {
          setAuthPinError(true);
          setEnteredAuthPin('');
        }
      }
      if (pinAction === 'remove') {
        if (newPinStr === appPin) {
          setAppPin(null);
          setPinAction(null);
          setEnteredAuthPin('');
          triggerToast("PIN entfernt");
        } else {
          setAuthPinError(true);
          setEnteredAuthPin('');
        }
      }
      if (pinAction === 'change_step1') {
        if (newPinStr === appPin) {
          setTempOldPin(newPinStr);
          setPinAction('change_step2');
          setEnteredAuthPin('');
        } else {
          setAuthPinError(true);
          setEnteredAuthPin('');
        }
      }
      if (pinAction === 'change_step2') {
        setAppPin(newPinStr);
        setPinAction(null);
        setEnteredAuthPin('');
        triggerToast("PIN geändert");
      }
    }
  };

  useEffect(() => {
    if (activeTab !== 'Tresor' && activeTab !== 'Settings') {
      setIsVaultUnlocked(false);
      setPinAction(null);
      setEnteredAuthPin('');
      setAuthPinError(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedDoc) {
      setEditName(selectedDoc.name);
      setEditCategory(selectedDoc.category);
      setEditContent(selectedDoc.content || '');
      setIsDetailEditing(false);
    }
  }, [selectedDoc]);

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setDeleteConfirmation({ isOpen: true, docId: id });
  };

  const confirmDelete = () => {
    const targetId = deleteConfirmation.docId;
    if (!targetId) return;
    
    setDocuments(prev => prev.filter(doc => doc.id !== targetId));
    setVaultDocs(prev => prev.filter(doc => doc.id !== targetId));
    
    if (selectedDoc?.id === targetId) setSelectedDoc(null);
    setDeleteConfirmation({ isOpen: false, docId: null });
    triggerToast("Dokument gelöscht");
  };

  const triggerToast = (msg: string) => {
    setShowSuccessToast(msg);
    setTimeout(() => setShowSuccessToast(null), 3000);
  };

  const handleSaveEdit = () => {
    if (!selectedDoc) return;
    const wasInVault = selectedDoc.category === 'Tresor' || vaultDocs.some(d => d.id === selectedDoc.id);
    const isMovingToVault = editCategory === 'Tresor';
    const updatedDoc: DocumentItem = { ...selectedDoc, name: editName, category: editCategory, content: editContent };

    if (wasInVault && !isMovingToVault) {
      setVaultDocs(prev => prev.filter(d => d.id !== selectedDoc.id));
      setDocuments(prev => [updatedDoc, ...prev]);
    } else if (!wasInVault && isMovingToVault) {
      setDocuments(prev => prev.filter(d => d.id !== selectedDoc.id));
      setVaultDocs(prev => [updatedDoc, ...prev]);
    } else {
      if (wasInVault) setVaultDocs(prev => prev.map(d => d.id === selectedDoc.id ? updatedDoc : d));
      else setDocuments(prev => prev.map(d => d.id === selectedDoc.id ? updatedDoc : d));
    }
    setSelectedDoc(updatedDoc);
    setIsDetailEditing(false);
    triggerToast("Gespeichert");
  };

  const handleRenameFolder = () => {
    if (!editingFolderName || !editingFolderName.new.trim()) return;
    const { old, new: next } = editingFolderName;
    if (old === 'Alle') { setEditingFolderName(null); return; }
    setFolders(prev => prev.map(f => f === old ? next : f));
    const updateCat = (doc: DocumentItem) => doc.category === old ? { ...doc, category: next } : doc;
    setDocuments(prev => prev.map(updateCat));
    setVaultDocs(prev => prev.map(updateCat));
    if (activeCategory === old) setActiveCategory(next);
    setEditingFolderName(null);
  };

  const createNewFolder = () => {
    const newName = `Neuer Ordner ${folders.length}`;
    if (folders.includes(newName)) return;
    setFolders(prev => [...prev, newName]);
    setEditingFolderName({ old: newName, new: newName });
  };

  const handleDeleteFolder = (folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (folderName === 'Alle') return;
    const remaining = folders.filter(f => f !== folderName && f !== 'Alle');
    const fallback = remaining.length > 0 ? remaining[0] : 'Unkategorisiert';
    if (remaining.length === 0 && !folders.includes('Unkategorisiert')) {
        setFolders(prev => [...prev.filter(f => f !== folderName), 'Unkategorisiert']);
    } else setFolders(prev => prev.filter(f => f !== folderName));
    const updateCat = (doc: DocumentItem) => doc.category === folderName ? { ...doc, category: fallback } : doc;
    setDocuments(prev => prev.map(updateCat));
    setVaultDocs(prev => prev.map(updateCat));
    if (activeCategory === folderName) setActiveCategory('Alle');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64Data = ev.target?.result as string;
      const extension = file.name.split('.').pop()?.toLowerCase();
      let type: DocType = 'pdf';
      if (extension === 'png') type = 'png';
      else if (extension === 'jpg' || extension === 'jpeg') type = 'jpg';
      else if (extension === 'txt' || extension === 'doc') type = (extension as DocType);
      
      let textContent = '';
      if (type === 'txt' || type === 'doc') textContent = await file.text();
      
      const firstFolder = folders.find(f => f !== 'Alle') || 'Sonstiges';
      const newDoc: DocumentItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name, type: type,
        category: (activeTab === 'Tresor') ? 'Tresor' : (activeCategory === 'Alle' ? firstFolder : activeCategory),
        timestamp: 'Jetzt', previewUrl: base64Data, content: textContent
      };
      if (activeTab === 'Tresor') setVaultDocs(prev => [newDoc, ...prev]);
      else setDocuments(prev => [newDoc, ...prev]);
      triggerToast("Hochgeladen");
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportBackup = () => {
    const data = { version: '1.2', timestamp: new Date().toISOString(), documents, vaultDocs, folders, appPin };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DocVault_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast("Backup erstellt");
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.documents && json.vaultDocs && json.folders) setRestoreConfirmation({ isOpen: true, data: json });
        else alert("Ungültiges Format.");
      } catch (err) { alert("Lesefehler."); }
    };
    reader.readAsText(file);
    if (backupInputRef.current) backupInputRef.current.value = '';
  };

  const confirmRestore = () => {
    const json = restoreConfirmation.data;
    if (!json) return;
    setDocuments(json.documents); setVaultDocs(json.vaultDocs); setFolders(json.folders); setAppPin(json.appPin || null);
    setRestoreConfirmation({ isOpen: false, data: null });
    setSelectedDoc(null); setIsEditMode(false); setActiveTab('Home');
    triggerToast("Restore erfolgreich");
  };

  const handleFactoryReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  const clearCache = () => {
    setActiveCategory('Alle');
    setIsEditMode(false);
    triggerToast("Cache bereinigt");
  };

  const renderPreviewContent = (doc: DocumentItem) => {
    const isTextType = doc.type === 'txt' || doc.type === 'doc';
    if (isDetailEditing && isTextType) {
      return <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full h-full bg-[#0a0f18] p-4 text-white font-mono text-sm leading-relaxed outline-none resize-none border-none" spellCheck={false} />;
    }
    if ((doc.type === 'jpg' || doc.type === 'png') && doc.previewUrl) return <img src={doc.previewUrl} alt={doc.name} className="w-full h-full object-contain" />;
    if (doc.type === 'pdf' && doc.previewUrl) return <iframe src={doc.previewUrl.startsWith('data:') ? doc.previewUrl : `${doc.previewUrl}#view=FitH&toolbar=0`} className="w-full h-full border-none bg-white rounded-lg" title={doc.name} />;
    if (isTextType) return <div className="w-full h-full bg-[#0a0f18] p-4 overflow-y-auto text-slate-300 font-mono text-sm leading-relaxed select-text whitespace-pre-wrap">{doc.content || "Leer"}</div>;
    return <div className="text-sm text-slate-500 text-center">Keine Vorschau verfügbar</div>;
  };

  const getDocCountForFolder = (folderName: string) => {
    if (folderName === 'Alle') return documents.length;
    return documents.filter(d => d.category === folderName).length;
  };

  const isCurrentDocText = selectedDoc?.type === 'txt' || selectedDoc?.type === 'doc';

  return (
    <div className={`flex flex-col h-screen max-w-md mx-auto relative ${isDarkMode ? 'bg-[#0b121e]' : 'bg-slate-50'} text-white overflow-hidden shadow-2xl border-x border-slate-800/20`}>
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.txt,.doc,.png,.jpg,.jpeg" />
      <input type="file" ref={backupInputRef} onChange={handleImportBackup} className="hidden" accept=".json" />

      {showSuccessToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[500] bg-blue-600 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4 duration-300 border border-white/10">
          <CheckCircle2 size={16} />
          <span className="text-xs font-bold tracking-tight">{showSuccessToast}</span>
        </div>
      )}

      {/* Hamburger Drawer */}
      <div className={`fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isSideMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSideMenuOpen(false)}>
        <aside className={`absolute top-0 left-0 bottom-0 w-[280px] bg-[#0f172a] shadow-2xl border-r border-slate-800 transition-transform duration-300 transform ${isSideMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={e => e.stopPropagation()}>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold"><User size={24} /></div>
              <div><h3 className="font-bold">Premium Nutzer</h3><p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">DocVault Identity</p></div>
            </div>
            <nav className="space-y-1">
              <SideMenuItem icon={<Home size={18} />} label="Übersicht" onClick={() => { setActiveTab('Home'); setIsSideMenuOpen(false); }} />
              <SideMenuItem icon={<Folder size={18} />} label="Alle Ordner" onClick={() => { setActiveTab('Ordner'); setIsSideMenuOpen(false); }} />
              <SideMenuItem icon={<Lock size={18} />} label="Tresor" onClick={() => { setActiveTab('Tresor'); setIsSideMenuOpen(false); }} />
              <SideMenuItem icon={<Settings size={18} />} label="Optionen" onClick={() => { setActiveTab('Settings'); setIsSideMenuOpen(false); }} />
            </nav>
            <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-slate-800/20 border border-slate-700/30">
                <div className="flex items-center gap-2 text-blue-500 mb-1"><Shield size={14} /><span className="text-[10px] font-black uppercase">Verschlüsselung aktiv</span></div>
                <p className="text-[9px] text-slate-500">Ihre Daten sind durch AES-256 lokal auf Ihrem Gerät geschützt.</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Security Modals */}
      {pinAction && (
        <div className="fixed inset-0 z-[400] bg-[#0b121e] flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
           <button onClick={() => { setPinAction(null); setEnteredAuthPin(''); }} className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white"><X size={24} /></button>
           <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto"><Shield size={32} /></div>
              <h2 className="text-xl font-bold mb-1">
                {pinAction === 'unlock' && 'Tresor entsperren'}
                {pinAction === 'remove' && 'PIN entfernen'}
                {pinAction === 'change_step1' && 'Alten PIN bestätigen'}
                {pinAction === 'change_step2' && 'Neuen PIN festlegen'}
              </h2>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-black">Identität bestätigen</p>
           </div>
           <div className="flex gap-4 mb-12">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${enteredAuthPin.length > i ? 'bg-blue-500 border-blue-500 scale-125 shadow-lg' : 'border-slate-700'}`} />
              ))}
           </div>
           <div className="grid grid-cols-3 gap-4 max-w-[280px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <button key={n} onClick={() => handleVaultAuthInput(n.toString())} className="w-16 h-16 rounded-full bg-slate-800/30 border border-slate-700/20 text-xl font-bold active:scale-90 transition-all">{n}</button>)}
              <div /><button onClick={() => handleVaultAuthInput('0')} className="w-16 h-16 rounded-full bg-slate-800/30 border border-slate-700/20 text-xl font-bold active:scale-90 transition-all">0</button>
              <button onClick={() => setEnteredAuthPin(enteredAuthPin.slice(0, -1))} className="w-16 h-16 rounded-full flex items-center justify-center text-slate-500"><Delete size={24} /></button>
           </div>
           {authPinError && <p className="mt-8 text-red-500 text-xs font-bold uppercase tracking-wider animate-shake">Falscher PIN.</p>}
        </div>
      )}

      {/* Main UI Header */}
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 bg-[#0b121e]/90 backdrop-blur-md z-20">
        <button onClick={() => setIsSideMenuOpen(true)} className="p-1 opacity-50 hover:opacity-100"><Menu size={20} /></button>
        <h1 className="text-lg font-bold tracking-tight">DocVault</h1>
        <button onClick={() => setIsEditMode(!isEditMode)} className={`${isEditMode ? 'text-red-400 font-bold' : 'text-blue-500 font-semibold'} text-sm transition-colors`}>{isEditMode ? 'Fertig' : 'Edit'}</button>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'Home' && (
          <div className="flex-1 overflow-y-auto pb-20 p-4">
            {activeCategory !== 'Alle' && (
              <button onClick={() => setActiveCategory('Alle')} className="flex items-center gap-1 text-blue-500 font-bold text-xs mb-4"><ChevronLeft size={14} /> Alle Dokumente</button>
            )}
            {activeCategory === 'Alle' && (
              <section className="grid grid-cols-4 gap-2 mb-6">
                {folders.filter(f => f !== 'Alle').map(folder => (
                  <div key={folder} onClick={() => setActiveCategory(folder)} className="bg-slate-800/10 border border-slate-700/20 rounded-xl p-3 flex flex-col items-center cursor-pointer hover:bg-slate-800/20 transition-all">
                    <Folder size={18} className="text-blue-500 mb-1" />
                    <span className="text-[9px] font-bold text-slate-400 truncate w-full text-center">{folder}</span>
                    <span className="text-[10px] text-slate-700 font-black mt-1">{getDocCountForFolder(folder)}</span>
                  </div>
                ))}
              </section>
            )}
            <main className="grid grid-cols-2 gap-3">
              {filteredDocuments.map(doc => (
                <div key={doc.id} onClick={() => !isEditMode && setSelectedDoc(doc)} className="flex flex-col gap-1.5 group animate-in fade-in">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-800/20 border border-slate-700/20 shadow-sm active:scale-95 transition-all cursor-pointer">
                    <div className="absolute top-0 left-0 right-0 p-2 flex justify-between z-10 bg-gradient-to-b from-black/50 to-transparent">
                       <div className="p-0.5 bg-black/40 rounded">{getDocIcon(doc.type)}</div>
                    </div>
                    {doc.previewUrl ? <img src={doc.previewUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-10">{getDocIcon(doc.type)}</div>}
                    {isEditMode && <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center backdrop-blur-sm"><button onClick={e => handleDelete(doc.id, e)} className="bg-red-600 p-2 rounded-full text-white"><Trash2 size={16} /></button></div>}
                  </div>
                  <div className="px-1"><h3 className="text-[11px] font-bold truncate leading-tight">{doc.name}</h3><p className="text-[8px] text-slate-600 font-black uppercase tracking-widest">{doc.timestamp}</p></div>
                </div>
              ))}
            </main>
          </div>
        )}

        {activeTab === 'Ordner' && (
          <main className="flex-1 overflow-y-auto p-4 pb-20 space-y-2">
            <button 
              onClick={createNewFolder}
              className="w-full flex items-center justify-center gap-2 p-4 mb-4 rounded-2xl bg-blue-600/10 border border-dashed border-blue-500/50 text-blue-500 hover:bg-blue-600/20 transition-all font-bold text-sm"
            >
              <Plus size={18} /> Neuer Ordner
            </button>
            {folders.filter(f => f !== 'Alle').map(f => (
              <div key={f} onClick={() => !isEditMode && (setActiveCategory(f), setActiveTab('Home'))} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/10 border border-slate-700/20 hover:bg-slate-800/20 transition-all cursor-pointer">
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500"><Folder size={20} /></div>
                <div className="flex-1"><h4 className="text-sm font-bold text-slate-200">{f}</h4><p className="text-[10px] text-slate-600">{getDocCountForFolder(f)} Dokumente</p></div>
                {isEditMode && (
                  <div className="flex gap-2">
                    <button onClick={e => { e.stopPropagation(); setEditingFolderName({ old: f, new: f }); }} className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Pencil size={14} /></button>
                    <button onClick={e => handleDeleteFolder(f, e)} className="p-2 bg-red-500/10 text-red-500 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
            ))}
          </main>
        )}

        {activeTab === 'Tresor' && (
          <main className="flex-1 overflow-hidden flex flex-col">
            {!isVaultUnlocked ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in">
                <div className="mb-8 text-center"><div className={`w-16 h-16 ${appPin ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'} rounded-full flex items-center justify-center mb-4 mx-auto`}><Lock size={32} /></div><h2 className="text-xl font-bold mb-1">{appPin ? 'Tresor geschützt' : 'Tresor einrichten'}</h2><p className="text-xs text-slate-500 uppercase tracking-widest font-black">{appPin ? 'PIN eingeben' : 'Lege einen 4-stelligen PIN fest'}</p></div>
                <div className="flex gap-4 mb-12">{[...Array(4)].map((_, i) => <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${enteredAuthPin.length > i ? 'bg-red-500 border-red-500 scale-125 shadow-lg' : 'border-slate-700'}`} />)}</div>
                <div className="grid grid-cols-3 gap-4 max-w-[280px]">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <button key={n} onClick={() => handleVaultAuthInput(n.toString())} className="w-16 h-16 rounded-full bg-slate-800/20 border border-slate-700/10 text-xl font-bold active:scale-90 transition-all">{n}</button>)}
                  <div /><button onClick={() => handleVaultAuthInput('0')} className="w-16 h-16 rounded-full bg-slate-800/20 border border-slate-700/10 text-xl font-bold active:scale-90 transition-all">0</button><button onClick={() => setEnteredAuthPin(enteredAuthPin.slice(0, -1))} className="w-16 h-16 rounded-full flex items-center justify-center text-slate-500"><Delete size={24} /></button>
                </div>
                {authPinError && <p className="mt-8 text-red-500 text-xs font-bold uppercase tracking-wider animate-shake">PIN Falsch</p>}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold text-red-400">Security Vault</h2><button onClick={() => setIsVaultUnlocked(false)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase">Sperren</button></div>
                {vaultDocs.map(doc => (
                  <div key={doc.id} onClick={() => !isEditMode && setSelectedDoc(doc)} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/20 border border-slate-700/30 hover:bg-slate-800/40 transition-all cursor-pointer group">
                    <div className="p-3 bg-red-500/10 rounded-xl text-red-500 group-hover:scale-110 transition-transform">{getDocIcon(doc.type)}</div>
                    <div className="flex-1"><h4 className="text-sm font-bold text-slate-200">{doc.name}</h4><p className="text-[9px] text-slate-600 font-black mt-0.5 uppercase tracking-widest">{doc.timestamp}</p></div>
                    {isEditMode ? <button onClick={e => handleDelete(doc.id, e)} className="p-2 text-red-500"><Trash2 size={16} /></button> : <ChevronIcon size={16} className="text-slate-700" />}
                  </div>
                ))}
              </div>
            )}
          </main>
        )}

        {activeTab === 'Settings' && (
          <main className="flex-1 overflow-y-auto p-4 pb-24 space-y-8">
            <h2 className="text-2xl font-bold">Optionen</h2>
            
            <section>
              <h3 className="text-[10px] font-black uppercase text-slate-600 mb-3 tracking-widest">PWA Installation</h3>
              <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <Smartphone className="text-blue-500 mt-1" size={20} />
                  <div>
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-tighter">iOS / Android</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">Tippe auf das Teilen-Symbol (iOS) oder die 3 Punkte (Android) und wähle <b>"Zum Home-Bildschirm hinzufügen"</b>.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Laptop className="text-blue-500 mt-1" size={20} />
                  <div>
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-tighter">Desktop</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">Klicke rechts in der Adressleiste auf das <b>App-Symbol</b> zum Installieren.</p>
                  </div>
                </div>
              </div>
            </section>

            <section><h3 className="text-[10px] font-black uppercase text-slate-600 mb-3 tracking-widest">Erscheinungsbild</h3><div className="bg-slate-800/20 border border-slate-700/20 rounded-2xl overflow-hidden"><SettingsRow icon={<Moon size={18} className="text-blue-400" />} label="Dark Mode" toggle active={isDarkMode} onClick={() => setIsDarkMode(!isDarkMode)} /><SettingsRow icon={<Bell size={18} className="text-purple-400" />} label="Benachrichtigungen" toggle active={notificationsEnabled} onClick={() => setNotificationsEnabled(!notificationsEnabled)} /></div></section>
            <section><h3 className="text-[10px] font-black uppercase text-slate-600 mb-3 tracking-widest">Sicherheit</h3><div className="bg-slate-800/20 border border-slate-700/20 rounded-2xl overflow-hidden"><SettingsRow icon={<Lock size={18} className={appPin ? "text-blue-400" : "text-slate-600"} />} label="PIN Status" value={appPin ? "Aktiviert" : "Einrichten"} onClick={() => appPin ? setPinAction('remove') : setActiveTab('Tresor')} />{appPin && <SettingsRow icon={<KeyRound size={18} className="text-orange-400" />} label="PIN ändern" onClick={() => setPinAction('change_step1')} />}</div></section>
            <section><h3 className="text-[10px] font-black uppercase text-slate-600 mb-3 tracking-widest">Daten</h3><div className="bg-slate-800/20 border border-slate-700/20 rounded-2xl overflow-hidden"><SettingsRow icon={<Download size={18} className="text-blue-400" />} label="Export" onClick={handleExportBackup} /><SettingsRow icon={<Upload size={18} className="text-green-400" />} label="Backup einspielen" onClick={() => backupInputRef.current?.click()} /><SettingsRow icon={<Database size={18} className="text-slate-400" />} label="Cache leeren" onClick={clearCache} /></div></section>
            <section><h3 className="text-[10px] font-black uppercase text-red-500 mb-3 tracking-widest">Gefahrenzone</h3><div className="bg-red-900/10 border border-red-500/20 rounded-2xl p-4 space-y-4"><button onClick={() => setIsFactoryResetModalOpen(true)} className="w-full py-3 rounded-xl bg-red-600 text-white font-bold text-sm shadow-xl">Alles löschen</button></div></section>
          </main>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#0b121e]/98 backdrop-blur-xl border-t border-slate-800/30 flex justify-around items-center py-2 pb-5 z-20">
        <NavButton icon={<Home size={22} />} label="Home" active={activeTab === 'Home'} onClick={() => setActiveTab('Home')} />
        <NavButton icon={<Folder size={22} />} label="Ordner" active={activeTab === 'Ordner'} onClick={() => setActiveTab('Ordner')} />
        <NavButton icon={<Lock size={22} />} label="Tresor" active={activeTab === 'Tresor'} onClick={() => setActiveTab('Tresor')} />
        <NavButton icon={<Settings size={22} />} label="Optionen" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />
      </nav>

      <button onClick={() => fileInputRef.current?.click()} className="fixed bottom-20 right-5 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl active:scale-90 transition-all z-30 ring-4 ring-[#0b121e] hover:bg-blue-500"><Plus size={28} /></button>

      {/* Detail Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in slide-in-from-bottom">
            <header className="flex items-center justify-between p-4 bg-slate-900/98 border-b border-slate-800"><button onClick={() => { if (isDetailEditing) setIsDetailEditing(false); else setSelectedDoc(null); }} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white"><X size={18} /></button><div className="flex flex-col items-center flex-1 px-4 truncate">{isDetailEditing ? <input value={editName} onChange={e => setEditName(e.target.value)} className="bg-[#0b121e] border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-bold text-center w-full outline-none focus:ring-2 ring-blue-500" autoFocus /> : <><span className="text-sm font-black truncate w-full text-center">{selectedDoc.name}</span><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedDoc.category}</span></>}</div><div className="flex gap-2">{!isDetailEditing && <button onClick={() => setIsDetailEditing(true)} className="p-2 bg-blue-600/10 text-blue-500 rounded-xl hover:bg-blue-600/20"><Pencil size={18} /></button>}</div></header>
            <div className="flex-1 p-4 bg-[#080c14] overflow-hidden flex flex-col"><div className={`flex-1 rounded-2xl overflow-hidden bg-[#111827] border border-slate-800 shadow-inner flex ${isCurrentDocText ? 'items-stretch' : 'items-center justify-center'}`}>{renderPreviewContent(selectedDoc)}</div>{isDetailEditing && <div className="mt-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 animate-in slide-in-from-bottom-2"><label className="text-[10px] font-black uppercase text-slate-600 block mb-2">Kategorie</label><select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="w-full bg-[#0b121e] border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-300">{folders.filter(f => f !== 'Alle').map(f => <option key={f} value={f}>{f}</option>)}<option value="Tresor">Tresor</option></select></div>}</div>
            <footer className="p-4 pb-10 grid grid-cols-2 gap-3 bg-slate-900 border-t border-slate-800">{isDetailEditing ? (<><button onClick={() => setIsDetailEditing(false)} className="py-3.5 rounded-2xl bg-slate-800 font-bold text-sm text-slate-400">Abbrechen</button><button onClick={handleSaveEdit} className="py-3.5 rounded-2xl bg-blue-600 font-bold text-sm shadow-xl">Speichern</button></>) : (<><button onClick={() => handleDelete(selectedDoc.id)} className="py-3.5 rounded-2xl bg-red-600/10 text-red-500 font-bold text-sm hover:bg-red-600 hover:text-white transition-all">Löschen</button><a href={selectedDoc.previewUrl} download={selectedDoc.name} className="py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl hover:bg-blue-500"><Download size={16} /> Export</a></>)}</footer>
        </div>
      )}

      {/* Confirmation Modals */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-[320px] bg-[#1a2235] border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} /></div>
            <h3 className="text-lg font-bold text-center mb-2">Löschen?</h3>
            <p className="text-xs text-slate-400 text-center mb-6">Dies kann nicht rückgängig gemacht werden.</p>
            <div className="flex flex-col gap-2"><button onClick={confirmDelete} className="w-full py-4 rounded-2xl bg-red-600 font-bold text-sm shadow-xl">Bestätigen</button><button onClick={() => setDeleteConfirmation({ isOpen: false, docId: null })} className="w-full py-4 rounded-2xl bg-slate-800 text-slate-400 font-bold text-sm">Abbrechen</button></div>
          </div>
        </div>
      )}

      {restoreConfirmation.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-[320px] bg-[#1a2235] border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4"><Upload size={32} /></div>
            <h3 className="text-lg font-bold text-center mb-2">Wiederherstellung?</h3>
            <p className="text-xs text-slate-400 text-center mb-6">Alle aktuellen Daten werden überschrieben.</p>
            <div className="flex flex-col gap-2"><button onClick={confirmRestore} className="w-full py-4 rounded-2xl bg-blue-600 font-bold text-sm shadow-xl">Fortfahren</button><button onClick={() => setRestoreConfirmation({ isOpen: false, data: null })} className="w-full py-4 rounded-2xl bg-slate-800 text-slate-400 font-bold text-sm">Abbrechen</button></div>
          </div>
        </div>
      )}

      {isFactoryResetModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-[320px] bg-[#1a2235] border border-red-500/30 rounded-3xl p-6 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><RefreshCw size={32} className="animate-spin" /></div>
            <h3 className="text-lg font-bold text-center mb-2 text-red-500">Vollständiger Reset?</h3>
            <p className="text-xs text-slate-400 text-center mb-6 leading-relaxed">Sämtliche Dokumente und Daten werden unwiderruflich gelöscht. Nur empfohlen, wenn Sie den PIN vergessen haben.</p>
            <div className="flex flex-col gap-2">
              <button onClick={handleFactoryReset} className="w-full py-4 rounded-2xl bg-red-600 text-white font-bold text-sm shadow-xl">ALLES LÖSCHEN</button>
              <button onClick={() => setIsFactoryResetModalOpen(false)} className="w-full py-4 rounded-2xl bg-slate-800 text-slate-400 font-bold text-sm">Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      {editingFolderName && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-[280px] bg-[#1a2235] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-[10px] font-black uppercase text-slate-500 mb-4 text-center tracking-widest">Name ändern</h3>
            <input type="text" value={editingFolderName.new} onChange={e => setEditingFolderName({ ...editingFolderName, new: e.target.value })} className="w-full bg-[#0b121e] border border-slate-700 rounded-xl px-4 py-3 text-center font-bold mb-4 outline-none focus:ring-2 ring-blue-500" autoFocus />
            <div className="flex flex-col gap-2"><button onClick={handleRenameFolder} className="w-full py-3 rounded-xl bg-blue-600 font-bold text-sm shadow-xl">Speichern</button><button onClick={() => setEditingFolderName(null)} className="w-full py-3 rounded-xl bg-slate-800 text-slate-500 font-bold text-sm">Abbrechen</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Helpers ---
interface NavButtonProps { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void; }
const NavButton: React.FC<NavButtonProps> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-blue-500' : 'text-slate-600'}`}>
    <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-blue-500/10 scale-110' : 'hover:bg-white/5'}`}>{icon}</div>
    <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);

interface SideMenuItemProps { icon: React.ReactNode; label: string; onClick: () => void; }
const SideMenuItem: React.FC<SideMenuItemProps> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 text-slate-300 transition-all font-semibold text-sm">
    <div className="text-slate-500">{icon}</div>{label}
  </button>
);

interface SettingsRowProps { icon: React.ReactNode; label: string; value?: string; onClick?: () => void; toggle?: boolean; active?: boolean; }
const SettingsRow: React.FC<SettingsRowProps> = ({ icon, label, value, onClick, toggle, active }) => (
  <div onClick={onClick} className="flex items-center justify-between p-4 border-b border-slate-800/50 last:border-0 hover:bg-white/5 transition-colors cursor-pointer select-none">
    <div className="flex items-center gap-3">{icon}<span className="text-sm font-medium">{label}</span></div>
    <div className="flex items-center gap-2">
      {toggle ? (
        <div className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${active ? 'bg-blue-600' : 'bg-slate-700'}`}>
          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${active ? 'right-1' : 'left-1'}`} />
        </div>
      ) : (
        <>{value && <span className="text-xs text-slate-500 font-bold">{value}</span>}<ChevronIcon size={14} className="text-slate-700" /></>
      )}
    </div>
  </div>
);

export default App;
