import React from 'react';

interface TextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onImport: (file: File) => void;
  onClear: () => void;
}

export function TextEditor({ content, onChange, onImport, onClear }: TextEditorProps) {
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
    }
    // Reset input so the same file can be imported again
    e.target.value = '';
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Script</h2>
        <div className="flex gap-2">
          <label className="flex-1">
            <input
              type="file"
              accept=".txt"
              onChange={handleFileImport}
              className="hidden"
            />
            <button className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">
              Import Text File
            </button>
          </label>
          <button
            onClick={onClear}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste or type your script here..."
        className="flex-1 p-4 border-none focus:ring-0 resize-none font-mono text-sm text-gray-700 placeholder-gray-400"
      />
    </div>
  );
}
