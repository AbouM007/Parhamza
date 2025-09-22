import React from "react";

interface Favorite {
  id: string;
  title: string;
  image: string;
  price: number;
}

interface FavoritesSectionProps {
  favorites: Favorite[];
  onRemoveFavorite: (id: string) => void;
}

const FavoritesSection: React.FC<FavoritesSectionProps> = ({
  favorites,
  onRemoveFavorite,
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Mes favoris</h2>
      {favorites.length === 0 ? (
        <p className="text-gray-500">
          Vous n’avez pas encore ajouté de favoris.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((fav) => (
            <div key={fav.id} className="border rounded p-3 flex flex-col">
              <img
                src={fav.image}
                alt={fav.title}
                className="w-full h-32 object-cover rounded"
              />
              <div className="mt-2 flex-1">
                <h3 className="font-medium">{fav.title}</h3>
                <p className="text-gray-600">{fav.price} €</p>
              </div>
              <button
                onClick={() => onRemoveFavorite(fav.id)}
                className="mt-2 text-red-600 hover:underline text-sm self-start"
              >
                Retirer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesSection;
