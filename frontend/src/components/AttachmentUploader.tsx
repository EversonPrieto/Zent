'use client';

import { useTheme } from '../hooks/useTheme';

import { useState } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { Upload, Loader2, Trash2, Download, FileIcon } from 'lucide-react';
import { api } from '../lib/api';

type Attachment = {
  id: string;
  url?: string;
  name?: string;
  size?: number;
  createdAt?: string;
  fileType?: string;
};

type Props = {
  taskId: string;
  workspaceId: string;
  attachments: Attachment[];
  onAttachmentAdded: (attachment: Attachment) => void;
  onAttachmentRemoved: (attachmentId: string) => void;
};

export default function AttachmentUploader({
  taskId,
  workspaceId,
  attachments,
  onAttachmentAdded,
  onAttachmentRemoved,
}: Props) {
  const { themeClasses } = useTheme();
  const [loading, setLoading] = useState(false);

  async function handleUploadSuccess(result: any) {
    try {
      setLoading(true);

      const attachment = {
        id: result.event?.public_id || `att_${Date.now()}`,
        url: result.info?.secure_url,
        name: result.info?.original_filename || 'Anexo',
        size: result.info?.bytes || 0,
        createdAt: new Date().toISOString(),
      };

      await api(`/tasks/${taskId}/attachments`, {
        method: 'POST',
        workspaceId,
        body: JSON.stringify(attachment),
      });

      onAttachmentAdded(attachment);
    } catch (err) {
      console.error('Erro ao salvar anexo:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAttachment(attachmentId: string) {
    try {
      setLoading(true);
      await api(`/tasks/${taskId}/attachments/${attachmentId}`, {
        method: 'DELETE',
        workspaceId,
      });
      onAttachmentRemoved(attachmentId);
    } catch (err) {
      console.error('Erro ao deletar anexo:', err);
    } finally {
      setLoading(false);
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (a: Attachment) => {
    if (a.fileType?.startsWith('image/')) return true;
    const url = a.url || '';
    // Cloudinary secure_url typically ends with a file extension.
    return /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
  };


  return (
    <div className="space-y-4">
      <CldUploadWidget
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
        onSuccess={handleUploadSuccess}
      >
        {({ open }) => (
          <button
            onClick={() => open()}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed ${themeClasses.border.primary} ${themeClasses.bg.subtle} py-3 text-sm font-medium ${themeClasses.text.secondary} hover:${themeClasses.border.hover} hover:${themeClasses.bg.hover} transition-colors disabled:opacity-50`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Adicionar Anexo
              </>
            )}
          </button>
        )}
      </CldUploadWidget>

      {attachments.length > 0 && (
        <div className="space-y-3">
          {/* debug in console - não renderiza nada */}
          {(() => {
            try {
              attachments.slice(0, 3).forEach((a) => {
                console.debug('[AttachmentUploader]', {
                  id: a.id,
                  url: a.url,
                  fileType: a.fileType,
                  name: a.name,
                });
              });
            } catch {
              // ignore
            }
            return null;
          })()}

          <p className={`text-xs font-semibold uppercase ${themeClasses.text.hint}`}>Anexos ({attachments.length})</p>

          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className={`rounded-lg border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-3`}
            >
              {isImage(attachment) && attachment.url && (
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mb-3 rounded-lg overflow-hidden"
                  title={attachment.name}
                >
                  <img
                    src={attachment.url}
                    alt={attachment.name ?? 'Imagem'}
                    className="w-full h-40 object-cover"
                    loading="lazy"
                  />
                </a>
              )}


              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FileIcon className={`h-4 w-4 ${themeClasses.text.hint} flex-shrink-0`} />
                  <div className="min-w-0 flex-1">
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-violet-400 hover:underline truncate block"
                    >
                      {attachment.name}
                    </a>
                    <p className={`text-xs ${themeClasses.text.muted}`}>{formatFileSize(attachment.size ?? 0)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <a
                    href={attachment.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`rounded-lg p-2 ${themeClasses.text.hint} hover:${themeClasses.bg.hover} hover:${themeClasses.text.primary} transition-colors`}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                <button
                  onClick={async () => {
                    const ok = window.confirm('Tem certeza que deseja deletar este anexo?');
                    if (!ok) return;
                    await handleDeleteAttachment(attachment.id);
                  }}
                  disabled={loading}
                  className={`rounded-lg p-2 ${themeClasses.text.hint} hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-50`}
                  title="Deletar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

