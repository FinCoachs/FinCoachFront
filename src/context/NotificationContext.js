import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Platform, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import api from '../services/api';

// ── Configuration du comportement des notifications en foreground ──────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [alertes,     setAlertes]     = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading,     setLoading]     = useState(false);

  const notifListener = useRef(null);
  const responseListener = useRef(null);

  // ── Enregistrement push + envoi du token au backend ───────────────────────
  const registerPushToken = useCallback(async () => {
    // Uniquement sur un appareil physique (pas simulateur/web)
    if (!Device.isDevice || Platform.OS === 'web') return;

    try {
      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;

      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return;

      // Canal Android requis
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name:       'FinCoach',
          importance: Notifications.AndroidImportance.MAX,
          sound:      'default',
        });
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '73bab9f6-d0b2-4e4c-9e4a-cd99db8b3a0e', // EAS project ID (à mettre à jour)
      });

      await api.post('/user/push-token', { token: tokenData.data });
    } catch (e) {
      // Silencieux en dev — peut échouer sur simulateur
    }
  }, []);

  // ── Chargement des alertes depuis le backend ───────────────────────────────
  const loadAlertes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/alertes');
      if (res.data.success) {
        setAlertes(res.data.data);
        setUnreadCount(res.data.unread ?? 0);
      }
    } catch (_) {
      // Pas bloquant
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Marquer toutes comme lues ──────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    try {
      await api.post('/alertes/lire');
      setAlertes(prev => prev.map(a => ({ ...a, lue: true })));
      setUnreadCount(0);
      await Notifications.setBadgeCountAsync(0);
    } catch (_) {}
  }, []);

  // ── Écoute des notifications reçues (app en foreground) ───────────────────
  useEffect(() => {
    registerPushToken();
    loadAlertes();

    // Nouvelle notification reçue pendant que l'app est ouverte
    notifListener.current = Notifications.addNotificationReceivedListener(() => {
      loadAlertes();
    });

    // L'utilisateur tape sur une notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
      loadAlertes();
    });

    // Recharger quand l'app revient au premier plan
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') loadAlertes();
    });

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
      sub.remove();
    };
  }, [registerPushToken, loadAlertes]);

  return (
    <NotificationContext.Provider value={{ alertes, unreadCount, loading, loadAlertes, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
