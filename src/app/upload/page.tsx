"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
  FileText, UploadCloud, 
  X, CheckCircle2, AlertCircle, File, Mail,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFile = e.dataTransfer.files[0];
      validateAndSetFile(selectedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    if (selectedFile.type === "application/pdf" || selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
      toast.success(`File "${selectedFile.name}" selected.`);
    } else {
      toast.error("Invalid file type. Please select a PDF or Image.");
    }
  };

  const handleUpload = () => {
    if (!file) return;
    
    setUploading(true);
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2500)),
      {
        loading: 'AI is extracting data...',
        success: () => {
          setUploading(false);
          // Redirect to a mock invoice detail page
          window.location.href = `/invoices/INV-${Math.floor(Math.random() * 10000)}`;
          return 'Invoice processed successfully!';
        },
        error: 'Failed to process invoice.',
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <AppHeader title="Upload Invoice" />

        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-3xl mx-auto w-full">
            
            {/* Title / Description */}
            <div className="mb-10">
              <h1 className="text-2xl font-bold text-white mb-2">Process New Invoice</h1>
              <p className="text-slate-400 text-sm">
                Upload a PDF or Image. Our AI will automatically extract all fields and check for duplicates.
              </p>
            </div>

            {/* Upload Area */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative bg-slate-900/40 border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center transition-all ${
                isDragging 
                  ? "border-primary-500 bg-primary-500/10 shadow-[0_0_40px_rgba(37,99,235,0.15)]" 
                  : "border-slate-800 hover:border-slate-700"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,image/png,image/jpeg,image/webp"
                className="hidden" 
              />
              
              {!file ? (
                <div className="space-y-6">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto text-slate-500 border border-slate-700/50">
                    <UploadCloud size={28} />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-white mb-1">
                      Drag & drop your file here
                    </p>
                    <p className="text-xs text-slate-500">
                      Supports PDF, PNG, JPG (Max 10MB)
                    </p>
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
                  >
                    Browse Files
                  </button>
                </div>
              ) : (
                <div className="w-full max-w-sm py-4">
                  <div className="bg-slate-800/60 rounded-xl p-4 flex items-center gap-4 border border-slate-700/50 relative">
                    <div className="w-10 h-10 rounded-lg bg-primary-600/10 text-primary-400 flex items-center justify-center shrink-0">
                      <File size={20} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm text-white font-medium truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1].toUpperCase()}</p>
                    </div>
                    <button 
                      onClick={() => setFile(null)}
                      className="w-7 h-7 rounded-full hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
                      disabled={uploading}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {uploading ? (
                    <div className="mt-8 space-y-3">
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-primary-500"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 2.5, ease: "easeInOut" }}
                        />
                      </div>
                      <p className="text-xs text-primary-400 font-medium animate-pulse">
                        Extracting data with AI...
                      </p>
                    </div>
                  ) : (
                    <button 
                      onClick={handleUpload}
                      className="w-full mt-8 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} /> Process Invoice
                    </button>
                  )}
                </div>
              )}
            </motion.div>

            {/* Alternative Methods */}
            <div className="grid md:grid-cols-2 gap-4 mt-8">
              <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl flex gap-4">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                  <Mail size={18} />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-xs mb-1">Email Intake</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Forward your invoices to your unique Ledgix address to process them.
                  </p>
                </div>
              </div>
              <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl flex gap-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-xs mb-1">Auto-Validation</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Our AI automatically checks for common errors and duplicate IDs.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
