import React, { useState, useEffect } from 'react';
import {
  X, GitBranch, GitCommit, GitPullRequest,
  CheckCircle2, AlertCircle, Copy, Check, Download,
  ExternalLink, Terminal, Shield, RefreshCw, UploadCloud
} from 'lucide-react';
import { api } from '../lib/api.ts';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({ isOpen, onClose }) => {
  const [gitStatus, setGitStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState<'push' | 'cli' | 'archive'>('push');

  // Direct push form state
  const [repoUrl, setRepoUrl] = useState('https://github.com/jiyanshi622/skillora.git');
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('jiyanshi622');
  const [forcePush, setForcePush] = useState(true);
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ success: boolean; log: string } | null>(null);

  // CLI state
  const [cliUsername, setCliUsername] = useState('jiyanshi622');
  const [copiedCli, setCopiedCli] = useState(false);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await api.getGitStatus();
      setGitStatus(res);
    } catch (err) {
      console.warn('Failed to load git status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setPushResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDirectPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setPushing(true);
    setPushResult(null);

    try {
      const res = await api.pushToGitHub({
        repoUrl: repoUrl.trim(),
        token: token.trim() || undefined,
        username: username.trim() || undefined,
        force: forcePush
      });

      setPushResult({
        success: res.success,
        log: res.log || res.message || 'Push completed successfully!'
      });
      fetchStatus();
    } catch (err: any) {
      setPushResult({
        success: false,
        log: err.message || 'Push failed. Please verify your repository URL and Personal Access Token permissions.'
      });
    } finally {
      setPushing(false);
    }
  };

  const cliCommands = `# 1. Add your remote repository
git remote add origin https://github.com/${cliUsername.trim() || '<your-username>'}/skillora.git

# 2. Set the main branch
git branch -M main

# 3. Push all commits & code to your repository
git push -u origin main

# (Optional: If your GitHub repo was initialized with a README or License, force push)
git push -u origin main --force`;

  const handleCopyCli = () => {
    navigator.clipboard.writeText(cliCommands);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const handleDownloadArchive = () => {
    window.location.href = '/api/github/download-archive';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C241D]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E8E2D5] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-[#F0EBE0] shrink-0 bg-[#FAF8F5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2C241D] text-white flex items-center justify-center shrink-0 shadow-xs">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-[#2C241D]">
                  Sync to GitHub Repository
                </h2>
                <span className="text-[11px] font-bold text-[#55634E] bg-[#E9E4D6] px-2.5 py-0.5 rounded-full">
                  Skillora Repo
                </span>
              </div>
              <p className="text-xs text-[#7A7165] mt-0.5">
                Push all 40+ source files, Python/FastAPI backend, MySQL schema, and UI to your GitHub account.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7A7165] hover:text-[#2C241D] rounded-xl hover:bg-[#F5F2EA] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Git Repository Status Banner */}
        <div className="p-4 px-6 bg-[#FAF7F0] border-b border-[#F0EBE0] flex items-center justify-between flex-wrap gap-3 text-xs shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 font-bold text-[#2C241D]">
              <GitBranch className="w-3.5 h-3.5 text-[#55634E]" />
              <span>Branch:</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-[#E5E0D4]">
                {gitStatus?.branch || 'main'}
              </span>
            </div>

            {gitStatus?.commit?.hash && (
              <div className="flex items-center gap-1.5 text-[#6B6256]">
                <GitCommit className="w-3.5 h-3.5 text-[#55634E]" />
                <span className="font-mono font-bold text-[#2C241D]">
                  {gitStatus.commit.hash}
                </span>
                <span className="text-[#998F82] truncate max-w-[200px]">
                  ({gitStatus.commit.message})
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[#55634E] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{gitStatus?.totalFiles || 40} files tracked</span>
            </div>
          </div>

          <button
            onClick={fetchStatus}
            disabled={loadingStatus}
            className="text-[11px] font-bold text-[#6B6256] hover:text-[#2C241D] flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${loadingStatus ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-[#F0EBE0] px-6 shrink-0 bg-white">
          <button
            onClick={() => setActiveTab('push')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'push'
                ? 'border-[#55634E] text-[#55634E]'
                : 'border-transparent text-[#7A7165] hover:text-[#2C241D]'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Direct In-App Push</span>
          </button>

          <button
            onClick={() => setActiveTab('cli')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'cli'
                ? 'border-[#55634E] text-[#55634E]'
                : 'border-transparent text-[#7A7165] hover:text-[#2C241D]'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Terminal / CLI Commands</span>
          </button>

          <button
            onClick={() => setActiveTab('archive')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'archive'
                ? 'border-[#55634E] text-[#55634E]'
                : 'border-transparent text-[#7A7165] hover:text-[#2C241D]'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Download Archive (.tar.gz)</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: DIRECT IN-APP PUSH */}
          {activeTab === 'push' && (
            <form onSubmit={handleDirectPush} className="space-y-4">
              <div className="bg-[#F5F2EA] rounded-2xl p-4 border border-[#E8E2D5] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#382B21]">
                  <Shield className="w-4 h-4 text-[#55634E]" />
                  <span>How to push directly from here to your GitHub:</span>
                </div>
                <ol className="text-xs text-[#6B6256] list-decimal list-inside space-y-1 pl-1">
                  <li>Make sure you created a repository named <strong className="text-[#2C241D]">skillora</strong> on GitHub.</li>
                  <li>
                    Generate a GitHub Personal Access Token (classic or fine-grained with <strong className="text-[#2C241D]">repo</strong> scope) at{' '}
                    <a
                      href="https://github.com/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#55634E] font-bold underline inline-flex items-center gap-0.5"
                    >
                      github.com/settings/tokens <ExternalLink className="w-3 h-3 inline" />
                    </a>.
                  </li>
                  <li>Paste the token below and click <strong className="text-[#2C241D]">Push to GitHub</strong>.</li>
                </ol>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C241D] mb-1.5">
                  GitHub Repository URL
                </label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/skillora.git or username/skillora"
                  required
                  className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-[#D5CFBF] bg-[#FAF8F5] text-[#2C241D] focus:outline-none focus:ring-2 focus:ring-[#55634E]"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2C241D] mb-1.5">
                    GitHub Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. jiyanshi622"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D5CFBF] bg-[#FAF8F5] text-[#2C241D] focus:outline-none focus:ring-2 focus:ring-[#55634E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2C241D] mb-1.5">
                    Personal Access Token (PAT)
                  </label>
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx or github_pat_xxxx"
                    className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-[#D5CFBF] bg-[#FAF8F5] text-[#2C241D] focus:outline-none focus:ring-2 focus:ring-[#55634E]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="forcePush"
                  checked={forcePush}
                  onChange={(e) => setForcePush(e.target.checked)}
                  className="w-4 h-4 rounded border-[#D5CFBF] text-[#55634E] focus:ring-[#55634E] cursor-pointer"
                />
                <label htmlFor="forcePush" className="text-xs text-[#6B6256] cursor-pointer select-none">
                  Overwrite remote if repository already initialized on GitHub (<code className="font-mono text-[#2C241D]">--force</code>)
                </label>
              </div>

              <button
                type="submit"
                disabled={pushing || !repoUrl}
                className="w-full py-3.5 px-4 rounded-full bg-[#55634E] hover:bg-[#47533F] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {pushing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Pushing code to GitHub...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Push to My GitHub Repository</span>
                  </>
                )}
              </button>

              {/* Push result output */}
              {pushResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in duration-200 ${
                    pushResult.success
                      ? 'bg-[#EBF1E8] border-[#8EA681] text-[#2F4425]'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {pushResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-[#55634E]" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span>{pushResult.success ? 'Success! Code pushed to GitHub' : 'Push error'}</span>
                  </div>
                  <pre className="p-3 bg-black/90 text-green-400 font-mono text-[11px] rounded-xl overflow-x-auto whitespace-pre-wrap max-h-48">
                    {pushResult.log}
                  </pre>
                  {pushResult.success && (
                    <div className="pt-1">
                      <a
                        href={repoUrl.replace(/\.git$/, '')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-bold text-xs underline text-[#55634E]"
                      >
                        View your Skillora repository on GitHub <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </form>
          )}

          {/* TAB 2: TERMINAL / CLI */}
          {activeTab === 'cli' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#2C241D]">
                    Push via Local Terminal / Command Line
                  </h3>
                  <p className="text-xs text-[#7A7165]">
                    Copy and run these commands in your project folder to push directly to GitHub.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-[#6B6256]">Username:</label>
                  <input
                    type="text"
                    value={cliUsername}
                    onChange={(e) => setCliUsername(e.target.value)}
                    className="w-32 px-2.5 py-1 text-xs rounded-lg border border-[#D5CFBF] bg-[#FAF8F5]"
                  />
                </div>
              </div>

              <div className="relative">
                <pre className="p-4 bg-[#1E1915] text-[#D8D2C5] rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed border border-[#3D352B]">
                  {cliCommands}
                </pre>

                <button
                  onClick={handleCopyCli}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCli ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Commands</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[#F5F2EA] rounded-2xl p-4 border border-[#E8E2D5] space-y-1 text-xs text-[#6B6256]">
                <div className="font-bold text-[#2C241D]">💡 Tip:</div>
                <p>
                  All 40 files including the FastAPI backend (<code className="font-mono text-[#2C241D]">backend/</code>), MySQL relational schema (<code className="font-mono text-[#2C241D]">schema.sql</code>), Express server (<code className="font-mono text-[#2C241D]">server.ts</code>), and React components are committed to branch <code className="font-mono text-[#2C241D]">main</code>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: DOWNLOAD ARCHIVE */}
          {activeTab === 'archive' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[#EBE5D8] text-[#554A3B] flex items-center justify-center mx-auto shadow-xs">
                <Download className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#2C241D]">
                  Download Complete Git Repository Archive
                </h3>
                <p className="text-xs text-[#7A7165] max-w-md mx-auto mt-1">
                  Download a tarball archive containing all code, Git commits, documentation, assets, and database schemas to push locally or deploy.
                </p>
              </div>

              <button
                onClick={handleDownloadArchive}
                className="px-6 py-3 rounded-full bg-[#55634E] hover:bg-[#47533F] text-white text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download skillora-repository.tar.gz</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[#F0EBE0] bg-[#FAF8F5] flex items-center justify-between text-xs text-[#7A7165] shrink-0">
          <span>Repository: Skillora (AI Personalized Learning Assistant)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full border border-[#D5CFBF] hover:bg-white text-[#2C241D] font-bold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
