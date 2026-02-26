import * as NotificationsType from 'expo-notifications';

// Safe import for Expo Go crash prevention
let Notifications: typeof NotificationsType | null = null;

try {
    Notifications = require('expo-notifications');
} catch (error) {
    console.warn('Expo Notifications failed to load.', error);
}

export default Notifications;
