import React, { useState, useRef, useEffect } from 'react';
import { AppScreen, Difficulty, Message, Persona, Topic, UserProgress } from './types';
import { PERSONAS, TOPICS } from './constants';
import { generateChatResponse, generateSpeech } from './services/gemini';
import { pcmToAudioBuffer, playAudioBuffer } from './utils/audio';
import { ChatBubble } from './components/ChatBubble';
import { ScriptHelper } from './components/ScriptHelper';
import { Mic, Send, ChevronLeft, Trophy, Flame, Zap, Settings2, StopCircle, Lock, Heart, Star, Crown } from 'lucide-react';

// Speech Recognition Type Definition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
    webkitAudioContext: any;
  }
}

// XP needed per level
const XP_PER_LEVEL = 150;

// XP needed per Relationship Level
const XP_PER_RELATIONSHIP = 50;

export default function App() {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.HOME);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.LEVEL_1);
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  
  // Progress State
  const [userProgress, setUserProgress] = useState<UserProgress>({
    totalXP: 120,
    streak: 3,
    level: 1,
    relationships: { 'chloe': 1, 'liam': 0, 'maya': 0 },
    topicMastery: {} // 'topicId': 0-100
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);

  // Computed Levels
  const currentLevel = Math.floor(userProgress.totalXP / XP_PER_LEVEL) + 1;
  const xpProgress = (userProgress.totalXP % XP_PER_LEVEL) / XP_PER_LEVEL * 100;

  // Initialize Audio Context
  useEffect(() => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true; 
      recognition.interimResults = true; 
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript || interimTranscript) {
           setInputText(prev => {
             return (finalTranscript + interimTranscript).trim();
           });
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
          alert("Microphone access denied. Please allow microphone access.");
          setIsRecording(false);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const startChat = async (topic: Topic) => {
    if (currentLevel < topic.minLevel) return; // Locked

    setSelectedTopic(topic);
    setScreen(AppScreen.CHAT);
    setMessages([]);
    setIsLoading(true);

    try {
      const relLevel = userProgress.relationships[selectedPersona.id] || 0;
      const mastery = userProgress.topicMastery[topic.id] || 0;

      // Generate initial greeting
      const aiData = await generateChatResponse(
        [], 
        `Let's start the roleplay topic: ${topic.title}. ${topic.initialPrompt}`, 
        selectedPersona, 
        topic, 
        difficulty,
        currentLevel,
        relLevel,
        mastery
      );
      
      const audioData = await generateSpeech(aiData.ai_response_text, selectedPersona.voiceName);

      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'ai',
        text: aiData.ai_response_text,
        translation: aiData.ai_response_translation,
        audioData: audioData,
        suggestedScript: aiData.suggested_user_script,
        scriptTranslation: aiData.script_translation
      };

      setMessages([newMessage]);
      playMessageAudio(newMessage);
      
    } catch (error) {
      console.error(error);
      alert("Failed to start chat. Check API Key.");
      setScreen(AppScreen.HOME);
    } finally {
      setIsLoading(false);
    }
  };

  const playMessageAudio = async (msg: Message) => {
    if (!msg.audioData || !audioContextRef.current) return;
    
    // Stop any currently playing
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    setPlayingAudioId(msg.id);
    const buffer = await pcmToAudioBuffer(msg.audioData, audioContextRef.current);
    playAudioBuffer(audioContextRef.current, buffer, () => {
      setPlayingAudioId(null);
    });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedTopic) return;
    
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    // --- PROGRESS UPDATES ---
    setUserProgress(prev => {
      // 1. Total XP
      const newTotalXP = prev.totalXP + 25;
      
      // 2. Relationship XP (Simulated simple increment for now)
      const currentRel = prev.relationships[selectedPersona.id] || 0;
      // Add '0.1' relationship point per message. 
      // In a real app, you'd track XP separately from Level, but here we just increment level occasionally
      // For demo: 10 messages = +1 Relationship Level
      const newRel = Math.min(10, currentRel + 0.1); 

      // 3. Topic Mastery
      const currentMastery = prev.topicMastery[selectedTopic.id] || 0;
      const newMastery = Math.min(100, currentMastery + 5); // +5% per message

      return {
        ...prev,
        totalXP: newTotalXP,
        relationships: {
          ...prev.relationships,
          [selectedPersona.id]: newRel
        },
        topicMastery: {
          ...prev.topicMastery,
          [selectedTopic.id]: newMastery
        }
      };
    });

    try {
      const relLevel = Math.floor(userProgress.relationships[selectedPersona.id] || 0);
      const mastery = userProgress.topicMastery[selectedTopic.id] || 0;

      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const aiData = await generateChatResponse(
        history, 
        userMsg.text, 
        selectedPersona, 
        selectedTopic, 
        difficulty,
        currentLevel,
        relLevel,
        mastery
      );

      const audioData = await generateSpeech(aiData.ai_response_text, selectedPersona.voiceName);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: aiData.ai_response_text,
        translation: aiData.ai_response_translation,
        audioData: audioData,
        suggestedScript: aiData.suggested_user_script,
        scriptTranslation: aiData.script_translation
      };

      setMessages(prev => [...prev, aiMsg]);
      playMessageAudio(aiMsg);

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Please use Chrome/Safari.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setInputText('');
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Recognition start error:", e);
      }
    }
  };

  // --- RENDER HELPERS ---

  const renderHome = () => {
    // No filtering, simple sorting: Unlocked first, then by mastery, then Locked
    const sortedTopics = [...TOPICS].sort((a, b) => {
       const aLocked = currentLevel < a.minLevel;
       const bLocked = currentLevel < b.minLevel;
       if (aLocked && !bLocked) return 1;
       if (!aLocked && bLocked) return -1;
       return 0;
    });

    return (
      <div className="flex flex-col h-full bg-purple-50">
        {/* Header */}
        <div className="p-6 bg-white border-b border-purple-100 shadow-sm sticky top-0 z-10 rounded-b-3xl">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">FlowTalk</h1>
            <div className="flex gap-3 text-sm font-semibold text-slate-600">
              <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-lg text-orange-600 border border-orange-100"><Flame size={14}/> {userProgress.streak}</div>
              <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg text-yellow-600 border border-yellow-100"><Trophy size={14}/> {userProgress.totalXP}</div>
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className="mb-6 bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-inner relative overflow-hidden">
            <div className="flex justify-between items-center mb-2 relative z-10">
              <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                <Crown size={16} className="text-violet-500 fill-current" />
                Level {currentLevel}
              </span>
              <span className="text-xs text-violet-400 font-medium">
                {Math.floor(xpProgress)}% to Next Level
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden relative z-10">
              <div 
                className="bg-violet-500 h-2 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(139,92,246,0.5)]" 
                style={{ width: `${xpProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Persona Selector with Relationship & Lock Logic */}
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
            {PERSONAS.map(p => {
              const isLocked = currentLevel < p.minLevel;
              const relLevel = Math.floor(userProgress.relationships[p.id] || 0);
              
              return (
                <button 
                  key={p.id}
                  disabled={isLocked}
                  onClick={() => setSelectedPersona(p)}
                  className={`flex-shrink-0 relative w-16 h-16 rounded-full border-2 transition-all duration-300 ${
                    selectedPersona.id === p.id 
                      ? 'border-violet-500 scale-105 shadow-lg ring-2 ring-violet-200' 
                      : 'border-transparent'
                  } ${isLocked ? 'opacity-50 grayscale' : ''}`}
                >
                  <img src={p.avatar} alt={p.name} className="w-full h-full rounded-full object-cover" />
                  
                  {/* Name Tag */}
                  <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap z-10 px-2 py-0.5 rounded-full font-bold text-[9px] tracking-wide ${
                    isLocked ? 'bg-slate-500 text-white' : 'bg-violet-600 text-white'
                  }`}>
                    {isLocked ? `Lvl ${p.minLevel}` : p.name}
                  </div>

                  {/* Lock Overlay */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                      <Lock size={16} className="text-white" />
                    </div>
                  )}

                  {/* Relationship Heart (Unlocked only) */}
                  {!isLocked && (
                    <div className="absolute -top-1 -right-1 flex items-center justify-center bg-white rounded-full p-1 shadow-sm border border-pink-100">
                       <Heart size={10} className={`text-pink-500 ${relLevel > 0 ? 'fill-current' : ''}`} />
                       <span className="text-[8px] font-bold text-pink-500 ml-0.5">{relLevel}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Unified Topic Grid */}
        <div className="flex-1 overflow-y-auto p-6 pt-0 pb-10 mt-4">
          <div className="grid grid-cols-1 gap-4">
            {sortedTopics.map(topic => {
              const isLocked = currentLevel < topic.minLevel;
              const mastery = userProgress.topicMastery[topic.id] || 0;
              const isMaster = mastery >= 100;

              return (
                <button 
                  key={topic.id}
                  onClick={() => startChat(topic)}
                  disabled={isLocked}
                  className={`relative p-5 rounded-2xl shadow-sm border text-left flex items-start gap-4 group overflow-hidden transition-all duration-300 ${
                    isLocked 
                      ? 'bg-slate-50 border-slate-100 opacity-70' 
                      : 'bg-white border-slate-100 hover:shadow-lg hover:border-violet-100 hover:-translate-y-1'
                  }`}
                >
                  {/* Background decoration */}
                  {!isLocked && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-50 to-transparent rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                  )}

                  {/* Emoji / Lock */}
                  <div className={`text-3xl p-3 rounded-2xl transition-all ${
                    isLocked ? 'bg-slate-200 grayscale' : 'bg-violet-50 group-hover:scale-110 group-hover:bg-violet-100'
                  }`}>
                    {isLocked ? <Lock size={28} className="text-slate-500"/> : topic.emoji}
                  </div>

                  <div className="z-10 flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className={`text-lg font-bold ${isLocked ? 'text-slate-500' : 'text-slate-800'}`}>{topic.title}</h3>
                      {isMaster && (
                         <div className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 border border-yellow-200">
                           <Crown size={10} fill="currentColor" /> MASTER
                         </div>
                      )}
                    </div>

                    <span className="text-[10px] font-bold text-violet-500 bg-violet-50 px-2 py-0.5 rounded-md uppercase tracking-wider inline-block mb-1">
                      {topic.category}
                    </span>
                    
                    <p className={`text-sm mt-1 leading-relaxed ${isLocked ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isLocked ? `Unlocks at Level ${topic.minLevel}` : topic.description}
                    </p>

                    {/* Mastery Bar */}
                    {!isLocked && (
                      <div className="mt-3">
                         <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wide">
                            <span>Mastery</span>
                            <span>{mastery}%</span>
                         </div>
                         <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                           <div 
                              className={`h-full rounded-full transition-all duration-500 ${isMaster ? 'bg-yellow-400' : 'bg-green-400'}`} 
                              style={{width: `${Math.min(100, mastery)}%`}}
                           ></div>
                         </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderChat = () => {
    // Get the last AI message's suggestion
    const lastAIMessage = messages.slice().reverse().find(m => m.role === 'ai');
    const suggestion = lastAIMessage?.suggestedScript || '';
    const suggestionTranslation = lastAIMessage?.scriptTranslation || '';

    // Script visibility based on difficulty
    const showScript = (difficulty === Difficulty.LEVEL_1 || difficulty === Difficulty.LEVEL_2 || difficulty === Difficulty.LEVEL_3) && messages.length > 0 && !isLoading;
    const showTranslation = difficulty === Difficulty.LEVEL_1;

    // Get current mastery and relationship for display
    const currentRel = Math.floor(userProgress.relationships[selectedPersona.id] || 0);
    const currentMastery = userProgress.topicMastery[selectedTopic!.id] || 0;

    return (
      <div className="flex flex-col h-full bg-purple-50 relative">
        {/* Chat Header */}
        <div className="px-4 py-3 bg-white/90 backdrop-blur-md border-b border-purple-100 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <button onClick={() => setScreen(AppScreen.HOME)} className="p-2 -ml-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            <h3 className="font-bold text-slate-800 flex items-center justify-center gap-2 text-sm">
              {selectedTopic?.title}
              {currentMastery >= 100 && <Crown size={14} className="text-yellow-500 fill-current"/>}
            </h3>
            {/* Relationship Status in Chat */}
            <p className="text-xs text-slate-500 flex items-center justify-center gap-3 mt-0.5">
               <span className="flex items-center gap-1 text-pink-500 font-medium">
                 <Heart size={10} fill="currentColor"/> {currentRel}
               </span>
               <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
               <span className="text-violet-500 font-medium">Lvl {currentLevel}</span>
            </p>
          </div>
          
          <div className="relative">
             <button 
                onClick={() => setShowDifficultyMenu(!showDifficultyMenu)}
                className="p-2 text-violet-600 bg-violet-50 rounded-full hover:bg-violet-100 transition-colors shadow-sm"
              >
                <Settings2 size={20} />
             </button>
             {showDifficultyMenu && (
               <div className="absolute right-0 top-12 bg-white rounded-xl shadow-xl border border-slate-100 p-2 w-56 flex flex-col gap-1 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider border-b border-slate-50 mb-1">Select Mode</div>
                  {Object.values(Difficulty).map((d) => (
                    <button
                      key={d}
                      onClick={() => { setDifficulty(d); setShowDifficultyMenu(false); }}
                      className={`text-left px-3 py-2.5 text-xs rounded-lg transition-colors ${difficulty === d ? 'bg-violet-50 text-violet-700 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}
                    >
                      {d}
                    </button>
                  ))}
               </div>
             )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 w-full">
          {/* Master Mode Banner */}
          {currentMastery >= 100 && messages.length === 1 && (
             <div className="mb-6 mx-auto bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100 p-3 rounded-xl text-center shadow-sm">
                <div className="text-yellow-700 font-bold text-sm flex items-center justify-center gap-2 mb-1">
                  <Crown size={16} fill="currentColor"/> MASTER MODE ACTIVE
                </div>
                <p className="text-xs text-yellow-600/80">The AI will now challenge you with complex "What if" scenarios.</p>
             </div>
          )}

          {messages.map((msg) => (
            <ChatBubble 
              key={msg.id} 
              message={msg} 
              personaColor={selectedPersona.color}
              isAudioPlaying={playingAudioId === msg.id}
              onPlayAudio={() => playMessageAudio(msg)}
            />
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center border border-purple-50">
                 <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                 <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                 <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Bottom Interaction Area */}
        <div className="bg-white border-t border-purple-100 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] w-full z-10 pb-safe">
          <ScriptHelper 
            text={suggestion} 
            translation={showTranslation ? suggestionTranslation : ''} 
            visible={showScript} 
          />

          <div className="p-4 pt-2">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleRecording}
                className={`relative p-3.5 rounded-full transition-all duration-300 flex-shrink-0 shadow-sm ${
                  isRecording 
                    ? 'bg-rose-500 text-white shadow-rose-200 scale-105 animate-pulse ring-4 ring-rose-100' 
                    : 'bg-violet-50 text-violet-600 hover:bg-violet-100 border border-violet-100'
                }`}
              >
                {isRecording ? <StopCircle size={22} /> : <Mic size={22} />}
              </button>

              <div className="flex-1 relative group">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={isRecording ? "Listening..." : "Type a message..."}
                  className={`w-full border-none rounded-2xl py-3.5 px-5 pr-12 text-slate-800 placeholder:text-slate-400 transition-all outline-none ${
                    isRecording 
                      ? 'bg-rose-50 ring-2 ring-rose-100 placeholder:text-rose-400' 
                      : 'bg-slate-100 focus:bg-white focus:ring-2 focus:ring-violet-500/50 shadow-inner'
                  }`}
                />
                
                {/* Visualizer when recording */}
                {isRecording && (
                   <div className="absolute right-14 top-1/2 -translate-y-1/2 flex gap-0.5 h-4 items-center">
                      <div className="w-1 bg-rose-400 rounded-full animate-[bounce_1s_infinite] h-2"></div>
                      <div className="w-1 bg-rose-400 rounded-full animate-[bounce_1s_infinite_0.1s] h-4"></div>
                      <div className="w-1 bg-rose-400 rounded-full animate-[bounce_1s_infinite_0.2s] h-3"></div>
                   </div>
                )}

                <button 
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isLoading}
                  className="absolute right-2 top-1.5 p-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:hover:bg-violet-600 transition-colors shadow-md shadow-violet-200 transform hover:scale-105 active:scale-95"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full max-w-md mx-auto bg-purple-50 shadow-2xl overflow-hidden relative">
       {screen === AppScreen.HOME ? renderHome() : renderChat()}
    </div>
  );
}
