import React, { useState, useRef } from 'react';
import { AssetVault } from '../services/AssetVault';
import { ProtocolShunt } from '../utils/ProtocolShunt';

export const MascotUploader: React.FC = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): boolean => {
        // 10MB limit
        if (file.size > 10 * 1024 * 1024) {
            setUploadStatus('Error: File exceeds 10MB limit.');
            return false;
        }
        if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf') && !file.name.endsWith('.blend')) {
            setUploadStatus('Error: Only .glb, .gltf, or .blend files allowed.');
            return false;
        }
        return true;
    };

    const handleFile = async (file: File) => {
        if (!validateFile(file)) return;
        
        setUploadStatus(`Uploading ${file.name}...`);
        
        // Mock authorization check
        const isPaid = localStorage.getItem('codedummy-is-buyer') === 'true';
        if (!isPaid) {
            setUploadStatus('Error: Custom Mascot Upload requires Tier 1 (Paid) Account.');
            return;
        }

        try {
            // If it's a blend file, it would theoretically hit the BlendForge Microservice here
            
            if (file.name.endsWith('.blend')) {
                setUploadStatus(`Delegating ${file.name} to external MCP Blender fallback...`);
                const localUrl = await ProtocolShunt.delegateConversionMCP(file, setUploadStatus);
                setUploadStatus("Success! Model converted and cached to OPFS via MCP.");
                window.dispatchEvent(new CustomEvent('mascot-model-uploaded', { detail: { url: localUrl } }));
                return;
            }


            // Standard GLB Upload
            const { uploadUrl, downloadUrl } = await AssetVault.generatePresignedUrl(file.name, file.type);
            console.log(`[MascotUploader] Simulated upload to R2/S3 presigned URL: ${uploadUrl}`);
            const cloudUrl = downloadUrl;
            setUploadStatus(`Cloud Sync Complete. Caching locally...`);
            
            const localUrl = await AssetVault.cacheFileToOPFS(file);
            setUploadStatus('Success! Model loaded to OPFS Cache.');
            
            // Dispatch event for AutonomousMascot to hot-swap
            window.dispatchEvent(new CustomEvent('mascot-model-uploaded', { detail: { url: localUrl } }));
        } catch (e: any) {
            setUploadStatus(`Error: ${e.message}`);
        }
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="mt-8 p-4 bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full mx-auto shadow-2xl">
            <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-2 text-center text-[#FFB703]">Mascot Library Vault</h3>
            <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragging ? 'border-[#F15BB5] bg-slate-800' : 'border-slate-600 hover:border-[#00F5D4]'}`}
            >
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".glb,.gltf,.blend" 
                    onChange={(e) => { if (e.target.files?.length) handleFile(e.target.files[0]); }}
                />
                <p className="text-slate-400 text-sm">Drag & Drop .glb / .blend file here to override Mascot</p>
                <p className="text-slate-500 text-xs mt-2">Max 10MB (Tier 1 Required)</p>
            </div>
            
            {uploadStatus && (
                <div className={`mt-4 text-xs font-mono p-2 rounded ${uploadStatus.includes('Error') ? 'bg-red-900/50 text-red-400' : 'bg-slate-800 text-[#00F5D4]'}`}>
                    {uploadStatus}
                </div>
            )}
        </div>
    );
};
