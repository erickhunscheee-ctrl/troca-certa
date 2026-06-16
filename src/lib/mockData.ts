export interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: "Novo" | "Excelente" | "Bom" | "Marcas de uso";
  valueEstimate: number;
  image: string;
  owner: {
    name: string;
    avatar: string;
    rating: number;
  };
  preferredTrade: string;
}

export interface SwapProposal {
  id: string;
  offeredItem: Item;
  requestedItem: Item;
  status: "Pendente" | "Aceito" | "Recusado";
  date: string;
}

export const CATEGORIES = [
  "Eletrônicos",
  "Vestuário",
  "Esportes",
  "Livros & Hobbies",
  "Casa & Decoração",
  "Outros"
];

export const INITIAL_ITEMS: Item[] = [
  {
    id: "1",
    title: "iPad Air 4ª Geração (64GB)",
    description: "iPad em perfeito estado de conservação, sempre usado com capa e película. Acompanha carregador original.",
    category: "Eletrônicos",
    condition: "Excelente",
    valueEstimate: 3200,
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80",
    owner: {
      name: "Mariana Silva",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      rating: 4.9
    },
    preferredTrade: "Notebook ou Nintendo Switch OLED"
  },
  {
    id: "2",
    title: "Câmera Canon EOS Rebel T7",
    description: "Câmera DSLR ideal para iniciantes na fotografia. Acompanha lente do kit 18-55mm, bateria, carregador e bolsa de transporte.",
    category: "Eletrônicos",
    condition: "Excelente",
    valueEstimate: 2500,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80",
    owner: {
      name: "Lucas Pereira",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      rating: 4.7
    },
    preferredTrade: "Smartphone recente ou PS4 Pro"
  },
  {
    id: "3",
    title: "Jaqueta de Couro Legítimo",
    description: "Jaqueta clássica de couro bovino preta, tamanho G. Pouquíssimo uso, couro super hidratado e macio.",
    category: "Vestuário",
    condition: "Excelente",
    valueEstimate: 650,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
    owner: {
      name: "Fernanda Costa",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80",
      rating: 4.8
    },
    preferredTrade: "Tênis esportivo original tamanho 42"
  },
  {
    id: "4",
    title: "Bicicleta Mountain Bike Aro 29",
    description: "Bicicleta com 21 marchas, freio a disco mecânico, suspensão dianteira. Ótima para trilhas leves ou cidade.",
    category: "Esportes",
    condition: "Bom",
    valueEstimate: 1400,
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80",
    owner: {
      name: "Gabriel Neves",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
      rating: 4.5
    },
    preferredTrade: "Monitor Gamer de 144Hz+"
  },
  {
    id: "5",
    title: "Kindle Paperwhite 11ª Gen",
    description: "Tela de 6.8 polegadas com temperatura de luz ajustável. Sem riscos na tela, bateria dura semanas.",
    category: "Livros & Hobbies",
    condition: "Excelente",
    valueEstimate: 600,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
    owner: {
      name: "Ana Oliveira",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      rating: 5.0
    },
    preferredTrade: "Jogos de PS5 ou fone Bluetooth premium"
  },
  {
    id: "6",
    title: "Cafeteira Nespresso Vertuo Next",
    description: "Cafeteira de cápsulas expresso e caneca. Praticamente nova, acompanha algumas cápsulas de brinde.",
    category: "Casa & Decoração",
    condition: "Novo",
    valueEstimate: 700,
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80",
    owner: {
      name: "Thiago Souza",
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80",
      rating: 4.6
    },
    preferredTrade: "AirFryer grande ou aspirador robô"
  }
];

export const MY_INITIAL_ITEMS: Item[] = [
  {
    id: "my-1",
    title: "Teclado Mecânico Keychron K2",
    description: "Teclado mecânico sem fio com switches Gateron Brown. Acompanha keycaps originais extras e cabo USB-C.",
    category: "Eletrônicos",
    condition: "Excelente",
    valueEstimate: 550,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
    owner: {
      name: "Você",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
      rating: 5.0
    },
    preferredTrade: "Kindle Paperwhite ou Mouse Logitech MX Master 3"
  }
];
