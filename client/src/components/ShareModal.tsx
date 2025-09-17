import React, { useState } from 'react';
import { X, Check, Copy, Facebook, Twitter, Mail, MessageCircle, Link } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, title, url }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  const shareOptions = [
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-[#1877F2] hover:bg-[#0E65D9]",
      link: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    },
    {
      name: "Twitter",
      icon: Twitter,
      color: "bg-[#1DA1F2] hover:bg-[#0C90E1]",
      link: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
    },
    {
      name: "WhatsApp",
      icon: MessageCircle, // Utilisons MessageCircle à la place de WhatsApp qui n'est pas disponible
      color: "bg-[#25D366] hover:bg-[#1FB855]",
      link: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`
    },
    {
      name: "Email",
      icon: Mail,
      color: "bg-[#EA4335] hover:bg-[#D73929]",
      link: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent('Découvrez cette annonce : ' + url)}`
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">Partager cette annonce</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-5">
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">Partagez cette annonce sur vos réseaux :</p>
            <div className="grid grid-cols-4 gap-3">
              {shareOptions.map(option => (
                <a 
                  key={option.name}
                  href={option.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${option.color} text-white rounded-xl flex flex-col items-center justify-center p-3 transition-all`}
                >
                  <option.icon className="h-6 w-6 mb-1" />
                  <span className="text-xs">{option.name}</span>
                </a>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-3">Ou copiez le lien direct :</p>
            <div className="flex">
              <input
                type="text"
                value={url}
                readOnly
                className="flex-1 border border-gray-300 rounded-l-xl px-3 py-2 bg-gray-50 text-sm"
              />
              <button
                onClick={copyToClipboard}
                className={`px-4 py-2 rounded-r-xl flex items-center justify-center ${copied 
                  ? 'bg-green-600 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    <span>Copié!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
