"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, Award, MessageCircle, Crown, Sparkles, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { storage } from "@/lib/storage";

interface TopFan {
  rank: number;
  userId: string;
  name: string;
  email: string | null;
  avatar: string | null;
  messageCount: number;
}

interface Creator {
  id: string;
  slug: string;
  name: string;
  avatar: string;
}

export default function MeilleurFanPage() {
  const [topFans, setTopFans] = useState<TopFan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [creatorInfo, setCreatorInfo] = useState<Creator | null>(null);
  const [showCreatorSelector, setShowCreatorSelector] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [failedAvatars, setFailedAvatars] = useState<Set<string>>(new Set());
  const [failedCreatorAvatar, setFailedCreatorAvatar] = useState(false);

  // Écouter les changements de localStorage pour détecter la connexion et les mises à jour de profil
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      // Si userId, accountType, creatorSlug, subscriptions ou userName change, rafraîchir
      if (e.key === 'userId' || e.key === 'accountType' || e.key === 'creatorSlug' || e.key === 'subscriptions' || e.key === 'userName') {
        setRefreshKey(prev => prev + 1);
      }
    }

    // Écouter les événements storage (changements depuis d'autres onglets)
    window.addEventListener('storage', handleStorageChange);

    // Écouter aussi les changements dans le même onglet via un interval
    let lastUserId = localStorage.getItem('userId');
    let lastAccountType = localStorage.getItem('accountType');
    let lastCreatorSlug = localStorage.getItem('creatorSlug');
    let lastSubscriptions = localStorage.getItem('subscriptions');
    let lastUserName = localStorage.getItem('userName');

    const checkInterval = setInterval(() => {
      const currentUserId = localStorage.getItem('userId');
      const currentAccountType = localStorage.getItem('accountType');
      const currentCreatorSlug = localStorage.getItem('creatorSlug');
      const currentSubscriptions = localStorage.getItem('subscriptions');
      const currentUserName = localStorage.getItem('userName');

      if (
        currentUserId !== lastUserId ||
        currentAccountType !== lastAccountType ||
        currentCreatorSlug !== lastCreatorSlug ||
        currentSubscriptions !== lastSubscriptions ||
        currentUserName !== lastUserName
      ) {
        lastUserId = currentUserId;
        lastAccountType = currentAccountType;
        lastCreatorSlug = currentCreatorSlug;
        lastSubscriptions = currentSubscriptions;
        lastUserName = currentUserName;
        setRefreshKey(prev => prev + 1);
      }
    }, 500); // Vérifier toutes les 500ms

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkInterval);
    };
  }, []);

  // Charger les créatrices auxquelles l'utilisateur est abonné
  useEffect(() => {
    async function loadCreators() {
      try {
        const userId = localStorage.getItem("userId");
        const accountType = localStorage.getItem("accountType");
        
        // Si c'est une créatrice, charger sa propre page
        if (accountType === "creator") {
          const creatorSlug = localStorage.getItem("creatorSlug");
          if (creatorSlug) {
            const response = await fetch(`/api/creators/${creatorSlug}`);
            if (response.ok) {
              const data = await response.json();
              const creator: Creator = {
                id: data.id || creatorSlug,
                slug: creatorSlug,
                name: data.name || creatorSlug,
                avatar: data.avatar || data.avatar_url || "/default-avatar.png",
              };
              setCreators([creator]);
              setSelectedCreatorId(creatorSlug);
              setCreatorInfo(creator);
            }
          }
          return;
        }

        // Si utilisateur, charger les abonnements actifs depuis la base de données
        if (userId) {
          try {
            // Charger les abonnements actifs depuis l'API
            const statsResponse = await fetch(`/api/user/stats?userId=${userId}`);
            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              
              // Récupérer les abonnements actifs avec les slugs des créatrices
              const activeSubscriptions = statsData.subscriptions || [];
              
              if (activeSubscriptions.length > 0) {
                const creatorsList: Creator[] = [];
                
                // Charger les infos de chaque créatrice depuis les abonnements
                for (const sub of activeSubscriptions) {
                  if (sub.status === 'active' && sub.creator_slug) {
                    // Essayer de charger l'avatar depuis l'API creators pour avoir le fallback
                    let avatarUrl = sub.creator_avatar;
                    if (!avatarUrl) {
                      try {
                        const creatorResponse = await fetch(`/api/creators/${sub.creator_slug}`);
                        if (creatorResponse.ok) {
                          const creatorData = await creatorResponse.json();
                          avatarUrl = creatorData.avatar || creatorData.avatar_url || "/default-avatar.png";
                        }
                      } catch (err) {
                        console.error(`Error loading creator ${sub.creator_slug}:`, err);
                      }
                    }
                    
                    creatorsList.push({
                      id: sub.creator_id || sub.creator_slug,
                      slug: sub.creator_slug,
                      name: sub.creator_name || sub.creator_slug,
                      avatar: avatarUrl || "/default-avatar.png",
                    });
                  }
                }
                
                setCreators(creatorsList);
                
                // Sélectionner la première créatrice par défaut
                if (creatorsList.length > 0) {
                  setSelectedCreatorId(creatorsList[0].slug);
                  setCreatorInfo(creatorsList[0]);
                }
              } else {
                // Aucun abonnement actif
                setCreators([]);
              }
            } else {
              console.error("Error loading user stats:", statsResponse.status);
              setCreators([]);
            }
          } catch (err) {
            console.error("Error loading subscriptions from API:", err);
            setCreators([]);
          }
        } else {
          // Pas d'userId, pas d'abonnements
          setCreators([]);
        }
      } catch (err) {
        console.error("Error loading creators:", err);
        setCreators([]);
      }
    }

    loadCreators();
  }, [refreshKey]); // Recharger quand refreshKey change

  // Charger le classement quand une créatrice est sélectionnée ou quand refreshKey change
  // Fermer le sélecteur si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (showCreatorSelector && !target.closest('.creator-selector')) {
        setShowCreatorSelector(false);
      }
    }
    
    if (showCreatorSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCreatorSelector]);

  useEffect(() => {
    if (!selectedCreatorId) return;

    async function loadTopFans() {
      try {
        setLoading(true);
        setError(null);
        // Ajouter un timestamp pour éviter le cache
        const response = await fetch(`/api/top-fans?limit=50&creatorId=${selectedCreatorId}&_t=${Date.now()}`);
        
        if (!response.ok) {
          throw new Error("Erreur lors du chargement du classement");
        }

        const data = await response.json();
        
        if (data.success) {
          setTopFans(data.topFans || []);
          // Mettre à jour les infos de la créatrice si retournées par l'API
          if (data.creator) {
            // Essayer de charger l'avatar depuis l'API creators si pas disponible
            let avatarUrl = data.creator.avatar;
            if (!avatarUrl) {
              try {
                const creatorResponse = await fetch(`/api/creators/${data.creator.slug}`);
                if (creatorResponse.ok) {
                  const creatorData = await creatorResponse.json();
                  avatarUrl = creatorData.avatar || creatorData.avatar_url;
                }
              } catch (err) {
                console.error(`Error loading creator avatar:`, err);
              }
            }
            
            setCreatorInfo({
              id: data.creator.id,
              slug: data.creator.slug,
              name: data.creator.name,
              avatar: avatarUrl || "/default-avatar.png",
            });
            setFailedCreatorAvatar(false); // Reset l'état d'erreur quand on change de créatrice
          }
        } else {
          throw new Error(data.error || "Erreur inconnue");
        }
      } catch (err) {
        console.error("Error loading top fans:", err);
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }

    loadTopFans();
  }, [selectedCreatorId, refreshKey]); // Ajouter refreshKey comme dépendance pour recharger quand il change

  const handleCreatorChange = (creatorSlug: string) => {
    setSelectedCreatorId(creatorSlug);
    const creator = creators.find(c => c.slug === creatorSlug);
    if (creator) {
      setCreatorInfo(creator);
    }
    setShowCreatorSelector(false);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <Crown className="w-6 h-6 text-yellow-400" />;
    }
    if (rank === 2) {
      return <Medal className="w-6 h-6 text-gray-300" />;
    }
    if (rank === 3) {
      return <Medal className="w-6 h-6 text-amber-600" />;
    }
    return <Award className="w-5 h-5 text-gray-500" />;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) {
      return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black";
    }
    if (rank === 2) {
      return "bg-gradient-to-r from-gray-300 to-gray-400 text-black";
    }
    if (rank === 3) {
      return "bg-gradient-to-r from-amber-600 to-amber-700 text-white";
    }
    return "bg-gray-800 text-gray-300";
  };

  if (loading && !selectedCreatorId) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e31fc1] mx-auto"></div>
          <p className="mt-4 text-gray-400">Chargement...</p>
        </div>
      </main>
    );
  }

  if (creators.length === 0) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <Trophy className="w-20 h-20 mx-auto text-[#e31fc1]" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Aucun abonnement</h1>
          <p className="text-gray-300 mb-8">
            Tu dois être abonné à au moins une créatrice pour voir le classement.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] hover:opacity-90 transition-opacity"
          >
            Découvrir les créatrices
          </Link>
        </div>
      </main>
    );
  }

  if (error && !loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <Trophy className="w-20 h-20 mx-auto text-[#e31fc1]" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Erreur</h1>
          <p className="text-gray-300 mb-8">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] hover:opacity-90 transition-opacity"
          >
            Retour à l'accueil
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header avec avatar de la créatrice */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          {/* Sélecteur de créatrice si plusieurs */}
          {creators.length > 1 && (
            <div className="mb-6 relative creator-selector">
              <button
                onClick={() => setShowCreatorSelector(!showCreatorSelector)}
                className="mx-auto flex items-center gap-3 px-6 py-3 bg-gray-900 rounded-2xl border border-gray-800 hover:border-[#e31fc1] transition-all"
              >
                {creatorInfo && (
                  <>
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#e31fc1]">
                      <Image
                        src={creatorInfo.avatar}
                        alt={creatorInfo.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="font-semibold">{creatorInfo.name}</span>
                  </>
                )}
                <ChevronDown className={`w-5 h-5 transition-transform ${showCreatorSelector ? 'rotate-180' : ''}`} />
              </button>
              
              {showCreatorSelector && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden z-50 shadow-xl">
                  {creators.map((creator) => (
                    <button
                      key={creator.slug}
                      onClick={() => handleCreatorChange(creator.slug)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors ${
                        selectedCreatorId === creator.slug ? 'bg-gray-800' : ''
                      }`}
                    >
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#e31fc1]">
                        <Image
                          src={creator.avatar}
                          alt={creator.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="font-medium">{creator.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Avatar et titre */}
          <div className="flex flex-col items-center gap-4 mb-4">
            {creatorInfo && (
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-[#e31fc1] shadow-lg shadow-[#e31fc1]/30">
                {!failedCreatorAvatar && creatorInfo.avatar ? (
                  <Image
                    src={creatorInfo.avatar}
                    alt={creatorInfo.name}
                    fill
                    className="object-cover"
                    onError={() => {
                      setFailedCreatorAvatar(true);
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#e31fc1] to-[#ff6b9d] flex items-center justify-center">
                    <span className="text-white font-bold text-3xl">
                      {creatorInfo.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center justify-center gap-3">
              <Trophy className="w-10 h-10 text-[#e31fc1]" />
              <h1 className="text-3xl md:text-4xl font-bold">
                Classement{" "}
                <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
                  {creatorInfo?.name || "des Meilleurs Fans"}
                </span>
              </h1>
            </div>
          </div>
          <p className="text-gray-400 text-lg">
            Les fans les plus actifs de {creatorInfo?.name || "cette créatrice"}
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e31fc1] mx-auto"></div>
            <p className="mt-4 text-gray-400">Chargement du classement...</p>
          </div>
        ) : (
          <>
            {/* Podium pour les 3 premiers */}
            {topFans.length >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-12"
              >
                <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              {/* 2ème place */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col items-center order-2 md:order-1"
              >
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center mb-3 border-4 border-gray-600 overflow-hidden">
                  {topFans[1]?.avatar && !failedAvatars.has(topFans[1]?.userId || '') ? (
                    <Image
                      src={topFans[1].avatar}
                      alt={topFans[1].name}
                      fill
                      className="object-cover"
                      onError={() => {
                        if (topFans[1]?.userId) {
                          setFailedAvatars(prev => new Set(prev).add(topFans[1].userId));
                        }
                      }}
                    />
                  ) : (
                    <span className="text-2xl font-bold text-black">
                      {topFans[1]?.name?.charAt(0).toUpperCase() || '2'}
                    </span>
                  )}
                </div>
                <div className="bg-gradient-to-b from-gray-900 to-black rounded-2xl p-4 border border-gray-800 w-full text-center">
                  <p className="font-semibold text-white mb-1 truncate">
                    {topFans[1]?.name || "Anonyme"}
                  </p>
                  <div className="flex items-center justify-center gap-1 text-gray-400 text-sm">
                    <MessageCircle className="w-4 h-4" />
                    <span>{topFans[1]?.messageCount || 0}</span>
                  </div>
                </div>
              </motion.div>

              {/* 1ère place */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col items-center order-1 md:order-2"
              >
                <div className="relative mb-2">
                  <Crown className="w-8 h-8 text-yellow-400 absolute -top-8 left-1/2 transform -translate-x-1/2" />
                </div>
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mb-3 border-4 border-yellow-500 shadow-lg shadow-yellow-500/50 overflow-hidden">
                  {topFans[0]?.avatar && !failedAvatars.has(topFans[0]?.userId || '') ? (
                    <Image
                      src={topFans[0].avatar}
                      alt={topFans[0].name}
                      fill
                      className="object-cover"
                      onError={() => {
                        if (topFans[0]?.userId) {
                          setFailedAvatars(prev => new Set(prev).add(topFans[0].userId));
                        }
                      }}
                    />
                  ) : (
                    <span className="text-3xl font-bold text-black">
                      {topFans[0]?.name?.charAt(0).toUpperCase() || '1'}
                    </span>
                  )}
                </div>
                    <div className="bg-gradient-to-b from-gray-900 to-black rounded-2xl p-4 border-2 border-[#e31fc1] w-full text-center shadow-lg shadow-[#e31fc1]/20">
                      <p className="font-bold text-white mb-1 truncate text-lg">
                        {topFans[0]?.name || "Anonyme"}
                      </p>
                      <div className="flex items-center justify-center gap-1 text-[#e31fc1] text-sm font-semibold">
                        <MessageCircle className="w-4 h-4" />
                        <span>{topFans[0]?.messageCount || 0} messages</span>
                      </div>
                    </div>
                  </motion.div>

              {/* 3ème place */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-col items-center order-3"
              >
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center mb-3 border-4 border-amber-800 overflow-hidden">
                  {topFans[2]?.avatar && !failedAvatars.has(topFans[2]?.userId || '') ? (
                    <Image
                      src={topFans[2].avatar}
                      alt={topFans[2].name}
                      fill
                      className="object-cover"
                      onError={() => {
                        if (topFans[2]?.userId) {
                          setFailedAvatars(prev => new Set(prev).add(topFans[2].userId));
                        }
                      }}
                    />
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      {topFans[2]?.name?.charAt(0).toUpperCase() || '3'}
                    </span>
                  )}
                </div>
                    <div className="bg-gradient-to-b from-gray-900 to-black rounded-2xl p-4 border border-gray-800 w-full text-center">
                      <p className="font-semibold text-white mb-1 truncate">
                        {topFans[2]?.name || "Anonyme"}
                      </p>
                      <div className="flex items-center justify-center gap-1 text-gray-400 text-sm">
                        <MessageCircle className="w-4 h-4" />
                        <span>{topFans[2]?.messageCount || 0}</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Liste complète du classement */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="space-y-3"
            >
              <h2 className="text-2xl font-bold mb-6 text-center">
                Classement complet
              </h2>

              {topFans.length === 0 ? (
                <div className="bg-gray-900 rounded-2xl p-8 text-center border border-gray-800">
                  <MessageCircle className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400 text-lg">
                    Aucun message pour le moment. Sois le premier à discuter ! 💬
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topFans.map((fan, index) => (
                    <motion.div
                      key={fan.userId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.7 + index * 0.05 }}
                      className={`bg-gradient-to-b from-gray-900 to-black rounded-2xl p-4 border ${
                        fan.rank <= 3
                          ? "border-[#e31fc1] shadow-lg shadow-[#e31fc1]/10"
                          : "border-gray-800 hover:border-gray-700"
                      } transition-all duration-300`}
                    >
                  <div className="flex items-center gap-4">
                    {/* Rang */}
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${getRankBadgeColor(
                        fan.rank
                      )}`}
                    >
                      {fan.rank <= 3 ? (
                        getRankIcon(fan.rank)
                      ) : (
                        <span>{fan.rank}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-gray-700 flex-shrink-0">
                      {fan.avatar && !failedAvatars.has(fan.userId) ? (
                        <Image
                          src={fan.avatar}
                          alt={fan.name}
                          fill
                          className="object-cover"
                          onError={() => {
                            setFailedAvatars(prev => new Set(prev).add(fan.userId));
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#e31fc1] to-[#ff6b9d] flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {fan.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Nom */}
                    <div className="flex-1 min-w-0">
                          <p
                            className={`font-semibold truncate ${
                              fan.rank === 1
                                ? "text-yellow-400 text-lg"
                                : fan.rank <= 3
                                ? "text-white"
                                : "text-gray-300"
                            }`}
                          >
                            {fan.name}
                            {fan.rank === 1 && (
                              <Sparkles className="w-4 h-4 inline-block ml-2 text-yellow-400" />
                            )}
                          </p>
                        </div>

                        {/* Nombre de messages */}
                        <div className="flex items-center gap-2 text-right">
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4 text-[#e31fc1]" />
                              <span
                                className={`font-bold ${
                                  fan.rank === 1
                                    ? "text-yellow-400"
                                    : fan.rank <= 3
                                    ? "text-[#e31fc1]"
                                    : "text-gray-400"
                                }`}
                              >
                                {fan.messageCount}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              message{fan.messageCount > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}

        {/* Footer avec lien retour */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mt-12 text-center"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] hover:opacity-90 transition-opacity"
          >
            Retour à l'accueil
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
