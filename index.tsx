import { render } from 'preact';
import { useState, useRef, useEffect, useCallback, useMemo } from 'preact/hooks';
import { Notification } from '../../components/Notification';
import './index.css';

// Constants for default languages
const DEFAULT_SOURCE_LANGUAGE = 'English - US';
const DEFAULT_TARGET_LANGUAGE = 'Spanish - Spain';

// Reusable type for media types
type MediaType = 'source' | 'target' | 'video';

interface Language { locale: string; language: string; flag?: string }
interface State {
  sourceLanguage: string;
  targetLanguage: string;
  dragActive: boolean;
  uploadedFile: File | null;
  uploadState: 'uploading' | 'processing' | 'completed' | null;
  progress: number;
  currentTime: number;
  duration: number;
  sourceCurrentTime: number;
  sourceDuration: number;
  targetCurrentTime: number;
  targetDuration: number;
  addBackgroundMusic: boolean;
  playbackSpeed: number;
  isPlaying: false | MediaType;
  isMuted: boolean;
  isFullscreen: boolean;
  videoUrl: string;
  translatedAudioUrl: string;
  emailAddress: string;
  isLanguageSelectorOpen: { source: boolean; target: boolean };
  jobId: string | null;
  isTranslatedPlaying: boolean;
  notification: { message: string; type: 'error' | 'success' } | null;
}
interface Refs {
  fileInputRef: HTMLInputElement | null;
  videoRef: HTMLVideoElement | null;
  sourceAudioRef: HTMLAudioElement | null;
  targetAudioRef: HTMLAudioElement | null;
  progressBarRef: HTMLDivElement | null;
  containerRef: HTMLDivElement | null;
}
interface AudioTranslatorProps { title?: string }

const sourceLanguages: Language[] = [
  { locale: 'en_US', language: 'English - US', flag: 'https://murf.ai/public-assets/Flags/Country%3DUS.svg' },
  { locale: 'en_UK', language: 'English - UK', flag: 'https://murf.ai/public-assets/Flags/Country%3DBritain.svg' },
  { locale: 'en_IN', language: 'English - India', flag: 'https://murf.ai/public-assets/Flags/Country%3DIndia.svg' },
  { locale: 'en_SCOTT', language: 'English - Scottish', flag: 'https://murf.ai/public-assets/Flags/Country%3DScotland.svg' },
  { locale: 'en_AU', language: 'English - Australia', flag: 'https://murf.ai/public-assets/Flags/Country%3DAustralia.svg' },
  { locale: 'fr_FR', language: 'French - France', flag: 'https://murf.ai/public-assets/Flags/Country%3DFrance.svg' },
  { locale: 'de_DE', language: 'German', flag: 'https://murf.ai/public-assets/Flags/Country%3DGermany.svg' },
  { locale: 'es_ES', language: 'Spanish - Spain', flag: 'https://murf.ai/public-assets/Flags/Country%3DSpain.svg' },
  { locale: 'es_MX', language: 'Spanish - Mexico', flag: 'https://murf.ai/public-assets/Flags/Country%3DMexico.svg' },
  { locale: 'it_IT', language: 'Italian', flag: 'https://murf.ai/public-assets/Flags/Country%3DItaly.svg' },
  { locale: 'pt_BR', language: 'Portuguese - Brazil', flag: 'https://murf.ai/public-assets/Flags/Country%3DBrazil.svg' },
  { locale: 'pl_PL', language: 'Polish', flag: 'https://murf.ai/public-assets/Flags/Country%3DPoland.svg' },
  { locale: 'hi_IN', language: 'Hindi', flag: 'https://murf.ai/public-assets/Flags/Country%3DIndia.svg' },
  { locale: 'ko_KR', language: 'Korean', flag: 'https://murf.ai/public-assets/Flags/Country%3DKorea.svg' },
  { locale: 'ja_JP', language: 'Japanese', flag: 'https://murf.ai/public-assets/Flags/Country%3DJapan.svg' },
  { locale: 'zh_CN', language: 'Chinese - Mandarin', flag: 'https://murf.ai/public-assets/Flags/Country%3DChina.svg' },
  { locale: 'nl_NL', language: 'Dutch', flag: 'https://murf.ai/public-assets/Flags/Country%3DNetherlands.svg' },
  { locale: 'fi_FI', language: 'Finnish', flag: 'https://murf.ai/public-assets/Flags/Country%3DFinland.svg' },
  { locale: 'ru_RU', language: 'Russian', flag: 'https://murf.ai/public-assets/Flags/Country%3DRussia.svg' },
  { locale: 'tr_TR', language: 'Turkish', flag: 'https://murf.ai/public-assets/Flags/Country%3DTurkey.svg' },
  { locale: 'uk_UA', language: 'Ukrainian', flag: 'https://murf.ai/public-assets/Flags/Country%3DUkraine.svg' },
];

const targetLanguages: Language[] = [
  { locale: 'en_US', language: 'English - US', flag: 'https://murf.ai/public-assets/Flags/Country%3DUS.svg' },
  { locale: 'en_UK', language: 'English - UK', flag: 'https://murf.ai/public-assets/Flags/Country%3DBritain.svg' },
  { locale: 'en_IN', language: 'English - India', flag: 'https://murf.ai/public-assets/Flags/Country%3DIndia.svg' },
  { locale: 'en_SCOTT', language: 'English - Scottish', flag: 'https://murf.ai/public-assets/Flags/Country%3DScotland.svg' },
  { locale: 'en_AU', language: 'English - Australia', flag: 'https://murf.ai/public-assets/Flags/Country%3DAustralia.svg' },
  { locale: 'fr_FR', language: 'French - France', flag: 'https://murf.ai/public-assets/Flags/Country%3DFrance.svg' },
  { locale: 'de_DE', language: 'German', flag: 'https://murf.ai/public-assets/Flags/Country%3DGermany.svg' },
  { locale: 'es_ES', language: 'Spanish - Spain', flag: 'https://murf.ai/public-assets/Flags/Country%3DSpain.svg' },
  { locale: 'es_MX', language: 'Spanish - Mexico', flag: 'https://murf.ai/public-assets/Flags/Country%3DMexico.svg' },
  { locale: 'it_IT', language: 'Italian', flag: 'https://murf.ai/public-assets/Flags/Country%3DItaly.svg' },
  { locale: 'pt_BR', language: 'Portuguese - Brazil', flag: 'https://murf.ai/public-assets/Flags/Country%3DBrazil.svg' },
  { locale: 'pl_PL', language: 'Polish', flag: 'https://murf.ai/public-assets/Flags/Country%3DPoland.svg' },
  { locale: 'hi_IN', language: 'Hindi', flag: 'https://murf.ai/public-assets/Flags/Country%3DIndia.svg' },
  { locale: 'ko_KR', language: 'Korean', flag: 'https://murf.ai/public-assets/Flags/Country%3DKorea.svg' },
  { locale: 'ta_IN', language: 'Tamil', flag: 'https://murf.ai/public-assets/Flags/Country%3DIndia.svg' },
  { locale: 'bn_IN', language: 'Bengali', flag: 'https://murf.ai/public-assets/Flags/Country%3DIndia.svg' },
  { locale: 'ja_JP', language: 'Japanese', flag: 'https://murf.ai/public-assets/Flags/Country%3DJapan.svg' },
  { locale: 'zh_CN', language: 'Chinese - Mandarin', flag: 'https://murf.ai/public-assets/Flags/Country%3DChina.svg' },
  { locale: 'nl_NL', language: 'Dutch', flag: 'https://murf.ai/public-assets/Flags/Country%3DNetherlands.svg' },
  { locale: 'fi_FI', language: 'Finnish', flag: 'https://murf.ai/public-assets/Flags/Country%3DFinland.svg' },
  { locale: 'ru_RU', language: 'Russian', flag: 'https://murf.ai/public-assets/Flags/Country%3DRussia.svg' },
  { locale: 'tr_TR', language: 'Turkish', flag: 'https://murf.ai/public-assets/Flags/Country%3DTurkey.svg' },
  { locale: 'da_DK', language: 'Danish', flag: 'https://murf.ai/public-assets/Flags/Country%3DDenmark.svg' },
  { locale: 'id_ID', language: 'Indonesian', flag: 'https://murf.ai/public-assets/Flags/Country%3DIndonesia.svg' },
  { locale: 'ro_RO', language: 'Romanian', flag: 'https://murf.ai/public-assets/Flags/Country%3DRomania.svg' },
  { locale: 'nb_NO', language: 'Norwegian', flag: 'https://murf.ai/public-assets/Flags/Country%3DNorway.svg' },
  { locale: 'hr_HR', language: 'Croatian', flag: 'https://murf.ai/public-assets/Flags/Country%3DCroatia.svg' },
  { locale: 'el_GR', language: 'Greek', flag: 'https://murf.ai/public-assets/Flags/Country%3DGreece.svg' },
  { locale: 'sk_SK', language: 'Slovak', flag: 'https://murf.ai/public-assets/Flags/Country%3DSlovakia.svg' },
];

const AudioTranslatorComponent = ({ title }: AudioTranslatorProps) => {
  const [state, setState] = useState<State>({
    sourceLanguage: DEFAULT_SOURCE_LANGUAGE,
    targetLanguage: DEFAULT_TARGET_LANGUAGE,
    dragActive: false,
    uploadedFile: null,
    uploadState: null,
    progress: 0,
    currentTime: 0,
    duration: 0,
    sourceCurrentTime: 0,
    sourceDuration: 0,
    targetCurrentTime: 0,
    targetDuration: 0,
    addBackgroundMusic: false,
    playbackSpeed: 1,
    isPlaying: false,
    isMuted: false,
    isFullscreen: false,
    videoUrl: '',
    translatedAudioUrl: '',
    emailAddress: '',
    isLanguageSelectorOpen: { source: false, target: false },
    jobId: null,
    isTranslatedPlaying: false,
    notification: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sourceAudioRef = useRef<HTMLAudioElement>(null);
  const targetAudioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const showNotification = useCallback((message: string, type: 'error' | 'success') => {
    setState(s => ({ ...s, notification: { message, type } }));
  }, []);

  const submitFileToDub = useCallback(async (file: File) => {
    const sourceLocale = sourceLanguages.find(l => l.language === state.sourceLanguage)?.locale || '';
    const targetLocale = targetLanguages.find(l => l.language === state.targetLanguage)?.locale || '';
    const formData = new FormData();
    formData.append('file_name', file.name);
    formData.append('file', file);
    formData.append('source_locale', sourceLocale);
    formData.append('target_locale', targetLocale);
    if (state.emailAddress && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.emailAddress)) {
      formData.append('email', state.emailAddress);
    }

    try {
      const response = await fetch('https://api.dev.murf.ai/murfdub/anonymous/jobs/create', { method: 'POST', body: formData });
      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.includes('submitted max free dubs')) {
          showNotification('Free translation limit reached. Please try again later.', 'error');
          setState(s => ({ ...s, uploadState: null, uploadedFile: null, videoUrl: '', jobId: null }));
          return;
        }
        throw new Error(`Upload failed: ${errorText}`);
      }
      const data = await response.json();
      if (!data.job_id) throw new Error('No job ID received');
      setState(s => ({ ...s, jobId: data.job_id, uploadState: 'processing', progress: 30 }));
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Error submitting file', 'error');
      setState(s => ({ ...s, uploadState: null, uploadedFile: null, videoUrl: '', jobId: null }));
    }
  }, [state.sourceLanguage, state.targetLanguage, state.emailAddress, showNotification]);

  const checkJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`https://api.dev.murf.ai/murfdub/anonymous/jobs/${jobId}/status`);
      if (!response.ok) throw new Error('Failed to check status');
      const data = await response.json();
      console.log('Job status:', data);
      switch (data.status) {
        case 'SUBMITTED': setState(s => ({ ...s, progress: 40 })); break;
        case 'QUEUED': setState(s => ({ ...s, progress: 60 })); break;
        case 'PROCESSING': setState(s => ({ ...s, progress: 80 })); break;
        case 'COMPLETED':
        case 'PARTIAL_SUCCESS': {
          const url = data.download_details?.[0]?.download_url;
          if (!url) throw new Error('No download URL');
          const blob = await (await fetch(url)).blob();
          const translatedUrl = URL.createObjectURL(blob);
          if (state.translatedAudioUrl) URL.revokeObjectURL(state.translatedAudioUrl);
          setState(s => ({
            ...s,
            progress: 100,
            uploadState: 'completed',
            translatedAudioUrl: translatedUrl,
            videoUrl: s.uploadedFile?.type.startsWith('video/') ? URL.createObjectURL(s.uploadedFile) : s.videoUrl,
            isPlaying: false,
            currentTime: 0, duration: 0,
            sourceCurrentTime: 0, sourceDuration: 0,
            targetCurrentTime: 0, targetDuration: 0,
          }));
          break;
        }
        case 'FAILED': throw new Error(data.failure_reason || 'Translation failed');
      }
    } catch (error) {
      if (error instanceof Error && error.message !== 'Failed to fetch') {
        showNotification('Error checking status', 'error');
      }
    }
  }, [state.translatedAudioUrl, state.uploadedFile, state.videoUrl, showNotification]);

  const formatTime = (t: number) => `${Math.floor(t / 60).toString().padStart(2, '0')}:${Math.floor(t % 60).toString().padStart(2, '0')}`;

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) setState(s => ({ ...s, currentTime: videoRef.current!.currentTime }));
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) setState(s => ({ ...s, duration: videoRef.current!.duration }));
  }, []);

  const handleProgressBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const { current: video } = videoRef;
    const { current: progressBar } = progressBarRef;
    if (video && progressBar) {
      const rect = progressBar.getBoundingClientRect();
      video.currentTime = ((e.clientX - rect.left) / rect.width) * video.duration || 0;
    }
  }, []);

  const handleSpeedChange = useCallback(() => {
    const speeds = [0.5, 1, 1.5, 2];
    const nextSpeed = speeds[(speeds.indexOf(state.playbackSpeed) + 1) % speeds.length];
    setState(s => ({ ...s, playbackSpeed: nextSpeed }));
    if (videoRef.current) videoRef.current.playbackRate = nextSpeed;
  }, [state.playbackSpeed]);

  const handleWaveClick = useCallback((e: React.MouseEvent<HTMLDivElement>, type: MediaType) => {
    const audioRef = type === 'source' ? sourceAudioRef : targetAudioRef;
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = clickPosition * (type === 'source' ? state.sourceDuration : state.targetDuration) || 0;
  }, [state.sourceDuration, state.targetDuration]);

  const togglePlay = useCallback((type: MediaType) => {
    const { current: video } = videoRef;
    const { current: sourceAudio } = sourceAudioRef;
    const { current: targetAudio } = targetAudioRef;
    const playMedia = (ref: HTMLMediaElement, playType: MediaType) => {
      [video, sourceAudio, targetAudio].forEach(r => r !== ref && r?.pause());
      if (state.isPlaying === playType) {
        ref.pause();
        setState(s => ({ ...s, isPlaying: false }));
      } else {
        ref.play().catch(console.error);
        setState(s => ({ ...s, isPlaying: playType }));
      }
    };
    if (type === 'source' && sourceAudio) playMedia(sourceAudio, 'source');
    else if (type === 'target' && targetAudio) playMedia(targetAudio, 'target');
    else if (type === 'video' && video) playMedia(video, 'video');
  }, [state.isPlaying]);

  const handleLanguageToggle = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isSource = (e.clientX - rect.left) < rect.width / 2;
    if (videoRef.current) {
      videoRef.current.src = isSource ? state.videoUrl : state.translatedAudioUrl;
      videoRef.current.load();
      videoRef.current.pause();
      setState(s => ({ ...s, isPlaying: false, isTranslatedPlaying: !isSource }));
    }
  }, [state.videoUrl, state.translatedAudioUrl]);

  const handleFile = useCallback(async (file: File) => {
    if (!['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'audio/mp3', 'audio/wav', 'audio/m4a'].includes(file.type) &&
        !file.name.match(/\.(mp4|avi|mov|wmv|mp3|wav|m4a)$/i)) {
      showNotification('Please upload a valid video or audio file', 'error');
      return;
    }
    setState(s => ({ ...s, uploadedFile: file, uploadState: 'uploading', progress: 0 }));
    const videoUrl = file.type.startsWith('video/') ? URL.createObjectURL(file) : '';
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setState(s => ({ ...s, progress: Math.min(95, progress) }));
    }, 300);
    await submitFileToDub(file);
    clearInterval(interval);
    if (videoRef.current && videoUrl) {
      videoRef.current.src = videoUrl;
      videoRef.current.load();
    }
  }, [submitFileToDub, showNotification]);

  const handleButtonClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    if (state.sourceLanguage === state.targetLanguage) {
      showNotification('Source and Target languages cannot be the same', 'error');
      return;
    }
    fileInputRef.current?.click();
  }, [state.sourceLanguage, state.targetLanguage, showNotification]);

  const handleCancel = useCallback(() => {
    [state.videoUrl, state.translatedAudioUrl].forEach(url => url && URL.revokeObjectURL(url));
    setState(s => ({
      ...s,
      uploadState: null,
      progress: 0,
      uploadedFile: null,
      videoUrl: '',
      translatedAudioUrl: '',
      jobId: null,
      currentTime: 0, duration: 0,
      sourceCurrentTime: 0, sourceDuration: 0,
      targetCurrentTime: 0, targetDuration: 0,
      isPlaying: false,
    }));
  }, [state.videoUrl, state.translatedAudioUrl]);

  const handleStartOver = useCallback(() => {
    videoRef.current?.pause();
    sourceAudioRef.current?.pause();
    targetAudioRef.current?.pause();
    [state.videoUrl, state.translatedAudioUrl, state.uploadedFile && URL.createObjectURL(state.uploadedFile)].forEach(url => url && URL.revokeObjectURL(url));
    setState({
      sourceLanguage: DEFAULT_SOURCE_LANGUAGE,
      targetLanguage: DEFAULT_TARGET_LANGUAGE,
      dragActive: false,
      uploadedFile: null,
      uploadState: null,
      progress: 0,
      currentTime: 0,
      duration: 0,
      sourceCurrentTime: 0,
      sourceDuration: 0,
      targetCurrentTime: 0,
      targetDuration: 0,
      addBackgroundMusic: false,
      playbackSpeed: 1,
      isPlaying: false,
      isMuted: false,
      isFullscreen: false,
      videoUrl: '',
      translatedAudioUrl: '',
      emailAddress: '',
      isLanguageSelectorOpen: { source: false, target: false },
      jobId: null,
      isTranslatedPlaying: false,
      notification: null,
    });
  }, [state.videoUrl, state.translatedAudioUrl, state.uploadedFile]);

  const handleDownload = useCallback(() => {
    if (state.translatedAudioUrl) {
      const link = document.createElement('a');
      link.href = state.translatedAudioUrl;
      link.download = `${state.uploadedFile?.name.split('.')[0]}_${state.targetLanguage}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [state.translatedAudioUrl, state.uploadedFile, state.targetLanguage]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !state.isMuted;
      setState(s => ({ ...s, isMuted: !s.isMuted }));
    }
  }, [state.isMuted]);

  const toggleFullScreen = useCallback(async () => {
    const container = containerRef.current;
    try {
      if (!document.fullscreenElement) {
        await container?.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);

  const toggleLanguageSelector = useCallback((selector: 'source' | 'target') => {
    setState(s => ({ ...s, isLanguageSelectorOpen: { ...s.isLanguageSelectorOpen, [selector]: !s.isLanguageSelectorOpen[selector] } }));
  }, []);

  const handleLanguageSelect = useCallback((type: 'source' | 'target', language: string) => {
    setState(s => ({
      ...s,
      [type === 'source' ? 'sourceLanguage' : 'targetLanguage']: language,
      isLanguageSelectorOpen: { ...s.isLanguageSelectorOpen, [type]: false },
    }));
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setState(s => ({ ...s, isFullscreen: isFs }));
      if (containerRef.current) {
        containerRef.current.style.cssText = isFs
          ? 'width:100vw;height:100vh;position:fixed;top:0;left:0;z-index:1000;background:black;'
          : '';
        if (videoRef.current) {
          videoRef.current.style.cssText = isFs ? 'width:100%;height:100%;object-fit:contain;' : '';
        }
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = state.playbackSpeed;
  }, [state.playbackSpeed]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const pollStatus = async () => {
      if (state.jobId && state.uploadState === 'processing') {
        await checkJobStatus(state.jobId);
        timeoutId = setTimeout(pollStatus, 60000);
      }
    };
    pollStatus();
    return () => clearTimeout(timeoutId);
  }, [state.jobId, state.uploadState, checkJobStatus]);

  useEffect(() => {
    if (state.uploadState === 'completed' && videoRef.current && state.uploadedFile?.type.startsWith('video/')) {
      videoRef.current.src = state.videoUrl;
      videoRef.current.load();
      videoRef.current.pause();
      if (state.translatedAudioUrl && targetAudioRef.current) {
        targetAudioRef.current.src = state.translatedAudioUrl;
        targetAudioRef.current.load();
      }
      if (state.uploadedFile && sourceAudioRef.current) {
        sourceAudioRef.current.src = URL.createObjectURL(state.uploadedFile);
        sourceAudioRef.current.load();
      }
    }
  }, [state.uploadState, state.videoUrl, state.translatedAudioUrl, state.uploadedFile]);

  const LanguageDropdown = useCallback(({ type, selectedLanguage, onToggle, isOpen, onSelect }: {
    type: 'source' | 'target';
    selectedLanguage: string;
    onToggle: (type: 'source' | 'target') => void;
    isOpen: boolean;
    onSelect: (type: 'source' | 'target', language: string) => void;
  }) => {
    const languages = type === 'source' ? sourceLanguages : targetLanguages;
    const selectedLang = useMemo(() => languages.find(l => l.language === selectedLanguage), [selectedLanguage]);
    return (
      <div className="flex flex-col space-y-2 w-full">
        <p className="text-white/60 text-left text-sm">{type === 'source' ? 'Source language' : 'Translate to'}</p>
        <div className="relative w-full">
          <button onClick={() => onToggle(type)} className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 w-full rounded-xl cursor-pointer text-sm">
            {selectedLang?.flag && <img src={selectedLang.flag} alt={`${selectedLanguage} flag`} className="w-7 h-7" />}
            <span class="text-white">{selectedLanguage}</span>
            <img className={`absolute right-2 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} src="https://i.ibb.co/pBLj0Y2z/dropdown-1.png" alt="Dropdown" />
          </button>
          {isOpen && (
            <div className="absolute mt-2 backdrop-blur-2xl rounded-xl overflow-y-auto max-h-66 z-50 w-full">
              <div className="bg-white/10 rounded-xl">
                {languages.map((l, i) => (
                  <div key={l.locale} className="group">
                    <button onClick={() => onSelect(type, l.language)} className="w-full px-4 py-3 text-left cursor-pointer flex items-center gap-2 text-white hover:bg-white/10 text-sm">
                      <img src={l.flag} alt={`${l.language} flag`} className="w-7 h-7" />
                      <span class="text-white">{l.language}</span>
                    </button>
                    {i !== languages.length - 1 && <div className="h-[1px] bg-white/20 w-11/12 mx-auto" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }, []);

  const sourceLang = useMemo(() => sourceLanguages.find(l => l.language === state.sourceLanguage), [state.sourceLanguage]);
  const targetLang = useMemo(() => targetLanguages.find(l => l.language === state.targetLanguage), [state.targetLanguage]);

  if (state.uploadState === 'uploading' || state.uploadState === 'processing') {
    return (
      <div className="w-full bg-transparent flex flex-col items-center justify-center p-6">
        {state.notification && <Notification message={state.notification.message} type={state.notification.type} onClose={() => setState(s => ({ ...s, notification: null }))} />}
        <div className="w-full max-w-lg">
          <div className="border border-neutral-400/40 rounded-2xl p-6 bg-[#1d1136] shadow-lg">
            <h6 className="text-align-left text-xl font-semibold text-white mb-4">{state.uploadState === 'uploading' ? 'Uploading File' : 'Processing File'}</h6>
            <div className="flex items-center w-full gap-3">
              <div className="w-full h-2 bg-purple-700/30 rounded-full overflow-hidden">
                <div className="h-full transition-all duration-300 ease-out" style={{ width: `${state.progress}%`, background: 'linear-gradient(90deg, #735DFF 0%, #DAABFF 100%)' }} />
              </div>
              <button onClick={handleCancel} className="cancel-btn text-red-500 hover:text-red-400 font-medium text-sm whitespace-nowrap">Cancel</button>
            </div>
          </div>
          <hr className="my-6 border-t border-white/10" />
          {/* <div className="text-center">
            <p className="text-white/80 text-sm mb-4">Share your email we'll send the output to your inbox when ready. (Optional)</p>
            <div className="flex gap-2 items-center w-full max-w-xl mx-auto">
              <div className="relative flex-grow">
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full py-2.5 px-6 rounded-xl text-gray-800 outline-none"
                  style={{ border: '3px solid transparent', backgroundImage: 'linear-gradient(white, white), linear-gradient(90deg, #FF5E3B 0%, #C516E1 100%)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }}
                  value={state.emailAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState(s => ({ ...s, emailAddress: e.target.value }))}
                />
              </div>
              <button
                className="ml-2 rounded-2xl p-3.5 flex items-center justify-center"
                style={{ background: 'linear-gradient(90deg, #FF5E3B 0%, #C516E1 100%)' }}
                onClick={() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.emailAddress) ? showNotification(`We'll send the file to ${state.emailAddress}`, 'success') : showNotification('Please enter a valid email address', 'error')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div> */}
        </div>
      </div>
    );
  }

  if (state.uploadState === 'completed') {
    if (state.uploadedFile?.type.startsWith('audio/')) {
      return (
        <div className="w-full bg-transparent font-sans flex flex-col items-center justify-center p-2">
          {state.notification && <Notification message={state.notification.message} type={state.notification.type} onClose={() => setState(s => ({ ...s, notification: null }))} />}
          <div className="w-full max-w-3xl text-center">
            <div className="mb-2 md:mb-8 flex items-center justify-center">
              <span className="text-yellow-400 text-4xl mr-2">🎉</span>
              <h4 className="text-4xl md:text-4xl font-bold text-white whitespace-nowrap">Your Translated Audio is Ready.</h4>
            </div>
            <div className="border-2 border-dashed border-white/15 rounded-xl p-8 bg-purple/40 shadow-lg">
              <div className="audio-container flex md:flex-row gap-8 justify-center mb-6">
                <div className="flex-1 flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-2">
                    {sourceLang?.flag && <img src={sourceLang.flag} alt={`${state.sourceLanguage} flag`} className="w-7 h-7" />}
                    <span className="text-white">{state.sourceLanguage}</span>
                  </div>
                  <div className="relative w-full h-20 backdrop-blur-2xl bg-white/5 border border-white/10 rounded-[20px] flex items-center px-4 shadow-md">
                    <audio
                      ref={sourceAudioRef}
                      className="hidden"
                      onTimeUpdate={() => setState(s => ({ ...s, sourceCurrentTime: sourceAudioRef.current?.currentTime || 0 }))}
                      onLoadedMetadata={() => setState(s => ({ ...s, sourceDuration: sourceAudioRef.current?.duration || 0 }))}
                      onEnded={() => setState(s => ({ ...s, isPlaying: false, sourceCurrentTime: 0 }))}
                    >
                      <source src={state.uploadedFile ? URL.createObjectURL(state.uploadedFile) : ''} type="audio/mp3" />
                    </audio>
                    <button
                      onClick={() => togglePlay('source')}
                      className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FF5E3B] to-[#C516E1] flex items-center justify-center mr-4"
                      style={{
                        boxShadow: '0 0 15px 5px rgba(255, 94, 59, 0.5), 0 0 25px 10px rgba(197, 22, 225, 0.3)',
                      }}
                    >
                      {state.isPlaying === 'source' ? (
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z" /></svg>
                      ) : (
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      )}
                    </button>
                    <div className="flex-1 h-10 relative">
                      <div className="absolute inset-0 cursor-pointer" onClick={e => handleWaveClick(e, 'source')}>
                        <svg className="w-full h-10 ml-4" viewBox="0 0 100 40" preserveAspectRatio="none">
                          {Array.from({ length: 22 }).map((_, i) => {
                            const progress = state.sourceDuration ? (state.sourceCurrentTime / state.sourceDuration) * 100 : 0;
                            const isPlayed = (i / 22) * 100 <= progress;
                            const height = [24, 16, 28, 12, 20, 14, 26, 18][i % 8];
                            return <rect key={i} x={i * 4.2} y={20 - height / 2} width="1.6" height={height} rx="0.8" fill={isPlayed ? 'white' : 'rgba(255,255,255,0.4)'} style={{ transition: 'fill 0.15s ease-out' }} />;
                          })}
                        </svg>
                      </div>
                    </div>
                    <span className="text-white/60 text-sm ml-4">{`${formatTime(state.sourceCurrentTime)}/${formatTime(state.sourceDuration)}`}</span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-2">
                    {targetLang?.flag && <img src={targetLang.flag} alt={`${state.targetLanguage} flag`} className="w-7 h-7" />}
                    <span className="text-white">{state.targetLanguage}</span>
                  </div>
                  <div className="relative w-full h-20 backdrop-blur-2xl bg-white/5 border border-white/10 rounded-[20px] flex items-center px-4 shadow-md">
                    <audio
                      ref={targetAudioRef}
                      className="hidden"
                      onTimeUpdate={() => setState(s => ({ ...s, targetCurrentTime: targetAudioRef.current?.currentTime || 0 }))}
                      onLoadedMetadata={() => setState(s => ({ ...s, targetDuration: targetAudioRef.current?.duration || 0 }))}
                      onEnded={() => setState(s => ({ ...s, isPlaying: false, targetCurrentTime: 0 }))}
                    >
                      <source src={state.translatedAudioUrl} type="audio/mp3" />
                    </audio>
                    <button
                      onClick={() => togglePlay('target')}
                      className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FF5E3B] to-[#C516E1] flex items-center justify-center mr-4"
                      style={{
                        boxShadow: '0 0 15px 5px rgba(255, 94, 59, 0.5), 0 0 25px 10px rgba(197, 22, 225, 0.3)',
                      }}
                    >
                      {state.isPlaying === 'target' ? (
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z" /></svg>
                      ) : (
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      )}
                    </button>
                    <div className="flex-1 h-10 relative">
                      <div className="absolute inset-0 cursor-pointer" onClick={e => handleWaveClick(e, 'target')}>
                        <svg className="w-full h-10 ml-4" viewBox="0 0 100 40" preserveAspectRatio="none">
                          {Array.from({ length: 22 }).map((_, i) => {
                            const progress = state.targetDuration ? (state.targetCurrentTime / state.targetDuration) * 100 : 0;
                            const isPlayed = (i / 22) * 100 <= progress;
                            const height = [24, 16, 28, 12, 20, 14, 26, 18][i % 8];
                            return <rect key={i} x={i * 4.2} y={20 - height / 2} width="1.6" height={height} rx="0.8" fill={isPlayed ? 'white' : 'rgba(255,255,255,0.4)'} style={{ transition: 'fill 0.15s ease-out' }} />;
                          })}
                        </svg>
                      </div>
                    </div>
                    <span className="text-white/60 text-sm ml-4">{`${formatTime(state.targetCurrentTime)}/${formatTime(state.targetDuration)}`}</span>
                  </div>
                  <div className="flex items-center justify-between px-2 mt-6 md:mt-4 backdrop-blur-2xl bg-white/5 border border-white/10 rounded-[20px] py-2 w-full shadow-md">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center">
                        <img src="https://murf.ai/public-assets/murf-mono-repo/islands/infoNew.svg" alt="Info" className="w-6 h-6" />
                      </div>
                      <span className="text-white/90 text-sm md:text-sm text-xs whitespace-nowrap">Add Background Music to Audio</span>
                    </div>
                    <div className={`w-12 h-6 rounded-full relative cursor-pointer ${state.addBackgroundMusic ? 'bg-purple-500' : 'bg-gray-600'}`} onClick={() => setState(s => ({ ...s, addBackgroundMusic: !s.addBackgroundMusic }))}>
                      <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-all ${state.addBackgroundMusic ? 'right-1' : 'left-1'}`}></div>
                    </div>
                  </div>
                  <div className="flex justify-center gap-4 mt-6 w-full">
                    <button onClick={handleDownload} className="bg-gradient-to-r from-[#FF5E3B] to-[#C516E1] text-white py-3 px-6 rounded-2xl font-medium flex items-center gap-2">
                      <span className="text-sm md:text-base text-white whitespace-nowrap">Download</span> <span className="text-white ml-1">➜</span>
                    </button>
                    <button onClick={handleStartOver} className="bg-white/10 text-white py-3 px-6 rounded-2xl font-medium flex items-center gap-2 border border-white/20">
                      <span className="text-sm md:text-base text-white whitespace-nowrap">Start Over</span> <span className="text-white ml-1">➜</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full bg-transparent font-sans flex flex-col items-center justify-center p-2">
        {state.notification && <Notification message={state.notification.message} type={state.notification.type} onClose={() => setState(s => ({ ...s, notification: null }))} />}
        <div className="w-full max-w-3xl h-full flex flex-col text-center">
          <div className="mb-2 md:mb-8 flex items-center justify-center">
            <span className="text-yellow-400 text-4xl mr-2">🎉</span>
            <h4 className="text-4xl md:text-4xl font-bold text-white whitespace-nowrap">Your Translated Video is Ready.</h4>
          </div>
          <div className="border-2 border-dashed border-white/15 rounded-xl p-4 md:p fishing-8 bg-purple/40 shadow-lg flex-1 flex flex-col">
            <div className="mb-4 md:mb-6 mx-auto flex items-center justify-center">
              <div className="flag-btn-border flex rounded-full overflow-hidden cursor-pointer bg-white" onClick={handleLanguageToggle}>
                <button className="py-2 px-4 flex-1 flex items-center justify-center text-gray-800 font-medium" style={{ background: '#fff' }}>
                  {sourceLang?.flag && <img src={sourceLang.flag} alt={`${state.sourceLanguage} flag`} className="w-7 h-7 mr-2" />}
                  {state.sourceLanguage}
                </button>
                <button className="flag-btn py-2 px-4 flex-1 flex items-center justify-center font-medium" style={{ background: 'linear-gradient(90deg, #FF5E3B 0%, #C516E1 100%)' }}>
                  {targetLang?.flag && <img src={targetLang.flag} alt={`${state.targetLanguage} flag`} className="w-7 h-7 mr-2" />}
                  {state.targetLanguage}
                </button>
              </div>
            </div>
            <div ref={containerRef} className="relative w-full rounded-xl overflow-hidden mb-4 md:mb-6 max-w-lg mx-auto flex-1 flex flex-col">
              {state.uploadedFile?.type.startsWith('video/') && (
                <div className="relative flex-1">
                  <video
                    ref={videoRef}
                    className="w-full h-full md:h-60 object-cover bg-black rounded-lg"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setState(s => ({ ...s, isPlaying: false }))}
                    onPlay={() => setState(s => ({ ...s, isPlaying: 'video' }))}
                    onPause={() => setState(s => ({ ...s, isPlaying: false }))}
                    src={state.isTranslatedPlaying ? state.translatedAudioUrl : state.videoUrl}
                  >
                    <source src={state.isTranslatedPlaying ? state.translatedAudioUrl : state.videoUrl} type="video/mp4" />
                  </video>
                  {!state.isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={() => togglePlay('video')}>
                      <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-white/100 backdrop-blur-sm py-2 md:py-3 px-2 md:px-6 flex items-center justify-between" style={{ borderRadius: '0 0 8px 8px', background: 'rgba(255, 255, 255, 0.95)' }}>
                    <button className="text-black flex items-center justify-center mr-2 md:mr-4" onClick={() => togglePlay('video')}>
                      {state.isPlaying === 'video' ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" className="w-7 h-7"><rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/></svg>
                      ) : (
                        <svg width="32" height="32" viewBox="0 0 24 24" className="w-8 h-8"><path d="M8 5C8 4.44772 8.44772 4 9 4C9.20246 4 9.39841 4.06142 9.56152 4.17557L17.8046 10.1756C18.2488 10.4827 18.2488 11.1673 17.8046 11.4744L9.56152 17.4744C9.39841 17.5886 9.20246 17.65 9 17.65C8.44772 17.65 8 17.2023 8 16.65V5Z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>
                      )}
                    </button>
                    <div ref={progressBarRef} className="flex-1 h-2 bg-gray-300 rounded-full mx-2 md:mx-4 overflow-hidden cursor-pointer" onClick={handleProgressBarClick}>
                      <div className="h-full bg-purple-600 transition-all duration-100" style={{ width: state.duration > 0 ? `${(state.currentTime / state.duration) * 100}%` : '0%' }}></div>
                    </div>
                    <span className="text-black text-xs md:text-sm whitespace-nowrap mx-2 md:mx-4">{`${formatTime(state.currentTime)} / ${formatTime(state.duration)}`}</span>
                    <div className="flex items-center gap-1 md:gap-4">
                      <button className="text-black text-xs md:text-sm bg-gray-200 px-1 md:px-2 py-1 rounded cursor-pointer" onClick={handleSpeedChange}>{state.playbackSpeed}x</button>
                      <button className="text-black p-1" onClick={toggleMute}>
                        {state.isMuted ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/>
                          </svg>
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                          </svg>
                        )}
                      </button>
                      <button className="text-black p-1" onClick={toggleFullScreen}>
                        {state.isFullscreen ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                            <path d="M9 3H5v4M15 3h4v4M5 15v4h4M19 15v4h-4"/>
                          </svg>
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                            <path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {!state.isFullscreen && (
                <div className="flex items-center justify-between px-2 mt-6 md:mt-6 bg-white/10 rounded-full py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center">
                      <img src="https://murf.ai/public-assets/murf-mono-repo/islands/infoNew.svg" alt="Info" className="w-5 h-5" />
                    </div>
                    <span className="text-white/90 text-sm md:text-sm text-xs whitespace-nowrap">Add Background Music to Audio</span>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative cursor-pointer ${state.addBackgroundMusic ? 'bg-purple-500' : 'bg-gray-600'}`} onClick={() => setState(s => ({ ...s, addBackgroundMusic: !s.addBackgroundMusic }))}>
                    <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-all ${state.addBackgroundMusic ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-center gap-4 md:mt-1 w-full">
              <button onClick={handleDownload} className="bg-gradient-to-r from-[#FF5E3B] to-[#C516E1] text-white py-3 px-6 rounded-2xl font-medium flex items-center gap-2">
                <span className="text-sm md:text-base text-white whitespace-nowrap">Download</span> <span className="text-white ml-1">➜</span>
              </button>
              <button onClick={handleStartOver} className="bg-white/10 text-white py-3 px-6 rounded-2xl font-medium flex items-center gap-2 border border-white/20">
                <span className="text-sm md:text-base text-white whitespace-nowrap">Start Over</span> <span className="text-white ml-1">➜</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-transparent flex justify-center items-center p-2">
      {state.notification && <Notification message={state.notification.message} type={state.notification.type} onClose={() => setState(s => ({ ...s, notification: null }))} />}
      <div className="w-full max-w-3xl text-center">
        <h1 className="text-2xl text-white mb-8">{title}</h1>
        <div className="flex flex-col gap-8">
          <div className="flex flex-row justify-center items-center gap-4">
            <div className="flex-1 w-full">
              <LanguageDropdown type="source" selectedLanguage={state.sourceLanguage} onToggle={toggleLanguageSelector} isOpen={state.isLanguageSelectorOpen.source} onSelect={handleLanguageSelect} />
            </div>
            <div className="flex items-center justify-center translate-y-1/2">
              <img src="https://murf.ai/public-assets/murf-mono-repo/islands/arrow.svg" alt="Arrow" className="w-7 h-7" />
            </div>
            <div className="flex-1 w-full">
              <LanguageDropdown type="target" selectedLanguage={state.targetLanguage} onToggle={toggleLanguageSelector} isOpen={state.isLanguageSelectorOpen.target} onSelect={handleLanguageSelect} />
            </div>
          </div>
          <div
            className={`flex flex-col items-center justify-center p-10 border-2 border-dashed ${state.dragActive ? 'border-white/60 bg-white/5' : 'border-white/15'} rounded-xl min-h-64 cursor-pointer bg-purple/40`}
            role="button"
            aria-label="Upload file"
            tabIndex={0}
            onDragEnter={() => setState(s => ({ ...s, dragActive: true }))}
            onDragOver={e => e.preventDefault()}
            onDragLeave={() => setState(s => ({ ...s, dragActive: false }))}
            onDrop={(e: React.DragEvent<HTMLDivElement>) => {
              e.preventDefault();
              setState(s => ({ ...s, dragActive: false }));
              if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
            }}
            onClick={handleButtonClick}
            onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleButtonClick(e as any);
              }
            }}
          >
            {!state.uploadedFile ? (
              <>
                <div className="text-white/80 mb-4">
                  <img src="https://murf.ai/public-assets/murf-mono-repo/islands/uploadImg.svg" alt="Upload" className="w-12 h-12" />
                </div>
                <p className="text-white text-lg font-medium mb-2">Drop your file here</p>
                <div className="text-white/70 text-sm mb-8">Supported formats: MP3, WAV, M4A, AVI</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp4,.avi,.mov,.wmv,.mp3,.wav,.m4a"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />
                <button className="flex items-center gap-2 bg-white/10 text-white rounded-xl py-3 px-6 text-sm hover:bg-white/20" onClick={e => { e.stopPropagation(); handleButtonClick(e); }}>
                  <img src="https://murf.ai/public-assets/murf-mono-repo/islands/browseImg.svg" alt="Browse" className="w-4 h-4" />
                  <span class="text-white/80">Browse Files</span>
                </button>
                <div className="flex items-center gap-1.5 text-white/60 text-xs mt-6">
                  <img src="https://murf.ai/public-assets/murf-mono-repo/islands/info.svg" alt="Info" className="w-4 h-4" />
                  <span>Max audio duration is 2 minutes</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <p className="text-white text-base">{state.uploadedFile.name}</p>
                <button className="bg-transparent text-white/80 border border-white/20 rounded-md py-2 px-4 text-sm hover:bg-white/10" onClick={handleCancel}>Change file</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AudioTranslatorIsland = (el: HTMLElement, props: AudioTranslatorProps = {}) => {
  render(<AudioTranslatorComponent {...props} />, el);
};
export default AudioTranslatorIsland;
