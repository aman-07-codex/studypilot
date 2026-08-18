import React, { useState, useEffect, useRef } from 'react';
import { StudyMaterial } from '../shared/types';
import { fetchWithAuth } from '../lib/apiClient';
import { UploadCloud, FileText, File, Trash2, Download, Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface MaterialManagerProps {
  subjectId: string;
  topicId?: string; // If provided, it's for notes. If absent, it's for subject PYQs.
  materialType: 'note' | 'pyq';
}

export function MaterialManager({ subjectId, topicId, materialType }: MaterialManagerProps) {
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('subject_id', subjectId);
      formData.append('material_type', materialType);
      if (topicId) {
        formData.append('topic_id', topicId);
      }

      const uploadRes = await fetch('/api/materials/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('studypilot_token')}`
        },
        body: formData
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const newMaterial = await uploadRes.json();
      setMaterials([...materials, newMaterial]);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this material?')) return;
    try {
      await fetchWithAuth(`/api/materials/${id}`, { method: 'DELETE' });
      setMaterials(materials.filter(m => m.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  // Check if we need to poll for extraction status
  useEffect(() => {
    const hasPending = materials.some(m => m.extraction_status === 'pending' || m.extraction_status === 'processing');
    if (hasPending) {
      const interval = setInterval(loadMaterials, 3000);
      return () => clearInterval(interval);
    }
  }, [materials]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" className="text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" /> AI Ready</Badge>;
      case 'failed':
        return <Badge variant="danger" className="text-[10px]"><AlertCircle className="w-3 h-3 mr-1" /> Extraction Failed</Badge>;
      case 'pending':
      case 'processing':
        return <Badge variant="warning" className="text-[10px]"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Card className="border-danger/20 bg-danger/5">
          <CardContent className="p-3 flex items-center text-sm text-danger">
            <AlertCircle className="mr-2 h-4 w-4" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {loading && materials.length === 0 ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map(material => (
            <div key={material.id} className="flex items-center justify-between p-3 rounded-lg border bg-surface hover:bg-surface-hover/50 transition-colors shadow-sm">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-2 bg-primary/10 rounded text-primary">
                  {material.file_type.includes('pdf') ? (
                    <FileText className="w-4 h-4" />
                  ) : (
                    <File className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">{material.file_name}</p>
                  <div className="flex items-center mt-1 space-x-2">
                    <span className="text-[10px] text-muted-foreground uppercase">{material.file_type.split('/').pop()}</span>
                    {getStatusBadge(material.extraction_status)}
                    {material.extraction_truncated && (
                       <Badge variant="outline" className="text-[10px] border-warning text-warning">Truncated</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-4">
                <a 
                  href={`/api/materials/${material.id}/download`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                  title="Download file"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button 
                  onClick={() => handleDelete(material.id)}
                  className="p-1.5 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                  title="Delete file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {materials.length === 0 && (
            <div className="text-center py-8 border border-dashed rounded-lg bg-surface">
              <p className="text-sm text-muted-foreground">No materials uploaded yet.</p>
            </div>
          )}

          <div className="pt-2">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload} 
              className="hidden" 
              accept=".pdf,.doc,.docx,.txt"
            />
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full text-muted-foreground border-dashed"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UploadCloud className="w-4 h-4 mr-2" />
              )}
              {uploading ? 'Uploading...' : `Upload ${materialType === 'note' ? 'Notes' : 'PYQ'} (PDF, DOCX, TXT)`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
