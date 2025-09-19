-- ========================================
-- MODIFICATION STATUT PAR DÉFAUT DES ANNONCES
-- ========================================
-- Ce script modifie le statut par défaut des nouvelles annonces
-- de 'approved' vers 'draft' pour activer le système de modération

-- Modifier le statut par défaut de la colonne status
ALTER TABLE annonces 
ALTER COLUMN status SET DEFAULT 'draft';

-- Optionnel : Ajouter une contrainte pour s'assurer que les statuts sont valides
ALTER TABLE annonces 
ADD CONSTRAINT valid_status_check 
CHECK (status IN ('draft', 'pending', 'approved', 'rejected'));

-- Vérification de la modification
SELECT column_default 
FROM information_schema.columns 
WHERE table_name = 'annonces' 
AND column_name = 'status';
