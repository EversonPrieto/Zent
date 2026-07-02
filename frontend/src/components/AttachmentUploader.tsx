'use client';

import { useTheme } from '../hooks/useTheme';

import { useState, useCallback } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { Upload, Loader2, Trash2, Download, FileIcon, FileText, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

/**
 * Tipos de arquivo suportados para upload
 */
const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'];
const ALLOWED_DOCUMENT_TYPES = ['pdf'];

// Todos os tipos permitidos
const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

/**
 * Mapeia extensão para tipo MIME
 */
const getMimeType = (extension: string): string => {
  const ext = extension.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

/**
 * Verifica se é uma imagem válida
 */
const isImageFile = (extension: string): boolean => {
  return ALLOWED_IMAGE_TYPES.includes(extension.toLowerCase());
};

/**
 * Verifica se é um PDF válido
 */
const isPdfFile = (extension: string): boolean => {
  return extension.toLowerCase() === 'pdf';
};

/**
 * Verifica tipo de arquivo pela extensão
 */
const getFileCategory = (extension: string): 'image' | 'pdf' | 'unknown' => {
  const ext = extension.toLowerCase();
  if (isImageFile(ext)) return 'image';
  if (isPdfFile(ext)) return 'pdf';
  return 'unknown';
};

type Attachment = {
  id: string;
  url?: string;
  fileName?: string;
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

/**
 * IMPORTANT: Em contas gratuitas do Cloudinary, pode haver uma configuração de segurança
 * que bloqueia a entrega pública de arquivos PDF/ZIP. Se os PDFs não carregarem,
 * vá até o Dashboard do Cloudinary -> Settings -> Security e desative a opção
 * "Restricted image formats" ou "Block delivery of PDF files".
 */
export default function AttachmentUploader({
  taskId,
  workspaceId,
  attachments,
  onAttachmentAdded,
  onAttachmentRemoved,
}: Props) {
  const { themeClasses } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Processa o resultado do upload com validação robusta
   */
  const processUploadResult = useCallback(async (result: any) => {
    setError(null);

    // Verifica se há erro do Cloudinary
    if (result.event === 'error') {
      const errorMessage = result.info?.error?.message || 'Erro ao fazer upload';
      throw new Error(errorMessage);
    }

    // Verifica se o upload foi cancelar pelo usuário
    if (result.event === 'abort') {
      return null;
    }

    // Verifica resposta do Cloudinary
    const info = result.info;
    if (!info) {
      throw new Error('Resposta inválida do Cloudinary');
    }

    // Verifica se tem URL pública
    if (!info.secure_url && !info.url) {
      throw new Error('URL não retornada pelo Cloudinary. Verifique as configurações de segurança do Cloudinary.');
    }

    // Extrai o nome original do arquivo
    const originalFileName = info.original_filename || 'Anexo';
    // Extrai a extensão do nome original ou da URL
    const url = info.secure_url || info.url;
    const extensionMatch = originalFileName.match(/\.([^.]+)$/);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : '';

    // Se nãoachou extensão no nome, tenta pegar da URL
    const urlExtensionMatch = url.match(/\.([^.?]+)(\?.*)?$/);
    const urlExtension = urlExtensionMatch ? urlExtensionMatch[1].toLowerCase() : '';

    // Usa a extensão encontrada (prioridade para URL se não tiver no nome)
    const finalExtension = extension || urlExtension || '';

    // Valida o tipo de arquivo
    const category = getFileCategory(finalExtension);
    if (category === 'unknown') {
      throw new Error(`Tipo de arquivo não permitido: .${finalExtension}. Arquivos permitidos: ${ALL_ALLOWED_TYPES.join(', ')}`);
    }

    const fileName = originalFileName;
    const fileType = getMimeType(finalExtension);

    // Monta o objeto de anexo
    const attachment = {
      id: info.public_id || `att_${Date.now()}`,
      url: info.secure_url,
      name: fileName,
      fileType: fileType,
      size: info.bytes || 0,
      createdAt: new Date().toISOString(),
    };

    // Envia para o backend e obtém o ID real do attachment criado
    await api(`/tasks/${taskId}/attachments`, {
      method: 'POST',
      workspaceId,
      body: JSON.stringify({
        url: attachment.url,
        fileName: fileName,
        fileType: attachment.fileType,
        size: attachment.size,
      }),
    });

    // Busca novamente a task para pegar o `attachment.id` gerado pelo banco
    const updatedTask = await api(`/tasks/${taskId}`, { workspaceId }) as any;
    const createdAttachment =
      updatedTask?.attachments?.find((a: any) => a.url === attachment.url) ??
      updatedTask?.task?.attachments?.find((a: any) => a.url === attachment.url);

    const resolvedAttachment = {
      ...attachment,
      id: createdAttachment?.id ?? attachment.id,
    };

    onAttachmentAdded(resolvedAttachment);
  }, [taskId, workspaceId, onAttachmentAdded]);

  /**
   * Lida com sucesso do upload
   */
  async function handleUploadSuccess(result: any) {
    try {
      setLoading(true);
      await processUploadResult(result);
    } catch (err: any) {
      console.error('Erro ao salvar anexo:', err);
      setError(err.message || 'Erro ao processar anexo');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Lida com erro durante o upload (erro do widget)
   */
  function handleUploadError(error: any) {
    console.error('Erro de upload:', error);
    setError('Falha no upload. Tente novamente.');
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
    return /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
  };

  const isPdf = (a: Attachment) => {
    if (a.fileType === 'application/pdf') return true;
    const url = a.url || '';
    return /\.pdf(\?.*)?$/i.test(url);
  };

  const getDisplayName = (a: Attachment) => {
    return a.fileName || a.name || 'Anexo';
  };

  /**
   * Gera URL para download-forcing de arquivos do Cloudinary
   * Adiciona parâmetro fl_attachment para forçar download
   */
  const getDownloadUrl = (url: string, fileName: string) => {
    if (!url) return url;
    if (url.includes('cloudinary.com')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}fl_attachment=${encodeURIComponent(fileName)}`;
    }
    return url;
  };

  return (
    <div className="space-y-4">
      {/*
        CldUploadWidget - Configuração para aceitar imagens E PDFs
        O Cloudinary trata PDFs como "raw" por padrão, mas usando "auto" como
        resource_type ele.detecta automaticamente o tipo de arquivo.
      */}
      <CldUploadWidget
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
        onSuccess={handleUploadSuccess}
        onError={handleUploadError}
        options={{
          // Aceita imagens e PDFs
          sources: ['local'],
          multiple: false,
          // Maximo 10MB
          maxFileSize: 10000000,
          // Resource type "auto" permite qualquer tipo de arquivo
          resourceType: 'auto',
          // Pasta no Cloudinary
          folder: 'zent/attachments',
        }}
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
                Adicionar Anexo (imagens ou PDF)
              </>
            )}
          </button>
        )}
      </CldUploadWidget>

      {/* Mensagem de erro */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tipos permitidos */}
      <p className={`text-xs ${themeClasses.text.hint}`}>
        Arquivos aceitos: {ALLOWED_IMAGE_TYPES.join(', ').toUpperCase()}, {ALLOWED_DOCUMENT_TYPES.join(', ').toUpperCase()} (max. 10MB)
      </p>

      {attachments.length > 0 && (
        <div className="space-y-3">
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
                  title={getDisplayName(attachment)}
                >
                  <img
                    src={attachment.url}
                    alt={getDisplayName(attachment)}
                    className="w-full h-40 object-cover"
                    loading="lazy"
                  />
                </a>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {isPdf(attachment) ? (
                    <FileText className="h-5 w-5 text-red-400 flex-shrink-0" />
                  ) : (
                    <FileIcon className={`h-4 w-4 ${themeClasses.text.hint} flex-shrink-0`} />
                  )}
                  <div className="min-w-0 flex-1">
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-violet-400 hover:underline truncate block"
                    >
                      {getDisplayName(attachment)}
                    </a>
                    <p className={`text-xs ${themeClasses.text.muted}`}>
                      {isPdf(attachment) ? 'PDF' : formatFileSize(attachment.size ?? 0)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <a
                    href={getDownloadUrl(attachment.url || '', getDisplayName(attachment))}
                    download={getDisplayName(attachment)}
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