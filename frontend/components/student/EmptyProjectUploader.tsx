/**
 * 空白專案上傳器
 *
 * 當專案沒有綁定文獻時顯示，允許直接拖曳上傳
 */

import { Upload, FolderOpen } from 'lucide-react';
import React, { useState, useRef, useCallback } from 'react';
import { useStore } from '../../store';

interface EmptyProjectUploaderProps {
  onOpenLibrary?: () => void;
}

export const EmptyProjectUploader: React.FC<EmptyProjectUploaderProps> = ({ onOpenLibrary }) => {
  const { uploadFileDocument, loadDocuments } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleFilesUpload = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );

      if (fileArray.length === 0) {
        alert('請選擇 PDF 檔案');
        return;
      }

      setIsUploading(true);
      setUploadProgress(`正在上傳 ${fileArray.length} 個檔案...`);

      try {
        for (let i = 0; i < fileArray.length; i++) {
          const file = fileArray[i];
          const title = file.name.replace(/\.pdf$/i, '');
          setUploadProgress(`上傳中 (${i + 1}/${fileArray.length}): ${title}`);
          await uploadFileDocument(title, file);
        }

        await loadDocuments();
        setUploadProgress(`成功上傳 ${fileArray.length} 個檔案！`);

        setTimeout(() => {
          setUploadProgress('');
        }, 2000);
      } catch (error) {
        console.error('Upload failed:', error);
        setUploadProgress('上傳失敗，請重試');
      } finally {
        setIsUploading(false);
        setIsDragging(false);
      }
    },
    [uploadFileDocument, loadDocuments]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFilesUpload(files);
      }
    },
    [handleFilesUpload]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFilesUpload(files);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFilesUpload]
  );

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`
        flex-1 flex items-center justify-center p-8 m-4
        ${isDragging ? 'bg-violet-50 border-violet-400' : 'bg-slate-50 border-slate-200'}
        border-2 border-dashed rounded-2xl transition-all duration-200
        ${isUploading ? 'pointer-events-none opacity-70' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="text-center max-w-md">
        {isUploading ? (
          <>
            <div className="animate-pulse">
              <Upload size={48} className="mx-auto text-violet-500 mb-4" />
            </div>
            <p className="text-violet-600 font-medium">{uploadProgress}</p>
          </>
        ) : (
          <>
            <Upload
              size={48}
              className={`mx-auto mb-4 ${isDragging ? 'text-violet-500' : 'text-slate-400'}`}
            />
            <h3 className="text-lg font-bold text-slate-700 mb-2">尚未指定文獻</h3>
            <p className="text-slate-500 mb-4 text-sm">
              拖曳 PDF 到此處直接上傳，或點擊下方按鈕選擇檔案
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={handleOpenFilePicker}
                className="btn btn-primary btn-sm gap-2"
                disabled={isUploading}
              >
                <Upload size={16} />
                選擇檔案上傳
              </button>
              {onOpenLibrary && (
                <button
                  onClick={onOpenLibrary}
                  className="btn btn-outline btn-sm gap-2"
                  disabled={isUploading}
                >
                  <FolderOpen size={16} />
                  從文獻庫選取
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-4">支援批次上傳：可一次拖曳多個 PDF 檔案</p>
          </>
        )}
      </div>
    </div>
  );
};
