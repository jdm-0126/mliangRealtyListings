import React from "react";

interface FacebookPreviewProps {
  text: string;
}

export function FacebookPreview({ text }: FacebookPreviewProps) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <h3 className="mb-2 font-semibold text-gray-800">
        Facebook Post Preview
      </h3>

      <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded border bg-white p-3 text-sm text-gray-700">
        {text}
      </pre>
    </div>
  );
}