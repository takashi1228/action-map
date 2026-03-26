import React, { useState, useEffect } from 'react';
import { 
  Map, Users, MessageSquare, Send, Navigation, Activity, Cloud, List, Table2, 
  Check, Sparkles, Bot, Bell, Link2, Calendar, MapPin, Building, ChevronDown, 
  ChevronUp, Globe, Phone, Image as ImageIcon, MapIcon, ZoomIn, ZoomOut, Download, 
  X, Maximize2, ArrowLeft, Heart, MessageCircle, Filter 
} from 'lucide-react';

// --- Firebase Initialization ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';

const isPreview = typeof __app_id !== 'undefined';

const firebaseConfig = isPreview && typeof __firebase_config !== 'undefined' && Object.keys(JSON.parse(__firebase_config)).length > 0
  ? JSON.parse(__firebase_config)
  : {
      apiKey: "AIzaSyCnf40RGxzR6X5JSCB6cqNbrHSg3GUkHJY",
      authDomain: "japan-action-map.firebaseapp.com",
      projectId: "japan-action-map",
      storageBucket: "japan-action-map.firebasestorage.app",
      messagingSenderId: "337678276551",
      appId: "1:337678276551:web:a7dc5c7a6a2bdcca652be2"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const COLLECTION_PATH = isPreview ? `artifacts/${typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'}/public/data/movements` : 'movements';

// --- Data Constants ---
const prefectures = [
  { code: 'ALL', name: '全国', region: 'national' },
  { code: '01', name: '北海道', region: 'hokkaido' },
  { code: '02', name: '青森', region: 'tohoku' }, { code: '03', name: '岩手', region: 'tohoku' }, { code: '04', name: '宮城', region: 'tohoku' }, { code: '05', name: '秋田', region: 'tohoku' }, { code: '06', name: '山形', region: 'tohoku' }, { code: '07', name: '福島', region: 'tohoku' },
  { code: '08', name: '茨城', region: 'kanto' }, { code: '09', name: '栃木', region: 'kanto' }, { code: '10', name: '群馬', region: 'kanto' }, { code: '11', name: '埼玉', region: 'kanto' }, { code: '12', name: '千葉', region: 'kanto' }, { code: '13', name: '東京', region: 'kanto' }, { code: '14', name: '神奈川', region: 'kanto' },
  { code: '15', name: '新潟', region: 'chubu' }, { code: '16', name: '富山', region: 'chubu' }, { code: '17', name: '石川', region: 'chubu' }, { code: '18', name: '福井', region: 'chubu' }, { code: '19', name: '山梨', region: 'chubu' }, { code: '20', name: '長野', region: 'chubu' }, { code: '21', name: '岐阜', region: 'chubu' }, { code: '22', name: '静岡', region: 'chubu' }, { code: '23', name: '愛知', region: 'chubu' },
  { code: '24', name: '三重', region: 'kansai' }, { code: '25', name: '滋賀', region: 'kansai' }, { code: '26', name: '京都', region: 'kansai' }, { code: '27', name: '大阪', region: 'kansai' }, { code: '28', name: '兵庫', region: 'kansai' }, { code: '29', name: '奈良', region: 'kansai' }, { code: '30', name: '和歌山', region: 'kansai' },
  { code: '31', name: '鳥取', region: 'chugoku' }, { code: '32', name: '島根', region: 'chugoku' }, { code: '33', name: '岡山', region: 'chugoku' }, { code: '34', name: '広島', region: 'chugoku' }, { code: '35', name: '山口', region: 'chugoku' },
  { code: '36', name: '徳島', region: 'shikoku' }, { code: '37', name: '香川', region: 'shikoku' }, { code: '38', name: '愛媛', region: 'shikoku' }, { code: '39', name: '高知', region: 'shikoku' },
  { code: '40', name: '福岡', region: 'kyushu' }, { code: '41', name: '佐賀', region: 'kyushu' }, { code: '42', name: '長崎', region: 'kyushu' }, { code: '43', name: '熊本', region: 'kyushu' }, { code: '44', name: '大分', region: 'kyushu' }, { code: '45', name: '宮崎', region: 'kyushu' }, { code: '46', name: '鹿児島', region: 'kyushu' },
  { code: '47', name: '沖縄', region: 'kyushu' }
];

const actionCategories = [
  { id: '教員アクション', label: '教員アクション', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { id: '議会等請願', label: '議会等請願', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: '地方議会アクション', label: '地方議会アクション', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: '訴訟運動', label: '訴訟運動', color: 'bg-purple-100 text-purple-700 border-purple-200' },
];

export default function App() {
  const [data, setData] = useState([]);
  const [selectedPref, setSelectedPref] = useState(null);
  const [activeTab, setActiveTab] = useState('actions'); // 'actions', 'groups', 'tactics'
  const [selectedCategory, setSelectedCategory] = useState(actionCategories[0].id);
  
  // Auth State
  const [user, setUser] = useState(null);
  const [isGroupMember, setIsGroupMember] = useState(false);
  const [secretWord, setSecretWord] = useState('');
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [targetOrg, setTargetOrg] = useState('');
  const [link, setLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // UI State
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // --- Auth & Data Fetching ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isPreview) {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
        }
      } catch (err) {
        console.error('Auth error', err);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.displayName && !author) {
        setAuthor(currentUser.displayName);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, COLLECTION_PATH));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sortedData = docs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
        return timeB - timeA;
      });
      setData(sortedData);
    }, (error) => {
      console.error("Firestore error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  // --- Handlers ---
  const handleGoogleLogin = async () => {
    if (isPreview) return alert('プレビュー環境ではログイン機能はテストできません。本番環境でご利用ください。');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
      alert('ログインに失敗しました。');
    }
  };

  const handleLogout = async () => {
    if (isPreview) return;
    try {
      await signOut(auth);
      setIsGroupMember(false); // ログアウト時にロック状態もリセット
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleUnlock = (e) => {
    e.preventDefault();
    if (secretWord === 'breakthrough') { // 秘密の言葉
      setIsGroupMember(true);
      setSecretWord('');
    } else {
      alert('秘密の言葉が違います。');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || user.isAnonymous) return alert('投稿にはログインが必要です。');
    if (!selectedPref) return;

    if (activeTab === 'tactics' && !targetOrg) { setErrorMsg('対象機関（議会・教育委員会など）を入力してください'); return; }
    if (activeTab === 'groups' && !organizer) { setErrorMsg('団体名を入力してください'); return; }
    if (!author) { setErrorMsg('おなまえを入力してください'); return; }
    if (!content) { setErrorMsg('内容を入力してください'); return; }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await addDoc(collection(db, COLLECTION_PATH), {
        prefectureCode: selectedPref.code,
        type: activeTab,
        category: activeTab === 'tactics' ? null : selectedCategory,
        author,
        content,
        date,
        location,
        organizer,
        targetOrg,
        link,
        createdAt: serverTimestamp(),
        userId: user.uid,
        likes: [],
        comments: []
      });
      setContent(''); setDate(''); setLocation(''); setOrganizer(''); setTargetOrg(''); setLink('');
      setIsFormOpen(false); // 投稿成功したらフォームを閉じる
    } catch (error) {
      console.error("Error adding document: ", error);
      setErrorMsg('投稿に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = async (e, post) => {
    e.stopPropagation();
    if (!user || user.isAnonymous) return alert('いいねするにはログインが必要です。');

    const hasLiked = post.likes?.includes(user.uid);
    const postRef = doc(db, COLLECTION_PATH, post.id);
    
    try {
      if (hasLiked) {
        await updateDoc(postRef, { likes: arrayRemove(user.uid) });
      } else {
        await updateDoc(postRef, { likes: arrayUnion(user.uid) });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user || user.isAnonymous) return alert('コメントするにはログインが必要です。');
    if (!selectedPost || !commentText.trim()) return;

    const postRef = doc(db, COLLECTION_PATH, selectedPost.id);
    const newComment = {
      id: crypto.randomUUID(),
      userId: user.uid,
      author: user.displayName || author || '匿名',
      text: commentText,
      createdAt: new Date().toISOString()
    };

    try {
      await updateDoc(postRef, { comments: arrayUnion(newComment) });
      setCommentText('');
      // Update local state for immediate UI reflection
      setSelectedPost(prev => ({...prev, comments: [...(prev.comments || []), newComment]}));
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleGenerateAI = async () => {
    if (data.length === 0) return;
    setIsGeneratingAI(true);
    try {
      const apiKey = isPreview ? "" : "AIzaSyDCbtCoykvVaZ_nAAnrUh-Vkge8tjYtFRA";
      const recentDataForAI = data.slice(0, 20).map(p => ({
        prefecture: prefectures.find(pref => pref.code === p.prefectureCode)?.name || '不明',
        type: p.type === 'actions' ? 'アクション' : p.type === 'groups' ? '団体' : '戦い方',
        content: p.content
      }));

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `以下の全国の最新アクションデータを分析し、現在の傾向や注目の動きを300文字程度で、ポジティブでモチベーションが上がるトーンで要約してください。\n\nデータ: ${JSON.stringify(recentDataForAI)}` }] }],
        })
      });
      const result = await response.json();
      setAiSummary(result.candidates?.[0]?.content?.parts?.[0]?.text || '要約を生成できませんでした。');
    } catch (err) {
      console.error(err);
      setAiSummary('AIとの通信に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleDownloadCSV = () => {
    const headers = ['都道府県', '種類', 'カテゴリ/団体名', '投稿者', '内容', '日時', '場所', 'リンク'];
    const csvContent = [
      headers.join(','),
      ...data.map(d => [
        prefectures.find(p => p.code === d.prefectureCode)?.name || '',
        d.type,
        d.category || d.organizer || d.targetOrg || '',
        d.author,
        `"${(d.content || '').replace(/"/g, '""')}"`,
        d.date || '',
        `"${(d.location || '').replace(/"/g, '""')}"`,
        d.link || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `action_map_data_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
  };

  const toggleFilter = (catId) => {
    setSelectedFilters(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  // --- Filtering & Theme ---
  const filteredData = data.filter(d => {
    const prefMatch = selectedPref?.code === 'ALL' || d.prefectureCode === selectedPref?.code;
    const tabMatch = d.type === activeTab;
    const filterMatch = selectedFilters.length === 0 || selectedFilters.includes(d.category);
    return prefMatch && tabMatch && filterMatch;
  });

  const getTheme = () => {
    if (activeTab === 'groups') return { bg: 'bg-emerald-50', bgSoft: 'bg-emerald-50/50', border: 'border-emerald-200', borderActive: 'border-emerald-400', text: 'text-emerald-600', textDark: 'text-emerald-800', accent: 'text-emerald-400', btn: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' };
    if (activeTab === 'tactics') return { bg: 'bg-amber-50', bgSoft: 'bg-amber-50/50', border: 'border-amber-200', borderActive: 'border-amber-400', text: 'text-amber-600', textDark: 'text-amber-800', accent: 'text-amber-400', btn: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' };
    return { bg: 'bg-pink-50', bgSoft: 'bg-pink-50/50', border: 'border-pink-200', borderActive: 'border-pink-400', text: 'text-pink-600', textDark: 'text-pink-800', accent: 'text-pink-400', btn: 'bg-pink-500', badge: 'bg-pink-100 text-pink-700' };
  };
  const currentTheme = getTheme();

  // 簡易的なSVGマップコンポーネント（表示用）
  const renderSimpleMap = () => {
    return (
      <div className="relative w-full h-full min-h-[400px] flex items-center justify-center bg-white rounded-3xl border-4 border-white mofumofu-shadow p-4">
        <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
          {prefectures.map(pref => (
            <button
              key={pref.code}
              onClick={() => setSelectedPref(pref)}
              className={`
                px-3 py-2 rounded-full font-bold text-sm transition-all mofumofu-shadow
                ${selectedPref?.code === pref.code ? 'bg-pink-500 text-white scale-110' : 'bg-pink-50 text-pink-600 hover:bg-pink-100 hover:scale-105'}
              `}
            >
              {pref.name}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-pink-200 flex flex-col lg:flex-row overflow-hidden">
      
      {/* --- 左側（または上部）: マップ領域 --- */}
      <div className={`
        ${selectedPref && selectedPref.code !== 'ALL' ? 'hidden lg:flex lg:w-1/3 xl:w-2/5' : 'flex w-full lg:w-1/2'} 
        flex-col p-4 lg:p-6 transition-all duration-500 ease-in-out h-[50vh] lg:h-screen relative z-10
      `}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-8 h-8 text-pink-400 fill-pink-100 drop-shadow-sm" />
            <h1 className="text-2xl font-black text-pink-500 tracking-tight drop-shadow-sm">アクションマップ</h1>
          </div>
          <button onClick={() => setSelectedPref(prefectures.find(p => p.code === 'ALL'))} className="px-4 py-2 bg-white rounded-full text-pink-500 font-bold border-2 border-pink-200 mofumofu-shadow hover:bg-pink-50 hover:scale-105 transition-all flex items-center gap-1 text-sm">
            <Globe className="w-4 h-4" /> 全国一覧
          </button>
        </div>
        
        <div className="flex-1 relative">
          {renderSimpleMap()}
        </div>

        {/* AI要約ボタン（全国表示時など） */}
        <div className="mt-4 flex justify-center">
          <button onClick={handleGenerateAI} disabled={isGeneratingAI} className="px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full font-bold mofumofu-shadow hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2">
            <Bot className="w-5 h-5" />
            {isGeneratingAI ? 'AIが全国の動きを要約中...' : 'AIで全国の動きを要約'}
          </button>
        </div>
      </div>

      {/* --- 右側: コンテンツ領域 --- */}
      <div className={`
        ${selectedPref && selectedPref.code !== 'ALL' ? 'flex w-full lg:w-2/3 xl:w-3/5' : 'hidden lg:flex lg:w-1/2'} 
        flex-col h-[50vh] lg:h-screen transition-all duration-500 ease-in-out relative
      `}>
        {selectedPref ? (
          <div className={`flex flex-col h-full bg-white lg:rounded-l-[2rem] shadow-[-10px_0_30px_rgba(0,0,0,0.05)] overflow-hidden border-t-4 lg:border-t-0 lg:border-l-4 ${currentTheme.border}`}>
            
            {/* ヘッダー */}
            <div className={`p-4 lg:p-6 pb-0 border-b ${currentTheme.border} shrink-0 bg-white z-20 relative`}>
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setSelectedPref(null)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className={`text-2xl lg:text-3xl font-black ${currentTheme.text} flex items-center gap-2 drop-shadow-sm`}>
                  <MapPin className={`w-6 h-6 lg:w-8 lg:h-8 ${currentTheme.accent} fill-current/20`} />
                  {selectedPref.name}
                </h2>
                
                <div className="flex items-center gap-2">
                  {!isPreview && (
                    user && !user.isAnonymous ? (
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                        <span className="text-xs font-bold text-slate-600">{user.displayName}</span>
                        <button onClick={handleLogout} className="text-[10px] font-bold text-slate-400 hover:text-slate-600">ログアウト</button>
                      </div>
                    ) : (
                      <button onClick={handleGoogleLogin} className="text-xs font-bold text-blue-500 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-50 transition-colors">
                        Googleでログイン
                      </button>
                    )
                  )}
                  <button onClick={handleDownloadCSV} className="p-2 bg-slate-50 text-slate-500 rounded-full hover:bg-slate-100 transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* タブ */}
              <div className="flex p-1 bg-slate-100 rounded-2xl mb-4 relative z-10 mofumofu-shadow">
                {[
                  { id: 'actions', icon: Activity, label: 'アクション', count: data.filter(d => (selectedPref.code === 'ALL' || d.prefectureCode === selectedPref.code) && d.type === 'actions').length },
                  { id: 'groups', icon: Users, label: '協力団体・者', count: data.filter(d => (selectedPref.code === 'ALL' || d.prefectureCode === selectedPref.code) && d.type === 'groups').length },
                  { id: 'tactics', icon: MessageSquare, label: '議会のトーン', count: data.filter(d => (selectedPref.code === 'ALL' || d.prefectureCode === selectedPref.code) && d.type === 'tactics').length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setSelectedFilters([]); setIsFormOpen(false); }}
                    className={`flex-1 flex flex-col lg:flex-row items-center justify-center gap-1 lg:gap-2 py-2 lg:py-3 rounded-[1rem] font-bold text-[10px] lg:text-sm transition-all duration-300 relative ${activeTab === tab.id ? `${currentTheme.bg} ${currentTheme.text} shadow-sm scale-[1.02]` : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'}`}
                  >
                    <tab.icon className={`w-4 h-4 lg:w-5 lg:h-5 ${activeTab === tab.id ? currentTheme.text : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] lg:text-[10px] ${activeTab === tab.id ? currentTheme.badge : 'bg-slate-200 text-slate-500'}`}>{tab.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* カテゴリフィルター */}
            {activeTab !== 'tactics' && (
              <div className={`bg-white px-4 lg:px-6 py-2 border-b ${currentTheme.border} flex flex-wrap gap-2 shrink-0`}>
                {actionCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => toggleFilter(cat.id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all border-2 ${selectedFilters.includes(cat.id) ? `${cat.color} scale-105` : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}

            {/* 投稿フォーム (トグル式) */}
            {selectedPref.code !== 'ALL' && !(activeTab === 'tactics' && !isGroupMember) && (
              <div className="bg-white shrink-0 border-b border-slate-100 z-10 shadow-sm">
                {(!isPreview && (!user || user.isAnonymous)) ? (
                  <div className="p-4 text-center">
                    <p className="text-xs font-bold text-slate-500 mb-2">投稿やいいねにはログインが必要です</p>
                    <button onClick={handleGoogleLogin} className="px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded-full">Googleでログイン</button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => setIsFormOpen(!isFormOpen)} className={`w-full px-4 py-3 flex justify-between items-center text-sm font-bold ${currentTheme.text} hover:bg-slate-50`}>
                      <span className="flex items-center gap-2"><Send className="w-4 h-4"/> 投稿する</span>
                      {isFormOpen ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                    </button>
                    {isFormOpen && (
                      <div className="p-4 pt-0">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                          {errorMsg && <div className="text-xs text-red-500 font-bold">{errorMsg}</div>}
                          {activeTab === 'tactics' ? (
                            <div className="flex gap-2"><input type="text" placeholder="対象機関 (例: 〇〇市議会)" value={targetOrg} onChange={e=>setTargetOrg(e.target.value)} className="flex-1 p-2 border rounded-xl text-sm" required/></div>
                          ) : activeTab === 'groups' ? (
                            <div className="flex gap-2"><input type="text" placeholder="団体名" value={organizer} onChange={e=>setOrganizer(e.target.value)} className="flex-1 p-2 border rounded-xl text-sm" required/></div>
                          ) : (
                            <select value={selectedCategory} onChange={e=>setSelectedCategory(e.target.value)} className="p-2 border rounded-xl text-sm w-full"><option value="">カテゴリを選択</option>{actionCategories.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select>
                          )}
                          <textarea placeholder="内容を入力..." value={content} onChange={e=>setContent(e.target.value)} className="w-full h-20 p-3 border rounded-xl text-sm resize-none" required />
                          <div className="flex justify-end">
                            <button type="submit" disabled={isSubmitting} className={`px-4 py-2 rounded-full text-white font-bold text-sm ${currentTheme.btn} disabled:opacity-50`}>
                              {isSubmitting ? '送信中...' : '送信する'}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* コンテンツ一覧 */}
            <div className={`flex-1 overflow-y-auto p-4 ${currentTheme.bgSoft} custom-scrollbar relative`}>
              {activeTab === 'tactics' && !isGroupMember ? (
                // 秘密の言葉ロック画面
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <MessageSquare className={`w-16 h-16 ${currentTheme.accent} mb-4 opacity-50`} />
                  <h3 className="text-lg font-bold mb-2">この情報は関係者限定です🔒</h3>
                  <form onSubmit={handleUnlock} className="flex flex-col gap-2 w-full max-w-xs mt-4">
                    <input type="password" placeholder="秘密の言葉 (breakthrough)" value={secretWord} onChange={e=>setSecretWord(e.target.value)} className="p-2 border rounded-full text-center" />
                    <button type="submit" className={`p-2 rounded-full text-white font-bold ${currentTheme.btn}`}>ロック解除</button>
                  </form>
                </div>
              ) : filteredData.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {filteredData.map(post => (
                    <div key={post.id} onClick={() => setSelectedPost(post)} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'tactics' ? 'bg-amber-100 text-amber-700' : activeTab === 'groups' ? 'bg-emerald-100 text-emerald-700' : actionCategories.find(c=>c.id===post.category)?.color}`}>
                          {post.category || post.organizer || post.targetOrg}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatDate(post.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed mb-3">{post.content}</p>
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                        <span className="text-xs font-bold text-slate-500">by {post.author}</span>
                        <div className="flex items-center gap-3">
                          <button onClick={(e) => handleToggleLike(e, post)} className={`flex items-center gap-1 text-xs font-bold transition-colors ${post.likes?.includes(user?.uid) ? 'text-pink-500' : 'text-slate-400 hover:text-pink-400'}`}>
                            <Heart className={`w-4 h-4 ${post.likes?.includes(user?.uid) ? 'fill-current' : ''}`} /> {post.likes?.length || 0}
                          </button>
                          <span className="flex items-center gap-1 text-xs font-bold text-slate-400"><MessageCircle className="w-4 h-4" /> {post.comments?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <Cloud className="w-16 h-16 mb-4 opacity-20" />
                  <p className="font-bold">まだ投稿がありません</p>
                </div>
              )}
            </div>
            
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6 text-center lg:rounded-l-[2rem]">
            <Navigation className="w-16 h-16 lg:w-20 lg:h-20 text-slate-300 mb-6 animate-bounce" />
            <h2 className="text-xl lg:text-3xl font-black text-slate-400 mb-4 tracking-tight">マップから地域を選んでね</h2>
          </div>
        )}
      </div>

      {/* モーダル類 */}
      {selectedPost && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] lg:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
            <div className={`p-4 border-b flex justify-between items-center ${activeTab==='groups' ? 'bg-emerald-50' : activeTab==='tactics' ? 'bg-amber-50' : 'bg-pink-50'}`}>
              <h3 className="font-bold text-lg text-slate-700">詳細</h3>
              <button onClick={() => setSelectedPost(null)} className="p-2 bg-white rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <p className="text-slate-800 whitespace-pre-wrap">{selectedPost.content}</p>
              {/* コメント領域 */}
              <div className="mt-8 border-t pt-4">
                <h4 className="font-bold text-sm text-slate-500 mb-4 flex items-center gap-2"><MessageCircle className="w-4 h-4"/> コメント</h4>
                <div className="flex flex-col gap-3 mb-4">
                  {(selectedPost.comments || []).map(comment => (
                    <div key={comment.id} className="bg-slate-50 p-3 rounded-xl">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-bold">{comment.author}</span>
                        <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm">{comment.text}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input type="text" value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="コメントを追加..." className="flex-1 p-2 text-sm border rounded-full bg-slate-50" />
                  <button type="submit" disabled={!commentText.trim()} className="px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-full disabled:opacity-50">送信</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {aiSummary && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl relative">
            <button onClick={() => setAiSummary('')} className="absolute top-4 right-4 p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-4"><div className="p-3 bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl"><Bot className="w-8 h-8 text-pink-500" /></div><h3 className="text-xl font-black text-slate-800 tracking-tight">AI アクション要約</h3></div>
            <div className="p-5 bg-gradient-to-br from-slate-50 to-pink-50/30 rounded-2xl border-2 border-pink-100/50 text-slate-700 text-sm lg:text-base leading-relaxed font-medium"><p className="whitespace-pre-wrap">{aiSummary}</p></div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .mofumofu-shadow { box-shadow: 0 8px 30px rgba(0,0,0,0.04), 0 4px 10px rgba(0,0,0,0.02); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
}