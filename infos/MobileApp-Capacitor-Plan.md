# 📱 Plan de transformation - Application Mobile Capacitor

> **Document de spécifications détaillées pour transformer PassionAuto2Roues en application mobile native iOS/Android via Capacitor**
> 
> **Version :** 1.0  
> **Date :** Octobre 2025  
> **Destinataire :** Développeur / Agent IA  
> **Temps estimé (agent IA) :** 10-12 heures

---

## 📋 Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture Capacitor](#2-architecture-capacitor)
3. [Prérequis techniques](#3-prérequis-techniques)
4. [Installation et configuration](#4-installation-et-configuration)
5. [Plugins natifs essentiels](#5-plugins-natifs-essentiels)
6. [Adaptation du code existant](#6-adaptation-du-code-existant)
7. [Notifications Push (FCM)](#7-notifications-push-fcm)
8. [Mode offline et cache](#8-mode-offline-et-cache)
9. [Build et distribution](#9-build-et-distribution)
10. [Tests et validation](#10-tests-et-validation)
11. [Maintenance et mises à jour](#11-maintenance-et-mises-à-jour)
12. [Estimation temps/coûts](#12-estimation-tempscoûts)
13. [Checklist de livraison](#13-checklist-de-livraison)

---

## 1. Vue d'ensemble

### 1.1 Qu'est-ce que Capacitor ?

**Capacitor** est un framework qui transforme votre application web React en application mobile native iOS/Android **sans réécrire le code**.

```
┌─────────────────────────────────────┐
│   Votre App React Actuelle          │
│   (Vite + React + Wouter + Supabase)│
└─────────────────┬───────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │   Capacitor    │
         │   (WebView)    │
         └────────┬───────┘
                  │
      ┌───────────┴────────────┐
      │                        │
      ▼                        ▼
┌────────────┐          ┌────────────┐
│  App iOS   │          │ App Android│
│  (native)  │          │  (native)  │
└────────────┘          └────────────┘
```

### 1.2 Avantages pour PassionAuto2Roues

| Aspect | Bénéfice |
|--------|----------|
| **Réutilisation code** | 95% du code React actuel fonctionne tel quel |
| **Fonctionnalités natives** | Caméra, GPS, notifications push, partage |
| **Performance** | Quasi-native grâce au WebView optimisé |
| **Maintenance** | Une seule codebase pour web + iOS + Android |
| **Coût** | Gratuit (Capacitor est open source) |
| **Distribution** | App Store + Google Play Store |
| **Délai** | 10-12h avec agent IA vs 2-3 jours humain |

### 1.3 Fonctionnalités qui resteront identiques

✅ **Tout le code React** - Composants, hooks, contexts  
✅ **Routing Wouter** - Navigation identique  
✅ **Supabase** - Auth, database, storage, realtime  
✅ **TanStack Query** - Requêtes API  
✅ **Stripe** - Paiements (avec SDK mobile)  
✅ **Notifications système** - Via table `notifications` + push natif  

### 1.4 Nouvelles capacités mobiles

🆕 **Caméra native** - Prise de photos pour annonces  
🆕 **Notifications push** - Firebase Cloud Messaging  
🆕 **Mode offline** - Cache + stockage local  
🆕 **Géolocalisation** - GPS pour localisation automatique  
🆕 **Partage natif** - Partager annonces via apps natives  
🆕 **Contacts** - Importer contacts (optionnel)  

---

## 2. Architecture Capacitor

### 2.1 Structure du projet

```
PassionAuto2Roues/
├── client/                      # Code React existant (inchangé)
│   ├── src/
│   ├── public/
│   └── index.html
├── server/                      # Backend Express (inchangé)
├── android/                     # 🆕 Projet Android natif (généré)
│   ├── app/
│   ├── build.gradle
│   └── AndroidManifest.xml
├── ios/                         # 🆕 Projet iOS natif (généré)
│   ├── App/
│   ├── App.xcworkspace
│   └── Podfile
├── capacitor.config.ts          # 🆕 Configuration Capacitor
├── package.json                 # Mise à jour avec plugins
└── shared/                      # Types partagés (inchangé)
```

### 2.2 Flux de communication

```
┌─────────────────────────────────────────────────────┐
│                    App Mobile                        │
│  ┌──────────────────────────────────────────────┐  │
│  │          React App (WebView)                  │  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │  Components, Hooks, TanStack Query     │  │  │
│  │  └────────────────────────────────────────┘  │  │
│  │                    ▲                          │  │
│  │                    │                          │  │
│  │                    ▼                          │  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │    Capacitor Bridge (JavaScript)       │  │  │
│  │  └────────────────────────────────────────┘  │  │
│  └──────────────────────┬───────────────────────┘  │
│                         │                          │
│                         ▼                          │
│  ┌──────────────────────────────────────────────┐  │
│  │      Native Layer (iOS/Android)              │  │
│  │  - Camera API                                │  │
│  │  - Push Notifications                        │  │
│  │  - Network Detection                         │  │
│  │  - Geolocation                               │  │
│  │  - Local Storage                             │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │  Backend Server  │
              │  (Supabase, API) │
              └──────────────────┘
```

### 2.3 Principe de fonctionnement

1. **React App** s'exécute dans un **WebView** (navigateur intégré)
2. **Capacitor Bridge** expose les APIs natives à JavaScript
3. **Plugins** permettent d'appeler caméra, GPS, etc. depuis React
4. **Code existant** fonctionne sans modification

---

## 3. Prérequis techniques

### 3.1 Environnement de développement

#### **Pour Android**

| Outil | Version | Installation |
|-------|---------|--------------|
| **Android Studio** | Arctic Fox+ | https://developer.android.com/studio |
| **Android SDK** | API 22+ | Via Android Studio |
| **Java JDK** | 11 ou 17 | Via Android Studio |
| **Gradle** | 7.x+ | Inclus avec Android Studio |

**Variables d'environnement :**
```bash
# Ajouter dans ~/.bashrc ou ~/.zshrc
export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_SDK_ROOT/platform-tools
export PATH=$PATH:$ANDROID_SDK_ROOT/tools
```

#### **Pour iOS** (macOS uniquement)

| Outil | Version | Installation |
|-------|---------|--------------|
| **Xcode** | 14+ | Mac App Store |
| **CocoaPods** | 1.11+ | `sudo gem install cocoapods` |
| **Command Line Tools** | Latest | `xcode-select --install` |
| **Apple Developer Account** | - | https://developer.apple.com |

#### **Pour les deux plateformes**

| Outil | Version | Installation |
|-------|---------|--------------|
| **Node.js** | 18+ | Déjà installé ✅ |
| **npm** | 9+ | Déjà installé ✅ |
| **Capacitor CLI** | 5+ | `npm install -g @capacitor/cli` |

### 3.2 Comptes nécessaires

| Service | Coût | Utilisation |
|---------|------|-------------|
| **Google Play Console** | 25$ (one-time) | Publication Android |
| **Apple Developer** | 99$/an | Publication iOS |
| **Firebase** | Gratuit | Push notifications |

---

## 4. Installation et configuration

### 4.1 Étape 1 : Installer Capacitor

```bash
# Dans le dossier racine du projet
npm install @capacitor/core @capacitor/cli

# Initialiser Capacitor
npx cap init
```

**Questions posées :**
- **App name** : `PassionAuto2Roues`
- **App ID** : `com.passionauto2roues.app` (format reverse domain)
- **Web directory** : `dist` (dossier de build Vite)

### 4.2 Étape 2 : Créer fichier de configuration

**Créer `capacitor.config.ts` à la racine :**

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.passionauto2roues.app',
  appName: 'PassionAuto2Roues',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Pour développement local (optionnel)
    // url: 'http://192.168.1.X:5000',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#067D92',
      androidSplashResourceName: 'splash',
      iosSplashResourceName: 'Splash',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
```

### 4.3 Étape 3 : Modifier package.json

**Ajouter ces scripts :**

```json
{
  "scripts": {
    "build": "vite build",
    "cap:sync": "npm run build && npx cap sync",
    "cap:android": "npm run cap:sync && npx cap open android",
    "cap:ios": "npm run cap:sync && npx cap open ios",
    "cap:run:android": "npm run cap:sync && npx cap run android",
    "cap:run:ios": "npm run cap:sync && npx cap run ios"
  }
}
```

### 4.4 Étape 4 : Ajouter les plateformes

```bash
# Build de l'app React
npm run build

# Ajouter Android
npx cap add android

# Ajouter iOS (macOS uniquement)
npx cap add ios

# Synchroniser les fichiers
npx cap sync
```

### 4.5 Étape 5 : Modifier index.html

**Ajouter dans `client/index.html` avant `</head>` :**

```html
<!-- Viewport pour mobile -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">

<!-- Status bar iOS -->
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">

<!-- Capacitor scripts (injectés automatiquement) -->
```

### 4.6 Étape 6 : Configurer Vite

**Modifier `vite.config.ts` :**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // ✅ Important pour Capacitor
    sourcemap: false,
  },
  server: {
    host: '0.0.0.0', // ✅ Permet accès depuis mobile
    port: 5000,
  },
});
```

---

## 5. Plugins natifs essentiels

### 5.1 Installation des plugins

```bash
# Plugins essentiels
npm install @capacitor/camera
npm install @capacitor/push-notifications
npm install @capacitor/network
npm install @capacitor/geolocation
npm install @capacitor/preferences
npm install @capacitor/share
npm install @capacitor/app
npm install @capacitor/splash-screen

# Synchroniser
npx cap sync
```

### 5.2 Plugin Caméra

#### **Configuration Android** (`android/app/src/main/AndroidManifest.xml`)

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES"/>
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>

<queries>
  <intent>
    <action android:name="android.media.action.IMAGE_CAPTURE" />
  </intent>
</queries>
```

#### **Configuration iOS** (`ios/App/App/Info.plist`)

```xml
<key>NSCameraUsageDescription</key>
<string>L'application a besoin d'accéder à votre caméra pour prendre des photos de vos annonces</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>L'application a besoin d'accéder à vos photos pour vos annonces</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>L'application a besoin d'enregistrer des photos</string>
```

#### **Service TypeScript** (`client/src/services/nativeCamera.ts`)

```typescript
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export const nativeCameraService = {
  /**
   * Vérifier si on est sur mobile natif
   */
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  },

  /**
   * Prendre une photo avec la caméra
   */
  async takePhoto(): Promise<string | null> {
    try {
      const image: Photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      return image.webPath || null;
    } catch (error) {
      console.error('Erreur caméra:', error);
      return null;
    }
  },

  /**
   * Choisir une photo depuis la galerie
   */
  async pickFromGallery(): Promise<string | null> {
    try {
      const image: Photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
      });

      return image.webPath || null;
    } catch (error) {
      console.error('Erreur galerie:', error);
      return null;
    }
  },

  /**
   * Convertir URI Capacitor en Blob pour upload Supabase
   */
  async convertToBlob(photoUri: string): Promise<Blob> {
    const response = await fetch(photoUri);
    return await response.blob();
  },
};
```

#### **Intégration dans CreateListingForm**

```typescript
// client/src/components/create-listing/CreateListingForm.tsx
import { nativeCameraService } from '@/services/nativeCamera';

// Dans le composant
const handleAddPhoto = async () => {
  // Si mobile natif, proposer caméra OU galerie
  if (nativeCameraService.isNative()) {
    const choice = window.confirm(
      'Prendre une photo avec la caméra ? (Annuler = choisir depuis galerie)'
    );
    
    const photoUri = choice 
      ? await nativeCameraService.takePhoto()
      : await nativeCameraService.pickFromGallery();
    
    if (photoUri) {
      // Convertir en Blob pour upload Supabase
      const blob = await nativeCameraService.convertToBlob(photoUri);
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, file]
      }));
    }
  } else {
    // Web : comportement actuel (input file)
    inputFileRef.current?.click();
  }
};
```

### 5.3 Plugin Géolocalisation

#### **Service** (`client/src/services/nativeGeolocation.ts`)

```typescript
import { Geolocation, Position } from '@capacitor/geolocation';

export const nativeGeolocationService = {
  async getCurrentPosition(): Promise<{ city: string; postalCode: string } | null> {
    try {
      const position: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocoding via API (ex: Nominatim)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();

      return {
        city: data.address.city || data.address.town || '',
        postalCode: data.address.postcode || '',
      };
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
      return null;
    }
  },
};
```

#### **Permissions Android**

```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

#### **Permissions iOS**

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>L'application a besoin de votre position pour remplir automatiquement votre ville</string>
```

### 5.4 Plugin Partage

#### **Service** (`client/src/services/nativeShare.ts`)

```typescript
import { Share } from '@capacitor/share';

export const nativeShareService = {
  async shareVehicle(vehicle: Vehicle) {
    try {
      await Share.share({
        title: vehicle.title,
        text: `Découvrez cette annonce sur PassionAuto2Roues : ${vehicle.title}`,
        url: `${window.location.origin}/listing/${vehicle.id}`,
        dialogTitle: 'Partager cette annonce',
      });
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  },
};
```

#### **Intégration dans VehicleDetail**

```typescript
// Remplacer le bouton partage existant
import { nativeShareService } from '@/services/nativeShare';

<button onClick={() => nativeShareService.shareVehicle(vehicle)}>
  <Share2 className="h-5 w-5" />
  Partager
</button>
```

### 5.5 Plugin Network (Détection offline)

#### **Hook** (`client/src/hooks/useNetworkStatus.ts`)

```typescript
import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    // État initial
    Network.getStatus().then(status => {
      setIsOnline(status.connected);
      setConnectionType(status.connectionType);
    });

    // Écouter changements
    const listener = Network.addListener('networkStatusChange', status => {
      setIsOnline(status.connected);
      setConnectionType(status.connectionType);
    });

    return () => {
      listener.remove();
    };
  }, []);

  return { isOnline, connectionType };
}
```

#### **Composant Offline Banner**

```typescript
// client/src/components/OfflineBanner.tsx
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white py-2 px-4 flex items-center justify-center gap-2">
      <WifiOff className="h-4 w-4" />
      <span>Mode hors ligne - Certaines fonctionnalités sont limitées</span>
    </div>
  );
}
```

#### **Intégration dans App.tsx**

```typescript
import { OfflineBanner } from '@/components/OfflineBanner';

function App() {
  return (
    <>
      <OfflineBanner />
      {/* Reste de l'app */}
    </>
  );
}
```

### 5.6 Plugin Preferences (Stockage local)

#### **Service** (`client/src/services/nativeStorage.ts`)

```typescript
import { Preferences } from '@capacitor/preferences';

export const nativeStorageService = {
  async set(key: string, value: any): Promise<void> {
    await Preferences.set({
      key,
      value: JSON.stringify(value),
    });
  },

  async get<T>(key: string): Promise<T | null> {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : null;
  },

  async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  },

  async clear(): Promise<void> {
    await Preferences.clear();
  },
};
```

---

## 6. Adaptation du code existant

### 6.1 Détection plateforme

**Créer un hook** (`client/src/hooks/usePlatform.ts`)

```typescript
import { Capacitor } from '@capacitor/core';
import { useEffect, useState } from 'react';

export function usePlatform() {
  const [platform, setPlatform] = useState<'web' | 'ios' | 'android'>('web');

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setPlatform(Capacitor.getPlatform() as 'ios' | 'android');
    }
  }, []);

  return {
    platform,
    isNative: Capacitor.isNativePlatform(),
    isWeb: !Capacitor.isNativePlatform(),
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
  };
}
```

### 6.2 Adaptations UI mobile

#### **Safe Area (encoche iPhone)**

```typescript
// client/src/App.tsx
import { StatusBar, Style } from '@capacitor/status-bar';
import { useEffect } from 'react';

useEffect(() => {
  if (Capacitor.isNativePlatform()) {
    // Configurer status bar
    StatusBar.setStyle({ style: Style.Dark });
    StatusBar.setBackgroundColor({ color: '#067D92' });
  }
}, []);
```

**CSS pour safe area :**

```css
/* client/src/index.css */
body {
  /* Respect notch iPhone */
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

#### **Bouton retour Android**

```typescript
// client/src/App.tsx
import { App as CapApp } from '@capacitor/app';

useEffect(() => {
  if (Capacitor.isNativePlatform()) {
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        CapApp.exitApp(); // Quitter l'app
      } else {
        window.history.back(); // Navigation arrière
      }
    });
  }
}, []);
```

### 6.3 Upload photos vers Supabase

**Adapter le service d'upload :**

```typescript
// client/src/services/uploadService.ts
import { nativeCameraService } from './nativeCamera';
import { supabase } from '@/lib/supabase';

export async function uploadPhotoToSupabase(file: File | string): Promise<string> {
  let fileToUpload: File;

  // Si c'est une URI Capacitor (mobile)
  if (typeof file === 'string' && file.startsWith('capacitor://')) {
    const blob = await nativeCameraService.convertToBlob(file);
    fileToUpload = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
  } else {
    fileToUpload = file as File;
  }

  // Upload vers Supabase (code existant)
  const fileName = `${Date.now()}_${fileToUpload.name}`;
  const { data, error } = await supabase.storage
    .from('vehicle-images')
    .upload(fileName, fileToUpload);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('vehicle-images')
    .getPublicUrl(fileName);

  return publicUrl;
}
```

---

## 7. Notifications Push (FCM)

### 7.1 Configuration Firebase

#### **Étape 1 : Créer projet Firebase**

1. Aller sur https://console.firebase.google.com
2. Créer un projet "PassionAuto2Roues"
3. Ajouter app Android : `com.passionauto2roues.app`
4. Télécharger `google-services.json`
5. Ajouter app iOS : `com.passionauto2roues.app`
6. Télécharger `GoogleService-Info.plist`

#### **Étape 2 : Configurer Android**

**Copier `google-services.json` dans :**
```
android/app/google-services.json
```

**Modifier `android/build.gradle` :**

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

**Modifier `android/app/build.gradle` :**

```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation 'com.google.firebase:firebase-messaging:23.1.2'
}
```

#### **Étape 3 : Configurer iOS**

**Copier `GoogleService-Info.plist` dans :**
```
ios/App/App/GoogleService-Info.plist
```

**Activer Push Notifications dans Xcode :**
1. Ouvrir `ios/App/App.xcworkspace`
2. Sélectionner target "App"
3. Onglet "Signing & Capabilities"
4. Cliquer "+ Capability"
5. Ajouter "Push Notifications"

### 7.2 Service Push Notifications

**Créer** (`client/src/services/pushNotifications.ts`)

```typescript
import { PushNotifications, Token, PushNotificationSchema } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export const pushNotificationService = {
  async initialize() {
    if (!Capacitor.isNativePlatform()) return;

    // Demander permission
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.log('Permission refusée');
      return;
    }

    // Enregistrer pour recevoir push
    await PushNotifications.register();

    // Listener registration token
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push token:', token.value);
      
      // Enregistrer token dans Supabase
      await saveTokenToBackend(token.value);
    });

    // Listener notification reçue
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Push reçu:', notification);
        // Afficher notification in-app si besoin
      }
    );

    // Listener notification cliquée
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification) => {
        console.log('Push cliqué:', notification);
        
        // Rediriger vers page appropriée
        const data = notification.notification.data;
        if (data.link) {
          window.location.href = data.link;
        }
      }
    );
  },
};

async function saveTokenToBackend(token: string) {
  // Sauvegarder dans table users ou device_tokens
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('users').update({
    push_token: token,
    push_enabled: true,
  }).eq('id', user.id);
}
```

**Initialiser dans App.tsx :**

```typescript
import { pushNotificationService } from '@/services/pushNotifications';

useEffect(() => {
  pushNotificationService.initialize();
}, []);
```

### 7.3 Backend : Envoyer push notifications

**Installer Firebase Admin SDK :**

```bash
npm install firebase-admin
```

**Service backend** (`server/services/pushService.ts`)

```typescript
import admin from 'firebase-admin';
import serviceAccount from '../firebase-service-account.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
});

export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      token,
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Push envoyé:', response);
    return response;
  } catch (error) {
    console.error('❌ Erreur push:', error);
    throw error;
  }
}
```

**Intégrer dans notificationService.ts :**

```typescript
import { sendPushNotification } from './pushService';

export async function createNotification({ ... }) {
  // 1. DB notification
  await supabase.from('notifications').insert({ ... });

  // 2. Email
  await emailService.send({ ... });

  // 3. Push mobile (nouveau)
  const { data: user } = await supabase
    .from('users')
    .select('push_token, push_enabled')
    .eq('id', userId)
    .single();

  if (user?.push_token && user?.push_enabled) {
    await sendPushNotification(user.push_token, title, message, { link });
  }
}
```

---

## 8. Mode offline et cache

### 8.1 Service Worker pour cache

**Créer** (`client/public/sw.js`)

```javascript
const CACHE_NAME = 'passionauto2roues-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js',
];

// Installation
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch avec stratégie Network First
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cloner et mettre en cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Fallback sur cache
        return caches.match(event.request);
      })
  );
});
```

**Enregistrer dans** (`client/src/main.tsx`)

```typescript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

### 8.2 Cache favorites hors ligne

```typescript
// client/src/hooks/useFavorites.ts avec cache
export function useFavorites() {
  const { isOnline } = useNetworkStatus();
  
  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      if (isOnline) {
        const data = await fetchFavorites();
        // Sauvegarder en cache local
        await nativeStorageService.set('favorites_cache', data);
        return data;
      } else {
        // Charger depuis cache
        return await nativeStorageService.get('favorites_cache') || [];
      }
    },
  });
  
  return { favorites };
}
```

---

## 9. Build et distribution

### 9.1 Build Android

#### **Debug build (pour tests)**

```bash
# Build React
npm run build

# Sync Capacitor
npx cap sync android

# Ouvrir Android Studio
npx cap open android

# Dans Android Studio :
# Build > Build Bundle(s) / APK(s) > Build APK(s)
```

**APK généré dans :**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

#### **Release build (production)**

**Générer keystore :**

```bash
keytool -genkey -v -keystore passionauto2roues.keystore -alias passionauto2roues -keyalg RSA -keysize 2048 -validity 10000
```

**Configurer** (`android/app/build.gradle`)

```gradle
android {
    signingConfigs {
        release {
            storeFile file('/path/to/passionauto2roues.keystore')
            storePassword 'YOUR_PASSWORD'
            keyAlias 'passionauto2roues'
            keyPassword 'YOUR_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

**Build AAB (Android App Bundle) :**

```bash
cd android
./gradlew bundleRelease
```

**AAB généré dans :**
```
android/app/build/outputs/bundle/release/app-release.aab
```

### 9.2 Build iOS

#### **Ouvrir Xcode**

```bash
npx cap open ios
```

#### **Configuration signing**

1. Sélectionner target "App"
2. Onglet "Signing & Capabilities"
3. Cocher "Automatically manage signing"
4. Sélectionner Team (Apple Developer Account)

#### **Archive pour App Store**

1. Menu : Product > Archive
2. Attendre fin de build
3. Dans Organizer, cliquer "Distribute App"
4. Choisir "App Store Connect"
5. Upload

### 9.3 Publication Google Play Store

#### **Prérequis**

- Compte Google Play Console (25$ one-time)
- AAB release signé
- Screenshots (4-8)
- Icône 512x512px
- Description app

#### **Étapes**

1. Aller sur https://play.google.com/console
2. Créer nouvelle application
3. Remplir fiche magasin :
   - Titre : PassionAuto2Roues
   - Description courte (80 caractères)
   - Description complète (4000 caractères)
   - Screenshots
   - Icône
4. Upload AAB dans "Production"
5. Soumettre pour review (24-48h)

### 9.4 Publication Apple App Store

#### **Prérequis**

- Compte Apple Developer (99$/an)
- Archive iOS
- Screenshots (obligatoires pour chaque taille)
- Privacy policy URL

#### **Étapes via App Store Connect**

1. Aller sur https://appstoreconnect.apple.com
2. Créer nouvelle app
3. Remplir infos :
   - Nom : PassionAuto2Roues
   - Catégorie : Shopping / Automobile
   - Description
   - Mots-clés
   - Screenshots (6.5", 5.5")
   - URL confidentialité
4. Sélectionner build uploadé
5. Soumettre pour review (1-3 jours)

---

## 10. Tests et validation

### 10.1 Tests en développement

#### **Android**

```bash
# Émulateur
npm run cap:run:android

# Device physique (USB debugging activé)
npm run cap:run:android --target=DEVICE_ID
```

#### **iOS**

```bash
# Simulateur
npm run cap:run:ios

# iPhone physique (connecté)
npm run cap:run:ios --target=DEVICE_ID
```

### 10.2 Checklist fonctionnelle

#### **Navigation**
- [ ] Toutes les routes Wouter fonctionnent
- [ ] Bouton retour Android fonctionne
- [ ] Deep links fonctionnent (partage annonce)

#### **Caméra**
- [ ] Prendre photo fonctionne
- [ ] Choisir depuis galerie fonctionne
- [ ] Upload vers Supabase fonctionne
- [ ] Permissions demandées correctement

#### **Géolocalisation**
- [ ] Position détectée automatiquement
- [ ] Ville et code postal récupérés
- [ ] Permission demandée

#### **Notifications**
- [ ] Push notifications reçues
- [ ] Clic redirige vers bonne page
- [ ] Badge compteur mis à jour
- [ ] In-app notifications temps réel

#### **Offline**
- [ ] Banner offline s'affiche
- [ ] Favoris accessibles hors ligne
- [ ] Cache fonctionne
- [ ] Sync auto à la reconnexion

#### **Performance**
- [ ] Temps de chargement < 3s
- [ ] Scroll fluide
- [ ] Pas de freeze UI
- [ ] Mémoire stable

#### **UI/UX**
- [ ] Safe area respectée (notch iPhone)
- [ ] Status bar configurée
- [ ] Splash screen s'affiche
- [ ] Pas de scroll horizontal indésirable

### 10.3 Tests sur vrais devices

**Android (à tester) :**
- Samsung Galaxy S21+
- Google Pixel 6
- Xiaomi Redmi Note 10
- OnePlus 9

**iOS (à tester) :**
- iPhone 14 Pro (encoche)
- iPhone 13
- iPhone SE (petit écran)
- iPad (si supporté)

---

## 11. Maintenance et mises à jour

### 11.1 Processus de mise à jour

**Workflow standard :**

1. **Modification code React**
2. **Build** : `npm run build`
3. **Sync** : `npx cap sync`
4. **Test** : Émulateurs/devices
5. **Build release** : Android (AAB) + iOS (Archive)
6. **Upload stores**

### 11.2 Over-The-Air Updates (optionnel)

**Utiliser Capacitor Live Updates (Appflow) :**

```bash
npm install @capacitor/live-updates
```

Permet de pousser mises à jour **sans passer par les stores** (seulement HTML/CSS/JS, pas code natif).

### 11.3 Versioning

**Synchroniser versions :**

```json
// package.json
{
  "version": "1.0.0"
}
```

```typescript
// capacitor.config.ts
{
  version: '1.0.0',
  buildNumber: 1, // Incrémenter à chaque release
}
```

**Android** (`android/app/build.gradle`)
```gradle
versionCode 1  // Incrémenter
versionName "1.0.0"
```

**iOS** (Xcode)
- Version: 1.0.0
- Build: 1 (incrémenter)

---

## 12. Estimation temps/coûts

### 12.1 Temps d'implémentation (agent IA)

| Phase | Tâches | Durée |
|-------|--------|-------|
| **Setup** | Installation Capacitor, config, plateformes | 1h |
| **Plugins** | Caméra, géoloc, share, network, preferences | 2h |
| **Adaptation code** | Détection plateforme, services natifs | 2h |
| **Push notifications** | Firebase, FCM, backend | 2h |
| **Mode offline** | Cache, service worker, stockage local | 1.5h |
| **Build & test** | APK/IPA, tests devices | 2h |
| **Debug** | Corrections bugs | 1.5h |
| **TOTAL** | | **10-12h** |

### 12.2 Coûts

| Service | Coût | Fréquence | Note |
|---------|------|-----------|------|
| **Google Play Console** | 25$ | One-time | Publication Android |
| **Apple Developer** | 99$ | Annuel | Publication iOS |
| **Firebase** | 0$ | - | Plan gratuit suffisant |
| **Certificat signing** | 0$ | - | Gratuit avec comptes dev |
| **TOTAL Year 1** | **124$** | - | Puis 99$/an |

### 12.3 Maintenance continue

- **Mises à jour mensuelles** : 2-4h/mois
- **Corrections bugs** : Variable
- **Features natives** : 4-8h par feature

---

## 13. Checklist de livraison

### 13.1 Configuration

- [ ] Capacitor installé et configuré
- [ ] `capacitor.config.ts` créé
- [ ] Plateformes Android + iOS ajoutées
- [ ] Firebase projet créé
- [ ] `google-services.json` placé (Android)
- [ ] `GoogleService-Info.plist` placé (iOS)

### 13.2 Plugins

- [ ] @capacitor/camera installé
- [ ] @capacitor/push-notifications installé
- [ ] @capacitor/network installé
- [ ] @capacitor/geolocation installé
- [ ] @capacitor/preferences installé
- [ ] @capacitor/share installé
- [ ] @capacitor/app installé
- [ ] @capacitor/splash-screen installé

### 13.3 Permissions

- [ ] Permissions caméra configurées (Android + iOS)
- [ ] Permissions localisation configurées
- [ ] Permissions push notifications configurées
- [ ] Permissions stockage configurées

### 13.4 Services

- [ ] `nativeCameraService.ts` créé et testé
- [ ] `nativeGeolocationService.ts` créé et testé
- [ ] `nativeShareService.ts` créé et testé
- [ ] `pushNotificationService.ts` créé et testé
- [ ] `nativeStorageService.ts` créé et testé

### 13.5 Adaptations code

- [ ] Hook `usePlatform` créé
- [ ] Hook `useNetworkStatus` créé
- [ ] Composant `OfflineBanner` créé
- [ ] Service `uploadPhotoToSupabase` adapté
- [ ] CreateListingForm utilise caméra native
- [ ] VehicleDetail utilise partage natif
- [ ] Safe area CSS appliquée
- [ ] Status bar configurée

### 13.6 Backend

- [ ] Push notification service backend créé
- [ ] Integration dans `notificationService`
- [ ] Champ `push_token` ajouté table users
- [ ] Firebase Admin SDK configuré

### 13.7 Build

- [ ] APK debug généré et testé
- [ ] AAB release généré
- [ ] Archive iOS générée
- [ ] Signing configuré (Android + iOS)

### 13.8 Tests

- [ ] Testé sur émulateur Android
- [ ] Testé sur device Android physique
- [ ] Testé sur simulateur iOS
- [ ] Testé sur iPhone physique
- [ ] Caméra testée
- [ ] Push notifications testées
- [ ] Mode offline testé
- [ ] Géolocalisation testée
- [ ] Partage testé

### 13.9 Publication

- [ ] Google Play Console compte créé
- [ ] Fiche magasin Play Store complétée
- [ ] Screenshots Android uploadés
- [ ] AAB uploadé sur Play Store
- [ ] Apple Developer compte créé
- [ ] App Store Connect configuré
- [ ] Fiche magasin App Store complétée
- [ ] Screenshots iOS uploadés
- [ ] Archive iOS uploadée

### 13.10 Documentation

- [ ] README mis à jour
- [ ] Guide build ajouté
- [ ] Variables d'environnement documentées
- [ ] Processus de mise à jour documenté

---

## 14. Annexes

### 14.1 Ressources officielles

- **Capacitor Docs** : https://capacitorjs.com/docs
- **Capacitor Plugins** : https://capacitorjs.com/docs/plugins
- **Firebase Console** : https://console.firebase.google.com
- **Google Play Console** : https://play.google.com/console
- **App Store Connect** : https://appstoreconnect.apple.com

### 14.2 Icônes et assets

**Générer icônes app :**

Utiliser https://capacitor.ionic.io/resources

```bash
# Créer icon-1024.png (1024x1024)
# Créer splash-2732x2732.png

npm install -g @capacitor/assets
npx capacitor-assets generate
```

### 14.3 Deep links

**Configurer** (`capacitor.config.ts`)

```typescript
{
  plugins: {
    App: {
      scheme: 'passionauto2roues',
      hostname: 'app',
    },
  },
}
```

**Utiliser :**
```
passionauto2roues://app/listing/123
```

### 14.4 Troubleshooting

#### **Erreur : Build failed Android**
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

#### **Erreur : Pods iOS**
```bash
cd ios/App
pod deintegrate
pod install
cd ../..
npx cap sync ios
```

#### **Permissions refusées**
Vérifier `AndroidManifest.xml` et `Info.plist`

#### **Push non reçues**
- Vérifier Firebase config
- Tester avec Firebase Console (Cloud Messaging)
- Check token enregistré en DB

---

## 🎯 Résumé - Étapes pour agent IA

1. **Installer Capacitor** (30 min)
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init
   npx cap add android ios
   ```

2. **Installer plugins** (30 min)
   ```bash
   npm install @capacitor/{camera,push-notifications,network,geolocation,preferences,share,app,splash-screen}
   npx cap sync
   ```

3. **Créer services natifs** (2h)
   - nativeCameraService
   - pushNotificationService
   - nativeGeolocationService
   - etc.

4. **Adapter composants** (2h)
   - CreateListingForm (caméra)
   - VehicleDetail (partage)
   - App.tsx (offline banner)

5. **Configurer Firebase** (1h)
   - Projet Firebase
   - google-services.json
   - GoogleService-Info.plist

6. **Backend push** (1h)
   - Firebase Admin SDK
   - Integration notificationService

7. **Build et test** (2h)
   - APK debug
   - Tests devices

8. **Release** (2h)
   - AAB Android
   - Archive iOS
   - Upload stores

**TOTAL : 10-12 heures**

---

**Document créé le :** Octobre 2025  
**Version :** 1.0  
**Temps estimé (agent IA) :** 10-12 heures  
**Temps estimé (humain) :** 2-3 jours  
**Coût initial :** 124$ (puis 99$/an)  
**Compatibilité :** iOS 13+ / Android 5.0+
