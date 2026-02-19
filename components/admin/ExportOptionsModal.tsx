import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";

interface ExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (selectedFields: string[]) => void;
  allFields: string[];
}

export default function ExportOptionsModal({
  isOpen,
  onClose,
  onExport,
  allFields,
}: ExportOptionsModalProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  // Initialize selected fields when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFields(allFields);
    }
  }, [isOpen, allFields]);

  // Lock scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
    };
  }, [isOpen]);

  const toggleField = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    );
  };

  const handleSelectAll = () => {
    setSelectedFields(allFields);
  };

  const handleDeselectAll = () => {
    setSelectedFields([]);
  };

  if (!isOpen) return null;

  return (
    <div
      data-lenis-prevent
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white font-unbounded">
            Export Options
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-400 mb-4 text-sm">
            Select the fields you want to include in the export file.
          </p>

          <div className="flex gap-3 mb-4">
            <button
              onClick={handleSelectAll}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider"
            >
              Select All
            </button>
            <span className="text-gray-600">|</span>
            <button
              onClick={handleDeselectAll}
              className="text-xs font-bold text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-wider"
            >
              Deselect All
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {allFields.map((field) => (
              <label
                key={field}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedFields.includes(field)
                    ? "bg-[#BA170D]/10 border-[#BA170D] text-white"
                    : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                    selectedFields.includes(field)
                      ? "bg-[#BA170D] border-[#BA170D]"
                      : "border-gray-500 bg-transparent"
                  }`}
                >
                  {selectedFields.includes(field) && (
                    <Check size={14} className="text-white" />
                  )}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={selectedFields.includes(field)}
                  onChange={() => toggleField(field)}
                />
                <span className="text-sm font-medium">{field}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-white/5 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onExport(selectedFields)}
            disabled={selectedFields.length === 0}
            className={`px-6 py-2 rounded-lg text-sm font-bold text-white transition-all ${
              selectedFields.length === 0
                ? "bg-gray-700 cursor-not-allowed opacity-50"
                : "bg-[#BA170D] hover:bg-[#a0140b] shadow-lg shadow-red-900/20"
            }`}
          >
            Export Selected
          </button>
        </div>
      </div>
    </div>
  );
}
