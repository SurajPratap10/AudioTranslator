import { render } from 'preact';
import { useState, useRef, useEffect, useCallback, useMemo } from 'preact/hooks';
import { Notification } from '../../components/Notification';
import WaveSurfer from 'wavesurfer.js';
import './index.css';

// Constants for default languages
const DEFAULT_SOURCE_LANGUAGE = 'English - US';
const DEFAULT_TARGET_LANGUAGE = 'Spanish - Spain';

// Constants for upload states
const UPLOAD_STATES = {
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  NULL: null
} as const;

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
  isEmailSubmitted: boolean;
  isLanguageSelectorOpen: { source: boolean, target: boolean };
  jobId: string | null;
  isTranslatedPlaying: boolean;
  notification: { message: string; type: 'error' | 'success' } | null;
  isCancelled: boolean;
}
interface Refs {
  fileInputRef: HTMLInputElement | null;
  videoRef: HTMLVideoElement | null;
  sourceAudioRef: HTMLAudioElement | null;
  targetAudioRef: HTMLAudioElement | null;
  sourceWaveRef: HTMLDivElement | null;
  targetWaveRef: HTMLDivElement | null;
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
    isEmailSubmitted: false,
    isLanguageSelectorOpen: { source: false, target: false },
    jobId: null,
    isTranslatedPlaying: false,
    notification: null,
    isCancelled: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sourceAudioRef = useRef<HTMLAudioElement>(null);
  const targetAudioRef = useRef<HTMLAudioElement>(null);
  const sourceWaveRef = useRef<HTMLDivElement>(null);
  const targetWaveRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const sourceWaveSurfer = useRef<WaveSurfer | null>(null);
  const targetWaveSurfer = useRef<WaveSurfer | null>(null);

  const showNotification = useCallback((message: string, type: 'error' | 'success') => {
    setState(s => ({ ...s, notification: { message, type } }));
  }, []);

  const updateEmail = useCallback(async (jobId: string, email: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }
    try {
      const response = await fetch(`https://api.murf.ai/murfdub/anonymous/jobs/${jobId}/update-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: email,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update email: ${errorText}`);
      }
      setState(s => ({ ...s, isEmailSubmitted: true }));
      showNotification(`Email updated to ${email}`, 'success');
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Error updating email', 'error');
    }
  }, [showNotification]);

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
      const response = await fetch('https://api.murf.ai/murfdub/anonymous/jobs/create', { method: 'POST', body: formData });
      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.includes('submitted max free dubs')) {
          showNotification('Free translation limit reached. Sign Up for Free to Murf Studio.', 'error');
          setState(s => ({ ...s, uploadState: null, uploadedFile: null, videoUrl: '', jobId: null }));
          return;
        }
        throw new Error(`Upload failed: ${errorText}`);
      }
      const data = await response.json();
      if (!data.job_id) throw new Error('No job ID received');
      setState(s => (s.isCancelled ? s : { ...s, jobId: data.job_id, uploadState: UPLOAD_STATES.PROCESSING, progress: 30 }));
    } catch (error) {
      setState(s => (s.isCancelled ? s : { ...s, uploadState: null, uploadedFile: null, videoUrl: '', jobId: null }));
      showNotification(error instanceof Error ? error.message : 'Error submitting file', 'error');
    }
  }, [state.sourceLanguage, state.targetLanguage, state.emailAddress, showNotification]);

  const checkJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`https://api.murf.ai/murfdub/anonymous/jobs/${jobId}/status`);
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
            uploadState: UPLOAD_STATES.COMPLETED,
            translatedAudioUrl: translatedUrl,
            videoUrl: s.uploadedFile?.type.startsWith('video/') ? URL.createObjectURL(s.uploadedFile) : s.videoUrl,
            isPlaying: false,
            currentTime: 0, duration: 0,
            sourceCurrentTime: 0, sourceDuration: 0,
            targetCurrentTime: 0, targetDuration: 0,
          }));
          break;
        }
        case 'FAILED': {
          if (data.failure_code === 'SOURCE_LANGUAGE_MISMATCH') {
            showNotification("Source language doesn't match the provided language.", 'error');
            setState(s => ({
              ...s,
              uploadState: null,
              uploadedFile: null,
              videoUrl: '',
              jobId: null,
              progress: 0,
              isCancelled: true,
            }));
          } else {
            throw new Error(data.failure_reason || 'Translation failed');
          }
          break;
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message !== 'Failed to fetch') {
        showNotification('Error checking status', 'error');
        setState(s => ({
          ...s,
          uploadState: null,
          uploadedFile: null,
          videoUrl: '',
          jobId: null,
          progress: 0,
          isCancelled: true,
        }));
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

  const handleProgressBarClick = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const { current: video } = videoRef;
    const { current: progressBar } = progressBarRef;
    if (video && progressBar) {
      const rect = progressBar.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      video.currentTime = ((clientX - rect.left) / rect.width) * video.duration || 0;
    }
  }, []);

  const handleSpeedChange = useCallback(() => {
    const speeds = [0.5, 1, 1.5, 2];
    const nextSpeed = speeds[(speeds.indexOf(state.playbackSpeed) + 1) % speeds.length];
    setState(s => ({ ...s, playbackSpeed: nextSpeed }));
    if (videoRef.current) videoRef.current.playbackRate = nextSpeed;
    if (sourceWaveSurfer.current) sourceWaveSurfer.current.setPlaybackRate(nextSpeed);
    if (targetWaveSurfer.current) targetWaveSurfer.current.setPlaybackRate(nextSpeed);
  }, [state.playbackSpeed]);

  const togglePlay = useCallback((type: MediaType) => {
    const { current: video } = videoRef;
    const { current: sourceAudio } = sourceAudioRef;
    const { current: targetAudio } = targetAudioRef;
    const playMedia = (ref: HTMLMediaElement | WaveSurfer, playType: MediaType) => {
      [video, sourceWaveSurfer.current, targetWaveSurfer.current].forEach(r => r !== ref && r?.pause());
      if (state.isPlaying === playType) {
        ref.pause();
        setState(s => ({ ...s, isPlaying: false }));
      } else {
        ref.play().catch(console.error);
        setState(s => ({ ...s, isPlaying: playType }));
      }
    };
    if (type === 'source' && sourceWaveSurfer.current) playMedia(sourceWaveSurfer.current, 'source');
    else if (type === 'target' && targetWaveSurfer.current) playMedia(targetWaveSurfer.current, 'target');
    else if (type === 'video' && video) playMedia(video, 'video');
  }, [state.isPlaying]);

  const handleLanguageToggle = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isSource = (e.clientX - rect.left) < rect.width / 2;
    const currentTime = videoRef.current?.currentTime || 0;
    const wasPlaying = state.isPlaying === 'video';
    
    if (videoRef.current) {
      videoRef.current.src = isSource ? state.videoUrl : state.translatedAudioUrl;
      videoRef.current.load();
      
      const onLoadedMetadata = () => {
        videoRef.current!.currentTime = currentTime;
        if (wasPlaying) {
          videoRef.current!.play().catch(console.error);
        }
        videoRef.current!.removeEventListener('loadedmetadata', onLoadedMetadata);
      };
      
      videoRef.current.addEventListener('loadedmetadata', onLoadedMetadata);
      
      setState(s => ({ 
        ...s, 
        isPlaying: wasPlaying ? 'video' : false, 
        isTranslatedPlaying: !isSource 
      }));
    }
  }, [state.videoUrl, state.translatedAudioUrl, state.isPlaying]);

  const checkFileDuration = useCallback((file: File): Promise<number> => {
    return new Promise((resolve) => {
      const media = file.type.startsWith('video/') ? document.createElement('video') : document.createElement('audio');
      media.src = URL.createObjectURL(file);
      media.onloadedmetadata = () => {
        URL.revokeObjectURL(media.src);
        resolve(media.duration);
      };
      media.onerror = () => {
        URL.revokeObjectURL(media.src);
        resolve(0);
      };
    });
  }, []);

  const handleFile = useCallback(async (file: File) => {
    if (!['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'audio/mp3', 'audio/wav', 'audio/m4a'].includes(file.type) &&
        !file.name.match(/\.(mp4|avi|mov|wmv|mp3|wav|m4a)$/i)) {
      showNotification('Please upload a valid video or audio file', 'error');
      return;
    }

    const duration = await checkFileDuration(file);
    if (duration > 120){
      showNotification('Error: The uploaded file exceeds the maximum duration of 120 seconds. Please upload a smaller duration file.', 'error');
      return;
    }

    setState(s => ({ ...s, uploadedFile: file, uploadState: UPLOAD_STATES.UPLOADING, progress: 0, isCancelled: false }));
    const videoUrl = file.type.startsWith('video/') ? URL.createObjectURL(file) : '';
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setState(s => (s.isCancelled ? s : { ...s, progress: Math.min(95, progress) }));
    }, 300);
    await submitFileToDub(file);
    clearInterval(interval);
    if (videoRef.current && videoUrl) {
      videoRef.current.src = videoUrl;
      videoRef.current.load();
    }
  }, [submitFileToDub, showNotification, checkFileDuration]);

  const handleButtonClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  }, []);

  const handleCancel = useCallback(() => {
    [state.videoUrl, state.translatedAudioUrl].forEach(url => url && URL.revokeObjectURL(url));
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
      emailAddress: state.emailAddress,
      isEmailSubmitted: false,
      isLanguageSelectorOpen: { source: false, target: false },
      jobId: null,
      isTranslatedPlaying: false,
      notification: null,
      isCancelled: true,
    });
  }, [state.videoUrl, state.translatedAudioUrl, state.emailAddress]);

  const handleStartOver = useCallback(() => {
    videoRef.current?.pause();
    sourceWaveSurfer.current?.pause();
    targetWaveSurfer.current?.pause();
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
      isEmailSubmitted: false,
      isLanguageSelectorOpen: { source: false, target: false },
      jobId: null,
      isTranslatedPlaying: false,
      notification: null,
      isCancelled: false,
    });
  }, [state.videoUrl, state.translatedAudioUrl, state.uploadedFile]);

  const handleDownload = useCallback(() => {
    if (state.translatedAudioUrl) {
      const link = document.createElement('a');
      link.href = state.translatedAudioUrl;
      const fileExtension = state.uploadedFile?.type.startsWith('audio/') ? 'mp3' : 'mp4';
      link.download = `${state.uploadedFile?.name.split('.')[0]}_${state.targetLanguage}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [state.translatedAudioUrl, state.uploadedFile, state.targetLanguage]);

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
    setState(s => {
      const newState = {
        ...s,
        [type === 'source' ? 'sourceLanguage' : 'targetLanguage']: language,
        isLanguageSelectorOpen: { ...s.isLanguageSelectorOpen, [type]: false },
      };
      if (type === 'source' && language === s.targetLanguage) {
        const availableTargets = targetLanguages.filter(l => l.language !== language);
        newState.targetLanguage = availableTargets[0]?.language || DEFAULT_TARGET_LANGUAGE;
      }
      if (type === 'target' && language === s.sourceLanguage) {
        const availableSources = sourceLanguages.filter(l => l.language !== language);
        newState.sourceLanguage = availableSources[0]?.language || DEFAULT_SOURCE_LANGUAGE;
      }
      return newState;
    });
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
      if (state.jobId && state.uploadState === UPLOAD_STATES.PROCESSING && !state.isCancelled) {
        await checkJobStatus(state.jobId);
        timeoutId = setTimeout(pollStatus, 60000);
      }
    };
    pollStatus();
    return () => clearTimeout(timeoutId);
  }, [state.jobId, state.uploadState, checkJobStatus, state.isCancelled]);

  useEffect(() => {
    if (state.uploadState === UPLOAD_STATES.COMPLETED) {
      if (state.uploadedFile && sourceWaveRef.current) {
        sourceWaveSurfer.current = WaveSurfer.create({
          container: sourceWaveRef.current,
          waveColor: '#5E5472',
          progressColor: '#FFFFFF',
          cursorColor: '#C516E1',
          cursorWidth: 3,
          barWidth: 3,
          barRadius: 3,
          height: 45,
          normalize: true,
          url: URL.createObjectURL(state.uploadedFile),
        });
        sourceWaveSurfer.current.on('ready', () => {
          setState(s => ({ ...s, sourceDuration: sourceWaveSurfer.current!.getDuration() }));
        });
        sourceWaveSurfer.current.on('audioprocess', (time) => {
          setState(s => ({ ...s, sourceCurrentTime: time }));
        });
        sourceWaveSurfer.current.on('finish', () => {
          setState(s => ({ ...s, isPlaying: false, sourceCurrentTime: 0 }));
        });
      }
      if (state.translatedAudioUrl && targetWaveRef.current) {
        targetWaveSurfer.current = WaveSurfer.create({
          container: targetWaveRef.current,
          waveColor: '#5E5472',
          progressColor: '#FFFFFF',
          cursorColor: '#C516E1',
          cursorWidth: 3,
          barWidth: 3,
          barRadius: 3,
          height: 45,
          normalize: true,
          url: state.translatedAudioUrl,
        });
        targetWaveSurfer.current.on('ready', () => {
          setState(s => ({ ...s, targetDuration: targetWaveSurfer.current!.getDuration() }));
        });
        targetWaveSurfer.current.on('audioprocess', (time) => {
          setState(s => ({ ...s, targetCurrentTime: time }));
        });
        targetWaveSurfer.current.on('finish', () => {
          setState(s => ({ ...s, isPlaying: false, targetCurrentTime: 0 }));
        });
      }
      if (state.uploadedFile?.type.startsWith('video/') && videoRef.current) {
        videoRef.current.src = state.videoUrl;
        videoRef.current.load();
        videoRef.current.pause();
      }
    }
    return () => {
      sourceWaveSurfer.current?.destroy();
      targetWaveSurfer.current?.destroy();
    };
  }, [state.uploadState, state.uploadedFile, state.translatedAudioUrl, state.videoUrl]);

  const LanguageDropdown = useCallback(({ type, selectedLanguage, onToggle, isOpen, onSelect }: {
    type: 'source' | 'target';
    selectedLanguage: string;
    onToggle: (type: 'source' | 'target') => void;
    isOpen: boolean;
    onSelect: (type: 'source' | 'target', language: string) => void;
  }) => {
    const languages = type === 'source' 
      ? sourceLanguages 
      : targetLanguages.filter(l => l.language !== state.sourceLanguage);
    const selectedLang = useMemo(() => languages.find(l => l.language === selectedLanguage), [selectedLanguage]);
    return (
      <div className="flex flex-col space-y-2 w-full">
        <p className="text-white/60 text-left text-sm">{type === 'source' ? 'Source language' : 'Translate to'}</p>
        <div className="relative w-full">
          <button onClick={() => onToggle(type)} className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 w-full rounded-xl cursor-pointer text-sm">
            {selectedLang?.flag && <img src={selectedLang.flag} alt={`${selectedLanguage} flag`} className="w-7 h-7" />}
            <span className="text-white">{selectedLanguage}</span>
            <img className={`absolute right-2 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} src="https://i.ibb.co/pBLj0Y2z/dropdown-1.png" alt="Dropdown" />
          </button>
          {isOpen && (
            <div className="absolute mt-2 backdrop-blur-2xl rounded-xl overflow-y-auto max-h-66 z-50 w-full">
              <div className="bg-white/10 rounded-xl">
                {languages.map((l, i) => (
                  <div key={l.locale} className="group">
                    <button onClick={() => onSelect(type, l.language)} className="w-full px-4 py-3 text-left cursor-pointer flex items-center gap-2 text-white hover:bg-white/10 text-sm">
                      <img src={l.flag} alt={`${l.language} flag`} className="w-7 h-7" />
                      <span className="text-white">{l.language}</span>
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
  }, [state.sourceLanguage]);

  const sourceLang = useMemo(() => sourceLanguages.find(l => l.language === state.sourceLanguage), [state.sourceLanguage]);
  const targetLang = useMemo(() => targetLanguages.find(l => l.language === state.targetLanguage), [state.targetLanguage]);

  const EmailInputSection = () => (
    <>
      {!state.isEmailSubmitted ? (
        <>
          <div className="text-white/80 text-sm mb-2">Share your email we'll send the output to your inbox when ready. (Optional)</div>
          <div className="flex gap-2 items-center w-full max-w-xl mx-auto">
            <div className="relative flex-grow">
              <input
                type="email"
                placeholder="Email"
                className="w-full py-2.5 px-6 rounded-xl text-gray-800 outline-none"
                style={{ border: '3px solid transparent', backgroundImage: 'linear-gradient(white, white), linear-gradient(90deg, #FF5E3B 0%, #C516E1 100%)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }}
                value={state.emailAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState(s => ({ ...s, emailAddress: e.target.value }))}
                disabled={state.uploadState === UPLOAD_STATES.UPLOADING}
              />
            </div>
            <button
              className="ml-2 rounded-2xl p-3.5 flex items-center justify-center hover:cursor-pointer"
              style={{ background: 'linear-gradient(90deg, #FF5E3B 0%, #C516E1 100%)' }}
              onClick={() => state.jobId ? updateEmail(state.jobId, state.emailAddress) : showNotification('No job ID available', 'error')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2 text-white/80 text-sm">
          <img src="https://murf.ai/public-assets/v2-assets/icons/check_circle.svg" alt="Check icon" width="24" height="24" />
          <span>Your Email has been submitted. We will send the dubbed file to your inbox <span style={{ background: 'linear-gradient(90deg, #FF5E3B 0%, #C516E1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{state.emailAddress}</span></span>
        </div>
      )}
    </>
  );

  if (state.uploadState === UPLOAD_STATES.UPLOADING || state.uploadState === UPLOAD_STATES.PROCESSING) {
    return (
      <div className="w-full bg-transparent flex flex-col items-center justify-center p-6">
        {state.notification && <Notification message={state.notification.message} type={state.notification.type} onClose={() => setState(s => ({ ...s, notification: null }))} />}
        <div className="w-full max-w-lg">
          <div className="border border-neutral-400/40 rounded-2xl p-6 bg-[#1d1136] shadow-lg">
            <h6 className="text-align-left text-xl font-semibold text-white mb-4">{state.uploadState === UPLOAD_STATES.UPLOADING ? 'Uploading File' : 'Processing File'}</h6>
            <div className="flex items-center w-full gap-3">
              <div className="w-full h-2 bg-purple-700/30 rounded-full overflow-hidden">
                <div className="h-full transition-all duration-300 ease-out" style={{ width: `${state.progress}%`, background: 'linear-gradient(90deg, #735DFF 0%, #DAABFF 100%)' }} />
              </div>
              <button onClick={handleCancel} className="cancel-btn text-red-500 hover:text-red-400 font-medium text-sm whitespace-nowrap">Cancel</button>
            </div>
          </div>
          <hr className="my-6 border-t border-white/10" />
          <div className="text-center">
            <EmailInputSection />
          </div>
        </div>
      </div>
    );
  }

  if (state.uploadState === UPLOAD_STATES.COMPLETED) {
    if (state.uploadedFile?.type.startsWith('audio/')) {
  return (
      <div className="w-full bg-transparent font-sans flex flex-col items-center justify-center p-2 sm:p-4">
        {state.notification && (<Notification message={state.notification.message} type={state.notification.type} onClose={() => setState((s) => ({ ...s, notification: null }))}/>
        )}
        <div className="w-full text-center">
          <div className="border-2 border-dashed border-white/15 rounded-xl p-4 sm:p-6 md:p-8 bg-purple/40 shadow-lg">
            <div className="mb-8 sm:mb-6 md:mb-8 flex items-center justify-center">
              <h4 className="text-yellow-400 text-2xl sm:text-3xl md:text-4xl mr-1 mb-1 shrink-0">🎉</h4>
              <h4 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white break-words">Your Translated Audio is Ready.</h4></div>              
            <div className="audio-cont flex md:flex-row gap-8 justify-center mb-6">
                <div className="flex-1 flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-2">
                    {sourceLang?.flag && <img src={sourceLang.flag} alt={`${state.sourceLanguage} flag`} className="w-7 h-7" />}
                    <span className="text-white">{state.sourceLanguage}</span>
                  </div>
                  <div className="relative w-full h-20 backdrop-blur-2xl bg-white/5 border border-white/10 rounded-[20px] flex items-center px-4 shadow-md">
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
                      <div ref={sourceWaveRef} className="w-full h-10 ml-2"></div>
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
                      <div ref={targetWaveRef} className="w-full h-10 ml-2"></div>
                    </div>
                    <span className="text-white/60 text-sm ml-4">{`${formatTime(state.targetCurrentTime)}/${formatTime(state.targetDuration)}`}</span>
                  </div>
                  <div className="flex justify-center gap-4 mt-6 w-full">
                    <button onClick={handleDownload} className="bg-gradient-to-r from-[#FF5E3B] to-[#C516E1] text-white py-3 px-6 rounded-xl font-medium flex items-center gap-2">
                      <span className="text-sm md:text-base text-white whitespace-nowrap">Download</span>
                    </button>
                    <button onClick={handleStartOver} className="bg-white/10 text-white py-3 px-6 rounded-xl font-medium flex items-center gap-2 border border-white/20">
                      <span className="text-sm md:text-base text-white whitespace-nowrap">Start Over</span>
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
      <div className="w-full bg-transparent font-sans flex flex-col items-center justify-center p-2 sm:p-4">
        {state.notification && (<Notification message={state.notification.message} type={state.notification.type} onClose={() => setState((s) => ({ ...s, notification: null }))}/>
        )}
        <div className="w-full h-full flex flex-col text-center">
          <div className="border-2 border-dashed border-white/15 rounded-xl p-4 sm:p-6 md:p-8 bg-purple/40 shadow-lg flex-1 flex flex-col">
            <div className="mb-8 sm:mb-6 md:mb-8 flex items-center justify-center">
              <h4 className="text-yellow-400 text-2xl sm:text-3xl md:text-4xl mr-1 mb-1 shrink-0">🎉</h4>
              <h4 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white break-words">Your Translated Video is Ready.</h4></div>              
            <div className="mb-4 md:mb-6 mx-auto flex items-center justify-center">
              <div className="flag-btn-border flex rounded-full overflow-hidden cursor-pointer bg-white" onClick={handleLanguageToggle}>
                <button className="py-2 px-4 flex-1 flex items-center justify-center text-gray-800 font-medium" style={{ background: state.isTranslatedPlaying ? '#fff' : 'linear-gradient(90deg, #FF5E3B 0%, #C516E1 100%)' }}>
                  {sourceLang?.flag && <img src={sourceLang.flag} alt={`${state.sourceLanguage} flag`} className="w-7 h-7 mr-2" />}
                  {state.sourceLanguage}
                </button>
                <button className="py-2 px-4 flex-1 flex items-center justify-center font-medium" style={{ background: state.isTranslatedPlaying ? 'linear-gradient(90deg, #FF5E3B 0%, #C516E1 100%)' : '#fff' }}>
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
                    className="w-full h-full md:h-80 object-cover bg-black rounded-lg"
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
                      <button className="p-1" onClick={handleDownload} aria-label="Download">
                        <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                          <g id="download">
                            <path id="Vector" d="M17.4579 10.2832H15.8679V5.2832C15.8679 4.7332 15.4179 4.2832 14.8679 4.2832H10.8679C10.3179 4.2832 9.86792 4.7332 9.86792 5.2832V10.2832H8.27792C7.38792 10.2832 6.93792 11.3632 7.56792 11.9932L12.1579 16.5832C12.5479 16.9732 13.1779 16.9732 13.5679 16.5832L18.1579 11.9932C18.7879 11.3632 18.3479 10.2832 17.4579 10.2832ZM5.86792 20.2832C5.86792 20.8332 6.31792 21.2832 6.86792 21.2832H18.8679C19.4179 21.2832 19.8679 20.8332 19.8679 20.2832C19.8679 19.7332 19.4179 19.2832 18.8679 19.2832H6.86792C6.31792 19.7332 5.86792 19.7332 5.86792 20.2832Z" fill="url(#paint0_linear_4100_42327)"/>
                          </g>
                          <defs>
                            <linearGradient id="paint0_linear_4100_42327" x1="5.86792" y1="12.7832" x2="19.8679" y2="12.7832" gradientUnits="userSpaceOnUse">
                              <stop stop-color="#FF5E3B"/>
                              <stop offset="1" stop-color="#C516E1"/>
                            </linearGradient>
                          </defs>
                        </svg>
                      </button>
                      <button className="p-1" onClick={handleStartOver} aria-label="Start Over">
                        <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                          <g id="restart_alt">
                            <g id="Vector">
                              <path d="M12.434 6.07376V4.28376C12.434 3.83376 11.894 3.61376 11.584 3.93376L8.78396 6.72376C8.58396 6.92376 8.58396 7.23376 8.78396 7.43376L11.574 10.2238C11.894 10.5338 12.434 10.3138 12.434 9.86376V8.07376C15.744 8.07376 18.434 10.7638 18.434 14.0738C18.434 16.7938 16.604 19.0938 14.124 19.8238C13.704 19.9438 13.434 20.3438 13.434 20.7738C13.434 21.4238 14.054 21.9338 14.684 21.7438C18.004 20.7738 20.434 17.7138 20.434 14.0738C20.434 9.65376 16.854 6.07376 12.434 6.07376Z" fill="black"/>
                              <path d="M6.43396 14.0738C6.43396 12.7338 6.87396 11.4938 7.62396 10.4838C7.92396 10.0838 7.88396 9.53376 7.53396 9.17376C7.11396 8.75376 6.39396 8.79376 6.03396 9.27376C5.03396 10.6138 4.43396 12.2738 4.43396 14.0738C4.43396 17.7138 6.86396 20.7738 10.184 21.7438C10.814 21.9338 11.434 21.4238 11.434 20.7738C11.434 20.3438 11.164 19.9438 10.744 19.8238C8.26396 19.0938 6.43396 16.7938 6.43396 14.0738Z" fill="black"/>
                            </g>
                          </g>
                        </svg>
                      </button>
                      <button className="p-1" onClick={toggleFullScreen} aria-label="Full Screen">
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                          <g id="full screen">
                            <path id="Vector" d="M8.9748 3.73915C8.9748 3.97267 8.88203 4.19663 8.71691 4.36176C8.55178 4.52688 8.32782 4.61965 8.0943 4.61965H5.45279C5.21926 4.61965 4.99531 4.71242 4.83018 4.87754C4.66505 5.04267 4.57229 5.26663 4.57229 5.50015V8.14166C4.57229 8.37519 4.47952 8.59914 4.31439 8.76427C4.14927 8.9294 3.92531 9.02216 3.69178 9.02216C3.45826 9.02216 3.2343 8.9294 3.06917 8.76427C2.90405 8.59914 2.81128 8.37519 2.81128 8.14166V5.50015C2.81128 4.79958 3.08958 4.1277 3.58496 3.63232C4.08034 3.13694 4.75222 2.85864 5.45279 2.85864H8.0943C8.32782 2.85864 8.55178 2.95141 8.71691 3.11654C8.88203 3.28166 8.9748 3.50562 8.9748 3.73915ZM8.0943 16.9467H5.45279C5.21926 16.9467 4.99531 16.8539 4.83018 16.6888C4.66505 16.5237 4.57229 16.2997 4.57229 16.0662V13.4247C4.57229 13.1912 4.47952 12.9672 4.31439 12.8021C4.14927 12.6369 3.92531 12.5442 3.69178 12.5442C3.45826 12.5442 3.2343 12.6369 3.06917 12.8021C2.90405 12.9672 2.81128 13.1912 2.81128 13.4247V16.0662C2.81128 16.7668 3.08958 17.4386 3.58496 17.934C4.08034 18.4294 4.75222 18.7077 5.45279 18.7077H8.0943C8.32782 18.7077 8.55178 18.6149 8.71691 18.4498C8.88203 18.2847 8.9748 18.0607 8.9748 17.8272C8.9748 17.5937 8.88203 17.3697 8.71691 17.2046C8.55178 17.0395 8.32782 16.9467 8.0943 16.9467ZM17.7798 12.5442C17.5463 12.5442 17.3223 12.6369 17.1572 12.8021C16.9921 12.9672 16.8993 13.1912 16.8993 13.4247V16.0662C16.8993 16.2997 16.8066 16.5237 16.6414 16.6888C16.4763 16.8539 16.2524 16.9467 16.0188 16.9467H13.3773C13.1438 16.9467 12.9198 17.0395 12.7547 17.2046C12.5896 17.3697 12.4968 17.5937 12.4968 17.8272C12.4968 18.0607 12.5896 18.2847 12.7547 18.4498C12.9198 18.6149 13.1438 18.7077 13.3773 18.7077H16.0188C16.7194 18.7077 17.3913 18.4294 17.8867 17.934C18.382 17.4386 18.6603 16.7668 18.6603 16.0662V13.4247C18.6603 13.1912 18.5676 12.9672 18.4024 12.8021C18.2373 12.6369 18.0134 12.5442 17.7798 12.5442ZM13.3773 4.61965H16.0188C16.2524 4.61965 16.4763 4.71242 16.6414 4.87754C16.8066 5.04267 16.8993 5.26663 16.8993 5.50015V8.14166C16.8993 8.37519 16.9921 8.59914 17.1572 8.76427C17.3223 8.9294 17.5463 9.02216 17.7798 9.02216C18.0134 9.02216 18.2373 8.9294 18.4024 8.76427C18.5676 8.59914 18.6603 8.37519 18.6603 8.14166V5.50015C18.6603 4.79958 18.382 4.1277 17.8867 3.63232C17.3913 3.13694 16.7194 2.85864 16.0188 2.85864H13.3773C13.1438 2.85864 12.9198 2.95141 12.7547 3.11654C12.5896 3.28166 12.4968 3.50562 12.4968 3.73915C12.4968 3.97267 12.5896 4.19663 12.7547 4.36176C12.9198 4.52688 13.1438 4.61965 13.3773 4.61965Z" fill="#1D1136"/>
                          </g>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-blue flex justify-center items-center p-2">
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
                  <span className="text-white/80">Browse Files</span>
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
