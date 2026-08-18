import React, { useState, useEffect, useRef } from 'react';
import { StudyMaterial } from '../shared/types';
import { fetchWithAuth } from '../lib/apiClient';
import { UploadCloud, FileText, File, Trash2, Download, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface MaterialManagerProps {
  subjectId: string;
  topicId?: string; // If provided, it's for notes. If absent, it's for subject PYQs.
  materialType: 'note' | 'pyq';
  title?: string;
}

export function MaterialManager({ subjectId, topicId, materialType, title = 'Materials' }: MaterialManagerProps) {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMaterials();
  }, [subjectId, topicId]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/api/materials?subject_id=${subjectId}`;
      if (topicId) {
        url += `&topic_id=${topicId}`;
      }
      const data = await fetchWithAuth(url);
      setMaterials(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length > 5) {
      setError('You can only upload up to 5 files at once.');
      return;
    }

    const formData = new FormData();
    formData.append('subject_id', subjectId);
    if (topicId) formData.append('topic_id', topicId);
    formData.append('material_type', materialType);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        setError(`File ${file.name} exceeds the 10MB limit.`);
        return;
      }
      formData.append('files', file);
    }

    try {
      setUploading(true);
      setError(null);
      
      const response = await fetchWithAuth('/api/materials', {
        method: 'POST',
        body: formData // fetchWithAuth will automatically omit Content-Type so the browser can set multipart boundary
      });

      if (response.errors && response.errors.length > 0) {
         setError(`Some files failed to upload: ${response.errors.map((e: any) => e.file).join(', ')}`);
      }

      if (response.results && response.results.length > 0) {
        setMaterials([...response.results, ...materials]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload materials');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (materialId: string, fileName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    try {
      await fetchWithAuth(`/api/materials/${materialId}`, { method: 'DELETE' });
      setMaterials(materials.filter(m => m.id !== materialId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete material');
    }
  };

  const handleDownload = async (materialId: string) => {
    try {
      const { url } = await fetchWithAuth(`/api/materials/${materialId}/download`);
      window.open(url, '_blank');
    } catch (err: any) {
      alert(err.message || 'Failed to download material');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
    if (fileType === 'text/plain') return <File className="h-5 w-5 text-gray-500" />;
    return <FileText className="h-5 w-5 text-blue-500" />; // DOCX fallback
  };

  const renderExtractionStatus = (status: string, error?: string | null) => {
    switch (status) {
      case 'processing':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Extracting text
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Text ready
          </span>
        );
      case 'failed':
        return (
          <span 
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700"
            title={error || 'Extraction failed'}
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Extraction failed
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-2">
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileChange} 
             multiple 
             accept=".pdf,.txt,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
             className="hidden" 
           />
           <button
             onClick={() => fileInputRef.current?.click()}
             disabled={uploading}
             className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
           >
             {uploading ? (
               <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
             ) : (
               <UploadCloud className="w-4 h-4 mr-1.5" />
             )}
             Upload File
           </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 text-sm text-red-700 flex items-center">
          <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : materials.length === 0 ? (
        <div className="p-8 text-center text-gray-500 text-sm">
          No materials uploaded yet.
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {materials.map((material) => (
            <li key={material.id} className="group p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                  {getFileIcon(material.file_type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate" title={material.file_name}>
                      {material.file_name}
                    </p>
                    {renderExtractionStatus(material.extraction_status, material.extraction_error)}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatFileSize(material.file_size)} • {new Date(material.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4 flex-shrink-0">
                <button
                  onClick={() => handleDownload(material.id)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                  title="Download / View"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(material.id, material.file_name)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                  title="Delete file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
