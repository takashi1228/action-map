import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Map, Users, MessageSquare, Send, Navigation, Activity, Cloud, List, Table2, Check, Sparkles, Bot, Bell, Link2, Calendar, MapPin, Building, ChevronDown, ChevronUp, Globe, Phone, Image as ImageIcon, Map as MapIcon, ZoomIn, ZoomOut, Download, X, Maximize2, ArrowLeft, Heart, MessageCircle, Filter } from 'lucide-react';

// --- Firebase Initialization ---
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

// 本番環境ではスッキリしたルートコレクション 'movements' を使用
const COLLECTION_PATH = isPreview ? `artifacts/${typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'}/public/data/movements` : 'movements';

// --- Data Constants ---
const prefectures = [
  { code: '00', name: '全国（共通）', shortName: '全国', x: 3, y: 2, isNational: true },
  { code: '01', name: '北海道', x: 14, y: 1 },
  { code: '02', name: '青森', x: 14, y: 3 },
  { code: '03', name: '岩手', x: 14, y: 4 },
  { code: '04', name: '宮城', x: 14, y: 5 },
  { code: '05', name: '秋田', x: 13, y: 4 },
  { code: '06', name: '山形', x: 13, y: 5 },
  { code: '07', name: '福島', x: 14, y: 6 },
  { code: '08', name: '茨城', x: 14, y: 7 },
  { code: '09', name: '栃木', x: 13, y: 7 },
  { code: '10', name: '群馬', x: 12, y: 7 },
  { code: '11', name: '埼玉', x: 13, y: 8 },
  { code: '12', name: '千葉', x: 14, y: 8 },
  { code: '13', name: '東京', x: 13, y: 9 },
  { code: '14', name: '神奈川', x: 13, y: 10 },
  { code: '15', name: '新潟', x: 12, y: 5 },
  { code: '16', name: '富山', x: 11, y: 5 },
  { code: '17', name: '石川', x: 10, y: 4 }, 
  { code: '18', name: '福井', x: 10, y: 5 },
  { code: '19', name: '山梨', x: 12, y: 9 },
  { code: '20', name: '長野', x: 12, y: 8 },
  { code: '21', name: '岐阜', x: 11, y: 8 },
  { code: '22', name: '静岡', x: 12, y: 10 },
  { code: '23', name: '愛知', x: 11, y: 9 },
  { code: '24', name: '三重', x: 10, y: 9 },
  { code: '25', name: '滋賀', x: 10, y: 8 },
  { code: '26', name: '京都', x: 9, y: 7 },
  { code: '27', name: '大阪', x: 9, y: 8 },
  { code: '28', name: '兵庫', x: 8, y: 7 },
  { code: '29', name: '奈良', x: 9, y: 9 },
  { code: '30', name: '和歌山', x: 9, y: 10 },
  { code: '31', name: '鳥取', x: 7, y: 7 },
  { code: '32', name: '島根', x: 6, y: 7 },
  { code: '33', name: '岡山', x: 7, y: 8 },
  { code: '34', name: '広島', x: 6, y: 8 },
  { code: '35', name: '山口', x: 5, y: 8 },
  { code: '36', name: '徳島', x: 8, y: 10 },
  { code: '37', name: '香川', x: 8, y: 9 },
  { code: '38', name: '愛媛', x: 6, y: 9 },
  { code: '39', name: '高知', x: 7, y: 10 },
  { code: '40', name: '福岡', x: 4, y: 8 },
  { code: '41', name: '佐賀', x: 3, y: 8 },
  { code: '42', name: '長崎', x: 2, y: 8 },
  { code: '43', name: '熊本', x: 3, y: 9 }, 
  { code: '44', name: '大分', x: 4, y: 9 },
  { code: '45', name: '宮崎', x: 4, y: 10 },
  { code: '46', name: '鹿児島', x: 3, y: 10 },
  { code: '47', name: '沖縄', x: 1, y: 12 }
];

const tabs = [
  { id: 'action', label: 'アクション', icon: Activity },
  { id: 'groups', label: '協力団体・者', icon: Users },
  { id: 'tactics', label: '議会のトーン', icon: MessageSquare },
];

const actionCategories = [
  { id: 'teachers', label: '教員アクション', color: 'bg-rose-100 text-rose-600 border-rose-200' },
  { id: 'petition', label: '議会等請願', color: 'bg-sky-100 text-sky-600 border-sky-200' },
  { id: 'council', label: '地方議会アクション', color: 'bg-emerald-100 text-emerald-600 border-emerald-200' },
  { id: 'lawsuit', label: '訴訟運動', color: 'bg-purple-100 text-purple-600 border-purple-200' },
];

const tones = [
  { id: 'cooperative', label: '🤝 協力的', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'passive', label: '😶 消極的', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'hostile', label: '🛑 敵対的/難航', color: 'bg-rose-100 text-rose-700 border-rose-200' }
];

const themes = {
  action: {
    bg: 'bg-pink-50', bgSoft: 'bg-pink-50/50', border: 'border-pink-100', borderActive: 'border-pink-300',
    text: 'text-pink-600', textDark: 'text-pink-700', accent: 'text-pink-500', badge: 'bg-pink-100 text-pink-600',
    btn: 'bg-gradient-to-r from-pink-400 to-purple-400', header: 'bg-pink-100/50 border-pink-200'
  },
  groups: {
    bg: 'bg-cyan-50', bgSoft: 'bg-cyan-50/50', border: 'border-cyan-100', borderActive: 'border-cyan-300',
    text: 'text-cyan-600', textDark: 'text-cyan-700', accent: 'text-cyan-500', badge: 'bg-cyan-100 text-cyan-600',
    btn: 'bg-gradient-to-r from-cyan-400 to-blue-400', header: 'bg-cyan-100/50 border-cyan-200'
  },
  tactics: {
    bg: 'bg-amber-50', bgSoft: 'bg-amber-50/50', border: 'border-amber-100', borderActive: 'border-amber-300',
    text: 'text-amber-600', textDark: 'text-amber-700', accent: 'text-amber-500', badge: 'bg-amber-100 text-amber-600',
    btn: 'bg-gradient-to-r from-amber-400 to-orange-400', header: 'bg-amber-100/50 border-amber-200'
  }
};

const sampleData = [
  { id: 'sample1', prefectureCode: '13', type: 'action', category: 'teachers', content: '都庁前でアピールを実施。多くのメディアが取材に来ました。\n当日の様子は https://example.com/tokyo-action を確認してください。', author: '東京アクション', eventDate: '2026/3/15', location: '都庁前', organizer: '東京教員有志', likes: [], comments: [], createdAt: { toMillis: () => Date.now() - 1000000 } },
  { id: 'sample2', prefectureCode: '27', type: 'groups', category: 'petition', content: '署名活動を中心に活動しています。賛同者募集中！', author: '大阪教育ネットワーク', organizer: '大阪教育ネットワーク', groupContact: 'info@example.com', likes: [], comments: [], createdAt: { toMillis: () => Date.now() - 2000000 } },
  { id: 'sample3', prefectureCode: '01', type: 'tactics', targetOrg: '北海道教育委員会', tone: 'passive', content: '現状維持の姿勢が強い。他県の成功事例（特に〇〇県）のデータを持っていくと少し話を聞いてくれる傾向があります。粘り強い交渉が必要です。', author: '北の教育者', likes: [], comments: [], createdAt: { toMillis: () => Date.now() - 3000000 } },
  { id: 'sample4', prefectureCode: '40', type: 'action', category: 'council', content: '県議会への陳情を行いました。好意的な議員も数名おり、手応えを感じています。', author: '福岡有志の会', eventDate: '2026/2/20', location: '福岡県庁', likes: ['user1', 'user2'], comments: [], createdAt: { toMillis: () => Date.now() - 4000000 } },
  { id: 'sample5', prefectureCode: '00', type: 'action', category: 'lawsuit', content: '全国一斉のオンライン説明会を開催しました。録画は https://youtube.com/example から視聴できます。', author: '全国事務局', eventDate: '2026/3/01', sharedLink: 'https://youtube.com/example', likes: [], comments: [], createdAt: { toMillis: () => Date.now() - 5000000 } },
  { id: 'sample6', prefectureCode: '23', type: 'tactics', targetOrg: '名古屋市議会 文教委員会', tone: 'cooperative', content: '〇〇会派の議員が非常に協力的で、定例会での質問を取り上げてくれました。事前にデータや現場の生の声（アンケート結果など）をまとめて渡すとスムーズです。', author: '愛知アクション', likes: [], comments: [{id: 'c1', text: '素晴らしい！データまとめのテンプレがあれば共有してほしいです。', author: '岐阜の仲間', createdAt: new Date(Date.now() - 500000).toISOString()}], createdAt: { toMillis: () => Date.now() - 6000000 } },
  { id: 'sample7', prefectureCode: '14', type: 'tactics', targetOrg: '〇〇市 教職員組合', tone: 'hostile', content: '既存の運動方針との違いから、最初は警戒されました。対立するのではなく、目的は同じであることを根気よく伝え、まずは情報交換の場を持つところから始めるのが良いです。', author: '神奈川若手の会', likes: [], comments: [], createdAt: { toMillis: () => Date.now() - 7000000 } },
];

const Linkify = ({ text }) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return (
    <>
      {parts.map((part, i) => 
        part.match(urlRegex) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 hover:underline break-all" onClick={e => e.stopPropagation()}>
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState([]);
  const [selectedPref, setSelectedPref] = useState(null);
  const [activeTab, setActiveTab] = useState('action');
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, text: '', prefCode: '' });
  
  // マップのズーム機能
  const [zoomLevel, setZoomLevel] = useState(1);
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.5, 1));
  
  // マップのカテゴリフィルタリング
  const [mapFilter, setMapFilter] = useState('all');

  const [viewMode, setViewMode] = useState('list');
  const [selectedFilters, setSelectedFilters] = useState([]);
  
  // ポップアップ詳細表示用 state
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');

  // Form states
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(actionCategories[0].id);
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [sharedLink, setSharedLink] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [showAdvancedForm, setShowAdvancedForm] = useState(false);
  
  const [groupContact, setGroupContact] = useState('');
  const [groupAddress, setGroupAddress] = useState('');
  const [groupMapUrl, setGroupMapUrl] = useState('');
  const [groupPhotoName, setGroupPhotoName] = useState('');

  const [targetOrg, setTargetOrg] = useState('');
  const [tone, setTone] = useState(tones[0].id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [isGroupMember, setIsGroupMember] = useState(false);

  const [aiSummary, setAiSummary] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false); // フォームの格納状態

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error('Auth error', err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Googleアカウント等の名前があれば初期値としてセット
      if (currentUser && currentUser.displayName && !author) {
        setAuthor(currentUser.displayName);
      }
    });
    return () => unsubscribe();
  }, []);

  // タブや地域が切り替わったらフォームを閉じて閲覧領域を広げる
  useEffect(() => {
    setIsFormOpen(false);
  }, [selectedPref, activeTab]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, COLLECTION_PATH));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.forEach(d => { if(d.type === 'overview') d.type = 'action'; });
      
      const allData = [...docs, ...sampleData];
      allData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || Date.now();
        const timeB = b.createdAt?.toMillis() || Date.now();
        return timeB - timeA;
      });
      setData(allData);

      // モーダル表示中のデータも更新する（リアルタイム反映）
      if (selectedPost) {
        const updatedPost = allData.find(p => p.id === selectedPost.id);
        if (updatedPost) setSelectedPost(updatedPost);
      }
    }, (error) => {
      console.error("Error fetching data: ", error);
      setErrorMsg("データの取得に失敗しました。");
    });
    return () => unsubscribe();
  }, [user, selectedPost?.id]);

  const handleMouseMove = (e, pref) => {
    setTooltip({ show: true, x: e.clientX, y: e.clientY, text: pref.name, prefCode: pref.code });
  };
  const handleMouseLeave = () => { setTooltip(prev => ({ ...prev, show: false })); };
  
  const toggleFilter = (catId) => {
    setSelectedFilters(prev => prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]);
  };

  const handleLinkClick = (e, linkStr) => {
    e.stopPropagation();
    e.preventDefault();
    alert(`【デモ環境の仕様】\n実際の運用環境では、ファイルや指定のリンクが開きます。\n\nリンク内容: ${linkStr}`);
  };

  const handleAddressBlur = () => {
    if (groupAddress.trim() && !groupMapUrl.trim()) {
      const encodedAddress = encodeURIComponent(groupAddress.trim());
      setGroupMapUrl(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
    }
  };

  const handleToggleLike = async (e, post) => {
    e.stopPropagation();
    if (!user) return alert('いいねするにはログインが必要です。');
    if (post.id.startsWith('sample')) return alert('サンプルデータにはいいねできません。（新規投稿してお試しください）');

    const hasLiked = post.likes?.includes(user.uid);
    const postRef = doc(db, COLLECTION_PATH, post.id);
    
    const newLikes = hasLiked 
      ? (post.likes || []).filter(id => id !== user.uid)
      : [...(post.likes || []), user.uid];
    
    if (selectedPost?.id === post.id) {
      setSelectedPost({ ...selectedPost, likes: newLikes });
    }

    try {
      await updateDoc(postRef, {
        likes: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (err) {
      console.error("Like error", err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) return alert('コメントするにはログインが必要です。');
    if (!selectedPost || selectedPost.id.startsWith('sample')) return alert('サンプルデータにはコメントできません。（新規投稿してお試しください）');
    if (!commentText.trim()) return;

    const postRef = doc(db, COLLECTION_PATH, selectedPost.id);
    const newComment = {
      id: Date.now().toString(),
      text: commentText.trim(),
      author: author || '名無しさん',
      userId: user.uid,
      createdAt: new Date().toISOString()
    };

    try {
      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });
      setCommentText('');
    } catch (err) {
      console.error("Comment error", err);
      alert('コメントの送信に失敗しました。');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert('投稿するにはGoogleアカウントでのログインが必要です。');
    if (!content.trim() || !author.trim() || !selectedPref) return;
    if (selectedPref.code === 'ALL') {
      setErrorMsg('全国一覧モードからは投稿できません。地域を選択してください。');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await addDoc(collection(db, COLLECTION_PATH), {
        prefectureCode: selectedPref.code,
        type: activeTab,
        category: activeTab === 'tactics' ? null : selectedCategory,
        content: content.trim(),
        author: author.trim(),
        eventDate: eventDate.trim(),
        location: location.trim(),
        organizer: organizer.trim(),
        sharedLink: attachedFile ? `[添付ファイル] ${attachedFile.name}` : sharedLink.trim(),
        groupContact: groupContact.trim(),
        groupAddress: groupAddress.trim(),
        groupMapUrl: groupMapUrl.trim(),
        groupPhotoName: groupPhotoName.trim(),
        targetOrg: targetOrg.trim(),
        tone: tone,
        likes: [],
        comments: [],
        createdAt: serverTimestamp(),
        userId: user.uid
      });
      setContent(''); setEventDate(''); setLocation(''); setOrganizer('');
      setSharedLink(''); setAttachedFile(null); setShowAdvancedForm(false);
      setGroupContact(''); setGroupAddress(''); setGroupMapUrl(''); setGroupPhotoName('');
      setTargetOrg(''); setTone(tones[0].id);
      setIsFormOpen(false); // 投稿後にフォームを閉じる
    } catch (err) {
      console.error(err);
      setErrorMsg('投稿に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  // マップのフィルタリングを考慮した色分け（議会のトーンは除外）
  const getPrefectureColor = (prefCode) => {
    const count = data.filter(d => {
      if (d.type === 'tactics') return false; // 議会のトーンはマップに反映しない
      if (mapFilter !== 'all' && d.category !== mapFilter) return false; // カテゴリフィルタ
      return d.prefectureCode === prefCode;
    }).length;

    if (count === 0) return 'bg-white/90 border-pink-100 text-slate-500 hover:bg-pink-50';
    if (count <= 1) return 'bg-pink-200 border-pink-300 text-pink-800 shadow-sm';
    if (count <= 3) return 'bg-purple-300 border-purple-400 text-purple-900 shadow-md';
    return 'bg-rose-400 border-rose-500 text-white shadow-lg font-extrabold float-anim';
  };

  const currentData = selectedPref ? data.filter(d => {
    const isRightPref = selectedPref.code === 'ALL' || d.prefectureCode === selectedPref.code;
    const isRightTab = d.type === activeTab;
    const isRightCategory = activeTab === 'tactics' || selectedFilters.length === 0 || selectedFilters.includes(d.category);
    return isRightPref && isRightTab && isRightCategory;
  }) : [];

  const handleDownloadCSV = () => {
    const exportData = selectedPref ? currentData : data;
    if (exportData.length === 0) return alert("ダウンロードするデータがありません。");

    const headers = ['日付', '都道府県', '種別', 'カテゴリ/対象機関', '内容', '投稿者', '日時', '場所', '主催団体', '連絡先', '住所', 'MAP URL', '添付/リンク'];
    
    const escapeCSV = (str) => {
      if (str == null) return '""';
      return `"${String(str).replace(/"/g, '""')}"`;
    };

    const csvRows = exportData.map(item => {
      const prefInfo = prefectures.find(p => p.code === item.prefectureCode);
      const catInfo = actionCategories.find(c => c.id === item.category);
      const toneInfo = tones.find(t => t.id === item.tone);
      const dateStr = item.createdAt ? (item.createdAt.toMillis ? new Date(item.createdAt.toMillis()).toLocaleDateString('ja-JP') : '') : '';
      const prefName = prefInfo?.name || '';
      const typeStr = item.type === 'action' ? 'アクション' : item.type === 'groups' ? '協力団体' : '議会のトーン';
      const catStr = item.type === 'tactics' ? `${item.targetOrg}(${toneInfo?.label})` : (catInfo?.label || '');

      return [
        escapeCSV(dateStr), escapeCSV(prefName), escapeCSV(typeStr), escapeCSV(catStr),
        escapeCSV(item.content), escapeCSV(item.author), escapeCSV(item.eventDate),
        escapeCSV(item.location), escapeCSV(item.organizer), escapeCSV(item.groupContact),
        escapeCSV(item.groupAddress), escapeCSV(item.groupMapUrl), escapeCSV(item.sharedLink)
      ].join(',');
    });

    const csvContent = '\uFEFF' + headers.join(',') + '\n' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `action_map_data_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const whatsNewData = [...data].sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return timeB - timeA;
  }).slice(0, 5);

  const handleGenerateAI = async () => {
    if (data.length === 0) return;
    setIsGeneratingAI(true);
    try {
      // プレビュー環境では空文字、本番環境ではご指定のGemini APIキーを使用
      const apiKey = isPreview ? "" : "AIzaSyDCbtCoykvVaZ_nAAnrUh-Vkge8tjYtFRA"; 
      const recentDataForAI = data.slice(0, 20).map(p => ({
        prefecture: prefectures.find(pref => pref.code === p.prefectureCode)?.name || '不明',
        category: p.type === 'tactics' ? p.targetOrg : (actionCategories.find(c => c.id === p.category)?.label || ''),
        content: p.content
      }));
      const prompt = `以下の全国の運動ノウハウの投稿データから、現在のトレンドや注目すべきアクションを抽出して、ユーザーに向けて要約してください。3〜4行程度で、優しくもまじめで、運動に取り組む人たちに寄り添い、励ますようなトーンでお願いします。\n\n${JSON.stringify(recentDataForAI)}`;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], systemInstruction: { parts: [{ text: "あなたは真摯で優しい運動のサポートパートナーです。丁寧で寄り添うような言葉遣いで応答します。" }] } })
      });
      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      setAiSummary(text || '要約を生成できませんでした。');
    } catch (error) {
      setAiSummary('AIの処理に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const currentTheme = themes[activeTab];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen font-maru overflow-x-hidden lg:overflow-hidden" style={{ backgroundColor: '#fff5f7', fontFamily: "'Zen Maru Gothic', 'Hiragino Maru Gothic ProN', sans-serif" }}>
      
      {/* --- 詳細拡大表示用モーダル --- */}
      {selectedPost && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-800/60 backdrop-blur-sm p-4 animate-fade-in-up" 
          onClick={() => setSelectedPost(null)}
        >
          <div 
            className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] flex flex-col mofumofu-shadow overflow-hidden relative border-4 border-pink-100" 
            onClick={e => e.stopPropagation()}
          >
            {/* モーダルヘッダー */}
            <div className={`px-6 py-4 flex justify-between items-start ${themes[selectedPost.type]?.bgSoft || 'bg-pink-50'}`}>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-black text-pink-600 bg-white px-2 py-1 rounded-md shadow-sm border border-pink-100">
                    {prefectures.find(p => p.code === selectedPost.prefectureCode)?.name || '不明'}
                  </span>
                  
                  {selectedPost.type === 'tactics' ? (
                    <>
                      <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded-full shadow-sm">
                        🏢 {selectedPost.targetOrg}
                      </span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full border shadow-sm ${tones.find(t => t.id === selectedPost.tone)?.color || 'bg-slate-100'}`}>
                        {tones.find(t => t.id === selectedPost.tone)?.label || '未分類'}
                      </span>
                    </>
                  ) : (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full border shadow-sm ${actionCategories.find(c => c.id === selectedPost.category)?.color || 'bg-slate-100'}`}>
                      {actionCategories.find(c => c.id === selectedPost.category)?.label || '未分類'}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 font-medium flex items-center gap-3">
                  <span>投稿日: {selectedPost.createdAt?.toMillis ? new Date(selectedPost.createdAt.toMillis()).toLocaleString('ja-JP') : ''}</span>
                  <div className="flex items-center gap-1 font-bold text-slate-600">
                    <Users className="w-3 h-3" /> {selectedPost.author}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedPost(null)} className="p-2 bg-white text-slate-400 rounded-full hover:bg-slate-100 transition-colors shadow-sm border border-slate-200 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* モーダルコンテンツ */}
            <div className="p-6 pb-20 overflow-y-auto custom-scrollbar flex-1 text-slate-700 flex flex-col gap-6">
              
              {/* 詳細情報 */}
              {(selectedPost.eventDate || selectedPost.location || selectedPost.organizer || selectedPost.groupContact || selectedPost.groupAddress || selectedPost.groupMapUrl || selectedPost.groupPhotoName) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm shrink-0">
                  {selectedPost.eventDate && <div className="flex items-start gap-2"><Calendar className="w-4 h-4 text-pink-400 mt-0.5 shrink-0"/> <div><div className="text-[10px] text-slate-400">日時</div>{selectedPost.eventDate}</div></div>}
                  {selectedPost.location && <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-pink-400 mt-0.5 shrink-0"/> <div><div className="text-[10px] text-slate-400">場所</div>{selectedPost.location}</div></div>}
                  {selectedPost.groupAddress && <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-pink-400 mt-0.5 shrink-0"/> <div><div className="text-[10px] text-slate-400">住所</div>{selectedPost.groupAddress}</div></div>}
                  {selectedPost.organizer && <div className="flex items-start gap-2 font-bold text-pink-600 sm:col-span-2"><Building className="w-4 h-4 text-pink-400 mt-0.5 shrink-0"/> <div><div className="text-[10px] text-pink-300 font-normal">主催団体・名称</div>{selectedPost.organizer}</div></div>}
                  {selectedPost.groupContact && <div className="flex items-start gap-2"><Phone className="w-4 h-4 text-pink-400 mt-0.5 shrink-0"/> <div><div className="text-[10px] text-slate-400">連絡先</div>{selectedPost.groupContact}</div></div>}
                  {selectedPost.groupMapUrl && <div className="flex items-start gap-2 sm:col-span-2"><MapIcon className="w-4 h-4 text-blue-500 mt-0.5 shrink-0"/> <div><div className="text-[10px] text-slate-400">MAPリンク</div><a href={selectedPost.groupMapUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">{selectedPost.groupMapUrl}</a></div></div>}
                  {selectedPost.groupPhotoName && <div className="flex items-start gap-2"><ImageIcon className="w-4 h-4 text-pink-400 mt-0.5 shrink-0"/> <div><div className="text-[10px] text-slate-400">写真</div>添付: {selectedPost.groupPhotoName}</div></div>}
                </div>
              )}

              {/* 本文 */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-inner shrink-0">
                <div className="text-[10px] font-bold text-slate-400 mb-2 border-b border-slate-100 pb-1">詳細内容</div>
                <p className="whitespace-pre-wrap leading-relaxed text-[15px]">
                  <Linkify text={selectedPost.content} />
                </p>
                {selectedPost.sharedLink && (
                  <div className="mt-4 flex justify-start">
                    <button onClick={(e) => handleLinkClick(e, selectedPost.sharedLink)} className="flex items-center gap-2 font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 px-4 py-2 rounded-full hover:shadow-lg hover:-translate-y-1 transition-all text-sm">
                      <Link2 className="w-4 h-4" /> 共有資料を開く / リンクへ
                    </button>
                  </div>
                )}
              </div>

              {/* アクションタブの場合: いいねボタンを大きく表示 */}
              {selectedPost.type === 'action' && (
                <div className="flex justify-center shrink-0">
                  <button 
                    onClick={(e) => handleToggleLike(e, selectedPost)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-lg transition-all border-2
                      ${selectedPost.likes?.includes(user?.uid) 
                        ? 'bg-pink-50 border-pink-400 text-pink-500 shadow-md scale-105' 
                        : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:border-pink-200 hover:text-pink-400'}
                    `}
                  >
                    <Heart className={`w-6 h-6 ${selectedPost.likes?.includes(user?.uid) ? 'fill-current' : ''}`} />
                    いいね！ {selectedPost.likes?.length || 0}
                  </button>
                </div>
              )}

              {/* 議会のトーンの場合: コメントスレッドを表示 */}
              {selectedPost.type === 'tactics' && (
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="font-bold text-slate-600 mb-4 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-amber-500" /> コメントスレッド ({selectedPost.comments?.length || 0})
                  </h3>
                  
                  <div className="space-y-3 mb-4">
                    {selectedPost.comments && selectedPost.comments.length > 0 ? (
                      selectedPost.comments.map(comment => (
                        <div key={comment.id} className="bg-amber-50/50 border border-amber-100 p-3 rounded-2xl">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-slate-700">{comment.author}</span>
                            <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleString('ja-JP', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-sm text-slate-600 whitespace-pre-wrap">{comment.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-2">まだコメントはありません。アドバイスや質問を書いてみましょう！</p>
                    )}
                  </div>

                  <form onSubmit={handleAddComment} className="flex gap-2 mt-4 pb-8">
                    <input
                      type="text"
                      placeholder="コメントを入力... (Ctrl+Enterで送信)"
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                          e.preventDefault();
                          if (commentText.trim()) handleAddComment(e);
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-amber-300"
                    />
                    <button 
                      type="submit" 
                      disabled={!commentText.trim()}
                      className="bg-amber-400 hover:bg-amber-500 text-white p-2 rounded-full disabled:opacity-50 transition-colors"
                    >
                      <Send className="w-4 h-4 transform translate-x-0.5 -translate-y-0.5" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- ツールチップ --- */}
      {tooltip.show && (
        <div
          className="fixed z-50 px-5 py-3 bg-white/95 backdrop-blur-sm text-slate-700 text-sm rounded-full shadow-[0_10px_25px_rgba(255,182,193,0.5)] pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-20px] transition-all duration-75 border-2 border-pink-100"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="font-extrabold text-base flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-400" />
            {tooltip.text}
            <span className="ml-2 px-2 py-0.5 bg-pink-100 text-pink-600 rounded-full text-xs">
              {/* ツールチップの件数もフィルタを考慮（議会トーンは除外） */}
              {data.filter(d => d.prefectureCode === tooltip.prefCode && d.type !== 'tactics' && (mapFilter === 'all' || d.category === mapFilter)).length} 件
            </span>
          </div>
          <div className="absolute w-4 h-4 bg-white border-b-2 border-r-2 border-pink-100 transform rotate-45 left-1/2 -translate-x-1/2 -bottom-2.5"></div>
        </div>
      )}

      {/* --- 左側/上部: マップエリア --- */}
      <div className="w-full lg:w-[55%] h-[45vh] lg:h-full p-2 sm:p-4 lg:p-8 flex flex-col relative z-0 shrink-0 border-b border-pink-100 lg:border-none">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-purple-50 opacity-80 z-[-2]"></div>
        
        {/* ヘッダー情報とボタン類 */}
        <div className="mb-3 lg:mb-4 flex flex-col lg:flex-row items-center justify-between z-10 gap-3">
          <div className="text-center lg:text-left flex-1 cursor-pointer group" onClick={() => setSelectedPref(null)}>
            <h1 className="text-2xl lg:text-4xl font-black text-pink-500 tracking-tight flex items-center justify-center lg:justify-start gap-2 lg:gap-3 drop-shadow-sm group-hover:scale-105 transition-transform origin-left">
              <Cloud className="w-8 h-8 lg:w-10 lg:h-10 text-pink-400 fill-pink-100" />
              アクションマップ
            </h1>
            <p className="mt-1 text-pink-400/80 font-bold text-xs lg:text-base hidden sm:block">
              〜 運動のノウハウをみんなで共有しよう 〜
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-2">
            <button
              onClick={handleDownloadCSV}
              className={`flex items-center gap-1.5 px-3 py-2 bg-white border-2 border-slate-200 rounded-full text-slate-500 font-bold hover:bg-slate-50 shadow-sm transition-all text-xs lg:text-sm mofumofu-shadow`}
            >
              <Download className="w-4 h-4" /> CSV
            </button>
            <button
              onClick={() => setSelectedPref({ code: 'ALL', name: '全国一覧 (すべての投稿)' })}
              className={`flex items-center gap-1.5 px-4 py-2 lg:px-5 lg:py-2.5 bg-white border-2 border-pink-200 rounded-full text-pink-500 font-bold hover:bg-pink-50 shadow-sm transition-all text-xs lg:text-sm mofumofu-shadow ${selectedPref?.code === 'ALL' ? 'ring-4 ring-pink-300 bg-pink-50' : ''}`}
            >
              <Globe className="w-4 h-4 lg:w-5 lg:h-5" /> 全国一覧
            </button>
          </div>
        </div>

        {/* マップ用のカテゴリフィルター */}
        <div className="flex flex-wrap gap-1.5 justify-center lg:justify-start mb-3 lg:mb-4 z-10 relative">
          <div className="flex items-center text-[10px] lg:text-xs font-bold text-slate-400 mr-1">
            <Filter className="w-3 h-3 mr-1" /> マップ表示:
          </div>
          <button
            onClick={() => setMapFilter('all')}
            className={`px-3 py-1.5 rounded-full text-[10px] lg:text-xs font-bold transition-all border-2
              ${mapFilter === 'all' ? 'bg-pink-100 text-pink-600 border-pink-300 shadow-sm' : 'bg-white/80 text-slate-500 border-transparent hover:bg-white'}
            `}
          >
            すべて
          </button>
          {actionCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setMapFilter(cat.id)}
              className={`px-3 py-1.5 rounded-full text-[10px] lg:text-xs font-bold transition-all border-2
                ${mapFilter === cat.id ? `${cat.color} shadow-sm scale-105` : 'bg-white/80 text-slate-500 border-transparent hover:bg-white'}
              `}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ズーム機能付きグリッドマップ */}
        <div className="flex-1 w-full flex flex-col relative min-h-0 bg-white/30 rounded-[2rem] lg:rounded-[3rem] overflow-hidden border border-white">
          <div className="flex-1 w-full overflow-auto custom-scrollbar p-2 lg:p-4 touch-pan-x touch-pan-y relative flex">
            
            <div className="w-full h-full flex flex-col">
              <div 
                className="relative transition-all duration-300 mx-auto my-auto"
                style={{ 
                  width: `${100 * zoomLevel}%`, 
                  minWidth: `${350 * zoomLevel}px`,
                  maxWidth: `${600 * zoomLevel}px`, 
                  aspectRatio: '15/13'
                }}
              >
                {/* 日本地図のシルエットSVG背景 */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.05] z-[-1] flex items-center justify-center overflow-hidden">
                  <svg viewBox="0 0 800 800" className="w-[120%] h-[120%] text-pink-600 fill-current max-w-none">
                    <path d="M600,100 Q650,80 700,120 Q750,150 720,200 Q680,220 620,180 Q580,140 600,100 Z" />
                    <path d="M620,200 Q650,250 600,300 Q550,350 500,400 Q450,450 400,450 Q350,450 300,500 Q250,550 200,550 Q180,500 250,450 Q300,400 350,350 Q400,300 450,250 Q500,200 620,200 Z" />
                    <path d="M300,550 Q350,520 380,550 Q400,580 350,600 Q300,600 300,550 Z" />
                    <path d="M200,550 Q250,550 250,600 Q250,650 200,700 Q150,650 180,580 Z" />
                    <path d="M100,700 Q120,720 100,750 Q80,720 100,700 Z" />
                  </svg>
                </div>

                {/* 実際のグリッド要素 */}
                <div 
                  className="w-full h-full grid bg-white/40 backdrop-blur-sm rounded-[1.5rem] lg:rounded-[3rem] border-2 lg:border-4 border-white mofumofu-shadow p-2 lg:p-6"
                  style={{
                    gridTemplateColumns: 'repeat(15, minmax(0, 1fr))',
                    gridTemplateRows: 'repeat(13, minmax(0, 1fr))',
                    gap: `${0.2 * zoomLevel}rem`
                  }}
                >
                  {prefectures.map(pref => (
                    <div
                      key={pref.code}
                      onMouseMove={(e) => handleMouseMove(e, pref)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => setSelectedPref(pref)}
                      className={`
                        flex items-center justify-center font-bold rounded-full cursor-pointer transition-all duration-300 border lg:border-[3px] select-none
                        ${pref.isNational ? 'border-dashed border-pink-300' : ''}
                        ${selectedPref?.code === pref.code 
                          ? 'ring-4 ring-pink-300 ring-offset-2 scale-110 z-20 bg-white border-pink-400 text-pink-600 shadow-xl' 
                          : `hover:scale-110 hover:z-10 ${getPrefectureColor(pref.code)}`
                        }
                      `}
                      style={{ 
                        gridColumn: pref.x, 
                        gridRow: pref.y,
                        fontSize: `${Math.max(0.6, 0.7 * zoomLevel)}rem`
                      }}
                    >
                      {pref.shortName || pref.name.slice(0, 2)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ズームコントロールボタン */}
          <div className="absolute bottom-4 right-4 z-30 flex flex-col gap-2 bg-white/80 backdrop-blur-sm p-1.5 rounded-full mofumofu-shadow border border-pink-100">
            <button onClick={handleZoomIn} className="w-8 h-8 flex items-center justify-center bg-pink-100 text-pink-600 rounded-full font-bold hover:bg-pink-200 transition-colors">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={handleZoomOut} className="w-8 h-8 flex items-center justify-center bg-pink-100 text-pink-600 rounded-full font-bold hover:bg-pink-200 transition-colors">
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* --- 右側/下部: 詳細パネルエリア --- */}
      <div className={`w-full lg:w-[45%] flex-1 lg:h-full bg-white flex flex-col z-20 relative mofumofu-shadow rounded-t-[2rem] lg:rounded-t-none lg:rounded-l-[3rem] border-t-4 lg:border-t-0 lg:border-l-8 border-white transition-colors duration-500 lg:overflow-hidden`}>
        {selectedPref ? (
          <>
            {/* パネルヘッダー */}
            <div className={`px-4 py-3 lg:px-6 lg:py-4 ${currentTheme.header} text-slate-700 shrink-0 border-b flex items-center justify-between transition-colors duration-300`}>
              <div className="flex items-center">
                {/* 戻るボタン */}
                <button 
                  onClick={() => setSelectedPref(null)} 
                  className={`mr-3 p-1.5 lg:p-2 rounded-full transition-all text-slate-400 hover:${currentTheme.text} hover:bg-white bg-white/50 border border-transparent hover:border-slate-200`}
                  title="TOPに戻る"
                >
                  <ArrowLeft className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
                <h2 className={`text-xl lg:text-3xl font-extrabold flex items-center gap-2 ${currentTheme.text}`}>
                  {selectedPref.code === 'ALL' ? <Globe className="w-5 h-5 lg:w-8 lg:h-8" /> : <Map className="w-5 h-5 lg:w-8 lg:h-8" />}
                  {selectedPref.name}
                </h2>
              </div>
              <div className={`flex bg-white rounded-full p-1 shadow-inner border ${currentTheme.border}`}>
                <button onClick={() => setViewMode('list')} className={`p-1.5 lg:p-2 rounded-full transition-all ${viewMode === 'list' ? `${currentTheme.badge} shadow` : `text-slate-400 hover:${currentTheme.text}`}`}>
                  <List className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('table')} className={`p-1.5 lg:p-2 rounded-full transition-all ${viewMode === 'table' ? `${currentTheme.badge} shadow` : `text-slate-400 hover:${currentTheme.text}`}`}>
                  <Table2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* タブ切り替え */}
            <div className={`flex px-3 lg:px-4 pt-2 lg:pt-3 gap-1 lg:gap-2 ${currentTheme.bgSoft} shrink-0 overflow-x-auto custom-scrollbar transition-colors duration-300`}>
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const count = data.filter(d => (selectedPref.code === 'ALL' || d.prefectureCode === selectedPref.code) && d.type === tab.id).length;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setSelectedFilters([]); }}
                    className={`
                      flex items-center gap-1.5 lg:gap-2 px-3 lg:px-5 py-2 lg:py-3 text-[11px] lg:text-sm font-bold rounded-t-2xl lg:rounded-t-3xl transition-all whitespace-nowrap
                      ${isActive 
                        ? `bg-white ${themes[tab.id].text} border-t-4 border-x-4 border-white mofumofu-shadow z-10` 
                        : `text-slate-400 hover:bg-white/50 hover:${themes[tab.id].text} border-4 border-transparent`}
                    `}
                  >
                    <Icon className={`w-3 h-3 lg:w-4 lg:h-4 ${isActive ? themes[tab.id].accent : ''}`} />
                    {tab.label}
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] lg:text-[10px] ${isActive ? themes[tab.id].badge : 'bg-slate-200 text-slate-500'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* カテゴリフィルター (アクションタブのみ表示) */}
            {activeTab !== 'tactics' && (
              <div className={`bg-white px-4 lg:px-6 py-2 border-b ${currentTheme.border} flex flex-wrap gap-1.5 lg:gap-2 shrink-0 transition-colors duration-300`}>
                {actionCategories.map(cat => {
                  const isSelected = selectedFilters.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleFilter(cat.id)}
                      className={`
                        px-2.5 py-1 rounded-full text-[10px] lg:text-xs font-bold flex items-center gap-1 transition-all border-2
                        ${isSelected ? `${cat.color} shadow-sm scale-105` : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}
                      `}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5" />}
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 投稿フォーム (一覧の上に配置・格納可能) */}
            {selectedPref.code !== 'ALL' && !(activeTab === 'tactics' && !isGroupMember) && (
              <div className={`bg-white shrink-0 border-b border-slate-100 relative z-10 shadow-sm transition-colors duration-300`}>
                <button 
                  onClick={() => setIsFormOpen(!isFormOpen)}
                  className={`w-full px-4 py-3 flex items-center justify-between text-sm font-bold ${currentTheme.text} hover:${currentTheme.bgSoft} transition-colors`}
                >
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    {activeTab === 'tactics' ? 'この地域の議会トーンを投稿する' : activeTab === 'groups' ? 'この地域の協力団体・者を登録する' : 'この地域のアクションを投稿する'}
                  </span>
                  {isFormOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>

                {isFormOpen && (
                  <div className="p-3 lg:p-5 pt-0 animate-fade-in-up">
                    <div className="text-[10px] lg:text-xs text-slate-400 mb-2 font-bold flex flex-wrap items-center gap-1">
                      <Cloud className="w-3 h-3" /> ※書き込み・いいねにはGoogleアカウントでのログインが必要です。
                      {user && user.displayName && <span className="ml-1 text-pink-400">({user.displayName}さんとしてログイン中)</span>}
                    </div>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                      {errorMsg && (
                        <div className="p-2 bg-rose-50 text-rose-500 rounded-xl text-[10px] lg:text-xs font-bold text-center border border-rose-100">
                          {errorMsg}
                        </div>
                      )}
                      
                      {activeTab === 'tactics' ? (
                        // 議会のトーン用 フォーム
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            placeholder="おなまえ (Google名から自動入力・編集可)"
                            value={author}
                            onChange={e => setAuthor(e.target.value)}
                            className={`w-full sm:w-1/4 px-4 py-2 lg:py-2.5 ${currentTheme.bgSoft} border-2 ${currentTheme.border} rounded-full focus:outline-none focus:${currentTheme.borderActive} focus:bg-white transition-all text-xs lg:text-sm font-bold text-slate-700 placeholder:opacity-50`}
                            required
                          />
                          <input 
                            type="text" 
                            placeholder="🏢 対象機関 (議会、教育委員会、団体など)" 
                            value={targetOrg} 
                            onChange={e => setTargetOrg(e.target.value)} 
                            className={`w-full sm:w-1/2 px-4 py-2 lg:py-2.5 ${currentTheme.bgSoft} border-2 ${currentTheme.border} rounded-full focus:outline-none focus:${currentTheme.borderActive} focus:bg-white transition-all text-xs lg:text-sm font-bold text-slate-700 placeholder:opacity-50`}
                            required
                          />
                          <select
                            value={tone}
                            onChange={e => setTone(e.target.value)}
                            className={`w-full sm:w-1/4 px-4 py-2 lg:py-2.5 ${currentTheme.bgSoft} border-2 ${currentTheme.border} rounded-full focus:outline-none focus:${currentTheme.borderActive} focus:bg-white transition-all text-xs lg:text-sm font-bold text-slate-600 appearance-none cursor-pointer`}
                          >
                            {tones.map(t => (
                              <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        // その他のフォーム
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            placeholder="おなまえ (Google名から自動入力・編集可)"
                            value={author}
                            onChange={e => setAuthor(e.target.value)}
                            className={`w-full sm:w-1/3 px-4 py-2 lg:py-2.5 ${currentTheme.bgSoft} border-2 ${currentTheme.border} rounded-full focus:outline-none focus:${currentTheme.borderActive} focus:bg-white transition-all text-xs lg:text-sm font-bold text-slate-700 placeholder:opacity-50`}
                            required
                          />
                          <select
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                            className={`w-full sm:w-2/3 px-4 py-2 lg:py-2.5 ${currentTheme.bgSoft} border-2 ${currentTheme.border} rounded-full focus:outline-none focus:${currentTheme.borderActive} focus:bg-white transition-all text-xs lg:text-sm font-bold text-slate-600 appearance-none cursor-pointer`}
                          >
                            {actionCategories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.label}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {activeTab === 'groups' && (
                        <div className="space-y-2">
                          <input 
                            type="text" 
                            placeholder="🏢 協力団体・個人の名前 (必須)" 
                            value={organizer} 
                            onChange={e => setOrganizer(e.target.value)} 
                            className={`w-full px-4 py-2 lg:py-2.5 ${currentTheme.bgSoft} border-2 ${currentTheme.border} rounded-full focus:outline-none focus:${currentTheme.borderActive} focus:bg-white transition-all text-xs lg:text-sm font-bold text-slate-700 placeholder:opacity-50`}
                            required
                          />
                          <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-2">
                            <button type="button" onClick={() => setShowAdvancedForm(!showAdvancedForm)} className={`w-full flex items-center justify-between text-[10px] lg:text-xs font-bold text-slate-500 hover:${currentTheme.text} transition-colors px-2`}>
                              <span>➕ 連絡先・住所・MAPなどを追加する（任意）</span>
                              {showAdvancedForm ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            {showAdvancedForm && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
                                <input type="text" placeholder="📞 連絡先 (電話やメール)" value={groupContact} onChange={e => setGroupContact(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs" />
                                {/* 住所入力からフォーカスが外れたら MAP URL を自動生成 */}
                                <input 
                                  type="text" 
                                  placeholder="📍 住所" 
                                  value={groupAddress} 
                                  onChange={e => setGroupAddress(e.target.value)} 
                                  onBlur={handleAddressBlur}
                                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs" 
                                />
                                <input type="url" placeholder="🗺️ MAPのURL (Google Maps等)" value={groupMapUrl} onChange={e => setGroupMapUrl(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs sm:col-span-2" />
                                <div className="flex items-center gap-2 px-1 sm:col-span-2">
                                  <label className={`flex items-center gap-1.5 text-[10px] lg:text-xs font-bold text-slate-500 hover:${currentTheme.text} cursor-pointer transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 w-full justify-center`}>
                                    <ImageIcon className="w-3 h-3" />
                                    {groupPhotoName ? groupPhotoName : '📷 写真を添付する (デモ)'}
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => setGroupPhotoName(e.target.files[0]?.name || '')} />
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {activeTab === 'action' && (
                        <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-2">
                          <button 
                            type="button" 
                            onClick={() => setShowAdvancedForm(!showAdvancedForm)}
                            className={`w-full flex items-center justify-between text-[10px] lg:text-xs font-bold text-slate-500 hover:${currentTheme.text} transition-colors px-2`}
                          >
                            <span>➕ 日時・場所・主催を追加する</span>
                            {showAdvancedForm ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                          
                          {showAdvancedForm && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
                              <input type="text" placeholder="📅 日時 (任意: 例 2026/4/1)" value={eventDate} onChange={e => setEventDate(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs" />
                              <input type="text" placeholder="📍 場所 (任意: 例 〇〇県庁前)" value={location} onChange={e => setLocation(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs" />
                              <input type="text" placeholder="👥 主催団体名 (任意)" value={organizer} onChange={e => setOrganizer(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs sm:col-span-2" />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 px-2">
                    <label className={`flex items-center gap-1.5 text-[10px] lg:text-xs font-bold text-slate-500 hover:${currentTheme.text} cursor-pointer transition-colors bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200`}>
                      <Link2 className="w-3 h-3" />
                          {attachedFile ? attachedFile.name : '資料を添付'}
                          <input 
                            type="file" 
                            className="hidden" 
                            onChange={(e) => {setAttachedFile(e.target.files[0]); setSharedLink('');}}
                            accept=".pdf,.doc,.docx,.jpg,.png"
                          />
                        </label>
                        <span className="text-[10px] text-slate-400">または</span>
                        <input 
                          type="text" 
                          placeholder="共有リンクURL" 
                          value={sharedLink}
                          onChange={e => {setSharedLink(e.target.value); setAttachedFile(null);}}
                          className="flex-1 min-w-[120px] px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] lg:text-xs focus:outline-none focus:border-pink-300"
                    />
                  </div>
                  
                  <div className="relative mt-1">
                    <textarea
                      placeholder={
                        activeTab === 'groups' ? `【${selectedPref.name}】の団体の活動内容やアピールポイントを入力してね... (Ctrl+Enterで送信)` :
                        activeTab === 'tactics' ? `【${selectedPref.name}】の議会や団体に対する対策・アドバイスを入力してね... (Ctrl+Enterで送信)` :
                        `【${selectedPref.name}】の具体的なアクション内容を入力してね... (Ctrl+Enterで送信)`
                      }
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      onKeyDown={e => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                          e.preventDefault();
                          const isDisabled = isSubmitting || !content.trim() || !author.trim() || (activeTab === 'groups' && !organizer.trim()) || (activeTab === 'tactics' && !targetOrg.trim());
                          if (!isDisabled) {
                            handleSubmit(e);
                          }
                        }
                      }}
                      className={`w-full h-16 lg:h-20 px-4 py-3 ${currentTheme.bgSoft} border-2 ${currentTheme.border} rounded-[1.5rem] focus:outline-none focus:${currentTheme.borderActive} focus:bg-white transition-all resize-none text-xs lg:text-sm font-medium pr-14 custom-scrollbar text-slate-700 placeholder:opacity-50`}
                      required
                    />
                    <button
                      type="submit"
                          disabled={isSubmitting || !content.trim() || !author.trim() || (activeTab === 'groups' && !organizer.trim()) || (activeTab === 'tactics' && !targetOrg.trim())}
                          className={`
                            absolute bottom-2 right-2 p-2.5 rounded-full shadow-md transition-all flex items-center justify-center
                            ${(isSubmitting || !content.trim() || !author.trim() || (activeTab === 'groups' && !organizer.trim()) || (activeTab === 'tactics' && !targetOrg.trim())) 
                              ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                              : `${currentTheme.btn} text-white hover:shadow-lg hover:-translate-y-1 active:translate-y-0`
                            }
                          `}
                        >
                          <Send className={`w-4 h-4 lg:w-5 lg:h-5 ${isSubmitting ? 'animate-bounce' : 'transform translate-x-0.5 -translate-y-0.5'}`} />
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* 一覧表示領域 */}
            <div className={`flex-1 lg:overflow-y-auto p-3 lg:p-6 ${currentTheme.bgSoft} custom-scrollbar relative transition-colors duration-300`}>
              {activeTab === 'tactics' && !isGroupMember ? (
                // 議会のトーン（未認証時・ロック画面）
                <div className="h-full flex flex-col items-center justify-center text-center py-6 px-4">
                  <MessageSquare className={`w-16 h-16 lg:w-20 lg:h-20 ${currentTheme.accent} mb-4 opacity-50`} />
                  <h3 className={`text-sm lg:text-lg font-bold ${currentTheme.textDark} mb-2`}>この情報は限定公開です🔒</h3>
                  <p className="text-xs lg:text-sm text-slate-500 max-w-[300px] mb-4">
                    「議会のトーンと戦い方」は、対象の<span className="font-bold border-b border-slate-400">Googleグループに所属しているメンバーのみ</span>が閲覧・投稿できます。
                  </p>
                  <button 
                    onClick={() => setIsGroupMember(true)}
                    className={`px-4 py-2 ${currentTheme.badge} border ${currentTheme.border} text-xs font-bold rounded-full hover:scale-105 transition-all`}
                  >
                    （デモ用）グループメンバーとしてロック解除
                  </button>
                </div>
              ) : currentData.length > 0 ? (
                viewMode === 'list' ? (
                  <div className="space-y-3 lg:space-y-4">
                    {currentData.map((item, index) => {
                      const catInfo = actionCategories.find(c => c.id === item.category);
                      const toneInfo = tones.find(t => t.id === item.tone);
                      const prefInfo = prefectures.find(p => p.code === item.prefectureCode);
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedPost(item)}
                          className={`bg-white p-4 lg:p-5 rounded-2xl lg:rounded-[2rem] border-2 ${currentTheme.border} mofumofu-shadow hover:-translate-y-1 hover:shadow-lg cursor-pointer transition-all animate-fade-in-up group relative flex flex-col`} 
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300">
                            <Maximize2 className="w-4 h-4" />
                          </div>
                          
                          <div className="flex justify-between items-start mb-2 pr-6">
                            <div className="flex items-center flex-wrap gap-2">
                              {selectedPref.code === 'ALL' && (
                                <span className={`text-[10px] font-black ${currentTheme.text} ${currentTheme.badge} px-2 py-0.5 rounded-md`}>
                                  {prefInfo?.shortName || '不明'}
                                </span>
                              )}
                              
                              {/* 議会のトーンの場合は、機関名とトーンを表示 */}
                              {item.type === 'tactics' ? (
                                <>
                                  <span className={`text-[10px] lg:text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 lg:px-3 lg:py-1 rounded-full`}>
                                    🏢 {item.targetOrg}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 lg:px-3 lg:py-1 rounded-full border ${toneInfo?.color || 'bg-slate-100 text-slate-600'}`}>
                                    {toneInfo?.label || '未分類'}
                                  </span>
                                </>
                              ) : (
                                <span className={`text-[10px] font-bold px-2 py-0.5 lg:px-3 lg:py-1 rounded-full border ${catInfo?.color || 'bg-slate-100 text-slate-600'}`}>
                                  {catInfo?.label || '未分類'}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] lg:text-xs text-slate-400 font-medium">
                              {item.createdAt?.toMillis ? new Date(item.createdAt.toMillis()).toLocaleDateString('ja-JP') : ''}
                            </span>
                          </div>

                          {/* アクション/団体詳細情報 */}
                          {(item.eventDate || item.location || item.organizer || item.groupContact || item.groupAddress || item.groupMapUrl || item.groupPhotoName) && (
                            <div className="flex flex-wrap gap-2 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] lg:text-xs text-slate-600">
                              {item.eventDate && <div className="flex items-center gap-1"><Calendar className={`w-3 h-3 ${currentTheme.accent}`}/> {item.eventDate}</div>}
                              {item.location && <div className="flex items-center gap-1"><MapPin className={`w-3 h-3 ${currentTheme.accent}`}/> {item.location}</div>}
                              {item.groupAddress && <div className="flex items-center gap-1"><MapPin className={`w-3 h-3 ${currentTheme.accent}`}/> {item.groupAddress}</div>}
                              {item.organizer && <div className={`flex items-center gap-1 font-bold ${currentTheme.text}`}><Building className={`w-3 h-3 ${currentTheme.accent}`}/> {item.organizer}</div>}
                              {item.groupContact && <div className="flex items-center gap-1"><Phone className={`w-3 h-3 ${currentTheme.accent}`}/> {item.groupContact}</div>}
                              {item.groupMapUrl && <a href={item.groupMapUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className={`flex items-center gap-1 text-blue-500 hover:underline`}><MapIcon className="w-3 h-3"/> MAPを見る</a>}
                              {item.groupPhotoName && <div className="flex items-center gap-1"><ImageIcon className={`w-3 h-3 ${currentTheme.accent}`}/> 添付写真: {item.groupPhotoName}</div>}
                            </div>
                          )}

                          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-xs lg:text-sm line-clamp-3 mb-3">
                            <Linkify text={item.content} />
                          </p>

                          <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-50 pt-3">
                            <div className="flex items-center gap-1.5 lg:gap-2 text-[10px] lg:text-xs">
                              <div className={`w-5 h-5 lg:w-6 lg:h-6 rounded-full ${currentTheme.badge} flex items-center justify-center`}>
                                <Users className="w-3 h-3" />
                              </div>
                              <span className="font-bold text-slate-600">{item.author}</span>
                            </div>
                            
                            {/* リアクション等の表示 */}
                            <div className="flex items-center gap-2">
                              {item.sharedLink && (
                                <button onClick={(e) => handleLinkClick(e, item.sharedLink)} className={`flex items-center gap-1 text-[10px] lg:text-xs font-bold ${currentTheme.textDark} ${currentTheme.badge} border ${currentTheme.border} px-3 py-1 rounded-full hover:scale-105 transition-all`}>
                                  <Link2 className="w-3 h-3" /> リンク/資料
                                </button>
                              )}
                              
                              {item.type === 'action' && (
                                <button 
                                  onClick={(e) => handleToggleLike(e, item)}
                                  className={`flex items-center gap-1 text-[10px] lg:text-xs font-bold px-3 py-1 rounded-full transition-all border
                                    ${item.likes?.includes(user?.uid) ? 'bg-pink-50 border-pink-300 text-pink-500' : 'bg-white border-slate-200 text-slate-400 hover:bg-pink-50'}
                                  `}
                                >
                                  <Heart className={`w-3 h-3 lg:w-4 lg:h-4 ${item.likes?.includes(user?.uid) ? 'fill-current' : ''}`} />
                                  {item.likes?.length || 0}
                                </button>
                              )}

                              {item.type === 'tactics' && (
                                <div className="flex items-center gap-1 text-[10px] lg:text-xs font-bold px-3 py-1 bg-amber-50 border border-amber-100 text-amber-600 rounded-full">
                                  <MessageCircle className="w-3 h-3 lg:w-4 lg:h-4" />
                                  {item.comments?.length || 0}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`bg-white rounded-2xl lg:rounded-[2rem] border-2 ${currentTheme.border} overflow-hidden mofumofu-shadow animate-fade-in-up`}>
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-xs lg:text-sm text-left whitespace-nowrap lg:whitespace-normal">
                        <thead className={`text-[10px] lg:text-xs ${currentTheme.text} uppercase ${currentTheme.header}`}>
                          <tr>
                            <th className="px-3 lg:px-6 py-3 rounded-tl-2xl">属性 / 日付</th>
                            <th className="px-3 lg:px-6 py-3 min-w-[200px]">詳細 / 内容</th>
                            <th className="px-3 lg:px-6 py-3 rounded-tr-2xl">投稿者 / 反応</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentData.map((item) => {
                            const catInfo = actionCategories.find(c => c.id === item.category);
                            const toneInfo = tones.find(t => t.id === item.tone);
                            const prefInfo = prefectures.find(p => p.code === item.prefectureCode);
                            return (
                              <tr 
                                key={item.id} 
                                onClick={() => setSelectedPost(item)}
                                className={`bg-white border-b border-slate-50 hover:${currentTheme.bgSoft} cursor-pointer transition-colors group`}
                              >
                                <td className="px-3 lg:px-6 py-3 align-top">
                                  <div className="text-slate-500 mb-1">
                                    {selectedPref.code === 'ALL' && <span className={`mr-1 font-black ${currentTheme.text}`}>{prefInfo?.shortName}</span>}
                                    {item.createdAt?.toMillis ? new Date(item.createdAt.toMillis()).toLocaleDateString('ja-JP') : ''}
                                  </div>
                                  
                                  {item.type === 'tactics' ? (
                                    <div className="flex flex-col gap-1 items-start">
                                      <span className={`text-[9px] lg:text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md`}>
                                        🏢 {item.targetOrg}
                                      </span>
                                      <span className={`text-[9px] lg:text-[10px] font-bold px-2 py-1 rounded-full border whitespace-nowrap ${toneInfo?.color || 'bg-slate-100'}`}>
                                        {toneInfo?.label || '未分類'}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className={`text-[9px] lg:text-[10px] font-bold px-2 py-1 rounded-full border whitespace-nowrap ${catInfo?.color || 'bg-slate-100'}`}>
                                      {catInfo?.label || '未分類'}
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 lg:px-6 py-3 align-top">
                                  {(item.eventDate || item.location || item.organizer || item.groupContact) && (
                                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 mb-1">
                                      {item.eventDate && <span>📅{item.eventDate}</span>}
                                      {item.location && <span>📍{item.location}</span>}
                                      {item.organizer && <span>👥{item.organizer}</span>}
                                      {item.groupContact && <span>📞{item.groupContact}</span>}
                                    </div>
                                  )}
                                  <div className="text-slate-700 font-medium line-clamp-2">
                                    <Linkify text={item.content} />
                                  </div>
                                  <div className="text-[10px] text-slate-300 mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Maximize2 className="w-3 h-3"/> クリックして詳細を表示
                                  </div>
                                </td>
                                <td className="px-3 lg:px-6 py-3 align-top font-bold text-slate-600">
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <div className="flex items-center gap-1">
                                      <Users className={`w-3 h-3 ${currentTheme.accent}`}/> {item.author}
                                    </div>
                                    
                                    {/* テーブル表示時のリアクションアイコン */}
                                    {item.type === 'action' && (
                                      <button onClick={(e) => handleToggleLike(e, item)} className={`flex items-center gap-0.5 text-[10px] ${item.likes?.includes(user?.uid) ? 'text-pink-500' : 'text-slate-300 hover:text-pink-300'}`}>
                                        <Heart className={`w-3 h-3 ${item.likes?.includes(user?.uid) ? 'fill-current' : ''}`}/> {item.likes?.length || 0}
                                      </button>
                                    )}
                                    {item.type === 'tactics' && (
                                      <div className="flex items-center gap-0.5 text-[10px] text-amber-500">
                                        <MessageCircle className="w-3 h-3"/> {item.comments?.length || 0}
                                      </div>
                                    )}
                                  </div>

                                  {item.sharedLink && (
                                    <button onClick={(e) => handleLinkClick(e, item.sharedLink)} className={`text-[10px] ${currentTheme.text} flex items-center gap-0.5 hover:underline mt-1`}>
                                      <Link2 className="w-3 h-3"/>リンク/資料あり
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-6 px-4">
                  <Cloud className={`w-16 h-16 lg:w-20 lg:h-20 ${currentTheme.text} opacity-20 mb-3 float-anim`} />
                  <h3 className={`text-sm lg:text-lg font-bold ${currentTheme.text} mb-2`}>まだ投稿がないみたいです</h3>
                  <p className="text-xs lg:text-sm text-slate-400 max-w-[250px]">
                    最初の情報を共有して、マップをもふもふに育てましょう！
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          // 未選択時のプレースホルダー兼 What's New & AI領域
          <div className="flex flex-col flex-1 lg:overflow-y-auto bg-white p-4 lg:p-8 custom-scrollbar relative">
            <div className="flex flex-col items-center justify-center py-4 lg:py-6 shrink-0">
              <div className="relative mb-3 float-anim">
                <Cloud className="w-16 h-16 lg:w-24 lg:h-24 text-pink-100 fill-pink-50 relative z-10 drop-shadow-md" />
                <Map className="w-6 h-6 lg:w-10 lg:h-10 text-pink-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20" />
              </div>
              <h2 className="text-xl lg:text-2xl font-extrabold text-pink-500 mb-1">地域を選んでね</h2>
              <p className="text-slate-400 font-medium text-[10px] lg:text-sm text-center">
                マップから都道府県をぽちっと押すと、<br/>みんなのノウハウが見られるよ！
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 w-full max-w-lg mx-auto pb-4">
              <div className="bg-purple-50/50 rounded-[1.5rem] lg:rounded-[2rem] p-4 lg:p-6 border-2 border-purple-100 mofumofu-shadow relative overflow-hidden">
                <div className="absolute top-[-10px] right-[-10px] opacity-10">
                  <Bot className="w-24 h-24 lg:w-32 lg:h-32 text-purple-500" />
                </div>
                <div className="relative z-10">
                  <h3 className="font-extrabold text-purple-600 mb-2 flex items-center gap-1.5 text-sm lg:text-lg">
                    <Sparkles className="w-4 h-4 lg:w-5 lg:h-5" /> AIからのトレンド要約
                  </h3>
                  
                  {aiSummary ? (
                    <div className="bg-white p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-purple-100 text-slate-700 text-xs lg:text-sm leading-relaxed mb-3 whitespace-pre-wrap animate-fade-in-up">
                      {aiSummary}
                    </div>
                  ) : (
                    <p className="text-[10px] lg:text-sm text-slate-500 mb-3">
                      全国の皆さんの投稿から、いま注目のアクションやノウハウをAIが要約してお届けします。
                    </p>
                  )}

                  <button
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI || data.length === 0}
                    className={`w-full py-2.5 lg:py-3 rounded-full font-bold text-xs lg:text-sm flex items-center justify-center gap-2 transition-all ${
                      isGeneratingAI || data.length === 0
                        ? 'bg-purple-100 text-purple-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
                    }`}
                  >
                    {isGeneratingAI ? (
                      <><Cloud className="w-3 h-3 lg:w-4 lg:h-4 animate-pulse" /> 要約を生成中...</>
                    ) : data.length === 0 ? (
                      <><Bot className="w-3 h-3 lg:w-4 lg:h-4" /> まだ投稿がありません</>
                    ) : (
                      <><Bot className="w-3 h-3 lg:w-4 lg:h-4" /> トレンドを要約する</>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-pink-50/50 rounded-[1.5rem] lg:rounded-[2rem] p-4 lg:p-6 border-2 border-pink-100 mofumofu-shadow">
                <h3 className="font-extrabold text-pink-500 mb-3 flex items-center gap-1.5 text-sm lg:text-lg">
                  <Bell className="w-4 h-4 lg:w-5 lg:h-5" /> What's New
                  <span className="text-[9px] lg:text-xs font-medium text-pink-400 bg-pink-100 px-2 py-0.5 rounded-full">全国の新着</span>
                </h3>
                
                <div className="space-y-2 lg:space-y-3">
                  {whatsNewData.length > 0 ? (
                    whatsNewData.map((item) => {
                      const prefInfo = prefectures.find(p => p.code === item.prefectureCode);
                      const catInfo = actionCategories.find(c => c.id === item.category);
                      const toneInfo = tones.find(t => t.id === item.tone);
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedPost(item)}
                          className="bg-white p-3 rounded-xl lg:rounded-2xl border border-pink-50 hover:bg-pink-50/30 transition-colors flex flex-col gap-1.5 cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] lg:text-xs font-black text-pink-600 bg-pink-100 px-1.5 py-0.5 lg:px-2 lg:py-1 rounded-md lg:rounded-lg">
                                {prefInfo?.shortName || prefInfo?.name || '不明'}
                              </span>
                              
                              {item.type === 'tactics' ? (
                                <span className={`text-[9px] lg:text-[10px] font-bold px-1.5 py-0.5 lg:px-2 lg:py-1 rounded-full border ${toneInfo?.color || 'bg-slate-100'}`}>
                                  {toneInfo?.label || '未分類'}
                                </span>
                              ) : (
                                <span className={`text-[9px] lg:text-[10px] font-bold px-1.5 py-0.5 lg:px-2 lg:py-1 rounded-full border ${catInfo?.color || 'bg-slate-100'}`}>
                                  {catInfo?.label || '未分類'}
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] lg:text-[10px] text-slate-400">
                              {item.createdAt?.toMillis ? new Date(item.createdAt.toMillis()).toLocaleDateString('ja-JP') : 'NEW'}
                            </span>
                          </div>
                          <p className="text-xs lg:text-sm text-slate-600 line-clamp-2">
                            {item.content}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 lg:py-6 text-xs lg:text-sm text-slate-400">
                      まだ新着情報はありません。<br/>最初の投稿をお待ちしています！
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700;900&display=swap');
        
        .mofumofu-shadow { box-shadow: 0 10px 30px -5px rgba(255, 182, 193, 0.4), 0 8px 10px -6px rgba(255, 182, 193, 0.2); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #fbcfe8; border-radius: 20px; border: 2px solid white; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #f9a8d4; }
        
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; opacity: 0; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-5px); } 100% { transform: translateY(0px); } }
        .float-anim { animation: float 3s ease-in-out infinite; }
        .float-anim-slow { animation: float 6s ease-in-out infinite; }
      `}} />
    </div>
  );
}