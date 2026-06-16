"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  ArrowRightLeft, 
  Search, 
  Plus, 
  Check, 
  X, 
  Clock, 
  User, 
  Tag, 
  Filter, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  ChevronRight, 
  Info,
  DollarSign,
  Star,
  Layers,
  Heart
} from "lucide-react";
import { CATEGORIES, INITIAL_ITEMS, MY_INITIAL_ITEMS, Item, SwapProposal } from "@/lib/mockData";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"landing" | "explore" | "my-items" | "my-swaps">("landing");
  
  // App States
  const [items, setItems] = useState<Item[]>(INITIAL_ITEMS);
  const [myItems, setMyItems] = useState<Item[]>(MY_INITIAL_ITEMS);
  const [proposals, setProposals] = useState<SwapProposal[]>([
    {
      id: "prop-1",
      offeredItem: MY_INITIAL_ITEMS[0],
      requestedItem: INITIAL_ITEMS[4], // Kindle Paperwhite
      status: "Pendente",
      date: "16/06/2026"
    }
  ]);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  
  // Modal states
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [mySelectedItemForSwap, setMySelectedItemForSwap] = useState<Item | null>(null);
  const [newMatch, setNewMatch] = useState<{ myItem: Item; otherItem: Item } | null>(null);

  // New Item Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("Eletrônicos");
  const [newCondition, setNewCondition] = useState<Item["condition"]>("Excelente");
  const [newValue, setNewValue] = useState("");
  const [newPref, setNewPref] = useState("");
  const [newImg, setNewImg] = useState("");

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc || !newValue) return;

    const newItem: Item = {
      id: `my-${Date.now()}`,
      title: newTitle,
      description: newDesc,
      category: newCategory,
      condition: newCondition,
      valueEstimate: Number(newValue) || 0,
      image: newImg || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
      owner: {
        name: "Você",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
        rating: 5.0
      },
      preferredTrade: newPref || "Qualquer item de valor equivalente"
    };

    setMyItems([newItem, ...myItems]);
    // Reset form
    setNewTitle("");
    setNewDesc("");
    setNewValue("");
    setNewPref("");
    setNewImg("");
    setActiveTab("my-items");
  };

  const handleProposeSwap = () => {
    if (!selectedItem || !mySelectedItemForSwap) return;

    const newProposal: SwapProposal = {
      id: `prop-${Date.now()}`,
      offeredItem: mySelectedItemForSwap,
      requestedItem: selectedItem,
      status: "Pendente",
      date: new Date().toLocaleDateString("pt-BR")
    };

    setProposals([newProposal, ...proposals]);
    setIsSwapModalOpen(false);
    setSelectedItem(null);
    setActiveTab("my-swaps");

    // Let's simulate a match! If offering the Keychron keyboard for the Kindle Paperwhite,
    // let's auto-approve it after 1.5 seconds to show the match screen!
    if (selectedItem.id === "5") {
      setTimeout(() => {
        setNewMatch({
          myItem: mySelectedItemForSwap,
          otherItem: selectedItem
        });
        // Update proposal status to accepted
        setProposals(prev => 
          prev.map(p => p.requestedItem.id === "5" ? { ...p, status: "Aceito" } : p)
        );
      }, 1500);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header / Navigation */}
      <header className="sticky top-0 z-40 w-full glass border-b border-border-color">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("landing")}>
            <div className="h-10 w-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
              Troca Certa
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <button 
              onClick={() => setActiveTab("landing")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "landing" ? "bg-violet-600/20 text-violet-400" : "text-zinc-400 hover:text-white"}`}
            >
              Início
            </button>
            <button 
              onClick={() => setActiveTab("explore")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "explore" ? "bg-violet-600/20 text-violet-400" : "text-zinc-400 hover:text-white"}`}
            >
              Explorar Itens
            </button>
            <button 
              onClick={() => setActiveTab("my-items")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "my-items" ? "bg-violet-600/20 text-violet-400" : "text-zinc-400 hover:text-white"}`}
            >
              Meus Itens
            </button>
            <button 
              onClick={() => setActiveTab("my-swaps")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${activeTab === "my-swaps" ? "bg-violet-600/20 text-violet-400" : "text-zinc-400 hover:text-white"}`}
            >
              Minhas Trocas
              {proposals.filter(p => p.status === "Pendente").length > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setActiveTab("my-items");
                // Scroll or focus could go here
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium text-sm transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Anunciar Item
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Areas */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* VIEW 1: LANDING PAGE */}
        {activeTab === "landing" && (
          <div className="space-y-24">
            {/* Hero Section */}
            <section className="text-center space-y-8 py-12 relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />
              
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-violet-500/30 text-violet-400 text-sm font-medium animate-fade-in">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span>O jeito moderno de desapegar e conquistar</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1]">
                Troque o que você <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">tem</span> por aquilo que você <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">quer</span>
              </h1>

              <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
                Esqueça o dinheiro. Conecte-se com pessoas, proponha trocas de forma inteligente e faça acordos perfeitos sem gastar nada.
              </p>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
                <button 
                  onClick={() => setActiveTab("explore")}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-base shadow-[0_4px_20px_rgba(139,92,246,0.3)] transition-all hover:scale-[1.03] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Explorar Marketplace
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setActiveTab("my-items")}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl glass hover:bg-zinc-800/60 text-white font-medium text-base transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="h-5 w-5 text-violet-400" />
                  Cadastrar meu desapego
                </button>
              </div>
            </section>

            {/* Statistics / Highlights */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: ArrowRightLeft, title: "1.2k+", desc: "Trocas concluídas com sucesso" },
                { icon: ShieldCheck, title: "100% Seguro", desc: "Avaliações e perfis validados" },
                { icon: TrendingUp, title: "Sem Dinheiro", desc: "Economia circular em sua melhor forma" }
              ].map((stat, i) => (
                <div key={i} className="glass p-6 rounded-2xl flex items-center gap-4 border border-border-color">
                  <div className="h-12 w-12 rounded-xl bg-zinc-800/80 flex items-center justify-center text-violet-400 border border-zinc-700">
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{stat.title}</h3>
                    <p className="text-sm text-zinc-400">{stat.desc}</p>
                  </div>
                </div>
              ))}
            </section>

            {/* How it Works */}
            <section className="space-y-12">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-white">Como Funciona a Troca Certa</h2>
                <p className="text-zinc-400 max-w-xl mx-auto">Três passos simples para você encontrar o par perfeito para o seu desapego.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { step: "01", title: "Anuncie seu Item", desc: "Cadastre de forma simples o item ou serviço que você deseja desapegar, estimando o valor e definindo sua preferência." },
                  { step: "02", title: "Explore & Proponha", desc: "Navegue pelo catálogo e, ao encontrar algo de seu interesse, proponha um dos seus itens cadastrados em troca." },
                  { step: "03", title: "Match & Negocie", desc: "Se o outro usuário também gostar do seu item, dá MATCH! Vocês combinam os detalhes do envio pelo chat." }
                ].map((item, i) => (
                  <div key={i} className="glass p-8 rounded-2xl border border-border-color relative hover:border-violet-500/40 transition-all group">
                    <div className="absolute top-4 right-6 text-5xl font-extrabold text-violet-500/10 group-hover:text-violet-500/20 transition-all font-mono">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Showcase Items Section */}
            <section className="space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-white">Recém anunciados para troca</h2>
                  <p className="text-zinc-400 text-sm">Alguns dos itens mais procurados disponíveis no momento</p>
                </div>
                <button 
                  onClick={() => setActiveTab("explore")}
                  className="text-violet-400 hover:text-violet-300 font-medium text-sm flex items-center gap-1 transition-all"
                >
                  Ver todos os itens
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.slice(0, 3).map((item) => (
                  <div key={item.id} className="glass rounded-2xl overflow-hidden border border-border-color hover:scale-[1.01] transition-all flex flex-col group">
                    <div className="relative h-48 w-full bg-zinc-900">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
                      />
                      <span className="absolute top-3 right-3 px-3 py-1 text-xs font-semibold rounded-full bg-zinc-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                        {item.condition}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <span className="text-xs text-violet-400 font-medium tracking-wider uppercase">{item.category}</span>
                        <h3 className="text-lg font-bold text-white line-clamp-1">{item.title}</h3>
                        <p className="text-zinc-400 text-xs line-clamp-2">{item.description}</p>
                      </div>

                      <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                        <div>
                          <p className="text-zinc-500">Estimativa</p>
                          <p className="font-bold text-white">R$ {item.valueEstimate}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 text-right">Troca por</p>
                          <p className="font-medium text-violet-400 text-right max-w-[140px] truncate">{item.preferredTrade}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedItem(item);
                        }}
                        className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all"
                      >
                        Ver detalhes & Propor
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: EXPLORE MARKETPLACE */}
        {activeTab === "explore" && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold text-white">Marketplace de Trocas</h1>
                <p className="text-zinc-400 text-sm">Encontre pessoas interessantes e faça propostas de troca.</p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Buscar eletrônicos, roupas..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 transition-all placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 pb-2">
              <button 
                onClick={() => setSelectedCategory("Todos")}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${selectedCategory === "Todos" ? "bg-violet-600 border-violet-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]" : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white"}`}
              >
                Todos
              </button>
              {CATEGORIES.map((cat) => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${selectedCategory === cat ? "bg-violet-600 border-violet-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]" : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white"}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Grid of Items */}
            {filteredItems.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center border border-border-color space-y-4">
                <Layers className="h-12 w-12 text-zinc-600 mx-auto" />
                <h3 className="text-lg font-bold text-white">Nenhum item encontrado</h3>
                <p className="text-zinc-400 text-sm max-w-md mx-auto">Tente ajustar sua busca ou categoria para encontrar outras ofertas de troca.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <div key={item.id} className="glass rounded-2xl overflow-hidden border border-border-color hover:scale-[1.01] transition-all flex flex-col group">
                    <div className="relative h-48 w-full bg-zinc-900">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
                      />
                      <span className="absolute top-3 right-3 px-3 py-1 text-xs font-semibold rounded-full bg-zinc-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                        {item.condition}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <span className="text-xs text-violet-400 font-medium tracking-wider uppercase">{item.category}</span>
                        <h3 className="text-lg font-bold text-white line-clamp-1">{item.title}</h3>
                        <p className="text-zinc-400 text-xs line-clamp-2">{item.description}</p>
                      </div>

                      <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                        <div>
                          <p className="text-zinc-500">Estimativa</p>
                          <p className="font-bold text-white">R$ {item.valueEstimate}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 text-right">Troca por</p>
                          <p className="font-medium text-violet-400 text-right max-w-[140px] truncate">{item.preferredTrade}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <img src={item.owner.avatar} className="h-7 w-7 rounded-full object-cover border border-zinc-700" alt={item.owner.name} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-zinc-300 truncate">{item.owner.name}</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            <span className="text-[10px] text-zinc-400">{item.owner.rating}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedItem(item);
                        }}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-[0_4px_12px_rgba(139,92,246,0.2)]"
                      >
                        Ver detalhes & Propor
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: MY ITEMS / REGISTER ITEM */}
        {activeTab === "my-items" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left/Middle Column: My Items Grid */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold text-white">Meus Desapegos</h1>
                <p className="text-zinc-400 text-sm">Estes são os itens que você possui disponíveis para propor trocas.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {myItems.map((item) => (
                  <div key={item.id} className="glass rounded-2xl overflow-hidden border border-border-color flex flex-col justify-between">
                    <div className="relative h-44 w-full bg-zinc-900">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      <span className="absolute top-3 right-3 px-3 py-1 text-xs font-semibold rounded-full bg-zinc-950/80 text-emerald-400 border border-emerald-500/20">
                        {item.condition}
                      </span>
                    </div>

                    <div className="p-5 space-y-4">
                      <div>
                        <span className="text-xs text-violet-400 font-medium tracking-wider uppercase">{item.category}</span>
                        <h3 className="text-base font-bold text-white line-clamp-1">{item.title}</h3>
                        <p className="text-zinc-400 text-xs line-clamp-2 mt-1">{item.description}</p>
                      </div>

                      <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                        <div>
                          <p className="text-zinc-500">Estimativa</p>
                          <p className="font-bold text-white">R$ {item.valueEstimate}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 text-right">Trocaria por</p>
                          <p className="font-medium text-violet-400 text-right max-w-[130px] truncate">{item.preferredTrade}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Register Form */}
            <div className="glass p-6 rounded-2xl border border-border-color h-fit space-y-6">
              <div className="flex items-center gap-2 text-white">
                <Plus className="h-5 w-5 text-violet-400" />
                <h2 className="text-xl font-bold">Cadastrar novo item</h2>
              </div>

              <form onSubmit={handleCreateItem} className="space-y-4 text-sm">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1.5">Título do Item *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: Teclado Mecânico Logitech" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1.5">Categoria</label>
                    <select 
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-violet-500"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1.5">Estado</label>
                    <select 
                      value={newCondition}
                      onChange={(e) => setNewCondition(e.target.value as Item["condition"])}
                      className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="Novo">Novo</option>
                      <option value="Excelente">Excelente</option>
                      <option value="Bom">Bom</option>
                      <option value="Marcas de uso">Marcas de uso</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1.5">Valor Estimado *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <input 
                        type="number" 
                        required 
                        placeholder="Ex: 500" 
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        className="w-full pl-8 pr-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1.5">URL da Imagem</label>
                    <input 
                      type="text" 
                      placeholder="https://..." 
                      value={newImg}
                      onChange={(e) => setNewImg(e.target.value)}
                      className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1.5">O que você aceita em troca? *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: Headset Gamer ou controle PS5" 
                    value={newPref}
                    onChange={(e) => setNewPref(e.target.value)}
                    className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1.5">Descrição detalhada *</label>
                  <textarea 
                    rows={3} 
                    required 
                    placeholder="Descreva detalhes de uso, o que acompanha, se tem caixa..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-violet-500 resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all shadow-[0_4px_12px_rgba(139,92,246,0.3)]"
                >
                  Anunciar Item
                </button>
              </form>
            </div>
          </div>
        )}

        {/* VIEW 4: MY SWAPS / PROPOSALS */}
        {activeTab === "my-swaps" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Minhas Propostas</h1>
              <p className="text-zinc-400 text-sm">Gerencie suas ofertas de troca enviadas e recebidas.</p>
            </div>

            {proposals.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center border border-border-color space-y-4">
                <ArrowRightLeft className="h-12 w-12 text-zinc-600 mx-auto" />
                <h3 className="text-lg font-bold text-white">Nenhuma proposta ativa</h3>
                <p className="text-zinc-400 text-sm max-w-md mx-auto">Vá para o catálogo explorar os itens cadastrados e envie uma proposta para começar.</p>
                <button 
                  onClick={() => setActiveTab("explore")}
                  className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-xs transition-all"
                >
                  Explorar Marketplace
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {proposals.map((prop) => (
                  <div key={prop.id} className="glass p-6 rounded-2xl border border-border-color flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Items involved in trade */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 flex-1 w-full">
                      {/* Offered Item */}
                      <div className="flex items-center gap-4 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60 flex-1 w-full">
                        <img src={prop.offeredItem.image} className="h-16 w-16 rounded-lg object-cover" alt="" />
                        <div className="min-w-0">
                          <span className="text-[10px] text-zinc-500 font-semibold uppercase">Você oferece</span>
                          <h4 className="font-bold text-white text-sm truncate">{prop.offeredItem.title}</h4>
                          <p className="text-xs text-zinc-400">R$ {prop.offeredItem.valueEstimate}</p>
                        </div>
                      </div>

                      {/* Direction icon */}
                      <div className="h-10 w-10 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/20 shrink-0">
                        <ArrowRightLeft className="h-5 w-5" />
                      </div>

                      {/* Requested Item */}
                      <div className="flex items-center gap-4 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60 flex-1 w-full">
                        <img src={prop.requestedItem.image} className="h-16 w-16 rounded-lg object-cover" alt="" />
                        <div className="min-w-0">
                          <span className="text-[10px] text-violet-400 font-semibold uppercase">Você quer</span>
                          <h4 className="font-bold text-white text-sm truncate">{prop.requestedItem.title}</h4>
                          <p className="text-xs text-zinc-400">Dono: {prop.requestedItem.owner.name}</p>
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col sm:flex-row md:flex-col items-center sm:justify-between md:items-end gap-3 w-full md:w-auto shrink-0 border-t md:border-t-0 border-zinc-800 pt-4 md:pt-0">
                      <div className="flex items-center gap-2">
                        {prop.status === "Pendente" && (
                          <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                            <Clock className="h-3.5 w-3.5" />
                            Pendente
                          </span>
                        )}
                        {prop.status === "Aceito" && (
                          <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <Check className="h-3.5 w-3.5" />
                            Match! Aceito
                          </span>
                        )}
                        {prop.status === "Recusado" && (
                          <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                            <X className="h-3.5 w-3.5" />
                            Recusado
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-zinc-500">
                        Proposta em: {prop.date}
                      </div>

                      {prop.status === "Aceito" && (
                        <button 
                          onClick={() => {
                            alert(`Contato para troca de ${prop.requestedItem.title}:\nEnvie e-mail para ${prop.requestedItem.owner.name.toLowerCase().replace(" ", "")}@trocacerta.com.br`);
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)] mt-2"
                        >
                          Entrar em Contato
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ITEM DETAILS MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass w-full max-w-2xl rounded-3xl overflow-hidden border border-border-color flex flex-col md:flex-row relative">
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-zinc-950/80 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-800 z-10"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Image */}
            <div className="h-64 md:h-auto md:w-1/2 bg-zinc-900 relative">
              <img src={selectedItem.image} alt={selectedItem.title} className="w-full h-full object-cover" />
              <span className="absolute top-4 left-4 px-3 py-1 text-xs font-semibold rounded-full bg-zinc-950/80 text-emerald-400 border border-emerald-500/20">
                {selectedItem.condition}
              </span>
            </div>

            {/* Modal Content */}
            <div className="p-6 md:w-1/2 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-violet-400 font-bold uppercase tracking-widest">{selectedItem.category}</span>
                  <h2 className="text-xl font-extrabold text-white mt-1">{selectedItem.title}</h2>
                </div>

                <div className="flex items-center gap-3 bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800">
                  <img src={selectedItem.owner.avatar} className="h-8 w-8 rounded-full object-cover border border-zinc-700" alt="" />
                  <div>
                    <p className="text-xs text-zinc-400">Anunciante</p>
                    <p className="text-xs font-bold text-white">{selectedItem.owner.name}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1 bg-zinc-950/60 px-2 py-1 rounded-lg text-yellow-500 text-xs">
                    <Star className="h-3 w-3 fill-yellow-500" />
                    <span>{selectedItem.owner.rating}</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">{selectedItem.description}</p>

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between text-xs border-b border-zinc-800/80 pb-2">
                    <span className="text-zinc-500">Estimativa de valor</span>
                    <span className="font-bold text-white">R$ {selectedItem.valueEstimate}</span>
                  </div>
                  <div className="flex flex-col text-xs">
                    <span className="text-zinc-500 mb-1">Desejo de troca do anunciante:</span>
                    <span className="font-medium text-violet-400 bg-violet-600/10 px-2.5 py-1.5 rounded-lg border border-violet-500/15">
                      {selectedItem.preferredTrade}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsSwapModalOpen(true)}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-sm transition-all shadow-[0_4px_15px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Oferecer um item para Troca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SWAP PROPOSAL MODAL */}
      {isSwapModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-3xl p-6 border border-border-color space-y-6 relative">
            <button 
              onClick={() => setIsSwapModalOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-zinc-950/80 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-800"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Selecione seu item para a troca</h3>
              <p className="text-zinc-400 text-xs">Qual dos seus desapegos deseja oferecer em troca de: <strong className="text-white">{selectedItem.title}</strong>?</p>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {myItems.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => setMySelectedItemForSwap(item)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${mySelectedItemForSwap?.id === item.id ? "bg-violet-600/10 border-violet-500" : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"}`}
                >
                  <img src={item.image} className="h-12 w-12 rounded-lg object-cover" alt="" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-xs truncate">{item.title}</h4>
                    <p className="text-[10px] text-zinc-400">R$ {item.valueEstimate} • Categoria: {item.category}</p>
                  </div>
                  <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${mySelectedItemForSwap?.id === item.id ? "border-violet-500 bg-violet-600 text-white" : "border-zinc-700"}`}>
                    {mySelectedItemForSwap?.id === item.id && <Check className="h-3 w-3" />}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsSwapModalOpen(false)}
                className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleProposeSwap}
                disabled={!mySelectedItemForSwap}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-[0_4px_12px_rgba(139,92,246,0.3)]"
              >
                Enviar Proposta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW MATCH POPUP/CONFIRMATION SCREEN */}
      {newMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="text-center space-y-8 max-w-md w-full relative">
            
            <div className="space-y-2">
              <div className="h-20 w-20 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                <Heart className="h-10 w-10 fill-emerald-500" />
              </div>
              <h2 className="text-4xl font-black text-white tracking-wide">DEU MATCH!</h2>
              <p className="text-zinc-400 text-sm">Mariana Silva aceitou sua proposta de troca!</p>
            </div>

            {/* Visual match animation */}
            <div className="flex items-center justify-center gap-6">
              <div className="space-y-2 text-center">
                <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.5)]">
                  <img src={newMatch.myItem.image} className="h-full w-full object-cover" alt="" />
                </div>
                <p className="text-[10px] text-zinc-400 font-bold truncate max-w-[100px]">{newMatch.myItem.title}</p>
              </div>

              <ArrowRightLeft className="h-8 w-8 text-emerald-400 animate-pulse" />

              <div className="space-y-2 text-center">
                <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                  <img src={newMatch.otherItem.image} className="h-full w-full object-cover" alt="" />
                </div>
                <p className="text-[10px] text-zinc-400 font-bold truncate max-w-[100px]">{newMatch.otherItem.title}</p>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => {
                  setNewMatch(null);
                  setActiveTab("my-swaps");
                }}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl text-sm transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)]"
              >
                Ver Contato para a Troca
              </button>
              <button 
                onClick={() => setNewMatch(null)}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold rounded-xl transition-all"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-border-color py-8 bg-zinc-950/60">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2 text-xs text-zinc-500">
          <p>© 2026 Troca Certa Inc. Desenvolvido para hospedagem instantânea na Vercel.</p>
          <p>Conectando desapegos de forma sustentável e inteligente.</p>
        </div>
      </footer>
    </div>
  );
}
