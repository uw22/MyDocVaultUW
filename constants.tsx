
import React from 'react';
import { FileText, File, Image as ImageIcon } from 'lucide-react';
import { DocumentItem, Category } from './types';

export const CATEGORIES: Category[] = ['Alle', 'Arbeit', 'Gesundheit', 'Reisen', 'Finanzen', 'Zuhause', 'Sonstiges'];

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: '1',
    name: 'Willkommen.txt',
    type: 'txt',
    category: 'Sonstiges',
    timestamp: 'Gerade eben',
    content: 'Willkommen bei DocVault Pro!\n\nDies ist ein Beispiel für ein Textdokument.\nSie können Dokumente löschen, indem Sie oben auf "Bearbeiten" klicken oder das Dokument öffnen und den Löschen-Button unten links verwenden.\n\nViel Erfolg!'
  },
  {
    id: '2',
    name: 'Beispiel-Dokument.pdf',
    type: 'pdf',
    category: 'Arbeit',
    timestamp: 'Gerade eben',
    previewUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf'
  },
  {
    id: '3',
    name: 'Kreditkarte.png',
    type: 'png',
    category: 'Finanzen',
    timestamp: 'Gerade eben',
    previewUrl: 'https://picsum.photos/seed/mastercard/800/500'
  },
  {
    id: '4',
    name: 'Mietvertrag_Muster.pdf',
    type: 'pdf',
    category: 'Zuhause',
    timestamp: 'Vor 2 Stunden',
    previewUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  },
  {
    id: '5',
    name: 'Urlaub_2024.jpg',
    type: 'jpg',
    category: 'Reisen',
    timestamp: 'Gestern',
    previewUrl: 'https://picsum.photos/seed/holiday/800/600'
  }
];

export const getDocIcon = (type: string) => {
  switch (type) {
    case 'pdf': return <File className="w-4 h-4 text-red-400" />;
    case 'txt': return <FileText className="w-4 h-4 text-blue-300" />;
    case 'png':
    case 'jpg': return <ImageIcon className="w-4 h-4 text-purple-400" />;
    default: return <File className="w-4 h-4" />;
  }
};
