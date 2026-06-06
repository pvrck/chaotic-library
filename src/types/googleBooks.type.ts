// --- RÉPONSE GLOBALE DE L'API ---
export interface GoogleBooksResponse {
  kind: string;
  totalItems: number;
  items?: GoogleBookItem[];
}

// --- UN ITEM DE LIVRE (VOLUME) ---
export interface GoogleBookItem {
  kind: string;
  id: string; // L'identifiant unique du livre chez Google (ex: "yE9HDwAAQBAJ")
  etag: string;
  selfLink: string;
  volumeInfo: GoogleBookVolumeInfo;
  saleInfo?: {
    country: string;
    saleability: string;
    isEbook: boolean;
  };
  accessInfo?: {
    country: string;
    viewability: string;
    embeddable: boolean;
    publicDomain: boolean;
  };
  searchInfo?: {
    textSnippet: string;
  };
}

// --- LES INFORMATIONS DU LIVRE (LE COEUR DES DONNÉES) ---
export interface GoogleBookVolumeInfo {
  title: string;
  subtitle?: string;
  authors?: string[]; // Tableau d'auteurs (ex: ["J.R.R. Tolkien"])
  publisher?: string;
  publishedDate?: string; // Format variable : "2024" ou "2024-12-15"
  description?: string; // Le résumé / quatrième de couverture
  industryIdentifiers?: GoogleBookIdentifier[]; // Pour trouver l'ISBN
  readingModes: {
    text: boolean;
    image: boolean;
  };
  pageCount?: number; // Nombre de pages
  printType: 'BOOK' | 'MAGAZINE';
  categories?: string[]; // Genres littéraires (ex: ["Fiction", "Fantasy"])
  averageRating?: number;
  ratingsCount?: number;
  maturityRating: string;
  allowAnonLogging: boolean;
  contentVersion: string;
  imageLinks?: GoogleBookImageLinks; // Les couvertures
  language: string; // Code langue (ex: "fr", "en")
  previewLink: string;
  infoLink: string;
  canonicalVolumeLink: string;
}

// --- REPRÉSENTATION DES ISBNS ---
export interface GoogleBookIdentifier {
  type: 'ISBN_10' | 'ISBN_13' | 'ISSN' | 'OTHER';
  identifier: string;
}

// --- LIENS VERS LES COUVERTURES ---
export interface GoogleBookImageLinks {
  smallThumbnail?: string; // Petite vignette (souvent utilisée pour les listes/suggestions)
  thumbnail?: string; // Couverture standard (idéale pour la modale détail)
  small?: string;
  medium?: string;
  large?: string;
  extraLarge?: string;
}

export interface GoogleBookSuggestion {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  thumbnail: string | null;
}
