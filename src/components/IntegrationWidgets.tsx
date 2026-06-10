import { Download, FileText, Bell, Globe, Fingerprint, Lock, Activity, BotMessageSquare, Landmark } from 'lucide-react';
import React, { useState } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  if (!isOpen) return null;

  const handleBiometrics = async () => {
    try {
      if (!window.PublicKeyCredential) {
        alert("A biometria não é suportada neste dispositivo/navegador.");
        return;
      }
      await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: { name: "Planejador Financeiro" },
          user: { id: new Uint8Array(16), name: "user@example.com", displayName: "Usuário Financeiro" },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }],
          authenticatorSelection: { userVerification: "preferred" },
          timeout: 60000,
        }
      });
      alert("Autenticação biométrica ativada com sucesso!");
    } catch (e) {
      console.error(e);
      alert("Falha ou cancelamento na configuração da biometria.");
    }
  };

  const handleNotification = async () => {
    if (!('Notification' in window)) {
      alert("Este navegador não suporta notificações de área de trabalho.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification("Planejador Financeiro", {
        body: "Notificações ativadas! Você receberá alertas de vencimento e oscilações.",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
          &times; Fechar
        </button>
        <h2 className="text-xl font-medium text-white mb-6">Configurações e Integrações</h2>
        
        <div className="space-y-4">
          <button onClick={handleBiometrics} className="w-full flex items-center justify-between p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition">
            <div className="flex items-center gap-3">
              <Fingerprint className="text-emerald-400" size={20} />
              <div className="text-left">
                <p className="text-sm font-medium text-white">Biometria (WebAuthn)</p>
                <p className="text-xs text-zinc-400">Ativar acesso seguro</p>
              </div>
            </div>
            <span className="text-xs bg-zinc-700 px-2 py-1 rounded text-zinc-300">Configurar</span>
          </button>

          <button onClick={handleNotification} className="w-full flex items-center justify-between p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition">
            <div className="flex items-center gap-3">
              <Bell className="text-amber-400" size={20} />
              <div className="text-left">
                <p className="text-sm font-medium text-white">Notificações Push</p>
                <p className="text-xs text-zinc-400">Alertas inteligentes e metas</p>
              </div>
            </div>
            <span className="text-xs bg-zinc-700 px-2 py-1 rounded text-zinc-300">Permitir</span>
          </button>

          <button onClick={() => alert("Simulação: Redirecionando para OAuth da sua Instituição Bancária...")} className="w-full flex items-center justify-between p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition">
            <div className="flex items-center gap-3">
              <Landmark className="text-blue-400" size={20} />
              <div className="text-left">
                <p className="text-sm font-medium text-white">Integração Bancária (API)</p>
                <p className="text-xs text-zinc-400">Open Finance Sync</p>
              </div>
            </div>
            <span className="text-xs bg-zinc-700 px-2 py-1 rounded text-zinc-300">Conectar</span>
          </button>

           <div className="w-full flex items-center justify-between p-3 rounded-lg bg-zinc-800 opacity-60 cursor-not-allowed">
            <div className="flex items-center gap-3">
              <Activity className="text-rose-400" size={20} />
              <div className="text-left">
                <p className="text-sm font-medium text-white">Dispositivos Vestíveis</p>
                <p className="text-xs text-zinc-400">Apple Watch / Galaxy Fit</p>
              </div>
            </div>
            <span className="text-xs bg-zinc-700 px-2 py-1 rounded text-zinc-300">Cooming Soon</span>
          </div>

        </div>
      </div>
    </div>
  );
}

export function SupportChat() {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-80 h-96 mb-4 flex flex-col overflow-hidden">
          <div className="bg-zinc-800 p-4 border-b border-zinc-700 flex justify-between items-center">
            <h3 className="font-medium text-white flex items-center gap-2">
              <BotMessageSquare size={18} /> Suporte 24/7
            </h3>
            <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-white">&times;</button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="bg-zinc-800 rounded-lg p-3 text-sm text-zinc-300 mb-2 w-[85%]">
              Olá! Como posso ajudar com seus investimentos hoje?
            </div>
          </div>
          <div className="p-3 border-t border-zinc-800">
            <input type="text" placeholder="Digite sua mensagem..." className="w-full bg-zinc-800 rounded-md p-2 text-sm text-white outline-none border border-transparent focus:border-zinc-600" />
          </div>
        </div>
      )}
      <button 
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
      >
        <BotMessageSquare size={24} />
      </button>
    </div>
  );
}
