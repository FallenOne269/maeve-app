import { useRef, useCallback, useState } from "react";
import { Paperclip, X, FileText, Image } from "lucide-react";
import type { FileAttachment } from "@/types";

const ACCEPTED = ["image/jpeg", "image/png", "image/gif", "image/webp", "text/plain", "application/pdf"];
const MAX_SIZE_MB = 5;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip "data:...;base64," prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface Props {
  attachments: FileAttachment[];
  onAdd: (files: FileAttachment[]) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export default function FileUploadZone({ attachments, onAdd, onRemove, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const newAttachments: FileAttachment[] = [];
    for (const file of Array.from(files)) {
      if (!ACCEPTED.includes(file.type)) {
        setError(`Unsupported type: ${file.name}`);
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`${file.name} exceeds ${MAX_SIZE_MB}MB`);
        continue;
      }
      const data = await fileToBase64(file);
      const isImage = file.type.startsWith("image/");
      newAttachments.push({
        name: file.name,
        type: file.type,
        size: file.size,
        data,
        mediaType: file.type as FileAttachment["mediaType"],
        isImage,
      });
    }
    if (newAttachments.length > 0) onAdd(newAttachments);
  }, [onAdd]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  return (
    <div className="flex flex-col gap-2">
      {/* Attachment pills */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {attachments.map((att, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 bg-maeve-border px-2.5 py-1 rounded text-xs font-mono text-maeve-cyan border border-maeve-muted/30"
            >
              {att.isImage ? <Image size={12} /> : <FileText size={12} />}
              <span className="max-w-[120px] truncate">{att.name}</span>
              <button
                onClick={() => onRemove(i)}
                className="ml-1 text-maeve-muted hover:text-red-400 transition-colors"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone hint + button */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`transition-colors rounded ${dragging ? "bg-maeve-border/40" : ""}`}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 text-maeve-muted hover:text-maeve-cyan transition-colors text-sm font-mono px-1 py-1 disabled:opacity-40"
          title="Attach file (images, PDF, text — max 5MB)"
        >
          <Paperclip size={15} />
          <span className="text-xs">attach</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="text-xs text-red-400 font-mono px-1">{error}</p>
      )}
    </div>
  );
}
