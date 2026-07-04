"use client";

interface Props {
  fileId: string;
}

export default function PdfPreview({ fileId }: Props) {
  const src = `/api/files/${fileId}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;

  return (
    <div className="h-full w-full bg-ink-950">
      <iframe
        src={src}
        title="PDF preview"
        className="h-full w-full border-0"
      />
    </div>
  );
}
