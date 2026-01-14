'use client';

import { useState } from 'react';
import { X, Plus, Trash2, Send, Loader2, UserPlus } from 'lucide-react';

interface Signer {
  email: string;
  name: string;
}

interface SignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (signers: Signer[]) => Promise<void>;
  defaultSigners?: Signer[];
  documentName?: string;
  isLoading?: boolean;
}

export function SignerModal({
  isOpen,
  onClose,
  onSend,
  defaultSigners = [],
  documentName = 'Document',
  isLoading = false,
}: SignerModalProps) {
  const [signers, setSigners] = useState<Signer[]>(
    defaultSigners.length > 0 ? defaultSigners : [{ email: '', name: '' }]
  );
  const [errors, setErrors] = useState<Record<number, string>>({});

  if (!isOpen) return null;

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const addSigner = () => {
    setSigners([...signers, { email: '', name: '' }]);
  };

  const removeSigner = (index: number) => {
    if (signers.length > 1) {
      setSigners(signers.filter((_, i) => i !== index));
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const updateSigner = (index: number, field: keyof Signer, value: string) => {
    const newSigners = [...signers];
    newSigners[index] = { ...newSigners[index], [field]: value };
    setSigners(newSigners);
    
    // Clear error when user starts typing
    if (errors[index]) {
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const handleSend = async () => {
    // Validate all signers
    const newErrors: Record<number, string> = {};
    let hasErrors = false;

    signers.forEach((signer, index) => {
      if (!signer.email.trim()) {
        newErrors[index] = 'Email is required';
        hasErrors = true;
      } else if (!validateEmail(signer.email)) {
        newErrors[index] = 'Invalid email format';
        hasErrors = true;
      } else if (!signer.name.trim()) {
        newErrors[index] = 'Name is required';
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    await onSend(signers);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Send for Signature</h2>
            <p className="text-sm text-gray-500 mt-1">{documentName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <p className="text-sm text-gray-600 mb-4">
            Add the signers who need to sign this document. They will receive an email from DocuSign.
          </p>

          <div className="space-y-4">
            {signers.map((signer, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Signer {index + 1}
                  </span>
                  {signers.length > 1 && (
                    <button
                      onClick={() => removeSigner(index)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Remove signer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={signer.name}
                      onChange={(e) => updateSigner(index, 'name', e.target.value)}
                      placeholder="John Smith"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={signer.email}
                      onChange={(e) => updateSigner(index, 'email', e.target.value)}
                      placeholder="john.smith@company.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {errors[index] && (
                    <p className="text-sm text-red-500">{errors[index]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addSigner}
            className="mt-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <UserPlus className="h-4 w-4" />
            Add Another Signer
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send for Signature
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignerModal;
