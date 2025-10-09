import type { LucideIcon } from "lucide-react";
import { Bike, Car, Package, Settings } from "lucide-react";

import aerienIcon from "@/assets/aerien_1753810777764.png";
import autreServiceIcon from "@/assets/autre_1752251142652.png";
import bateauIcon from "@/assets/bateau_1752249742336.png";
import caravaneIcon from "@/assets/caravane_1752249166091.png";
import chercherIcon from "@/assets/chercher_1752258100621.png";
import entretienIcon from "@/assets/entretien_1752251142651.png";
import jetskiIcon from "@/assets/Jetski_1752249742334.png";
import motosImage from "@/assets/motos-scooters_1752244968742.png";
import motosIcon from "@/assets/motos-scooters_1752244968742.png";
import piecesImage from "@/assets/pieces-detachees_1752244968743.png";
import quadIcon from "@/assets/Quad_1752249742337.png";
import remorquageIcon from "@/assets/remorquage_1752251142654.png";
import remorqueIcon from "@/assets/remorque_1752249166090.png";
import reparationIcon from "@/assets/reparation_1752251142655.png";
import scooterIcon from "@/assets/scooter_1752088210843.png";
import servicesImage from "@/assets/services-entretien_1752244968744.png";
import utilitaireIcon from "@/assets/utilitaire_1752249166091.png";
import vendreIcon from "@/assets/vendre_1752258100618.png";
import voitureIcon from "@/assets/voiture-_1752249166092.png";
import voitureImage from "@/assets/voiture-2_1752244968736.png";

export interface SubcategoryDefinition {
  id: string;
  name: string;
  image?: string;
  color: string;
  bgColor?: string;
}

export interface CategoryDefinition {
  id: string;
  name: string;
  icon: LucideIcon;
  image?: string;
  color: string;
  isMaterial: boolean;
  subcategories: SubcategoryDefinition[];
}

export const CATEGORIES: CategoryDefinition[] = [
  {
    id: "voiture-utilitaire",
    name: "Voitures - Utilitaires",
    icon: Car,
    image: voitureImage,
    color: "from-blue-500 to-blue-600",
    isMaterial: true,
    subcategories: [
      {
        id: "voiture",
        name: "Voiture",
        image: voitureIcon,
        color: "text-blue-500",
        bgColor: "bg-blue-100",
      },
      {
        id: "utilitaire",
        name: "Utilitaire",
        image: utilitaireIcon,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      },
      {
        id: "remorque",
        name: "Remorque",
        image: remorqueIcon,
        color: "text-indigo-500",
        bgColor: "bg-indigo-100",
      },
      {
        id: "caravane",
        name: "Caravane / Camping-car",
        image: caravaneIcon,
        color: "text-purple-500",
        bgColor: "bg-purple-100",
      },
    ],
  },
  {
    id: "motos-quad-marine",
    name: "Motos - Quad - Marine",
    icon: Bike,
    image: motosImage,
    color: "from-emerald-500 to-emerald-600",
    isMaterial: true,
    subcategories: [
      {
        id: "moto",
        name: "Moto",
        image: motosIcon,
        color: "text-emerald-500",
        bgColor: "bg-emerald-100",
      },
      {
        id: "scooter",
        name: "Scooter",
        image: scooterIcon,
        color: "text-teal-500",
        bgColor: "bg-teal-100",
      },
      {
        id: "quad",
        name: "Quad",
        image: quadIcon,
        color: "text-orange-500",
        bgColor: "bg-orange-100",
      },
      {
        id: "jetski",
        name: "Jetski",
        image: jetskiIcon,
        color: "text-blue-500",
        bgColor: "bg-blue-100",
      },
      {
        id: "bateau",
        name: "Bateau",
        image: bateauIcon,
        color: "text-sky-500",
        bgColor: "bg-sky-100",
      },
      {
        id: "aerien",
        name: "Aérien",
        image: aerienIcon,
        color: "text-indigo-500",
        bgColor: "bg-indigo-100",
      },
    ],
  },
  {
    id: "services",
    name: "Services & entretien",
    icon: Settings,
    image: servicesImage,
    color: "from-amber-500 to-amber-600",
    isMaterial: false,
    subcategories: [
      {
        id: "reparation",
        name: "Réparation & mécanique",
        image: reparationIcon,
        color: "text-amber-500",
        bgColor: "bg-amber-100",
      },
      {
        id: "remorquage",
        name: "Remorquage & assistance",
        image: remorquageIcon,
        color: "text-red-500",
        bgColor: "bg-red-100",
      },
      {
        id: "entretien",
        name: "Entretien & nettoyage",
        image: entretienIcon,
        color: "text-green-500",
        bgColor: "bg-green-100",
      },
      {
        id: "autre-service",
        name: "Autres services",
        image: autreServiceIcon,
        color: "text-gray-500",
        bgColor: "bg-gray-100",
      },
    ],
  },
  {
    id: "pieces",
    name: "Pièces détachées",
    icon: Package,
    image: piecesImage,
    color: "from-purple-500 to-purple-600",
    isMaterial: false,
    subcategories: [
      {
        id: "piece-voiture",
        name: "Pièces voiture",
        image: voitureImage,
        color: "text-blue-500",
        bgColor: "bg-blue-100",
      },
      {
        id: "piece-utilitaire",
        name: "Pièces utilitaire",
        image: utilitaireIcon,
        color: "text-indigo-500",
        bgColor: "bg-indigo-100",
      },
      {
        id: "piece-moto-scooter",
        name: "Pièces moto / scooter",
        image: motosImage,
        color: "text-emerald-500",
        bgColor: "bg-emerald-100",
      },
      {
        id: "piece-quad",
        name: "Pièces quad",
        image: quadIcon,
        color: "text-orange-500",
        bgColor: "bg-orange-100",
      },
      {
        id: "piece-caravane-remorque",
        name: "Pièces caravane / remorque",
        image: caravaneIcon,
        color: "text-purple-500",
        bgColor: "bg-purple-100",
      },
      {
        id: "piece-jetski-bateau",
        name: "Pièces jetski / bateau",
        image: jetskiIcon,
        color: "text-cyan-500",
        bgColor: "bg-cyan-100",
      },
      {
        id: "piece-aerien",
        name: "Pièces aérien",
        image: aerienIcon,
        color: "text-indigo-500",
        bgColor: "bg-indigo-100",
      },
      {
        id: "autre-piece",
        name: "Autres pièces",
        image: piecesImage,
        color: "text-gray-500",
        bgColor: "bg-gray-100",
      },
    ],
  },
];

export const CTA_ICONS = {
  sell: vendreIcon,
  search: chercherIcon,
};
