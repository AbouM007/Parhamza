# 🧩 Todo

---

## 🔐 **URGENT - Migration Authentification Admin (Sécurité Critique)**

### ⚠️ Problème Actuel

**L'authentification admin utilise actuellement un système temporaire NON SÉCURISÉ :**
- Credentials hardcodés dans le frontend (`admin@passionauto2roues.com` / `admin123`)
- Stockage en `localStorage` (facilement modifiable par l'utilisateur)
- Headers statiques HTTP (`x-user-email` et `authorization`) envoyés à chaque requête
- Middleware backend qui accepte ces headers sans vérification de token JWT
- **Risque** : N'importe qui peut forger ces headers et accéder aux routes admin

### 📁 Fichiers Concernés

**Backend :**
- `server/routes/admin.ts` - Routes admin et middleware `requireAdmin` temporaire
- `server/middleware/auth.ts` - Middleware d'authentification général

**Frontend :**
- `client/src/components/AdminLogin.tsx` - Page de connexion admin (localStorage actuel)
- `client/src/components/AdminDashboardClean.tsx` - Dashboard admin
- `client/src/components/dashboard/ReportsSection.tsx` - Section des signalements
- `client/src/lib/queryClient.ts` - Configuration axios avec intercepteurs (headers statiques)

**Database :**
- Table `users` - Ajouter/utiliser la colonne `type` pour identifier les admins (`type='admin'`)

---

### 🚀 Plan de Migration Détaillé

#### **Phase 1 : Préparation Database**

1. **Vérifier la colonne `type` dans la table `users`** :
   ```sql
   -- Vérifier si la colonne existe déjà
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'users' AND column_name = 'type';
   ```

2. **Créer un compte admin dans Supabase** :
   - Aller sur le tableau de bord Supabase → Authentication → Users
   - Créer un nouvel utilisateur avec l'email `admin@passionauto2roues.com`
   - Définir un mot de passe fort (ex: généré aléatoirement)
   - Mettre à jour le champ `type` de cet utilisateur à `'admin'` dans la table `users`

#### **Phase 2 : Modifier le Backend**

3. **Supprimer l'authentification temporaire dans `server/routes/admin.ts`** :
   
   **AVANT (temporaire - à supprimer) :**
   ```typescript
   // Middleware temporaire acceptant les headers statiques
   const requireAdmin: RequestHandler = async (req, res, next) => {
     const userEmail = req.headers['x-user-email'] as string;
     const authHeader = req.headers['authorization'] as string;
     
     if (userEmail === 'admin@passionauto2roues.com' && authHeader === 'Bearer admin-token') {
       req.user = { id: 'admin-id', email: userEmail, type: 'admin' };
       return next();
     }
     // ...
   }
   ```

   **APRÈS (sécurisé - à implémenter) :**
   ```typescript
   // Middleware sécurisé utilisant Supabase Auth
   const requireAdmin: RequestHandler = async (req, res, next) => {
     try {
       // 1. Vérifier le token JWT Supabase
       const token = req.headers.authorization?.replace('Bearer ', '');
       if (!token) {
         return res.status(401).json({ error: 'Token manquant' });
       }

       // 2. Valider le token avec Supabase
       const { data: { user }, error } = await supabase.auth.getUser(token);
       if (error || !user) {
         return res.status(401).json({ error: 'Token invalide' });
       }

       // 3. Vérifier que l'utilisateur est admin
       const { data: userData } = await supabase
         .from('users')
         .select('type')
         .eq('id', user.id)
         .single();

       if (userData?.type !== 'admin') {
         return res.status(403).json({ error: 'Accès admin requis' });
       }

       req.user = { id: user.id, email: user.email!, type: 'admin' };
       next();
     } catch (err) {
       return res.status(500).json({ error: 'Erreur serveur' });
     }
   };
   ```

#### **Phase 3 : Modifier le Frontend**

4. **Migrer `AdminLogin.tsx` vers Supabase Auth** :

   **AVANT (localStorage - à supprimer) :**
   ```typescript
   const handleLogin = (e: FormEvent) => {
     e.preventDefault();
     if (email === 'admin@passionauto2roues.com' && password === 'admin123') {
       localStorage.setItem('adminAuth', JSON.stringify({ email, token: 'admin-token' }));
       setLocation('/admin');
     }
   }
   ```

   **APRÈS (Supabase Auth - à implémenter) :**
   ```typescript
   const handleLogin = async (e: FormEvent) => {
     e.preventDefault();
     setIsLoading(true);
     setError('');

     try {
       // Connexion avec Supabase Auth
       const { data, error } = await supabase.auth.signInWithPassword({
         email,
         password,
       });

       if (error) throw error;

       // Vérifier que c'est bien un admin
       const { data: userData } = await supabase
         .from('users')
         .select('type')
         .eq('id', data.user.id)
         .single();

       if (userData?.type !== 'admin') {
         await supabase.auth.signOut();
         throw new Error('Accès non autorisé');
       }

       // Rediriger vers le dashboard admin
       setLocation('/admin');
     } catch (err: any) {
       setError(err.message || 'Identifiants incorrects');
     } finally {
       setIsLoading(false);
     }
   };
   ```

5. **Supprimer les headers statiques dans `client/src/lib/queryClient.ts`** :

   **AVANT (headers statiques - à supprimer) :**
   ```typescript
   api.interceptors.request.use((config) => {
     const adminAuth = localStorage.getItem('adminAuth');
     if (adminAuth) {
       const { email, token } = JSON.parse(adminAuth);
       config.headers['x-user-email'] = email;
       config.headers['authorization'] = `Bearer ${token}`;
     }
     return config;
   });
   ```

   **APRÈS (token JWT Supabase - à implémenter) :**
   ```typescript
   api.interceptors.request.use(async (config) => {
     // Récupérer la session Supabase
     const { data: { session } } = await supabase.auth.getSession();
     
     if (session?.access_token) {
       config.headers['authorization'] = `Bearer ${session.access_token}`;
     }
     
     return config;
   });
   ```

6. **Gérer la déconnexion admin** :
   - Remplacer `localStorage.removeItem('adminAuth')` par `await supabase.auth.signOut()`
   - Rediriger vers `/admin/login` après déconnexion

#### **Phase 4 : Protection des Routes**

7. **Ajouter une vérification de session dans `AdminDashboardClean.tsx`** :
   ```typescript
   useEffect(() => {
     const checkAdminSession = async () => {
       const { data: { session } } = await supabase.auth.getSession();
       
       if (!session) {
         setLocation('/admin/login');
         return;
       }

       // Vérifier que c'est un admin
       const { data: userData } = await supabase
         .from('users')
         .select('type')
         .eq('id', session.user.id)
         .single();

       if (userData?.type !== 'admin') {
         await supabase.auth.signOut();
         setLocation('/admin/login');
       }
     };

     checkAdminSession();
   }, []);
   ```

---

### ✅ Tests à Effectuer Après Migration

1. **Test de connexion** :
   - [ ] Connexion avec credentials admin valides fonctionne
   - [ ] Connexion avec credentials invalides échoue
   - [ ] Connexion avec un compte utilisateur non-admin échoue

2. **Test des routes protégées** :
   - [ ] Accès à `/admin` sans token redirige vers login
   - [ ] Accès à `/api/admin/reports` sans token retourne 401
   - [ ] Accès à `/api/admin/reports` avec token user (non-admin) retourne 403
   - [ ] Accès à `/api/admin/reports` avec token admin fonctionne

3. **Test de session** :
   - [ ] Refresh de la page conserve la session
   - [ ] Déconnexion supprime la session
   - [ ] Session expirée redirige vers login

4. **Test de sécurité** :
   - [ ] Impossible de forger des headers pour accéder aux routes admin
   - [ ] Token JWT invalide est rejeté
   - [ ] Token expiré est rejeté

---

### 📝 Notes Importantes

- **Ne pas supprimer le code temporaire avant d'avoir testé la nouvelle implémentation**
- **Créer une branche Git avant la migration** pour pouvoir rollback si nécessaire
- **Tester en local avant de déployer en production**
- **Documenter le nouveau mot de passe admin de manière sécurisée** (pas dans le code !)
- **Considérer l'ajout d'une authentification 2FA** pour encore plus de sécurité

---

### 🔗 Ressources Utiles

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

--